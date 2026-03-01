package handler

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/hadi/kidtube/internal/db"
	"github.com/hadi/kidtube/internal/models"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

// SiteListEpisodes returns an http.HandlerFunc that lists episodes for the public site.
// CRITICAL: Always filters to status=ready only — never exposes unplayable episodes.
// Supports optional ?channel_id= filter. Sorted by order ascending.
func SiteListEpisodes(database *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		// Always include status=ready filter — public endpoints must never expose unplayable episodes.
		filter := bson.D{{Key: "status", Value: "ready"}}

		if channelIDParam := r.URL.Query().Get("channel_id"); channelIDParam != "" {
			channelObjID, err := bson.ObjectIDFromHex(channelIDParam)
			if err != nil {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusBadRequest)
				json.NewEncoder(w).Encode(map[string]string{"error": "invalid channel_id"}) //nolint:errcheck
				return
			}
			filter = append(filter, bson.E{Key: "channel_id", Value: channelObjID})
		}

		opts := options.Find().SetSort(bson.D{{Key: "order", Value: 1}})
		cursor, err := database.Collection(db.CollEpisodes).Find(ctx, filter, opts)
		if err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "failed to list episodes"}) //nolint:errcheck
			return
		}
		defer cursor.Close(ctx)

		episodes := make([]models.Episode, 0)
		if err := cursor.All(ctx, &episodes); err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "failed to decode episodes"}) //nolint:errcheck
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(episodes) //nolint:errcheck
	}
}

// SiteGetEpisode returns an http.HandlerFunc that retrieves a single episode by ID for the public site.
// Only returns episodes with status=ready — returns 404 for pending or failed episodes.
func SiteGetEpisode(database *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		id := chi.URLParam(r, "id")
		oid, err := bson.ObjectIDFromHex(id)
		if err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "invalid id"}) //nolint:errcheck
			return
		}

		var episode models.Episode
		// Filter by both _id and status=ready so non-ready episodes return 404.
		err = database.Collection(db.CollEpisodes).FindOne(ctx, bson.D{
			{Key: "_id", Value: oid},
			{Key: "status", Value: "ready"},
		}).Decode(&episode)
		if err == mongo.ErrNoDocuments {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusNotFound)
			json.NewEncoder(w).Encode(map[string]string{"error": "episode not found"}) //nolint:errcheck
			return
		}
		if err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "failed to get episode"}) //nolint:errcheck
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(episode) //nolint:errcheck
	}
}
