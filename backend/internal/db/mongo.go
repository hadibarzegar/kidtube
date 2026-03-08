package db

import (
	"context"
	"fmt"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

// Collection name constants
const (
	CollChannels        = "channels"
	CollEpisodes        = "episodes"
	CollCategories      = "categories"
	CollAgeGroups       = "age_groups"
	CollUsers           = "users"
	CollJobs            = "jobs"
	CollSubscriptions   = "subscriptions"
	CollBookmarks       = "bookmarks"
	CollLikes           = "likes"
	CollViews           = "views"
	CollScreenTimeLogs  = "screen_time_logs"
	CollViewingActivity = "viewing_activity"
	CollChannelRules    = "channel_rules"
	CollWatchProgress   = "watch_progress"
	CollPlaylists       = "playlists"
	CollContentReports  = "content_reports"
	CollNotifications   = "notifications"
	CollBedtimeRules    = "bedtime_rules"
	CollEpisodeRules    = "episode_rules"
	CollAchievements    = "achievements"
	CollStreaks          = "streaks"
)

// Connect establishes a MongoDB connection and returns the database handle.
// Uses mongo-driver v2 — Connect no longer requires a separate Ping in v2.
func Connect(ctx context.Context, uri string) (*mongo.Database, error) {
	clientOpts := options.Client().ApplyURI(uri)
	client, err := mongo.Connect(clientOpts)
	if err != nil {
		return nil, fmt.Errorf("mongo connect: %w", err)
	}
	if err := client.Ping(ctx, nil); err != nil {
		return nil, fmt.Errorf("mongo ping: %w", err)
	}
	dbName := "kidtube"
	return client.Database(dbName), nil
}

// EnsureIndexes creates required indexes on startup.
func EnsureIndexes(ctx context.Context, database *mongo.Database) error {
	unique := true

	// episodes: index on channel_id for listing episodes by channel
	_, err := database.Collection(CollEpisodes).Indexes().CreateMany(ctx, []mongo.IndexModel{
		{Keys: bson.D{{Key: "channel_id", Value: 1}}},
		{Keys: bson.D{{Key: "status", Value: 1}}},
		{Keys: bson.D{{Key: "status", Value: 1}, {Key: "created_at", Value: -1}, {Key: "view_count", Value: -1}}},
		{Keys: bson.D{{Key: "status", Value: 1}, {Key: "created_at", Value: -1}}},
	})
	if err != nil {
		return fmt.Errorf("episodes indexes: %w", err)
	}

	// users: unique index on email
	_, err = database.Collection(CollUsers).Indexes().CreateMany(ctx, []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "email", Value: 1}},
			Options: options.Index().SetUnique(unique),
		},
	})
	if err != nil {
		return fmt.Errorf("users indexes: %w", err)
	}

	// jobs: indexes on episode_id and status
	_, err = database.Collection(CollJobs).Indexes().CreateMany(ctx, []mongo.IndexModel{
		{Keys: bson.D{{Key: "episode_id", Value: 1}}},
		{Keys: bson.D{{Key: "status", Value: 1}}},
	})
	if err != nil {
		return fmt.Errorf("jobs indexes: %w", err)
	}

	// channels: indexes on category_ids and age_group_ids for browse queries
	_, err = database.Collection(CollChannels).Indexes().CreateMany(ctx, []mongo.IndexModel{
		{Keys: bson.D{{Key: "category_ids", Value: 1}}},
		{Keys: bson.D{{Key: "age_group_ids", Value: 1}}},
	})
	if err != nil {
		return fmt.Errorf("channels indexes: %w", err)
	}

	// subscriptions: compound unique index on (user_id, channel_id) to prevent duplicate subscriptions
	_, err = database.Collection(CollSubscriptions).Indexes().CreateMany(ctx, []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "user_id", Value: 1}, {Key: "channel_id", Value: 1}},
			Options: options.Index().SetUnique(unique),
		},
		{Keys: bson.D{{Key: "user_id", Value: 1}}},
	})
	if err != nil {
		return fmt.Errorf("subscriptions indexes: %w", err)
	}

	// bookmarks: compound unique index on (user_id, episode_id) to prevent duplicate bookmarks
	_, err = database.Collection(CollBookmarks).Indexes().CreateMany(ctx, []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "user_id", Value: 1}, {Key: "episode_id", Value: 1}},
			Options: options.Index().SetUnique(unique),
		},
		{Keys: bson.D{{Key: "user_id", Value: 1}}},
	})
	if err != nil {
		return fmt.Errorf("bookmarks indexes: %w", err)
	}

	// likes: compound unique index on (user_id, episode_id) to prevent duplicate likes
	_, err = database.Collection(CollLikes).Indexes().CreateMany(ctx, []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "user_id", Value: 1}, {Key: "episode_id", Value: 1}},
			Options: options.Index().SetUnique(unique),
		},
		{Keys: bson.D{{Key: "user_id", Value: 1}}},
	})
	if err != nil {
		return fmt.Errorf("likes indexes: %w", err)
	}

	// views: compound unique index on (episode_id, viewer_id) for deduplication
	_, err = database.Collection(CollViews).Indexes().CreateMany(ctx, []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "episode_id", Value: 1}, {Key: "viewer_id", Value: 1}},
			Options: options.Index().SetUnique(unique),
		},
	})
	if err != nil {
		return fmt.Errorf("views indexes: %w", err)
	}

	// screen_time_logs: unique per (user_id, child_id, date)
	_, err = database.Collection(CollScreenTimeLogs).Indexes().CreateMany(ctx, []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "user_id", Value: 1}, {Key: "child_id", Value: 1}, {Key: "date", Value: 1}},
			Options: options.Index().SetUnique(unique),
		},
	})
	if err != nil {
		return fmt.Errorf("screen_time_logs indexes: %w", err)
	}

	// viewing_activity: query by user+child+time
	_, err = database.Collection(CollViewingActivity).Indexes().CreateMany(ctx, []mongo.IndexModel{
		{Keys: bson.D{{Key: "user_id", Value: 1}, {Key: "child_id", Value: 1}, {Key: "watched_at", Value: -1}}},
	})
	if err != nil {
		return fmt.Errorf("viewing_activity indexes: %w", err)
	}

	// channel_rules: unique per (user_id, child_id, channel_id)
	_, err = database.Collection(CollChannelRules).Indexes().CreateMany(ctx, []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "user_id", Value: 1}, {Key: "child_id", Value: 1}, {Key: "channel_id", Value: 1}},
			Options: options.Index().SetUnique(unique),
		},
	})
	if err != nil {
		return fmt.Errorf("channel_rules indexes: %w", err)
	}

	// watch_progress: unique per (user_id, child_id, episode_id) + query index
	_, err = database.Collection(CollWatchProgress).Indexes().CreateMany(ctx, []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "user_id", Value: 1}, {Key: "child_id", Value: 1}, {Key: "episode_id", Value: 1}},
			Options: options.Index().SetUnique(unique),
		},
		{Keys: bson.D{{Key: "user_id", Value: 1}, {Key: "child_id", Value: 1}, {Key: "last_watched_at", Value: -1}}},
	})
	if err != nil {
		return fmt.Errorf("watch_progress indexes: %w", err)
	}

	// playlists: query by user+child, featured queries
	_, err = database.Collection(CollPlaylists).Indexes().CreateMany(ctx, []mongo.IndexModel{
		{Keys: bson.D{{Key: "user_id", Value: 1}, {Key: "child_id", Value: 1}}},
		{Keys: bson.D{{Key: "is_featured", Value: 1}}},
	})
	if err != nil {
		return fmt.Errorf("playlists indexes: %w", err)
	}

	// content_reports: unique per (episode_id, reporter_id) + status query
	_, err = database.Collection(CollContentReports).Indexes().CreateMany(ctx, []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "episode_id", Value: 1}, {Key: "reporter_id", Value: 1}},
			Options: options.Index().SetUnique(unique),
		},
		{Keys: bson.D{{Key: "status", Value: 1}, {Key: "created_at", Value: -1}}},
	})
	if err != nil {
		return fmt.Errorf("content_reports indexes: %w", err)
	}

	// notifications: query by user, unread first
	_, err = database.Collection(CollNotifications).Indexes().CreateMany(ctx, []mongo.IndexModel{
		{Keys: bson.D{{Key: "user_id", Value: 1}, {Key: "read", Value: 1}, {Key: "created_at", Value: -1}}},
	})
	if err != nil {
		return fmt.Errorf("notifications indexes: %w", err)
	}

	// bedtime_rules: unique per (user_id, child_id)
	_, err = database.Collection(CollBedtimeRules).Indexes().CreateMany(ctx, []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "user_id", Value: 1}, {Key: "child_id", Value: 1}},
			Options: options.Index().SetUnique(unique),
		},
	})
	if err != nil {
		return fmt.Errorf("bedtime_rules indexes: %w", err)
	}

	// episode_rules: unique per (user_id, child_id, episode_id)
	_, err = database.Collection(CollEpisodeRules).Indexes().CreateMany(ctx, []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "user_id", Value: 1}, {Key: "child_id", Value: 1}, {Key: "episode_id", Value: 1}},
			Options: options.Index().SetUnique(unique),
		},
	})
	if err != nil {
		return fmt.Errorf("episode_rules indexes: %w", err)
	}

	// achievements: unique per (user_id, child_id, badge_type)
	_, err = database.Collection(CollAchievements).Indexes().CreateMany(ctx, []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "user_id", Value: 1}, {Key: "child_id", Value: 1}, {Key: "badge_type", Value: 1}},
			Options: options.Index().SetUnique(unique),
		},
	})
	if err != nil {
		return fmt.Errorf("achievements indexes: %w", err)
	}

	// streaks: unique per (user_id, child_id)
	_, err = database.Collection(CollStreaks).Indexes().CreateMany(ctx, []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "user_id", Value: 1}, {Key: "child_id", Value: 1}},
			Options: options.Index().SetUnique(unique),
		},
	})
	if err != nil {
		return fmt.Errorf("streaks indexes: %w", err)
	}

	return nil
}
