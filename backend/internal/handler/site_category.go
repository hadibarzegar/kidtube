package handler

import (
	"encoding/json"
	"net/http"

	"github.com/hadi/kidtube/internal/db"
	"github.com/hadi/kidtube/internal/models"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

// SiteListCategories returns an http.HandlerFunc that lists all categories for the public site.
// Sorted by name ascending.
func SiteListCategories(database *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		opts := options.Find().SetSort(bson.D{{Key: "name", Value: 1}})
		cursor, err := database.Collection(db.CollCategories).Find(ctx, bson.D{}, opts)
		if err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "failed to list categories"}) //nolint:errcheck
			return
		}
		defer cursor.Close(ctx)

		categories := make([]models.Category, 0)
		if err := cursor.All(ctx, &categories); err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "failed to decode categories"}) //nolint:errcheck
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(categories) //nolint:errcheck
	}
}
