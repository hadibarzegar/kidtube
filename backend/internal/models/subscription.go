package models

import (
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

// Subscription represents a user's subscription to a channel.
type Subscription struct {
	ID        bson.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID    bson.ObjectID `bson:"user_id" json:"user_id"`
	ChannelID bson.ObjectID `bson:"channel_id" json:"channel_id"`
	CreatedAt time.Time     `bson:"created_at" json:"created_at"`
}
