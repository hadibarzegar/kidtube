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

// ListUsers returns an http.HandlerFunc that lists all registered users sorted by
// registration date descending. Password hash is always projected out as belt-and-suspenders
// security (json:"-" on the struct field is a second layer of protection).
func ListUsers(database *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		opts := options.Find().
			SetSort(bson.D{{Key: "created_at", Value: -1}}).
			SetProjection(bson.D{{Key: "password_hash", Value: 0}})

		cursor, err := database.Collection(db.CollUsers).Find(r.Context(), bson.D{}, opts)
		if err != nil {
			http.Error(w, "failed to list users", http.StatusInternalServerError)
			return
		}

		var users []models.User
		if err := cursor.All(r.Context(), &users); err != nil {
			http.Error(w, "failed to decode users", http.StatusInternalServerError)
			return
		}
		if users == nil {
			users = []models.User{}
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(users) //nolint:errcheck
	}
}
