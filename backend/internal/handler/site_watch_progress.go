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

type updateWatchProgressRequest struct {
	ProgressSec int `json:"progress_sec"`
	DurationSec int `json:"duration_sec"`
}

type continueWatchingItem struct {
	models.Episode
	ProgressSec int     `json:"progress_sec"`
	ProgressPct float64 `json:"progress_pct"`
	DurationSec int     `json:"duration_sec"`
}

// UpdateWatchProgress upserts playback progress for the given episode.
func UpdateWatchProgress(database *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, err := userIDFromContext(r)
		if err != nil {
			http.Error(w, "invalid token", http.StatusUnauthorized)
			return
		}

		episodeID, err := bson.ObjectIDFromHex(chi.URLParam(r, "episode_id"))
		if err != nil {
			http.Error(w, "invalid episode_id", http.StatusBadRequest)
			return
		}

		var req updateWatchProgressRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "invalid request body", http.StatusBadRequest)
			return
		}

		var progressPct float64
		if req.DurationSec > 0 {
			progressPct = float64(req.ProgressSec) / float64(req.DurationSec)
		}
		completed := progressPct >= 0.9

		// Fetch user to get active_child_id
		var user models.User
		err = database.Collection(db.CollUsers).FindOne(r.Context(), bson.D{{Key: "_id", Value: userID}}).Decode(&user)
		if err != nil {
			http.Error(w, "user not found", http.StatusNotFound)
			return
		}

		// If watch history is paused for the active child, skip saving
		if user.ActiveChildID != nil {
			for _, cp := range user.ChildProfiles {
				if cp.ID == *user.ActiveChildID && cp.WatchHistoryPaused {
					w.Header().Set("Content-Type", "application/json")
					json.NewEncoder(w).Encode(map[string]any{"status": "paused"}) //nolint:errcheck
					return
				}
			}
		}

		now := time.Now().UTC()

		filter := bson.D{
			{Key: "user_id", Value: userID},
			{Key: "child_id", Value: user.ActiveChildID},
			{Key: "episode_id", Value: episodeID},
		}

		update := bson.D{
			{Key: "$set", Value: bson.D{
				{Key: "user_id", Value: userID},
				{Key: "child_id", Value: user.ActiveChildID},
				{Key: "episode_id", Value: episodeID},
				{Key: "progress_sec", Value: req.ProgressSec},
				{Key: "duration_sec", Value: req.DurationSec},
				{Key: "progress_pct", Value: progressPct},
				{Key: "completed", Value: completed},
				{Key: "last_watched_at", Value: now},
			}},
			{Key: "$setOnInsert", Value: bson.D{
				{Key: "created_at", Value: now},
			}},
		}

		opts := options.UpdateOne().SetUpsert(true)
		_, err = database.Collection(db.CollWatchProgress).UpdateOne(r.Context(), filter, update, opts)
		if err != nil {
			http.Error(w, "failed to update watch progress", http.StatusInternalServerError)
			return
		}

		// Trigger gamification checks when an episode is marked completed
		if completed && user.ActiveChildID != nil {
			go CheckAndAwardBadges(database, userID, *user.ActiveChildID)
			go UpdateStreak(database, userID, *user.ActiveChildID)
		}

		w.WriteHeader(http.StatusOK)
	}
}

