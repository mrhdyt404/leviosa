package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"leviosa-backend/config"
	"leviosa-backend/database"
	"leviosa-backend/handlers"
	"leviosa-backend/middleware"
	"leviosa-backend/services"
)

func main() {
	log.Println("=====================================================")
	log.Println("  LEVIOSA - AI Personal Assistant Backend Server")
	log.Println("  \"You don't need more time. You need a smarter way to live it.\"")
	log.Println("  [ADVANCE SECURITY ENABLED: OWASP Headers + Rate Limiter + Session Guard]")
	log.Println("=====================================================")

	cfg := config.LoadConfig()

	// Connect to MariaDB
	db, err := database.ConnectDB(cfg)
	if err != nil {
		log.Printf("[DATABASE ALERT] Server akan tetap berjalan dalam mode inisialisasi.")
		log.Printf("[DATABASE ALERT] Untuk mengaktifkan koneksi MariaDB penuh, jalankan:")
		log.Printf("[DATABASE ALERT]   sudo mysql < /var/www/html/leviosa/init_db.sql")
	}

	// Initialize Services
	authService := services.NewAuthService(db, cfg)
	activityService := services.NewActivityService(db)
	sidobeService := services.NewSidobeService(cfg)
	calendarService := services.NewCalendarService()
	weatherService := services.NewWeatherService()
	aiService := services.NewAIService(cfg, calendarService, weatherService)

	var webAuthnService *services.WebAuthnService
	if db != nil {
		if wa, err := services.NewWebAuthnService(cfg, db); err == nil {
			webAuthnService = wa
		} else {
			log.Printf("[WEBAUTHN WARNING] Failed to initialize WebAuthn: %v", err)
		}
	}

	// Start Background WhatsApp Scheduler Worker (interval 30s)
	scheduler := services.NewSchedulerService(db, sidobeService)
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	scheduler.Start(ctx)

	// Initialize Handlers
	authHandler := handlers.NewAuthHandler(authService, activityService)
	calendarHandler := handlers.NewCalendarHandler(calendarService)
	weatherHandler := handlers.NewWeatherHandler(weatherService)
	reminderHandler := handlers.NewReminderHandler(db, sidobeService, authService)
	aiHandler := handlers.NewAIHandler(aiService)
	activityHandler := handlers.NewActivityHandler(activityService)

	var webAuthnHandler *handlers.WebAuthnHandler
	if webAuthnService != nil {
		webAuthnHandler = handlers.NewWebAuthnHandler(webAuthnService, authService, activityService)
	}

	// Advance Security: Multi-tier IP Rate Limiters
	// General: 5 req/s, burst 30
	generalLimiter := middleware.NewIPRateLimiter(5.0, 30.0)
	generalRateMW := middleware.RateLimitMiddleware(generalLimiter)

	// Strict Auth & WA Limiter: 0.5 req/s (max 1 req every 2 seconds, burst 6)
	strictAuthLimiter := middleware.NewIPRateLimiter(0.5, 6.0)
	strictRateMW := middleware.RateLimitMiddleware(strictAuthLimiter)

	// Setup Router
	mux := http.NewServeMux()

	// Health Check
	mux.HandleFunc("GET /api/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		dbStatus := "connected"
		if db == nil || db.Ping() != nil {
			dbStatus = "waiting_setup (run init_db.sql)"
		}
		json.NewEncoder(w).Encode(map[string]interface{}{
			"status":           "ok",
			"app":              "Leviosa AI Assistant Backend",
			"version":          "1.0.0",
			"database":         dbStatus,
			"advance_security": "active (OWASP Headers, RateLimiter, TokenBucket, MaxBytes)",
			"environment":      cfg.AppEnv,
			"sidobe_url":       cfg.SidobeAPIURL,
			"server_time":      time.Now().Format(time.RFC3339),
		})
	})

	// Public Auth Endpoints with Strict Rate Limiting
	mux.Handle("POST /api/auth/register", strictRateMW(http.HandlerFunc(authHandler.Register)))
	mux.Handle("POST /api/auth/login", strictRateMW(http.HandlerFunc(authHandler.Login)))
	mux.Handle("POST /api/auth/google", strictRateMW(http.HandlerFunc(authHandler.GoogleLogin)))

	// Public Calendar Endpoints (Active Realtime Indonesian Calendar)
	mux.Handle("GET /api/calendar/holidays", generalRateMW(http.HandlerFunc(calendarHandler.GetHolidays)))
	mux.Handle("GET /api/calendar/today", generalRateMW(http.HandlerFunc(calendarHandler.GetTodayInfo)))

	// Public Weather Endpoints (Weather Intelligence)
	mux.Handle("GET /api/weather", generalRateMW(http.HandlerFunc(weatherHandler.GetWeather)))

	// WhatsApp Testing Endpoint (Strictly Rate Limited to prevent spam)
	mux.Handle("POST /api/reminders/test", strictRateMW(http.HandlerFunc(reminderHandler.TestWhatsApp)))

	// AI Assistant Chat & Planning
	mux.Handle("POST /api/ai/chat", generalRateMW(http.HandlerFunc(aiHandler.Chat)))

	// Protected Endpoints (Stateful DB Session Check + JWT)
	authMW := middleware.AuthMiddleware(cfg, db)

	mux.Handle("GET /api/auth/me", authMW(http.HandlerFunc(authHandler.Me)))
	mux.Handle("POST /api/auth/logout", authMW(http.HandlerFunc(authHandler.Logout)))

	if webAuthnHandler != nil {
		mux.Handle("GET /api/auth/webauthn/register-options", authMW(http.HandlerFunc(webAuthnHandler.RegisterOptions)))
		mux.Handle("POST /api/auth/webauthn/register-verify", authMW(http.HandlerFunc(webAuthnHandler.RegisterVerify)))
	}

	mux.Handle("GET /api/activity/logs", authMW(http.HandlerFunc(activityHandler.GetLogs)))
	mux.Handle("GET /api/activity/sessions", authMW(http.HandlerFunc(activityHandler.GetActiveSessions)))

	mux.Handle("POST /api/reminders/sync", authMW(http.HandlerFunc(reminderHandler.SyncReminders)))
	mux.Handle("GET /api/reminders", authMW(http.HandlerFunc(reminderHandler.GetReminders)))
	mux.Handle("DELETE /api/reminders/", authMW(http.HandlerFunc(reminderHandler.CancelReminders)))

	mux.Handle("POST /api/ai/evaluate", authMW(http.HandlerFunc(aiHandler.Evaluate)))

	// Global Security Layer:
	// 1. HTTP Logger
	// 2. Hardened CORS
	// 3. OWASP Security Headers & Max Body Payload Size (1 MB)
	allowedOrigins := []string{cfg.AppURL, "http://localhost:8080", "http://127.0.0.1:8080"}
	handler := middleware.Logger(
		middleware.AdvancedCORS(allowedOrigins)(
			middleware.SecurityHeaders(1048576)(mux),
		),
	)

	server := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      handler,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Server runner
	go func() {
		log.Printf("[SERVER] Leviosa Backend listening on http://localhost:%s\n", cfg.Port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("[SERVER FATAL] ListenAndServe: %v", err)
		}
	}()

	// Graceful Shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("[SERVER] Shutting down server gracefully...")
	scheduler.Stop()

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer shutdownCancel()

	if err := server.Shutdown(shutdownCtx); err != nil {
		log.Printf("[SERVER ERROR] Graceful shutdown error: %v", err)
	}

	if db != nil {
		_ = db.Close()
	}

	log.Println("[SERVER] Server exited properly.")
}
