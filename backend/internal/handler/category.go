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

type categoryRequest struct {
	Name string `json:"name"`
}

// ListCategories returns an http.HandlerFunc that lists all categories.
func ListCategories(database *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		cursor, err := database.Collection(db.CollCategories).Find(ctx, bson.D{})
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

// GetCategory returns an http.HandlerFunc that retrieves a single category by ID.
func GetCategory(database *mongo.Database) http.HandlerFunc {
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

		var category models.Category
		err = database.Collection(db.CollCategories).FindOne(ctx, bson.D{{Key: "_id", Value: oid}}).Decode(&category)
		if err == mongo.ErrNoDocuments {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusNotFound)
			json.NewEncoder(w).Encode(map[string]string{"error": "category not found"}) //nolint:errcheck
			return
		}
		if err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "failed to get category"}) //nolint:errcheck
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(category) //nolint:errcheck
	}
}

// CreateCategory returns an http.HandlerFunc that creates a new category.
func CreateCategory(database *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		var req categoryRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "invalid request body"}) //nolint:errcheck
			return
		}

		now := time.Now().UTC()
		category := models.Category{
			Name:      req.Name,
			CreatedAt: now,
			UpdatedAt: now,
		}

		res, err := database.Collection(db.CollCategories).InsertOne(ctx, category)
		if err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "failed to create category"}) //nolint:errcheck
			return
		}
		category.ID = res.InsertedID.(bson.ObjectID)

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(category) //nolint:errcheck
	}
}

// UpdateCategory returns an http.HandlerFunc that updates an existing category.
func UpdateCategory(database *mongo.Database) http.HandlerFunc {
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

		var req categoryRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "invalid request body"}) //nolint:errcheck
			return
		}

		now := time.Now().UTC()
		update := bson.D{{Key: "$set", Value: bson.D{
			{Key: "name", Value: req.Name},
			{Key: "updated_at", Value: now},
		}}}

		result, err := database.Collection(db.CollCategories).UpdateOne(ctx, bson.D{{Key: "_id", Value: oid}}, update)
		if err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "failed to update category"}) //nolint:errcheck
			return
		}
		if result.MatchedCount == 0 {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusNotFound)
			json.NewEncoder(w).Encode(map[string]string{"error": "category not found"}) //nolint:errcheck
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"name":       req.Name,
			"updated_at": now,
		}) //nolint:errcheck
	}
}

// DeleteCategory returns an http.HandlerFunc that deletes a category by ID.
func DeleteCategory(database *mongo.Database) http.HandlerFunc {
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

		result, err := database.Collection(db.CollCategories).DeleteOne(ctx, bson.D{{Key: "_id", Value: oid}})
		if err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "failed to delete category"}) //nolint:errcheck
			return
		}
		if result.DeletedCount == 0 {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusNotFound)
			json.NewEncoder(w).Encode(map[string]string{"error": "category not found"}) //nolint:errcheck
			return
		}

		w.WriteHeader(http.StatusNoContent)
	}
}
