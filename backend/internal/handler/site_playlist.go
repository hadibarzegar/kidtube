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

type createPlaylistRequest struct {
	Title string `json:"title"`
}

type updatePlaylistRequest struct {
	Title      *string          `json:"title,omitempty"`
	EpisodeIDs *[]bson.ObjectID `json:"episode_ids,omitempty"`
}

type playlistWithEpisodes struct {
	models.Playlist
	Episodes []models.Episode `json:"episodes"`
}

// ListPlaylists returns the authenticated user's playlists.
func ListPlaylists(database *mongo.Database) http.HandlerFunc {
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

		opts := options.Find().SetSort(bson.D{{Key: "created_at", Value: -1}})
		cursor, err := database.Collection(db.CollPlaylists).Find(r.Context(), filter, opts)
		if err != nil {
			http.Error(w, "failed to fetch playlists", http.StatusInternalServerError)
			return
		}
		defer cursor.Close(r.Context())

		playlists := make([]models.Playlist, 0)
		if err := cursor.All(r.Context(), &playlists); err != nil {
			http.Error(w, "failed to decode playlists", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(playlists) //nolint:errcheck
	}
}

// CreatePlaylist creates a new playlist for the authenticated user.
func CreatePlaylist(database *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, err := userIDFromContext(r)
		if err != nil {
			http.Error(w, "invalid token", http.StatusUnauthorized)
			return
		}

		var req createPlaylistRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "invalid request body", http.StatusBadRequest)
			return
		}

		if req.Title == "" {
			http.Error(w, "title is required", http.StatusBadRequest)
			return
		}

		// Fetch user to get active_child_id
		var user models.User
		err = database.Collection(db.CollUsers).FindOne(r.Context(), bson.D{{Key: "_id", Value: userID}}).Decode(&user)
		if err != nil {
			http.Error(w, "user not found", http.StatusNotFound)
			return
		}

		// Check playlist limit
		count, err := database.Collection(db.CollPlaylists).CountDocuments(r.Context(), bson.D{
			{Key: "user_id", Value: userID},
			{Key: "child_id", Value: user.ActiveChildID},
		})
		if err != nil {
			http.Error(w, "failed to count playlists", http.StatusInternalServerError)
			return
		}
		if count >= 50 {
			http.Error(w, "playlist limit reached (max 50)", http.StatusBadRequest)
			return
		}

		now := time.Now().UTC()
		playlist := models.Playlist{
			UserID:     userID,
			ChildID:    user.ActiveChildID,
			Title:      req.Title,
			EpisodeIDs: []bson.ObjectID{},
			IsPublic:   false,
			IsFeatured: false,
			CreatedAt:  now,
			UpdatedAt:  now,
		}

		result, err := database.Collection(db.CollPlaylists).InsertOne(r.Context(), playlist)
		if err != nil {
			http.Error(w, "failed to create playlist", http.StatusInternalServerError)
			return
		}

		playlist.ID = result.InsertedID.(bson.ObjectID)

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(playlist) //nolint:errcheck
	}
}

// GetPlaylist returns a single playlist with its episodes.
func GetPlaylist(database *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, err := userIDFromContext(r)
		if err != nil {
			http.Error(w, "invalid token", http.StatusUnauthorized)
			return
		}

		playlistID, err := bson.ObjectIDFromHex(chi.URLParam(r, "id"))
		if err != nil {
			http.Error(w, "invalid id", http.StatusBadRequest)
			return
		}

		var playlist models.Playlist
		err = database.Collection(db.CollPlaylists).FindOne(r.Context(), bson.D{
			{Key: "_id", Value: playlistID},
			{Key: "user_id", Value: userID},
		}).Decode(&playlist)
		if err == mongo.ErrNoDocuments {
			http.Error(w, "playlist not found", http.StatusNotFound)
			return
		}
		if err != nil {
			http.Error(w, "failed to fetch playlist", http.StatusInternalServerError)
			return
		}

		// Batch fetch episodes in order
		episodes := make([]models.Episode, 0, len(playlist.EpisodeIDs))
		for _, epID := range playlist.EpisodeIDs {
			var ep models.Episode
			err := database.Collection(db.CollEpisodes).FindOne(
				r.Context(),
				bson.D{{Key: "_id", Value: epID}, {Key: "status", Value: "ready"}},
			).Decode(&ep)
			if err != nil {
				continue // episode may not be ready — skip gracefully
			}
			episodes = append(episodes, ep)
		}

		result := playlistWithEpisodes{
			Playlist: playlist,
			Episodes: episodes,
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(result) //nolint:errcheck
	}
}

