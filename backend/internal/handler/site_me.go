package handler

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/jwtauth/v5"
	"github.com/hadi/kidtube/internal/db"
	"github.com/hadi/kidtube/internal/models"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
	"golang.org/x/crypto/bcrypt"
)

// userIDFromContext extracts the user_id from JWT claims in the request context.
func userIDFromContext(r *http.Request) (bson.ObjectID, error) {
	_, claims, _ := jwtauth.FromContext(r.Context())
	userIDStr, _ := claims["user_id"].(string)
	return bson.ObjectIDFromHex(userIDStr)
}

// GetMe returns an http.HandlerFunc that returns the authenticated user's profile.
// Excludes password_hash from the response via projection.
func GetMe(database *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, err := userIDFromContext(r)
		if err != nil {
			http.Error(w, "invalid token", http.StatusUnauthorized)
			return
		}

		var user models.User
		projection := options.FindOne().SetProjection(bson.D{
			{Key: "password_hash", Value: 0},
		})
		err = database.Collection(db.CollUsers).FindOne(r.Context(), bson.D{{Key: "_id", Value: userID}}, projection).Decode(&user)
		if err != nil {
			http.Error(w, "user not found", http.StatusNotFound)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(user) //nolint:errcheck
	}
}

type changePasswordRequest struct {
	CurrentPassword string `json:"current_password"`
	NewPassword     string `json:"new_password"`
}

// ChangePassword returns an http.HandlerFunc that updates the authenticated user's password.
func ChangePassword(database *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, err := userIDFromContext(r)
		if err != nil {
			http.Error(w, "invalid token", http.StatusUnauthorized)
			return
		}

		var req changePasswordRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "invalid request body", http.StatusBadRequest)
			return
		}

		if len(req.NewPassword) < 8 {
			http.Error(w, "new password must be at least 8 characters", http.StatusBadRequest)
			return
		}

		// Fetch user including password_hash for comparison
		var user models.User
		err = database.Collection(db.CollUsers).FindOne(r.Context(), bson.D{{Key: "_id", Value: userID}}).Decode(&user)
		if err != nil {
			http.Error(w, "user not found", http.StatusNotFound)
			return
		}

		if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.CurrentPassword)); err != nil {
			http.Error(w, "current password is incorrect", http.StatusUnauthorized)
			return
		}

		newHash, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
		if err != nil {
			http.Error(w, "failed to process password", http.StatusInternalServerError)
			return
		}

		now := time.Now().UTC()
		update := bson.D{{Key: "$set", Value: bson.D{
			{Key: "password_hash", Value: string(newHash)},
			{Key: "updated_at", Value: now},
		}}}

		_, err = database.Collection(db.CollUsers).UpdateOne(r.Context(), bson.D{{Key: "_id", Value: userID}}, update)
		if err != nil {
			http.Error(w, "failed to update password", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
	}
}

// GetSubscriptions returns the authenticated user's subscribed channels as a JSON array.
func GetSubscriptions(database *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, err := userIDFromContext(r)
		if err != nil {
			http.Error(w, "invalid token", http.StatusUnauthorized)
			return
		}

		opts := options.Find().SetSort(bson.D{{Key: "created_at", Value: -1}})
		cursor, err := database.Collection(db.CollSubscriptions).Find(
			r.Context(),
			bson.D{{Key: "user_id", Value: userID}},
			opts,
		)
		if err != nil {
			http.Error(w, "failed to fetch subscriptions", http.StatusInternalServerError)
			return
		}
		defer cursor.Close(r.Context())

		var subs []models.Subscription
		if err := cursor.All(r.Context(), &subs); err != nil {
			http.Error(w, "failed to decode subscriptions", http.StatusInternalServerError)
			return
		}

		channels := make([]models.Channel, 0, len(subs))
		for _, sub := range subs {
			var ch models.Channel
			err := database.Collection(db.CollChannels).FindOne(
				r.Context(),
				bson.D{{Key: "_id", Value: sub.ChannelID}},
			).Decode(&ch)
			if err != nil {
				continue // channel may have been deleted — skip gracefully
			}
			channels = append(channels, ch)
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(channels) //nolint:errcheck
	}
}

