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

// maturityAllowed returns the list of maturity levels at or below the given max level.
func maturityAllowed(max string) []string {
	levels := []string{"all-ages", "6+", "9+", "12+"}
	var allowed []string
	for _, l := range levels {
		allowed = append(allowed, l)
		if l == max {
			break
		}
	}
	return allowed
}

// GetTrending returns an http.HandlerFunc that lists trending episodes from the last 7 days.
// Sorted by view_count descending, limited to 20. Public endpoint.
func GetTrending(database *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		sevenDaysAgo := time.Now().UTC().AddDate(0, 0, -7)

		filter := bson.D{
			{Key: "status", Value: "ready"},
			{Key: "created_at", Value: bson.D{{Key: "$gte", Value: sevenDaysAgo}}},
		}
		if maxMaturity := r.URL.Query().Get("max_maturity"); maxMaturity != "" {
			allowed := maturityAllowed(maxMaturity)
			filter = append(filter, bson.E{Key: "maturity_rating", Value: bson.D{{Key: "$in", Value: allowed}}})
		}
		opts := options.Find().
			SetSort(bson.D{{Key: "view_count", Value: -1}}).
			SetLimit(20)

		cursor, err := database.Collection(db.CollEpisodes).Find(ctx, filter, opts)
		if err != nil {
			http.Error(w, "failed to fetch trending episodes", http.StatusInternalServerError)
			return
		}
		defer cursor.Close(ctx)

		episodes := make([]models.Episode, 0)
		if err := cursor.All(ctx, &episodes); err != nil {
			http.Error(w, "failed to decode episodes", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(episodes) //nolint:errcheck
	}
}

// GetNewEpisodes returns an http.HandlerFunc that lists the newest ready episodes.
// Sorted by created_at descending, limited to 20. Public endpoint.
func GetNewEpisodes(database *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()

		filter := bson.D{{Key: "status", Value: "ready"}}
		if maxMaturity := r.URL.Query().Get("max_maturity"); maxMaturity != "" {
			allowed := maturityAllowed(maxMaturity)
			filter = append(filter, bson.E{Key: "maturity_rating", Value: bson.D{{Key: "$in", Value: allowed}}})
		}
		opts := options.Find().
			SetSort(bson.D{{Key: "created_at", Value: -1}}).
			SetLimit(20)

		cursor, err := database.Collection(db.CollEpisodes).Find(ctx, filter, opts)
		if err != nil {
			http.Error(w, "failed to fetch new episodes", http.StatusInternalServerError)
			return
		}
		defer cursor.Close(ctx)

		episodes := make([]models.Episode, 0)
		if err := cursor.All(ctx, &episodes); err != nil {
			http.Error(w, "failed to decode episodes", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(episodes) //nolint:errcheck
	}
}

// GetPopularInCategory returns an http.HandlerFunc that lists popular episodes
// from channels in the given category. Sorted by view_count descending, limited to 10.
// Public endpoint.
func GetPopularInCategory(database *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()

		categoryID, err := bson.ObjectIDFromHex(chi.URLParam(r, "category_id"))
		if err != nil {
			http.Error(w, "invalid category_id", http.StatusBadRequest)
			return
		}

		// Find channels that belong to this category
		channelCursor, err := database.Collection(db.CollChannels).Find(ctx, bson.D{
			{Key: "category_ids", Value: categoryID},
		})
		if err != nil {
			http.Error(w, "failed to fetch channels", http.StatusInternalServerError)
			return
		}
		defer channelCursor.Close(ctx)

		var channels []models.Channel
		if err := channelCursor.All(ctx, &channels); err != nil {
			http.Error(w, "failed to decode channels", http.StatusInternalServerError)
			return
		}

		channelIDs := make([]bson.ObjectID, 0, len(channels))
		for _, ch := range channels {
			channelIDs = append(channelIDs, ch.ID)
		}

		if len(channelIDs) == 0 {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode([]models.Episode{}) //nolint:errcheck
			return
		}

		filter := bson.D{
			{Key: "status", Value: "ready"},
			{Key: "channel_id", Value: bson.D{{Key: "$in", Value: channelIDs}}},
		}
		if maxMaturity := r.URL.Query().Get("max_maturity"); maxMaturity != "" {
			allowed := maturityAllowed(maxMaturity)
			filter = append(filter, bson.E{Key: "maturity_rating", Value: bson.D{{Key: "$in", Value: allowed}}})
		}
		opts := options.Find().
			SetSort(bson.D{{Key: "view_count", Value: -1}}).
			SetLimit(10)

		cursor, err := database.Collection(db.CollEpisodes).Find(ctx, filter, opts)
		if err != nil {
			http.Error(w, "failed to fetch episodes", http.StatusInternalServerError)
			return
		}
		defer cursor.Close(ctx)

		episodes := make([]models.Episode, 0)
		if err := cursor.All(ctx, &episodes); err != nil {
			http.Error(w, "failed to decode episodes", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(episodes) //nolint:errcheck
	}
}

// GetRelatedEpisodes returns an http.HandlerFunc that finds episodes related to the given episode.
// Finds episodes from the same channel and channels sharing the same categories.
// Excludes the source episode. Sorted by view_count descending, limited to 10. Public endpoint.
func GetRelatedEpisodes(database *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()

		episodeID, err := bson.ObjectIDFromHex(chi.URLParam(r, "episode_id"))
		if err != nil {
			http.Error(w, "invalid episode_id", http.StatusBadRequest)
			return
		}

		// Fetch the source episode
		var sourceEpisode models.Episode
		err = database.Collection(db.CollEpisodes).FindOne(ctx, bson.D{
			{Key: "_id", Value: episodeID},
			{Key: "status", Value: "ready"},
		}).Decode(&sourceEpisode)
		if err != nil {
			http.Error(w, "episode not found", http.StatusNotFound)
			return
		}

		// Fetch the source channel to get its category_ids
		var sourceChannel models.Channel
		err = database.Collection(db.CollChannels).FindOne(ctx, bson.D{
			{Key: "_id", Value: sourceEpisode.ChannelID},
		}).Decode(&sourceChannel)
		if err != nil {
			http.Error(w, "channel not found", http.StatusNotFound)
			return
		}

		// Find channels with the same categories
		relatedChannelIDs := []bson.ObjectID{sourceEpisode.ChannelID}
		if len(sourceChannel.CategoryIDs) > 0 {
			channelCursor, err := database.Collection(db.CollChannels).Find(ctx, bson.D{
				{Key: "category_ids", Value: bson.D{{Key: "$in", Value: sourceChannel.CategoryIDs}}},
			})
			if err == nil {
				defer channelCursor.Close(ctx)
				var relatedChannels []models.Channel
				if err := channelCursor.All(ctx, &relatedChannels); err == nil {
					for _, ch := range relatedChannels {
						relatedChannelIDs = append(relatedChannelIDs, ch.ID)
					}
				}
			}
		}

		filter := bson.D{
			{Key: "status", Value: "ready"},
			{Key: "channel_id", Value: bson.D{{Key: "$in", Value: relatedChannelIDs}}},
			{Key: "_id", Value: bson.D{{Key: "$ne", Value: episodeID}}},
		}
		if maxMaturity := r.URL.Query().Get("max_maturity"); maxMaturity != "" {
			allowed := maturityAllowed(maxMaturity)
			filter = append(filter, bson.E{Key: "maturity_rating", Value: bson.D{{Key: "$in", Value: allowed}}})
		}
		opts := options.Find().
			SetSort(bson.D{{Key: "view_count", Value: -1}}).
			SetLimit(10)

		cursor, err := database.Collection(db.CollEpisodes).Find(ctx, filter, opts)
		if err != nil {
			http.Error(w, "failed to fetch related episodes", http.StatusInternalServerError)
			return
		}
		defer cursor.Close(ctx)

		episodes := make([]models.Episode, 0)
		if err := cursor.All(ctx, &episodes); err != nil {
			http.Error(w, "failed to decode episodes", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(episodes) //nolint:errcheck
	}
}

// GetPersonalized returns an http.HandlerFunc that lists personalized episode recommendations.
// Shows unwatched episodes from subscribed channels, sorted by created_at descending, limited to 20.
// Protected endpoint — requires authentication.
func GetPersonalized(database *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()

		userID, err := userIDFromContext(r)
		if err != nil {
			http.Error(w, "invalid token", http.StatusUnauthorized)
			return
		}

		// Get user's subscribed channel IDs
		subCursor, err := database.Collection(db.CollSubscriptions).Find(ctx, bson.D{
			{Key: "user_id", Value: userID},
		})
		if err != nil {
			http.Error(w, "failed to fetch subscriptions", http.StatusInternalServerError)
			return
		}
		defer subCursor.Close(ctx)

		var subs []models.Subscription
		if err := subCursor.All(ctx, &subs); err != nil {
			http.Error(w, "failed to decode subscriptions", http.StatusInternalServerError)
			return
		}

		channelIDs := make([]bson.ObjectID, 0, len(subs))
		for _, sub := range subs {
			channelIDs = append(channelIDs, sub.ChannelID)
		}

		if len(channelIDs) == 0 {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode([]models.Episode{}) //nolint:errcheck
			return
		}

		// Get user's watched episode IDs
		wpCursor, err := database.Collection(db.CollWatchProgress).Find(ctx, bson.D{
			{Key: "user_id", Value: userID},
		})
		if err != nil {
			http.Error(w, "failed to fetch watch progress", http.StatusInternalServerError)
			return
		}
		defer wpCursor.Close(ctx)

		var watchProgress []models.WatchProgress
		if err := wpCursor.All(ctx, &watchProgress); err != nil {
			http.Error(w, "failed to decode watch progress", http.StatusInternalServerError)
			return
		}

		watchedIDs := make([]bson.ObjectID, 0, len(watchProgress))
		for _, wp := range watchProgress {
			watchedIDs = append(watchedIDs, wp.EpisodeID)
		}

		filter := bson.D{
			{Key: "status", Value: "ready"},
			{Key: "channel_id", Value: bson.D{{Key: "$in", Value: channelIDs}}},
		}
		if len(watchedIDs) > 0 {
			filter = append(filter, bson.E{Key: "_id", Value: bson.D{{Key: "$nin", Value: watchedIDs}}})
		}
		if maxMaturity := r.URL.Query().Get("max_maturity"); maxMaturity != "" {
			allowed := maturityAllowed(maxMaturity)
			filter = append(filter, bson.E{Key: "maturity_rating", Value: bson.D{{Key: "$in", Value: allowed}}})
		}

		opts := options.Find().
			SetSort(bson.D{{Key: "created_at", Value: -1}}).
			SetLimit(20)

		cursor, err := database.Collection(db.CollEpisodes).Find(ctx, filter, opts)
		if err != nil {
			http.Error(w, "failed to fetch personalized episodes", http.StatusInternalServerError)
			return
		}
		defer cursor.Close(ctx)

		episodes := make([]models.Episode, 0)
		if err := cursor.All(ctx, &episodes); err != nil {
			http.Error(w, "failed to decode episodes", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(episodes) //nolint:errcheck
	}
}