// UpdatePlaylist updates a playlist's title and/or episode order.
func UpdatePlaylist(database *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, err := userIDFromContext(r)
		if err != nil {
			http.Error(w, "invalid token", http.StatusUnauthorized)
			return
		}

		playlistID, err := bson.ObjectIDFromHex(chi.URLParam(r, "id"))
		if err != nil {
			http.Error(w, "invalid id", http.StatusBadRequest)
			return
		}

		var req updatePlaylistRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "invalid request body", http.StatusBadRequest)
			return
		}

		setFields := bson.D{
			{Key: "updated_at", Value: time.Now().UTC()},
		}

		if req.Title != nil {
			setFields = append(setFields, bson.E{Key: "title", Value: *req.Title})
		}

		if req.EpisodeIDs != nil {
			if len(*req.EpisodeIDs) > 200 {
				http.Error(w, "playlist cannot exceed 200 episodes", http.StatusBadRequest)
				return
			}
			setFields = append(setFields, bson.E{Key: "episode_ids", Value: *req.EpisodeIDs})
		}

		filter := bson.D{
			{Key: "_id", Value: playlistID},
			{Key: "user_id", Value: userID},
		}

		update := bson.D{{Key: "$set", Value: setFields}}

		result, err := database.Collection(db.CollPlaylists).UpdateOne(r.Context(), filter, update)
		if err != nil {
			http.Error(w, "failed to update playlist", http.StatusInternalServerError)
			return
		}
		if result.MatchedCount == 0 {
			http.Error(w, "playlist not found", http.StatusNotFound)
			return
		}

		w.WriteHeader(http.StatusOK)
	}
}

// DeletePlaylist removes a playlist owned by the authenticated user.
func DeletePlaylist(database *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, err := userIDFromContext(r)
		if err != nil {
			http.Error(w, "invalid token", http.StatusUnauthorized)
			return
		}

		playlistID, err := bson.ObjectIDFromHex(chi.URLParam(r, "id"))
		if err != nil {
			http.Error(w, "invalid id", http.StatusBadRequest)
			return
		}

		result, err := database.Collection(db.CollPlaylists).DeleteOne(r.Context(), bson.D{
			{Key: "_id", Value: playlistID},
			{Key: "user_id", Value: userID},
		})
		if err != nil {
			http.Error(w, "failed to delete playlist", http.StatusInternalServerError)
			return
		}
		if result.DeletedCount == 0 {
			http.Error(w, "playlist not found", http.StatusNotFound)
			return
		}

		w.WriteHeader(http.StatusOK)
	}
}

