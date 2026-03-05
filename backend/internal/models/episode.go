package models

import (
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

// Episode represents a single video episode belonging to a channel.
// HLS path is derived by convention: /hls/{episode_id}/master.m3u8 — no explicit path field.
type Episode struct {
	ID          bson.ObjectID `bson:"_id,omitempty" json:"id"`
	ChannelID   bson.ObjectID `bson:"channel_id" json:"channel_id"`
	Title       string        `bson:"title" json:"title"`
	Description string        `bson:"description" json:"description"`
	Order       int           `bson:"order" json:"order"`
	Thumbnail   string        `bson:"thumbnail" json:"thumbnail"`
	SubtitleURL string        `bson:"subtitle_url" json:"subtitle_url"`
	Status      string        `bson:"status" json:"status"` // pending, ready, failed
	ViewCount   int64         `bson:"view_count" json:"view_count"`
	LikeCount   int64         `bson:"like_count" json:"like_count"`
	CreatedAt   time.Time     `bson:"created_at" json:"created_at"`
	UpdatedAt   time.Time     `bson:"updated_at" json:"updated_at"`
}
