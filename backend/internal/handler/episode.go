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

type episodeRequest struct {
	ChannelID   string `json:"channel_id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Order       int    `json:"order"`
	SubtitleURL string `json:"subtitle_url"`
	SourceURL   string `json:"source_url"`
}

// ListEpisodes returns an http.HandlerFunc that lists all episodes.
// Accepts an optional ?channel_id=xxx query parameter to filter by channel.
func ListEpisodes(database *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		filter := bson.D{}

		if channelIDParam := r.URL.Query().Get("channel_id"); channelIDParam != "" {
			channelObjID, err := bson.ObjectIDFromHex(channelIDParam)
			if err != nil {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusBadRequest)
				json.NewEncoder(w).Encode(map[string]string{"error": "invalid channel_id"}) //nolint:errcheck
				return
			}
			filter = bson.D{{Key: "channel_id", Value: channelObjID}}
		}

		cursor, err := database.Collection(db.CollEpisodes).Find(ctx, filter)
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

// GetEpisode returns an http.HandlerFunc that retrieves a single episode by ID.
func GetEpisode(database *mongo.Database) http.HandlerFunc {
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
		err = database.Collection(db.CollEpisodes).FindOne(ctx, bson.D{{Key: "_id", Value: oid}}).Decode(&episode)
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

// CreateEpisode returns an http.HandlerFunc that creates a new episode.
// If source_url is provided, a Job document is also created and 202 is returned.
func CreateEpisode(database *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		var req episodeRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "invalid request body"}) //nolint:errcheck
			return
		}

		channelObjID, err := bson.ObjectIDFromHex(req.ChannelID)
		if err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "invalid channel_id"}) //nolint:errcheck
			return
		}

		now := time.Now().UTC()
		episode := models.Episode{
			ChannelID:   channelObjID,
			Title:       req.Title,
			Description: req.Description,
			Order:       req.Order,
			SubtitleURL: req.SubtitleURL,
			Status:      "pending",
			CreatedAt:   now,
			UpdatedAt:   now,
		}

		res, err := database.Collection(db.CollEpisodes).InsertOne(ctx, episode)
		if err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "failed to create episode"}) //nolint:errcheck
			return
		}
		episode.ID = res.InsertedID.(bson.ObjectID)

		statusCode := http.StatusCreated

		if req.SourceURL != "" {
			job := models.Job{
				EpisodeID: episode.ID,
				SourceURL: req.SourceURL,
				Status:    models.JobStatusPending,
				CreatedAt: now,
				UpdatedAt: now,
			}
			_, err := database.Collection(db.CollJobs).InsertOne(ctx, job)
			if err != nil {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusInternalServerError)
				json.NewEncoder(w).Encode(map[string]string{"error": "failed to create job"}) //nolint:errcheck
				return
			}
			statusCode = http.StatusAccepted
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(statusCode)
		json.NewEncoder(w).Encode(episode) //nolint:errcheck
	}
}

// UpdateEpisode returns an http.HandlerFunc that updates an existing episode.
func UpdateEpisode(database *mongo.Database) http.HandlerFunc {
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

		var req episodeRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "invalid request body"}) //nolint:errcheck
			return
		}

		now := time.Now().UTC()
		update := bson.D{{Key: "$set", Value: bson.D{
			{Key: "title", Value: req.Title},
			{Key: "description", Value: req.Description},
			{Key: "order", Value: req.Order},
			{Key: "subtitle_url", Value: req.SubtitleURL},
			{Key: "updated_at", Value: now},
		}}}

		result, err := database.Collection(db.CollEpisodes).UpdateOne(ctx, bson.D{{Key: "_id", Value: oid}}, update)
		if err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "failed to update episode"}) //nolint:errcheck
			return
		}
		if result.MatchedCount == 0 {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusNotFound)
			json.NewEncoder(w).Encode(map[string]string{"error": "episode not found"}) //nolint:errcheck
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"title":        req.Title,
			"description":  req.Description,
			"order":        req.Order,
			"subtitle_url": req.SubtitleURL,
			"updated_at":   now,
		}) //nolint:errcheck
	}
}

// DeleteEpisode returns an http.HandlerFunc that deletes an episode by ID.
func DeleteEpisode(database *mongo.Database) http.HandlerFunc {
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

		result, err := database.Collection(db.CollEpisodes).DeleteOne(ctx, bson.D{{Key: "_id", Value: oid}})
		if err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "failed to delete episode"}) //nolint:errcheck
			return
		}
		if result.DeletedCount == 0 {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusNotFound)
			json.NewEncoder(w).Encode(map[string]string{"error": "episode not found"}) //nolint:errcheck
			return
		}

		w.WriteHeader(http.StatusNoContent)
	}
}
