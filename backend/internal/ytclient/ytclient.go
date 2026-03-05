package ytclient

import (
	"net/http"
	"net/url"
	"os"

	"github.com/kkdai/youtube/v2"
)

// New returns a youtube.Client configured with an optional HTTP proxy
// from the YOUTUBE_PROXY environment variable (e.g. socks5://host:port).
func New() youtube.Client {
	client := youtube.Client{}

	if raw := os.Getenv("YOUTUBE_PROXY"); raw != "" {
		if parsed, err := url.Parse(raw); err == nil {
			client.HTTPClient = &http.Client{
				Transport: &http.Transport{
					Proxy: http.ProxyURL(parsed),
				},
			}
		}
	}

	return client
}
