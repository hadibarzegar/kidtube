package handler

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/hadi/kidtube/internal/db"
	"github.com/hadi/kidtube/internal/models"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

// AdminListPlaylists returns all featured/public playlists for admin management.
func AdminListPlaylists(database *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		opts := options.Find().SetSort(bson.D{{Key: "created_at", Value: -1}})
		filter := bson.D{{Key: "$or", Value: bson.A{
			bson.D{{Key: "is_featured", Value: true}},
			bson.D{{Key: "is_public", Value: true}},
		}}}

		cursor, err := database.Collection(db.CollPlaylists).Find(r.Context(), filter, opts)
		if err != nil {
			http.Error(w, "failed to fetch playlists", http.StatusInternalServerError)
			return
		}
		defer cursor.Close(r.Context())

		var playlists []models.Playlist
		if err := cursor.All(r.Context(), &playlists); err != nil {
			http.Error(w, "failed to decode playlists", http.StatusInternalServerError)
			return
		}
		if playlists == nil {
			playlists = []models.Playlist{}
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(playlists) //nolint:errcheck
	}
}

// AdminCreatePlaylist creates a new featured/public playlist.
func AdminCreatePlaylist(database *mongo.Database) http.HandlerFunc {
	type request struct {
		Title       string `json:"title"`
		Description string `json:"description"`
		IsFeatured  bool   `json:"is_featured"`
		IsPublic    bool   `json:"is_public"`
		Thumbnail   string `json:"thumbnail"`
	}
	return func(w http.ResponseWriter, r *http.Request) {
		userID, err := userIDFromContext(r)
		if err != nil {
			http.Error(w, "invalid token", http.StatusUnauthorized)
			return
		}

		var req request
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "invalid request body", http.StatusBadRequest)
			return
		}
		if req.Title == "" {
			http.Error(w, "title is required", http.StatusBadRequest)
			return
		}

		now := time.Now().UTC()
		playlist := models.Playlist{
			UserID:      userID,
			Title:       req.Title,
			Description: req.Description,
			EpisodeIDs:  []bson.ObjectID{},
			IsPublic:    req.IsPublic,
			IsFeatured:  req.IsFeatured,
			Thumbnail:   req.Thumbnail,
			CreatedAt:   now,
			UpdatedAt:   now,
		}

		result, err := database.Collection(db.CollPlaylists).InsertOne(r.Context(), playlist)
		if err != nil {
			http.Error(w, "failed to create playlist", http.StatusInternalServerError)
			return
		}
		playlist.ID = result.InsertedID.(bson.ObjectID)

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(playlist) //nolint:errcheck
	}
}

// AdminUpdatePlaylist updates an admin-managed playlist.
func AdminUpdatePlaylist(database *mongo.Database) http.HandlerFunc {
	type request struct {
		Title       *string          `json:"title"`
		Description *string          `json:"description"`
		IsFeatured  *bool            `json:"is_featured"`
		IsPublic    *bool            `json:"is_public"`
		Thumbnail   *string          `json:"thumbnail"`
		EpisodeIDs  []bson.ObjectID  `json:"episode_ids"`
	}
	return func(w http.ResponseWriter, r *http.Request) {
		id, err := bson.ObjectIDFromHex(chi.URLParam(r, "id"))
		if err != nil {
			http.Error(w, "invalid id", http.StatusBadRequest)
			return
		}

		var req request
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "invalid request body", http.StatusBadRequest)
			return
		}

		updates := bson.D{{Key: "updated_at", Value: time.Now().UTC()}}
		if req.Title != nil {
			updates = append(updates, bson.E{Key: "title", Value: *req.Title})
		}
		if req.Description != nil {
			updates = append(updates, bson.E{Key: "description", Value: *req.Description})
		}
		if req.IsFeatured != nil {
			updates = append(updates, bson.E{Key: "is_featured", Value: *req.IsFeatured})
		}
		if req.IsPublic != nil {
			updates = append(updates, bson.E{Key: "is_public", Value: *req.IsPublic})
		}
		if req.Thumbnail != nil {
			updates = append(updates, bson.E{Key: "thumbnail", Value: *req.Thumbnail})
		}
		if req.EpisodeIDs != nil {
			updates = append(updates, bson.E{Key: "episode_ids", Value: req.EpisodeIDs})
		}

		_, err = database.Collection(db.CollPlaylists).UpdateOne(
			r.Context(),
			bson.D{{Key: "_id", Value: id}},
			bson.D{{Key: "$set", Value: updates}},
		)
		if err != nil {
			http.Error(w, "failed to update playlist", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
	}
}

// AdminDeletePlaylist deletes a playlist by ID.
func AdminDeletePlaylist(database *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id, err := bson.ObjectIDFromHex(chi.URLParam(r, "id"))
		if err != nil {
			http.Error(w, "invalid id", http.StatusBadRequest)
			return
		}

		_, err = database.Collection(db.CollPlaylists).DeleteOne(
			r.Context(),
			bson.D{{Key: "_id", Value: id}},
		)
		if err != nil {
			http.Error(w, "failed to delete playlist", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
	}
}