// AddToPlaylist adds an episode to a playlist using $addToSet.
func AddToPlaylist(database *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, err := userIDFromContext(r)
		if err != nil {
			http.Error(w, "invalid token", http.StatusUnauthorized)
			return
		}

		playlistID, err := bson.ObjectIDFromHex(chi.URLParam(r, "id"))
		if err != nil {
			http.Error(w, "invalid id", http.StatusBadRequest)
			return
		}

		episodeID, err := bson.ObjectIDFromHex(chi.URLParam(r, "episode_id"))
		if err != nil {
			http.Error(w, "invalid episode_id", http.StatusBadRequest)
			return
		}

		// Verify playlist belongs to user and check episode count
		var playlist models.Playlist
		err = database.Collection(db.CollPlaylists).FindOne(r.Context(), bson.D{
			{Key: "_id", Value: playlistID},
			{Key: "user_id", Value: userID},
		}).Decode(&playlist)
		if err == mongo.ErrNoDocuments {
			http.Error(w, "playlist not found", http.StatusNotFound)
			return
		}
		if err != nil {
			http.Error(w, "failed to fetch playlist", http.StatusInternalServerError)
			return
		}

		if len(playlist.EpisodeIDs) >= 200 {
			http.Error(w, "playlist cannot exceed 200 episodes", http.StatusBadRequest)
			return
		}

		update := bson.D{
			{Key: "$addToSet", Value: bson.D{{Key: "episode_ids", Value: episodeID}}},
			{Key: "$set", Value: bson.D{{Key: "updated_at", Value: time.Now().UTC()}}},
		}

		_, err = database.Collection(db.CollPlaylists).UpdateOne(r.Context(), bson.D{
			{Key: "_id", Value: playlistID},
			{Key: "user_id", Value: userID},
		}, update)
		if err != nil {
			http.Error(w, "failed to add episode to playlist", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
	}
}

// RemoveFromPlaylist removes an episode from a playlist using $pull.
func RemoveFromPlaylist(database *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, err := userIDFromContext(r)
		if err != nil {
			http.Error(w, "invalid token", http.StatusUnauthorized)
			return
		}

		playlistID, err := bson.ObjectIDFromHex(chi.URLParam(r, "id"))
		if err != nil {
			http.Error(w, "invalid id", http.StatusBadRequest)
			return
		}

		episodeID, err := bson.ObjectIDFromHex(chi.URLParam(r, "episode_id"))
		if err != nil {
			http.Error(w, "invalid episode_id", http.StatusBadRequest)
			return
		}

		update := bson.D{
			{Key: "$pull", Value: bson.D{{Key: "episode_ids", Value: episodeID}}},
			{Key: "$set", Value: bson.D{{Key: "updated_at", Value: time.Now().UTC()}}},
		}

		_, err = database.Collection(db.CollPlaylists).UpdateOne(r.Context(), bson.D{
			{Key: "_id", Value: playlistID},
			{Key: "user_id", Value: userID},
		}, update)
		if err != nil {
			http.Error(w, "failed to remove episode from playlist", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
	}
}

// ListFeaturedPlaylists returns all featured playlists. Public — no auth required.
func ListFeaturedPlaylists(database *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		filter := bson.D{{Key: "is_featured", Value: true}}

		cursor, err := database.Collection(db.CollPlaylists).Find(r.Context(), filter)
		if err != nil {
			http.Error(w, "failed to fetch featured playlists", http.StatusInternalServerError)
			return
		}
		defer cursor.Close(r.Context())

		playlists := make([]models.Playlist, 0)
		if err := cursor.All(r.Context(), &playlists); err != nil {
			http.Error(w, "failed to decode playlists", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(playlists) //nolint:errcheck
	}
}

// GetPublicPlaylist returns a single public or featured playlist with episodes. Public — no auth required.
func GetPublicPlaylist(database *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		playlistID, err := bson.ObjectIDFromHex(chi.URLParam(r, "id"))
		if err != nil {
			http.Error(w, "invalid id", http.StatusBadRequest)
			return
		}

		var playlist models.Playlist
		err = database.Collection(db.CollPlaylists).FindOne(r.Context(), bson.D{
			{Key: "_id", Value: playlistID},
			{Key: "$or", Value: bson.A{
				bson.D{{Key: "is_public", Value: true}},
				bson.D{{Key: "is_featured", Value: true}},
			}},
		}).Decode(&playlist)
		if err == mongo.ErrNoDocuments {
			http.Error(w, "playlist not found", http.StatusNotFound)
			return
		}
		if err != nil {
			http.Error(w, "failed to fetch playlist", http.StatusInternalServerError)
			return
		}

		// Fetch episodes in order
		episodes := make([]models.Episode, 0, len(playlist.EpisodeIDs))
		for _, epID := range playlist.EpisodeIDs {
			var ep models.Episode
			err := database.Collection(db.CollEpisodes).FindOne(
				r.Context(),
				bson.D{{Key: "_id", Value: epID}, {Key: "status", Value: "ready"}},
			).Decode(&ep)
			if err != nil {
				continue
			}
			episodes = append(episodes, ep)
		}

		result := playlistWithEpisodes{
			Playlist: playlist,
			Episodes: episodes,
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(result) //nolint:errcheck
	}
}
