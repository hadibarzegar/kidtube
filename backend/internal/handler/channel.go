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

type channelRequest struct {
	Name        string   `json:"name"`
	Description string   `json:"description"`
	Thumbnail   string   `json:"thumbnail"`
	CategoryIDs []string `json:"category_ids"`
	AgeGroupIDs []string `json:"age_group_ids"`
}

func parseObjectIDs(hexIDs []string) ([]bson.ObjectID, error) {
	ids := make([]bson.ObjectID, 0, len(hexIDs))
	for _, h := range hexIDs {
		oid, err := bson.ObjectIDFromHex(h)
		if err != nil {
			return nil, err
		}
		ids = append(ids, oid)
	}
	return ids, nil
}

// ListChannels returns an http.HandlerFunc that lists all channels.
func ListChannels(database *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		cursor, err := database.Collection(db.CollChannels).Find(ctx, bson.D{})
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

// GetChannel returns an http.HandlerFunc that retrieves a single channel by ID.
func GetChannel(database *mongo.Database) http.HandlerFunc {
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

// CreateChannel returns an http.HandlerFunc that creates a new channel.
func CreateChannel(database *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		var req channelRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "invalid request body"}) //nolint:errcheck
			return
		}

		categoryIDs, err := parseObjectIDs(req.CategoryIDs)
		if err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "invalid category_ids"}) //nolint:errcheck
			return
		}

		ageGroupIDs, err := parseObjectIDs(req.AgeGroupIDs)
		if err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "invalid age_group_ids"}) //nolint:errcheck
			return
		}

		now := time.Now().UTC()
		channel := models.Channel{
			Name:        req.Name,
			Description: req.Description,
			Thumbnail:   req.Thumbnail,
			CategoryIDs: categoryIDs,
			AgeGroupIDs: ageGroupIDs,
			CreatedAt:   now,
			UpdatedAt:   now,
		}

		res, err := database.Collection(db.CollChannels).InsertOne(ctx, channel)
		if err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "failed to create channel"}) //nolint:errcheck
			return
		}
		channel.ID = res.InsertedID.(bson.ObjectID)

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(channel) //nolint:errcheck
	}
}

// UpdateChannel returns an http.HandlerFunc that updates an existing channel.
func UpdateChannel(database *mongo.Database) http.HandlerFunc {
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

		var req channelRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "invalid request body"}) //nolint:errcheck
			return
		}

		categoryIDs, err := parseObjectIDs(req.CategoryIDs)
		if err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "invalid category_ids"}) //nolint:errcheck
			return
		}

		ageGroupIDs, err := parseObjectIDs(req.AgeGroupIDs)
		if err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "invalid age_group_ids"}) //nolint:errcheck
			return
		}

		now := time.Now().UTC()
		update := bson.D{{Key: "$set", Value: bson.D{
			{Key: "name", Value: req.Name},
			{Key: "description", Value: req.Description},
			{Key: "thumbnail", Value: req.Thumbnail},
			{Key: "category_ids", Value: categoryIDs},
			{Key: "age_group_ids", Value: ageGroupIDs},
			{Key: "updated_at", Value: now},
		}}}

		result, err := database.Collection(db.CollChannels).UpdateOne(ctx, bson.D{{Key: "_id", Value: oid}}, update)
		if err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "failed to update channel"}) //nolint:errcheck
			return
		}
		if result.MatchedCount == 0 {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusNotFound)
			json.NewEncoder(w).Encode(map[string]string{"error": "channel not found"}) //nolint:errcheck
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"name":         req.Name,
			"description":  req.Description,
			"thumbnail":    req.Thumbnail,
			"category_ids": req.CategoryIDs,
			"age_group_ids": req.AgeGroupIDs,
			"updated_at":   now,
		}) //nolint:errcheck
	}
}

// DeleteChannel returns an http.HandlerFunc that deletes a channel by ID.
func DeleteChannel(database *mongo.Database) http.HandlerFunc {
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

		result, err := database.Collection(db.CollChannels).DeleteOne(ctx, bson.D{{Key: "_id", Value: oid}})
		if err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "failed to delete channel"}) //nolint:errcheck
			return
		}
		if result.DeletedCount == 0 {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusNotFound)
			json.NewEncoder(w).Encode(map[string]string{"error": "channel not found"}) //nolint:errcheck
			return
		}

		w.WriteHeader(http.StatusNoContent)
	}
}
