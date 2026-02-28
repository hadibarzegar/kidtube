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
	CollChannels   = "channels"
	CollEpisodes   = "episodes"
	CollCategories = "categories"
	CollAgeGroups  = "age_groups"
	CollUsers      = "users"
	CollJobs       = "jobs"
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
	// episodes: index on channel_id for listing episodes by channel
	_, err := database.Collection(CollEpisodes).Indexes().CreateMany(ctx, []mongo.IndexModel{
		{Keys: bson.D{{Key: "channel_id", Value: 1}}},
		{Keys: bson.D{{Key: "status", Value: 1}}},
	})
	if err != nil {
		return fmt.Errorf("episodes indexes: %w", err)
	}

	// users: unique index on email
	unique := true
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

	return nil
}
