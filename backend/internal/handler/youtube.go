package handler

import (
	"encoding/json"
	"net/http"

	"github.com/hadi/kidtube/internal/ytclient"
)

type ytMetaResponse struct {
	Title       string  `json:"title"`
	Description string  `json:"description"`
	Thumbnail   string  `json:"thumbnail"`
	Duration    float64 `json:"duration"`
}

// YouTubeMeta is an http.HandlerFunc that fetches YouTube metadata using the kkdai/youtube library.
// It reads ?url= query parameter and returns extracted metadata as JSON.
func YouTubeMeta(w http.ResponseWriter, r *http.Request) {
	rawURL := r.URL.Query().Get("url")
	if rawURL == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "url query parameter is required"}) //nolint:errcheck
		return
	}

	client := ytclient.New()
	video, err := client.GetVideoContext(r.Context(), rawURL)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadGateway)
		json.NewEncoder(w).Encode(map[string]string{"error": "failed to fetch video metadata"}) //nolint:errcheck
		return
	}

	var thumbnailURL string
	if len(video.Thumbnails) > 0 {
		thumbnailURL = video.Thumbnails[len(video.Thumbnails)-1].URL
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(ytMetaResponse{
		Title:       video.Title,
		Description: video.Description,
		Thumbnail:   thumbnailURL,
		Duration:    video.Duration.Seconds(),
	}) //nolint:errcheck
}
