package models

import (
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

// ViewingActivity records what a child watched and for how long.
type ViewingActivity struct {
	ID          bson.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID      bson.ObjectID `bson:"user_id" json:"user_id"`
	ChildID     bson.ObjectID `bson:"child_id" json:"child_id"`
	EpisodeID   bson.ObjectID `bson:"episode_id" json:"episode_id"`
	DurationSec int           `bson:"duration_sec" json:"duration_sec"`
	WatchedAt   time.Time     `bson:"watched_at" json:"watched_at"`
}
