package gridfs

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"net/http"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

const (
	BucketName   = "images"
	MaxImageSize = 10 * 1024 * 1024 // 10 MiB
)

// AllowedContentTypes is the set of image MIME types we accept.
var AllowedContentTypes = map[string]bool{
	"image/jpeg": true,
	"image/png":  true,
	"image/webp": true,
	"image/gif":  true,
}

// bucket returns a GridFS bucket for the "images" prefix.
func bucket(db *mongo.Database) *mongo.GridFSBucket {
	return db.GridFSBucket(options.GridFSBucket().SetName(BucketName))
}

// Upload streams the reader into GridFS and returns the new file's ObjectID.
// Content type is stored in metadata for serving later.
func Upload(ctx context.Context, db *mongo.Database, filename string, contentType string, r io.Reader) (bson.ObjectID, error) {
	b := bucket(db)

	metadata := bson.M{"content_type": contentType}
	opts := options.GridFSUpload().SetMetadata(metadata)

	oid, err := b.UploadFromStream(ctx, filename, r, opts)
	if err != nil {
		return bson.ObjectID{}, fmt.Errorf("gridfs upload: %w", err)
	}

	return oid, nil
}

// Download writes the GridFS file to the http.ResponseWriter with correct
// Content-Type and caching headers.
func Download(ctx context.Context, db *mongo.Database, id bson.ObjectID, w http.ResponseWriter) error {
	b := bucket(db)

	stream, err := b.OpenDownloadStream(ctx, id)
	if err != nil {
		return fmt.Errorf("gridfs download: %w", err)
	}
	defer stream.Close()

	// Read file metadata to get content_type
	file := stream.GetFile()
	contentType := "application/octet-stream"

	if file != nil {
		// Metadata is stored as a bson.RawValue; try to extract content_type
		if raw, err := bson.Marshal(file.Metadata); err == nil {
			var md bson.M
			if err := bson.Unmarshal(raw, &md); err == nil {
				if ct, ok := md["content_type"].(string); ok && ct != "" {
					contentType = ct
				}
			}
		}
	}

	w.Header().Set("Content-Type", contentType)
	w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")

	_, err = io.Copy(w, stream)
	return err
}

// Delete removes a file from GridFS by ObjectID.
func Delete(ctx context.Context, db *mongo.Database, id bson.ObjectID) error {
	return bucket(db).Delete(ctx, id)
}

// DetectAndValidate reads the first 512 bytes of data to detect the MIME type,
// validates it against AllowedContentTypes, and returns the detected content type
// along with a reader that replays the sniffed bytes followed by the rest of the data.
func DetectAndValidate(r io.Reader) (contentType string, combined io.Reader, err error) {
	header := make([]byte, 512)
	n, readErr := io.ReadFull(r, header)
	if readErr != nil && readErr != io.ErrUnexpectedEOF {
		return "", nil, fmt.Errorf("failed to read file header: %w", readErr)
	}
	header = header[:n]

	contentType = http.DetectContentType(header)
	if !AllowedContentTypes[contentType] {
		return "", nil, fmt.Errorf("unsupported image type %q; accepted: JPEG, PNG, WebP, GIF", contentType)
	}

	combined = io.MultiReader(bytes.NewReader(header), r)
	return contentType, combined, nil
}
