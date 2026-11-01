package middleware

import (
	"net/http"
	"strings"
)

// AdvancedCORS configures secure CORS with explicit allowed methods and headers
func AdvancedCORS(allowedOrigins []string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			origin := r.Header.Get("Origin")

			// Check if origin is allowed or from local dev environment
			isAllowed := false
			if origin == "" {
				isAllowed = true // Same origin or non-browser request
			} else {
				for _, ao := range allowedOrigins {
					if ao == "*" || ao == origin {
						isAllowed = true
						break
					}
					// Allow localhost / 127.0.0.1 for PWA testing
					if strings.HasPrefix(origin, "http://localhost:") || strings.HasPrefix(origin, "http://127.0.0.1:") {
						isAllowed = true
						break
					}
				}
			}

			if isAllowed && origin != "" {
				w.Header().Set("Access-Control-Allow-Origin", origin)
				w.Header().Set("Access-Control-Allow-Credentials", "true")
			} else if origin == "" {
				w.Header().Set("Access-Control-Allow-Origin", "*")
			}

			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, X-Secret-Key")
			w.Header().Set("Access-Control-Max-Age", "86400") // 24 hours preflight cache

			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusNoContent)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}
