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

// SiteListChannels returns an http.HandlerFunc that lists all channels for the public site.
// Supports optional ?category_id= and ?age_group_id= query filters.
func SiteListChannels(database *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		filter := bson.D{}

		if categoryIDParam := r.URL.Query().Get("category_id"); categoryIDParam != "" {
			oid, err := bson.ObjectIDFromHex(categoryIDParam)
			if err != nil {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusBadRequest)
				json.NewEncoder(w).Encode(map[string]string{"error": "invalid category_id"}) //nolint:errcheck
				return
			}
			filter = append(filter, bson.E{Key: "category_ids", Value: oid})
		}

		if ageGroupIDParam := r.URL.Query().Get("age_group_id"); ageGroupIDParam != "" {
			oid, err := bson.ObjectIDFromHex(ageGroupIDParam)
			if err != nil {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusBadRequest)
				json.NewEncoder(w).Encode(map[string]string{"error": "invalid age_group_id"}) //nolint:errcheck
				return
			}
			filter = append(filter, bson.E{Key: "age_group_ids", Value: oid})
		}

		opts := options.Find().SetSort(bson.D{{Key: "created_at", Value: -1}})
		cursor, err := database.Collection(db.CollChannels).Find(ctx, filter, opts)
		if err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "failed to list channels"}) //nolint:errcheck
			return
		}
		defer cursor.Close(ctx)

		channels := make([]models.Channel, 0)
		if err := cursor.All(ctx, &channels); err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "failed to decode channels"}) //nolint:errcheck
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(channels) //nolint:errcheck
	}
}

// SiteGetChannel returns an http.HandlerFunc that retrieves a single channel by ID for the public site.
func SiteGetChannel(database *mongo.Database) http.HandlerFunc {
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

		var channel models.Channel
		err = database.Collection(db.CollChannels).FindOne(ctx, bson.D{{Key: "_id", Value: oid}}).Decode(&channel)
		if err == mongo.ErrNoDocuments {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusNotFound)
			json.NewEncoder(w).Encode(map[string]string{"error": "channel not found"}) //nolint:errcheck
			return
		}
		if err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "failed to get channel"}) //nolint:errcheck
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(channel) //nolint:errcheck
	}
}
