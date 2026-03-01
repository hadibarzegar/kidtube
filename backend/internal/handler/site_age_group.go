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

// SiteListAgeGroups returns an http.HandlerFunc that lists all age groups for the public site.
// Sorted by min_age ascending.
func SiteListAgeGroups(database *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		opts := options.Find().SetSort(bson.D{{Key: "min_age", Value: 1}})
		cursor, err := database.Collection(db.CollAgeGroups).Find(ctx, bson.D{}, opts)
		if err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "failed to list age groups"}) //nolint:errcheck
			return
		}
		defer cursor.Close(ctx)

		ageGroups := make([]models.AgeGroup, 0)
		if err := cursor.All(ctx, &ageGroups); err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "failed to decode age groups"}) //nolint:errcheck
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(ageGroups) //nolint:errcheck
	}
}
