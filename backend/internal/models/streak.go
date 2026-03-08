package models

import (
	"go.mongodb.org/mongo-driver/v2/bson"
)

// Streak tracks consecutive daily watch activity for a child profile.
type Streak struct {
	ID            bson.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID        bson.ObjectID `bson:"user_id" json:"user_id"`
	ChildID       bson.ObjectID `bson:"child_id" json:"child_id"`
	CurrentStreak int           `bson:"current_streak" json:"current_streak"`
	LongestStreak int           `bson:"longest_streak" json:"longest_streak"`
	LastWatchDate string        `bson:"last_watch_date" json:"last_watch_date"`
}
