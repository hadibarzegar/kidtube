package handler

import (
	"encoding/json"
	"io"
	"log"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/hadi/kidtube/internal/gridfs"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
)

const maxImageUploadSize = 10 * 1024 * 1024 // 10 MiB

// UploadImage handles POST /images/upload with multipart/form-data.
// Expects a single file field named "file".
// Returns JSON: { "id": "<objectid_hex>", "url": "/images/<objectid_hex>" }
func UploadImage(database *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		r.Body = http.MaxBytesReader(w, r.Body, maxImageUploadSize)

		mr, err := r.MultipartReader()
		if err != nil {
			writeJSONError(w, http.StatusBadRequest, "expected multipart/form-data")
			return
		}

		var fileProcessed bool
		var imageID bson.ObjectID

		for {
			part, err := mr.NextPart()
			if err == io.EOF {
				break
			}
			if err != nil {
				if strings.Contains(err.Error(), "too large") {
					writeJSONError(w, http.StatusRequestEntityTooLarge, "image too large (max 10 MB)")
					return
				}
				writeJSONError(w, http.StatusBadRequest, "error reading multipart data")
				return
			}

			if part.FormName() != "file" {
				continue
			}

			// Detect and validate content type from actual file bytes
			contentType, combined, err := gridfs.DetectAndValidate(part)
			if err != nil {
				writeJSONError(w, http.StatusBadRequest, err.Error())
				return
			}

			filename := part.FileName()
			if filename == "" {
				filename = "image"
			}

			oid, err := gridfs.Upload(ctx, database, filename, contentType, combined)
			if err != nil {
				log.Printf("image upload: gridfs upload failed: %v", err)
				writeJSONError(w, http.StatusInternalServerError, "failed to store image")
				return
			}

			imageID = oid
			fileProcessed = true
			break // only process first file
		}

		if !fileProcessed {
			writeJSONError(w, http.StatusBadRequest, "missing required field: file")
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]string{
			"id":  imageID.Hex(),
			"url": "/images/" + imageID.Hex(),
		}) //nolint:errcheck
	}
}

// ServeImage handles GET /images/{id} — reads from GridFS and streams the image.
func ServeImage(database *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		idHex := chi.URLParam(r, "id")

		oid, err := bson.ObjectIDFromHex(idHex)
		if err != nil {
			writeJSONError(w, http.StatusBadRequest, "invalid image id")
			return
		}

		if err := gridfs.Download(ctx, database, oid, w); err != nil {
			if strings.Contains(err.Error(), "not found") ||
				strings.Contains(err.Error(), "no results") {
				writeJSONError(w, http.StatusNotFound, "image not found")
				return
			}
			log.Printf("image serve: %v", err)
			writeJSONError(w, http.StatusInternalServerError, "failed to serve image")
		}
	}
}