// Subscribe adds a subscription for the authenticated user to the given channel.
func Subscribe(database *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, err := userIDFromContext(r)
		if err != nil {
			http.Error(w, "invalid token", http.StatusUnauthorized)
			return
		}

		channelID, err := bson.ObjectIDFromHex(chi.URLParam(r, "channel_id"))
		if err != nil {
			http.Error(w, "invalid channel_id", http.StatusBadRequest)
			return
		}

		// Validate channel exists
		var ch models.Channel
		if err := database.Collection(db.CollChannels).FindOne(
			r.Context(),
			bson.D{{Key: "_id", Value: channelID}},
		).Decode(&ch); err != nil {
			http.Error(w, "channel not found", http.StatusNotFound)
			return
		}

		sub := models.Subscription{
			UserID:    userID,
			ChannelID: channelID,
			CreatedAt: time.Now().UTC(),
		}
		_, err = database.Collection(db.CollSubscriptions).InsertOne(r.Context(), sub)
		if err != nil {
			if mongo.IsDuplicateKeyError(err) {
				w.WriteHeader(http.StatusConflict) // 409 — already subscribed; client treats as success
				return
			}
			http.Error(w, "failed to subscribe", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusCreated)
	}
}

// Unsubscribe removes a subscription for the authenticated user from the given channel.
func Unsubscribe(database *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, err := userIDFromContext(r)
		if err != nil {
			http.Error(w, "invalid token", http.StatusUnauthorized)
			return
		}

		channelID, err := bson.ObjectIDFromHex(chi.URLParam(r, "channel_id"))
		if err != nil {
			http.Error(w, "invalid channel_id", http.StatusBadRequest)
			return
		}

		_, err = database.Collection(db.CollSubscriptions).DeleteOne(
			r.Context(),
			bson.D{{Key: "user_id", Value: userID}, {Key: "channel_id", Value: channelID}},
		)
		if err != nil {
			http.Error(w, "failed to unsubscribe", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
	}
}

// GetBookmarks returns the authenticated user's bookmarked episodes as a JSON array.
func GetBookmarks(database *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, err := userIDFromContext(r)
		if err != nil {
			http.Error(w, "invalid token", http.StatusUnauthorized)
			return
		}

		opts := options.Find().SetSort(bson.D{{Key: "created_at", Value: -1}})
		cursor, err := database.Collection(db.CollBookmarks).Find(
			r.Context(),
			bson.D{{Key: "user_id", Value: userID}},
			opts,
		)
		if err != nil {
			http.Error(w, "failed to fetch bookmarks", http.StatusInternalServerError)
			return
		}
		defer cursor.Close(r.Context())

		var bookmarks []models.Bookmark
		if err := cursor.All(r.Context(), &bookmarks); err != nil {
			http.Error(w, "failed to decode bookmarks", http.StatusInternalServerError)
			return
		}

		episodes := make([]models.Episode, 0, len(bookmarks))
		for _, bm := range bookmarks {
			var ep models.Episode
			err := database.Collection(db.CollEpisodes).FindOne(
				r.Context(),
				bson.D{{Key: "_id", Value: bm.EpisodeID}, {Key: "status", Value: "ready"}},
			).Decode(&ep)
			if err != nil {
				continue // episode may be pending/failed/deleted — skip gracefully
			}
			episodes = append(episodes, ep)
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(episodes) //nolint:errcheck
	}
}

// Bookmark adds a bookmark for the authenticated user on the given episode.
func Bookmark(database *mongo.Database) http.HandlerFunc {
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

		// Validate episode exists
		var ep models.Episode
		if err := database.Collection(db.CollEpisodes).FindOne(
			r.Context(),
			bson.D{{Key: "_id", Value: episodeID}},
		).Decode(&ep); err != nil {
			http.Error(w, "episode not found", http.StatusNotFound)
			return
		}

		bm := models.Bookmark{
			UserID:    userID,
			EpisodeID: episodeID,
			CreatedAt: time.Now().UTC(),
		}
		_, err = database.Collection(db.CollBookmarks).InsertOne(r.Context(), bm)
		if err != nil {
			if mongo.IsDuplicateKeyError(err) {
				w.WriteHeader(http.StatusConflict) // 409 — already bookmarked; client treats as success
				return
			}
			http.Error(w, "failed to bookmark", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusCreated)
	}
}

// Unbookmark removes a bookmark for the authenticated user from the given episode.
func Unbookmark(database *mongo.Database) http.HandlerFunc {
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

		_, err = database.Collection(db.CollBookmarks).DeleteOne(
			r.Context(),
			bson.D{{Key: "user_id", Value: userID}, {Key: "episode_id", Value: episodeID}},
		)
		if err != nil {
			http.Error(w, "failed to unbookmark", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
	}
}
