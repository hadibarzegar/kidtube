package models

import (
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

// WatchProgress tracks playback position per episode per user/child.
type WatchProgress struct {
	ID            bson.ObjectID  `bson:"_id,omitempty" json:"id"`
	UserID        bson.ObjectID  `bson:"user_id" json:"user_id"`
	ChildID       *bson.ObjectID `bson:"child_id,omitempty" json:"child_id,omitempty"`
	EpisodeID     bson.ObjectID  `bson:"episode_id" json:"episode_id"`
	ProgressSec   int            `bson:"progress_sec" json:"progress_sec"`
	DurationSec   int            `bson:"duration_sec" json:"duration_sec"`
	ProgressPct   float64        `bson:"progress_pct" json:"progress_pct"` // 0.0 - 1.0
	Completed     bool           `bson:"completed" json:"completed"`       // true if >= 90%
	LastWatchedAt time.Time      `bson:"last_watched_at" json:"last_watched_at"`
	CreatedAt     time.Time      `bson:"created_at" json:"created_at"`
}
