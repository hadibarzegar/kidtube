package models

import (
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

// JobStatus represents the processing state of a transcoding job.
type JobStatus string

const (
	JobStatusPending     JobStatus = "pending"
	JobStatusDownloading JobStatus = "downloading"
	JobStatusTranscoding JobStatus = "transcoding"
	JobStatusReady       JobStatus = "ready"
	JobStatusFailed      JobStatus = "failed"
)

// Job tracks the lifecycle of a video download and transcoding operation.
type Job struct {
	ID          bson.ObjectID `bson:"_id,omitempty" json:"id"`
	EpisodeID   bson.ObjectID `bson:"episode_id" json:"episode_id"`
	SourceURL   string        `bson:"source_url" json:"source_url"`
	Source      string        `bson:"source" json:"source"` // "youtube" | "upload"
	Status      JobStatus     `bson:"status" json:"status"`
	Error       string        `bson:"error" json:"error"`
	StartedAt   *time.Time    `bson:"started_at,omitempty" json:"started_at"`
	CompletedAt *time.Time    `bson:"completed_at,omitempty" json:"completed_at"`
	CreatedAt   time.Time     `bson:"created_at" json:"created_at"`
	UpdatedAt   time.Time     `bson:"updated_at" json:"updated_at"`
}
