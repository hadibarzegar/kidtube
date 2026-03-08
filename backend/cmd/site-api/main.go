package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/jwtauth/v5"
	"github.com/hadi/kidtube/internal/auth"
	"github.com/hadi/kidtube/internal/db"
	"github.com/hadi/kidtube/internal/handler"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8081"
	}

	mongoURI := os.Getenv("MONGO_URI")
	if mongoURI == "" {
		mongoURI = "mongodb://localhost:27017"
	}

	// Initialize JWT auth — panics if JWT_SECRET is not set
	auth.Init()

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	database, err := db.Connect(ctx, mongoURI)
	if err != nil {
		log.Fatalf("site-api: failed to connect to MongoDB: %v", err)
	}

	if err := db.EnsureIndexes(context.Background(), database); err != nil {
		log.Fatalf("site-api: failed to ensure indexes: %v", err)
	}

	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	r.Get("/healthz", handler.HealthHandler(database))

	// Public routes — no authentication required (AUTH-04).
	r.Get("/channels", handler.SiteListChannels(database))
	r.Get("/channels/{id}", handler.SiteGetChannel(database))
	r.Get("/episodes", handler.SiteListEpisodes(database))
	r.Get("/episodes/{id}", handler.SiteGetEpisode(database))
	r.Get("/categories", handler.SiteListCategories(database))
	r.Get("/age-groups", handler.SiteListAgeGroups(database))
	r.Get("/search", handler.SiteSearch(database))
	r.Get("/images/{id}", handler.ServeImage(database))

	// Public auth routes — no JWT required
	r.Post("/auth/register", handler.SiteRegister(database))
	r.Post("/auth/login", handler.SiteLogin(database))

	// tokenFromSiteCookie reads the site_token cookie for browser-based auth.
	// (defined early so it can be used by both optional-auth and protected route groups)
	tokenFromSiteCookie := func(r *http.Request) string {
		cookie, err := r.Cookie("site_token")
		if err != nil {
			return ""
		}
		return cookie.Value
	}

	// Public discovery endpoints
	r.Get("/discover/trending", handler.GetTrending(database))
	r.Get("/discover/new", handler.GetNewEpisodes(database))
	r.Get("/discover/popular-in/{category_id}", handler.GetPopularInCategory(database))
	r.Get("/discover/because-you-watched/{episode_id}", handler.GetRelatedEpisodes(database))
	r.Get("/playlists/featured", handler.ListFeaturedPlaylists(database))
	r.Get("/playlists/{id}", handler.GetPublicPlaylist(database))

	// Public routes with optional JWT — parses token if present but does not reject anonymous requests
	r.Group(func(r chi.Router) {
		r.Use(jwtauth.Verify(auth.TokenAuth, jwtauth.TokenFromHeader, tokenFromSiteCookie))
		r.Post("/episodes/{id}/views", handler.RecordView(database, auth.TokenAuth))
	})

	// Protected routes — require valid site JWT
	r.Group(func(r chi.Router) {
		r.Use(jwtauth.Verify(auth.TokenAuth, jwtauth.TokenFromHeader, tokenFromSiteCookie))
		r.Use(jwtauth.Authenticator(auth.TokenAuth))

		r.Get("/me", handler.GetMe(database))
		r.Put("/me/password", handler.ChangePassword(database))

		// Subscriptions
		r.Get("/me/subscriptions", handler.GetSubscriptions(database))
		r.Post("/me/subscriptions/{channel_id}", handler.Subscribe(database))
		r.Delete("/me/subscriptions/{channel_id}", handler.Unsubscribe(database))

		// Bookmarks
		r.Get("/me/bookmarks", handler.GetBookmarks(database))
		r.Post("/me/bookmarks/{episode_id}", handler.Bookmark(database))
		r.Delete("/me/bookmarks/{episode_id}", handler.Unbookmark(database))

		// Likes
		r.Get("/me/likes", handler.GetLikes(database))
		r.Post("/me/likes/{episode_id}", handler.Like(database))
		r.Delete("/me/likes/{episode_id}", handler.Unlike(database))

		// Child profiles
		r.Post("/me/pin", handler.SetParentPIN(database))
		r.Post("/me/pin/verify", handler.VerifyParentPIN(database))
		r.Get("/me/children", handler.ListChildren(database))
		r.Post("/me/children", handler.CreateChild(database))
		r.Put("/me/children/{child_id}", handler.UpdateChild(database))
		r.Delete("/me/children/{child_id}", handler.DeleteChild(database))
		r.Post("/me/children/{child_id}/activate", handler.ActivateChild(database))
		r.Post("/me/children/deactivate", handler.DeactivateChild(database))

		// Child passcodes
		r.Post("/me/children/{childId}/passcode", handler.SetChildPasscode(database))
		r.Post("/me/children/{childId}/verify-passcode", handler.VerifyChildPasscode(database))
		r.Delete("/me/children/{childId}/passcode", handler.RemoveChildPasscode(database))

		// Parental controls
		r.Post("/me/children/{child_id}/screen-time", handler.ReportScreenTime(database))
		r.Get("/me/children/{child_id}/screen-time", handler.GetScreenTime(database))
		r.Get("/me/children/{child_id}/activity", handler.GetViewingActivity(database))
		r.Post("/me/children/{child_id}/channel-rules", handler.SetChannelRule(database))
		r.Get("/me/children/{child_id}/channel-rules", handler.ListChannelRules(database))
		r.Delete("/me/children/{child_id}/channel-rules/{rule_id}", handler.DeleteChannelRule(database))

		// Watch progress & history
		r.Post("/me/watch-progress/{episode_id}", handler.UpdateWatchProgress(database))
		r.Get("/me/watch-progress/{episode_id}", handler.GetWatchProgress(database))
		r.Get("/me/continue-watching", handler.GetContinueWatching(database))
		r.Get("/me/watch-history", handler.GetWatchHistory(database))
		r.Delete("/me/watch-history", handler.ClearWatchHistory(database))

		// Playlists
		r.Get("/me/playlists", handler.ListPlaylists(database))
		r.Post("/me/playlists", handler.CreatePlaylist(database))
		r.Get("/me/playlists/{id}", handler.GetPlaylist(database))
		r.Put("/me/playlists/{id}", handler.UpdatePlaylist(database))
		r.Delete("/me/playlists/{id}", handler.DeletePlaylist(database))
		r.Post("/me/playlists/{id}/episodes/{episode_id}", handler.AddToPlaylist(database))
		r.Delete("/me/playlists/{id}/episodes/{episode_id}", handler.RemoveFromPlaylist(database))

		// Content reporting
		r.Post("/episodes/{id}/report", handler.ReportContent(database))

		// Notifications
		r.Get("/me/notifications", handler.ListNotifications(database))
		r.Post("/me/notifications/read-all", handler.MarkAllNotificationsRead(database))
		r.Get("/me/notifications/unread-count", handler.UnreadNotificationCount(database))

		// Bedtime rules
		r.Put("/me/children/{childId}/bedtime", handler.SetBedtime(database))
		r.Get("/me/children/{childId}/bedtime", handler.GetBedtime(database))
		r.Delete("/me/children/{childId}/bedtime", handler.DeleteBedtime(database))

		// Episode blocking
		r.Post("/me/children/{childId}/blocked-episodes", handler.BlockEpisode(database))
		r.Delete("/me/children/{childId}/blocked-episodes/{episodeId}", handler.UnblockEpisode(database))
		r.Get("/me/children/{childId}/blocked-episodes", handler.ListBlockedEpisodes(database))

		// Gamification
		r.Get("/me/children/{childId}/badges", handler.GetBadges(database))
		r.Get("/me/children/{childId}/streak", handler.GetStreak(database))

		// Personalized discovery
		r.Get("/discover/personalized", handler.GetPersonalized(database))
	})

	srv := &http.Server{
		Addr:    ":" + port,
		Handler: r,
	}

	done := make(chan os.Signal, 1)
	signal.Notify(done, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		log.Printf("site-api listening on :%s", port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("site-api: server error: %v", err)
		}
	}()

	<-done
	log.Println("site-api: shutting down...")

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Fatalf("site-api: graceful shutdown failed: %v", err)
	}
	log.Println("site-api: stopped")
}
