package models

import (
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

// BedtimeRule represents a parent-defined bedtime window for a child profile.
type BedtimeRule struct {
	ID        bson.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID    bson.ObjectID `bson:"user_id" json:"user_id"`
	ChildID   bson.ObjectID `bson:"child_id" json:"child_id"`
	StartTime string        `bson:"start_time" json:"start_time"` // "21:00" (24h format)
	EndTime   string        `bson:"end_time" json:"end_time"`     // "07:00"
	Timezone  string        `bson:"timezone" json:"timezone"`     // "Asia/Tehran"
	Enabled   bool          `bson:"enabled" json:"enabled"`
	CreatedAt time.Time     `bson:"created_at" json:"created_at"`
	UpdatedAt time.Time     `bson:"updated_at" json:"updated_at"`
}
