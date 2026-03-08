package models

import (
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

// ScreenTimeLog tracks daily screen time usage per child profile.
type ScreenTimeLog struct {
	ID        bson.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID    bson.ObjectID `bson:"user_id" json:"user_id"`
	ChildID   bson.ObjectID `bson:"child_id" json:"child_id"`
	Date      string        `bson:"date" json:"date"` // "2026-03-08" format for daily aggregation
	Minutes   int           `bson:"minutes" json:"minutes"`
	UpdatedAt time.Time     `bson:"updated_at" json:"updated_at"`
}