// GetWatchProgress returns the watch progress for a single episode.
func GetWatchProgress(database *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, err := userIDFromContext(r)
		if err != nil {
			http.Error(w, "invalid token", http.StatusUnauthorized)
			return
		}

		episodeID, err := bson.ObjectIDFromHex(chi.URLParam(r, "episode_id"))
		if err != nil {
			http.Error(w, "invalid episode_id", http.StatusBadRequest)
			return
		}

		// Fetch user to get active_child_id
		var user models.User
		err = database.Collection(db.CollUsers).FindOne(r.Context(), bson.D{{Key: "_id", Value: userID}}).Decode(&user)
		if err != nil {
			http.Error(w, "user not found", http.StatusNotFound)
			return
		}

		filter := bson.D{
			{Key: "user_id", Value: userID},
			{Key: "child_id", Value: user.ActiveChildID},
			{Key: "episode_id", Value: episodeID},
		}

		var progress models.WatchProgress
		err = database.Collection(db.CollWatchProgress).FindOne(r.Context(), filter).Decode(&progress)
		if err == mongo.ErrNoDocuments {
			http.Error(w, "watch progress not found", http.StatusNotFound)
			return
		}
		if err != nil {
			http.Error(w, "failed to fetch watch progress", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(progress) //nolint:errcheck
	}
}

// GetContinueWatching returns incomplete episodes sorted by last watched time.
func GetContinueWatching(database *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, err := userIDFromContext(r)
		if err != nil {
			http.Error(w, "invalid token", http.StatusUnauthorized)
			return
		}

		// Fetch user to get active_child_id
		var user models.User
		err = database.Collection(db.CollUsers).FindOne(r.Context(), bson.D{{Key: "_id", Value: userID}}).Decode(&user)
		if err != nil {
			http.Error(w, "user not found", http.StatusNotFound)
			return
		}

		filter := bson.D{
			{Key: "user_id", Value: userID},
			{Key: "child_id", Value: user.ActiveChildID},
			{Key: "completed", Value: false},
		}

		opts := options.Find().
			SetSort(bson.D{{Key: "last_watched_at", Value: -1}}).
			SetLimit(20)

		cursor, err := database.Collection(db.CollWatchProgress).Find(r.Context(), filter, opts)
		if err != nil {
			http.Error(w, "failed to fetch continue watching", http.StatusInternalServerError)
			return
		}
		defer cursor.Close(r.Context())

		var progressDocs []models.WatchProgress
		if err := cursor.All(r.Context(), &progressDocs); err != nil {
			http.Error(w, "failed to decode watch progress", http.StatusInternalServerError)
			return
		}

		items := make([]continueWatchingItem, 0, len(progressDocs))
		for _, p := range progressDocs {
			var ep models.Episode
			err := database.Collection(db.CollEpisodes).FindOne(
				r.Context(),
				bson.D{{Key: "_id", Value: p.EpisodeID}, {Key: "status", Value: "ready"}},
			).Decode(&ep)
			if err != nil {
				continue // episode may not be ready — skip gracefully
			}
			items = append(items, continueWatchingItem{
				Episode:     ep,
				ProgressSec: p.ProgressSec,
				ProgressPct: p.ProgressPct,
				DurationSec: p.DurationSec,
			})
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(items) //nolint:errcheck
	}
}

// GetWatchHistory returns all watched episodes with cursor pagination.
func GetWatchHistory(database *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, err := userIDFromContext(r)
		if err != nil {
			http.Error(w, "invalid token", http.StatusUnauthorized)
			return
		}

		// Fetch user to get active_child_id
		var user models.User
		err = database.Collection(db.CollUsers).FindOne(r.Context(), bson.D{{Key: "_id", Value: userID}}).Decode(&user)
		if err != nil {
			http.Error(w, "user not found", http.StatusNotFound)
			return
		}

		filter := bson.D{
			{Key: "user_id", Value: userID},
			{Key: "child_id", Value: user.ActiveChildID},
		}

		// Cursor pagination: if "before" is provided, filter last_watched_at < before
		if beforeParam := r.URL.Query().Get("before"); beforeParam != "" {
			beforeTime, err := time.Parse(time.RFC3339, beforeParam)
			if err != nil {
				http.Error(w, "invalid before parameter, use ISO 8601 format", http.StatusBadRequest)
				return
			}
			filter = append(filter, bson.E{Key: "last_watched_at", Value: bson.D{{Key: "$lt", Value: beforeTime}}})
		}

		opts := options.Find().
			SetSort(bson.D{{Key: "last_watched_at", Value: -1}}).
			SetLimit(50)

		cursor, err := database.Collection(db.CollWatchProgress).Find(r.Context(), filter, opts)
		if err != nil {
			http.Error(w, "failed to fetch watch history", http.StatusInternalServerError)
			return
		}
		defer cursor.Close(r.Context())

		var progressDocs []models.WatchProgress
		if err := cursor.All(r.Context(), &progressDocs); err != nil {
			http.Error(w, "failed to decode watch history", http.StatusInternalServerError)
			return
		}

		items := make([]continueWatchingItem, 0, len(progressDocs))
		for _, p := range progressDocs {
			var ep models.Episode
			err := database.Collection(db.CollEpisodes).FindOne(
				r.Context(),
				bson.D{{Key: "_id", Value: p.EpisodeID}, {Key: "status", Value: "ready"}},
			).Decode(&ep)
			if err != nil {
				continue // episode may not be ready — skip gracefully
			}
			items = append(items, continueWatchingItem{
				Episode:     ep,
				ProgressSec: p.ProgressSec,
				ProgressPct: p.ProgressPct,
				DurationSec: p.DurationSec,
			})
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(items) //nolint:errcheck
	}
}

// ClearWatchHistory deletes all watch progress for the authenticated user's active child.
func ClearWatchHistory(database *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, err := userIDFromContext(r)
		if err != nil {
			http.Error(w, "invalid token", http.StatusUnauthorized)
			return
		}

		// Fetch user to get active_child_id
		var user models.User
		err = database.Collection(db.CollUsers).FindOne(r.Context(), bson.D{{Key: "_id", Value: userID}}).Decode(&user)
		if err != nil {
			http.Error(w, "user not found", http.StatusNotFound)
			return
		}

		filter := bson.D{
			{Key: "user_id", Value: userID},
			{Key: "child_id", Value: user.ActiveChildID},
		}

		_, err = database.Collection(db.CollWatchProgress).DeleteMany(r.Context(), filter)
		if err != nil {
			http.Error(w, "failed to clear watch history", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
	}
}
