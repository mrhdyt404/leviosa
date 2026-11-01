package middleware

import (
	"encoding/json"
	"net"
	"net/http"
	"strings"
	"sync"
	"time"
)

type clientBucket struct {
	tokens     float64
	lastRefill time.Time
}

type IPRateLimiter struct {
	mu           sync.Mutex
	clients      map[string]*clientBucket
	rate         float64 // tokens per second
	capacity     float64 // max burst tokens
	cleanTicker  *time.Ticker
}

func NewIPRateLimiter(rate float64, capacity float64) *IPRateLimiter {
	limiter := &IPRateLimiter{
		clients:     make(map[string]*clientBucket),
		rate:        rate,
		capacity:    capacity,
		cleanTicker: time.NewTicker(5 * time.Minute),
	}

	// Clean up stale IPs periodically
	go func() {
		for range limiter.cleanTicker.C {
			limiter.mu.Lock()
			now := time.Now()
			for ip, b := range limiter.clients {
				if now.Sub(b.lastRefill) > 10*time.Minute {
					delete(limiter.clients, ip)
				}
			}
			limiter.mu.Unlock()
		}
	}()

	return limiter
}

func (limiter *IPRateLimiter) allow(ip string) bool {
	limiter.mu.Lock()
	defer limiter.mu.Unlock()

	now := time.Now()
	b, exists := limiter.clients[ip]
	if !exists {
		limiter.clients[ip] = &clientBucket{
			tokens:     limiter.capacity - 1,
			lastRefill: now,
		}
		return true
	}

	// Refill tokens
	elapsed := now.Sub(b.lastRefill).Seconds()
	b.tokens += elapsed * limiter.rate
	if b.tokens > limiter.capacity {
		b.tokens = limiter.capacity
	}
	b.lastRefill = now

	if b.tokens >= 1 {
		b.tokens -= 1
		return true
	}

	return false
}

// ExtractIP retrieves client real IP from headers or RemoteAddr
func ExtractIP(r *http.Request) string {
	for _, h := range []string{"X-Forwarded-For", "X-Real-IP"} {
		addresses := strings.Split(r.Header.Get(h), ",")
		for _, addr := range addresses {
			ip := strings.TrimSpace(addr)
			if parsedIP := net.ParseIP(ip); parsedIP != nil && !parsedIP.IsLoopback() {
				return ip
			}
		}
	}

	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err == nil {
		return host
	}
	return r.RemoteAddr
}

// RateLimitMiddleware enforces IP-based rate limiting
func RateLimitMiddleware(limiter *IPRateLimiter) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ip := ExtractIP(r)

			if !limiter.allow(ip) {
				w.Header().Set("Content-Type", "application/json")
				w.Header().Set("Retry-After", "10")
				w.WriteHeader(http.StatusTooManyRequests)
				json.NewEncoder(w).Encode(map[string]interface{}{
					"success": false,
					"error":   "Too Many Requests: Permintaan Anda melampaui batas keamanan. Silakan coba kembali sesaat lagi.",
				})
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}
