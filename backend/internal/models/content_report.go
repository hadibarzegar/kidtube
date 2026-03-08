package models

import (
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

// ContentReport represents a user's report of inappropriate content.
type ContentReport struct {
	ID         bson.ObjectID  `bson:"_id,omitempty" json:"id"`
	EpisodeID  bson.ObjectID  `bson:"episode_id" json:"episode_id"`
	ReporterID bson.ObjectID  `bson:"reporter_id" json:"reporter_id"`
	Reason     string         `bson:"reason" json:"reason"`               // "inappropriate", "violent", "other"
	Details    string         `bson:"details,omitempty" json:"details,omitempty"`
	Status     string         `bson:"status" json:"status"`               // "pending", "reviewed", "dismissed"
	ReviewedBy *bson.ObjectID `bson:"reviewed_by,omitempty" json:"reviewed_by,omitempty"`
	ReviewedAt *time.Time     `bson:"reviewed_at,omitempty" json:"reviewed_at,omitempty"`
	CreatedAt  time.Time      `bson:"created_at" json:"created_at"`
}
