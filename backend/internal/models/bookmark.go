package models

import (
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

// Bookmark represents a user's bookmark of an episode.
type Bookmark struct {
	ID        bson.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID    bson.ObjectID `bson:"user_id" json:"user_id"`
	EpisodeID bson.ObjectID `bson:"episode_id" json:"episode_id"`
	CreatedAt time.Time     `bson:"created_at" json:"created_at"`
}
