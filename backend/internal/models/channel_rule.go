package models

import (
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

// ChannelRule represents a parent's whitelist/blacklist rule for a child profile.
type ChannelRule struct {
	ID        bson.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID    bson.ObjectID `bson:"user_id" json:"user_id"`
	ChildID   bson.ObjectID `bson:"child_id" json:"child_id"`
	ChannelID bson.ObjectID `bson:"channel_id" json:"channel_id"`
	Action    string        `bson:"action" json:"action"` // "allow" or "block"
	CreatedAt time.Time     `bson:"created_at" json:"created_at"`
}
