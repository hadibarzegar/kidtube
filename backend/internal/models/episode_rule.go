package models

import (
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

type EpisodeRule struct {
	ID        bson.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID    bson.ObjectID `bson:"user_id" json:"user_id"`
	ChildID   bson.ObjectID `bson:"child_id" json:"child_id"`
	EpisodeID bson.ObjectID `bson:"episode_id" json:"episode_id"`
	CreatedAt time.Time     `bson:"created_at" json:"created_at"`
}
