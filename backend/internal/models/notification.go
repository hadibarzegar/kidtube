package models

import (
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

// Notification represents an in-app notification for a user.
type Notification struct {
	ID        bson.ObjectID  `bson:"_id,omitempty" json:"id"`
	UserID    bson.ObjectID  `bson:"user_id" json:"user_id"`
	Type      string         `bson:"type" json:"type"` // "new_episode"
	Title     string         `bson:"title" json:"title"`
	Body      string         `bson:"body" json:"body"`
	EpisodeID *bson.ObjectID `bson:"episode_id,omitempty" json:"episode_id,omitempty"`
	ChannelID *bson.ObjectID `bson:"channel_id,omitempty" json:"channel_id,omitempty"`
	Read      bool           `bson:"read" json:"read"`
	CreatedAt time.Time      `bson:"created_at" json:"created_at"`
}
