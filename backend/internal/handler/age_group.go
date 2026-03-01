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
)

type ageGroupRequest struct {
	Name   string `json:"name"`
	MinAge int    `json:"min_age"`
	MaxAge int    `json:"max_age"`
}

// ListAgeGroups returns an http.HandlerFunc that lists all age groups.
func ListAgeGroups(database *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		cursor, err := database.Collection(db.CollAgeGroups).Find(ctx, bson.D{})
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

// GetAgeGroup returns an http.HandlerFunc that retrieves a single age group by ID.
func GetAgeGroup(database *mongo.Database) http.HandlerFunc {
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

		var ageGroup models.AgeGroup
		err = database.Collection(db.CollAgeGroups).FindOne(ctx, bson.D{{Key: "_id", Value: oid}}).Decode(&ageGroup)
		if err == mongo.ErrNoDocuments {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusNotFound)
			json.NewEncoder(w).Encode(map[string]string{"error": "age group not found"}) //nolint:errcheck
			return
		}
		if err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "failed to get age group"}) //nolint:errcheck
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(ageGroup) //nolint:errcheck
	}
}

// CreateAgeGroup returns an http.HandlerFunc that creates a new age group.
func CreateAgeGroup(database *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		var req ageGroupRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "invalid request body"}) //nolint:errcheck
			return
		}

		if req.MinAge < 0 || req.MaxAge < 0 || req.MinAge >= req.MaxAge {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "min_age must be >= 0 and less than max_age"}) //nolint:errcheck
			return
		}

		now := time.Now().UTC()
		ageGroup := models.AgeGroup{
			Name:      req.Name,
			MinAge:    req.MinAge,
			MaxAge:    req.MaxAge,
			CreatedAt: now,
			UpdatedAt: now,
		}

		res, err := database.Collection(db.CollAgeGroups).InsertOne(ctx, ageGroup)
		if err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "failed to create age group"}) //nolint:errcheck
			return
		}
		ageGroup.ID = res.InsertedID.(bson.ObjectID)

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(ageGroup) //nolint:errcheck
	}
}

// UpdateAgeGroup returns an http.HandlerFunc that updates an existing age group.
func UpdateAgeGroup(database *mongo.Database) http.HandlerFunc {
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

		var req ageGroupRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "invalid request body"}) //nolint:errcheck
			return
		}

		if req.MinAge < 0 || req.MaxAge < 0 || req.MinAge >= req.MaxAge {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "min_age must be >= 0 and less than max_age"}) //nolint:errcheck
			return
		}

		now := time.Now().UTC()
		update := bson.D{{Key: "$set", Value: bson.D{
			{Key: "name", Value: req.Name},
			{Key: "min_age", Value: req.MinAge},
			{Key: "max_age", Value: req.MaxAge},
			{Key: "updated_at", Value: now},
		}}}

		result, err := database.Collection(db.CollAgeGroups).UpdateOne(ctx, bson.D{{Key: "_id", Value: oid}}, update)
		if err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "failed to update age group"}) //nolint:errcheck
			return
		}
		if result.MatchedCount == 0 {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusNotFound)
			json.NewEncoder(w).Encode(map[string]string{"error": "age group not found"}) //nolint:errcheck
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"name":       req.Name,
			"min_age":    req.MinAge,
			"max_age":    req.MaxAge,
			"updated_at": now,
		}) //nolint:errcheck
	}
}

// DeleteAgeGroup returns an http.HandlerFunc that deletes an age group by ID.
func DeleteAgeGroup(database *mongo.Database) http.HandlerFunc {
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

		result, err := database.Collection(db.CollAgeGroups).DeleteOne(ctx, bson.D{{Key: "_id", Value: oid}})
		if err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "failed to delete age group"}) //nolint:errcheck
			return
		}
		if result.DeletedCount == 0 {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusNotFound)
			json.NewEncoder(w).Encode(map[string]string{"error": "age group not found"}) //nolint:errcheck
			return
		}

		w.WriteHeader(http.StatusNoContent)
	}
}
