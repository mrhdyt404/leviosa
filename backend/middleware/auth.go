package middleware

import (
	"context"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"net/http"
	"strings"
	"time"

	"leviosa-backend/config"

	"github.com/golang-jwt/jwt/v5"
)

type contextKey string

const (
	UserIDKey   contextKey = "userID"
	UserUUIDKey contextKey = "userUUID"
	UsernameKey contextKey = "username"
	TokenKey    contextKey = "token"
)

// AuthMiddleware validates JWT and verifies session active state against MariaDB
func AuthMiddleware(cfg *config.Config, db *sql.DB) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusUnauthorized)
				w.Write([]byte(`{"success":false,"error":"Unauthorized: token otentikasi tidak ditemukan"}`))
				return
			}

			tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
			claims := jwt.MapClaims{}

			token, err := jwt.ParseWithClaims(tokenStr, claims, func(t *jwt.Token) (interface{}, error) {
				if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
					return nil, jwt.ErrSignatureInvalid
				}
				return []byte(cfg.JWTSecret), nil
			})

			if err != nil || !token.Valid {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusUnauthorized)
				w.Write([]byte(`{"success":false,"error":"Unauthorized: token kedaluwarsa atau tidak valid"}`))
				return
			}

			subVal, _ := claims["sub"].(float64)
			userID := uint64(subVal)
			userUUID, _ := claims["uuid"].(string)
			username, _ := claims["username"].(string)

			// Advanced Security: Verify Session in Database (Revocation & Expiry check)
			if db != nil {
				hash := sha256.Sum256([]byte(tokenStr))
				tokenHash := hex.EncodeToString(hash[:])

				var isActive bool
				var expiresAt time.Time
				err := db.QueryRow(`
					SELECT is_active, expires_at 
					FROM sessions 
					WHERE token_hash = ? AND user_id = ?
					LIMIT 1`,
					tokenHash, userID,
				).Scan(&isActive, &expiresAt)

				if err == sql.ErrNoRows || !isActive || expiresAt.Before(time.Now()) {
					w.Header().Set("Content-Type", "application/json")
					w.WriteHeader(http.StatusUnauthorized)
					w.Write([]byte(`{"success":false,"error":"Unauthorized: sesi telah berakhir atau dicabut"}`))
					return
				}

				// Update last activity timestamp periodically
				go func(uid uint64, th string) {
					_, _ = db.Exec(`UPDATE sessions SET last_activity = NOW() WHERE token_hash = ?`, th)
				}(userID, tokenHash)
			}

			ctx := context.WithValue(r.Context(), UserIDKey, userID)
			ctx = context.WithValue(ctx, UserUUIDKey, userUUID)
			ctx = context.WithValue(ctx, UsernameKey, username)
			ctx = context.WithValue(ctx, TokenKey, tokenStr)

			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
