package handler

import (
	"encoding/json"
	"net/http"
	"os/exec"
)

type ytMetaResponse struct {
	Title       string  `json:"title"`
	Description string  `json:"description"`
	Thumbnail   string  `json:"thumbnail"`
	Duration    float64 `json:"duration"`
}

// ytDlpOutput represents the subset of fields parsed from yt-dlp --dump-json output.
type ytDlpOutput struct {
	Title       string  `json:"title"`
	Description string  `json:"description"`
	Thumbnail   string  `json:"thumbnail"`
	Duration    float64 `json:"duration"`
}

// YouTubeMeta is an http.HandlerFunc that fetches YouTube metadata using yt-dlp.
// It reads ?url= query parameter, runs yt-dlp --dump-json, and returns extracted metadata.
func YouTubeMeta(w http.ResponseWriter, r *http.Request) {
	url := r.URL.Query().Get("url")
	if url == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "url query parameter is required"}) //nolint:errcheck
		return
	}

	cmd := exec.CommandContext(r.Context(), "yt-dlp", "--dump-json", "--no-playlist", url)
	out, err := cmd.Output()
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadGateway)
		json.NewEncoder(w).Encode(map[string]string{"error": "failed to fetch video metadata"}) //nolint:errcheck
		return
	}

	var meta ytDlpOutput
	if err := json.Unmarshal(out, &meta); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadGateway)
		json.NewEncoder(w).Encode(map[string]string{"error": "failed to parse video metadata"}) //nolint:errcheck
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(ytMetaResponse{
		Title:       meta.Title,
		Description: meta.Description,
		Thumbnail:   meta.Thumbnail,
		Duration:    meta.Duration,
	}) //nolint:errcheck
}
