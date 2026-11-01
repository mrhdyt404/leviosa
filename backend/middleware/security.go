package middleware

import (
	"net/http"
)

// SecurityHeaders applies OWASP recommended security headers and limits body size to 1MB
func SecurityHeaders(maxBodyBytes int64) func(http.Handler) http.Handler {
	if maxBodyBytes <= 0 {
		maxBodyBytes = 1048576 // 1 MB default
	}

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Limit request body to prevent Denial of Service via large payloads
			if r.Body != nil {
				r.Body = http.MaxBytesReader(w, r.Body, maxBodyBytes)
			}

			// OWASP Recommended Security Headers
			w.Header().Set("X-Content-Type-Options", "nosniff")
			w.Header().Set("X-Frame-Options", "DENY")
			w.Header().Set("X-XSS-Protection", "1; mode=block")
			w.Header().Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
			w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
			w.Header().Set("Permissions-Policy", "camera=(self), microphone=(), geolocation=(self)")
			w.Header().Set("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:;")

			next.ServeHTTP(w, r)
		})
	}
}
