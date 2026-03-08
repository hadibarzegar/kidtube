package models

import (
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

// Achievement represents a badge earned by a child profile.
type Achievement struct {
	ID        bson.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID    bson.ObjectID `bson:"user_id" json:"user_id"`
	ChildID   bson.ObjectID `bson:"child_id" json:"child_id"`
	BadgeType string        `bson:"badge_type" json:"badge_type"`
	EarnedAt  time.Time     `bson:"earned_at" json:"earned_at"`
}
