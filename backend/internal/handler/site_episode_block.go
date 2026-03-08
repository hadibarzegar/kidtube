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

type blockEpisodeRequest struct {
	EpisodeID string `json:"episode_id"`
}

type blockedEpisodeEntry struct {
	models.EpisodeRule `json:",inline"`
	EpisodeTitle       string `json:"episode_title"`
	EpisodeThumbnail   string `json:"episode_thumbnail"`
}

// BlockEpisode creates an episode block rule for the given child profile.
func BlockEpisode(database *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, err := userIDFromContext(r)
		if err != nil {
			http.Error(w, "invalid token", http.StatusUnauthorized)
			return
		}

		childID, err := bson.ObjectIDFromHex(chi.URLParam(r, "childId"))
		if err != nil {
			http.Error(w, "invalid childId", http.StatusBadRequest)
			return
		}

		var req blockEpisodeRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "invalid request body", http.StatusBadRequest)
			return
		}

		episodeID, err := bson.ObjectIDFromHex(req.EpisodeID)
		if err != nil {
			http.Error(w, "invalid episode_id", http.StatusBadRequest)
			return
		}

		// Validate child belongs to user
		var user models.User
		err = database.Collection(db.CollUsers).FindOne(r.Context(), bson.D{{Key: "_id", Value: userID}}).Decode(&user)
		if err != nil {
			http.Error(w, "user not found", http.StatusNotFound)
			return
		}
		if !childBelongsToUser(&user, childID) {
			http.Error(w, "child profile not found", http.StatusNotFound)
			return
		}

		rule := models.EpisodeRule{
			UserID:    userID,
			ChildID:   childID,
			EpisodeID: episodeID,
			CreatedAt: time.Now().UTC(),
		}

		_, err = database.Collection(db.CollEpisodeRules).InsertOne(r.Context(), rule)
		if err != nil {
			if mongo.IsDuplicateKeyError(err) {
				http.Error(w, "episode is already blocked", http.StatusConflict)
				return
			}
			http.Error(w, "failed to block episode", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusCreated)
	}
}

// UnblockEpisode removes an episode block rule for the given child profile.
func UnblockEpisode(database *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, err := userIDFromContext(r)
		if err != nil {
			http.Error(w, "invalid token", http.StatusUnauthorized)
			return
		}

		childID, err := bson.ObjectIDFromHex(chi.URLParam(r, "childId"))
		if err != nil {
			http.Error(w, "invalid childId", http.StatusBadRequest)
			return
		}

		episodeID, err := bson.ObjectIDFromHex(chi.URLParam(r, "episodeId"))
		if err != nil {
			http.Error(w, "invalid episodeId", http.StatusBadRequest)
			return
		}

		// Validate child belongs to user
		var user models.User
		err = database.Collection(db.CollUsers).FindOne(r.Context(), bson.D{{Key: "_id", Value: userID}}).Decode(&user)
		if err != nil {
			http.Error(w, "user not found", http.StatusNotFound)
			return
		}
		if !childBelongsToUser(&user, childID) {
			http.Error(w, "child profile not found", http.StatusNotFound)
			return
		}

		_, err = database.Collection(db.CollEpisodeRules).DeleteOne(r.Context(), bson.D{
			{Key: "user_id", Value: userID},
			{Key: "child_id", Value: childID},
			{Key: "episode_id", Value: episodeID},
		})
		if err != nil {
			http.Error(w, "failed to unblock episode", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusNoContent)
	}
}

// ListBlockedEpisodes returns all blocked episodes for the given child profile with episode details.
func ListBlockedEpisodes(database *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, err := userIDFromContext(r)
		if err != nil {
			http.Error(w, "invalid token", http.StatusUnauthorized)
			return
		}

		childID, err := bson.ObjectIDFromHex(chi.URLParam(r, "childId"))
		if err != nil {
			http.Error(w, "invalid childId", http.StatusBadRequest)
			return
		}

		// Validate child belongs to user
		var user models.User
		err = database.Collection(db.CollUsers).FindOne(r.Context(), bson.D{{Key: "_id", Value: userID}}).Decode(&user)
		if err != nil {
			http.Error(w, "user not found", http.StatusNotFound)
			return
		}
		if !childBelongsToUser(&user, childID) {
			http.Error(w, "child profile not found", http.StatusNotFound)
			return
		}

		pipeline := mongo.Pipeline{
			{{Key: "$match", Value: bson.D{
				{Key: "user_id", Value: userID},
				{Key: "child_id", Value: childID},
			}}},
			{{Key: "$lookup", Value: bson.D{
				{Key: "from", Value: db.CollEpisodes},
				{Key: "localField", Value: "episode_id"},
				{Key: "foreignField", Value: "_id"},
				{Key: "as", Value: "episode"},
			}}},
			{{Key: "$unwind", Value: bson.D{
				{Key: "path", Value: "$episode"},
				{Key: "preserveNullAndEmptyArrays", Value: true},
			}}},
			{{Key: "$project", Value: bson.D{
				{Key: "_id", Value: 1},
				{Key: "user_id", Value: 1},
				{Key: "child_id", Value: 1},
				{Key: "episode_id", Value: 1},
				{Key: "created_at", Value: 1},
				{Key: "episode_title", Value: "$episode.title"},
				{Key: "episode_thumbnail", Value: "$episode.thumbnail"},
			}}},
		}

		cursor, err := database.Collection(db.CollEpisodeRules).Aggregate(r.Context(), pipeline)
		if err != nil {
			http.Error(w, "failed to fetch blocked episodes", http.StatusInternalServerError)
			return
		}
		defer cursor.Close(r.Context())

		entries := make([]map[string]any, 0)
		if err := cursor.All(r.Context(), &entries); err != nil {
			http.Error(w, "failed to decode blocked episodes", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(entries) //nolint:errcheck
	}
}
