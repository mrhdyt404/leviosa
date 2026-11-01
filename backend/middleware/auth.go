package middleware

import (
	"context"
	"net/http"
	"strings"

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

func AuthMiddleware(cfg *config.Config) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
				http.Error(w, `{"error":"Unauthorized: missing or invalid token"}`, http.StatusUnauthorized)
				return
			}

			tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
			claims := jwt.MapClaims{}

			token, err := jwt.ParseWithClaims(tokenStr, claims, func(t *jwt.Token) (interface{}, error) {
				return []byte(cfg.JWTSecret), nil
			})

			if err != nil || !token.Valid {
				http.Error(w, `{"error":"Unauthorized: invalid or expired token"}`, http.StatusUnauthorized)
				return
			}

			subVal, _ := claims["sub"].(float64)
			userID := uint64(subVal)
			userUUID, _ := claims["uuid"].(string)
			username, _ := claims["username"].(string)

			ctx := context.WithValue(r.Context(), UserIDKey, userID)
			ctx = context.WithValue(ctx, UserUUIDKey, userUUID)
			ctx = context.WithValue(ctx, UsernameKey, username)
			ctx = context.WithValue(ctx, TokenKey, tokenStr)

			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
