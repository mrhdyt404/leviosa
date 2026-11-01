package models

import "time"

type Session struct {
	ID           uint64    `json:"id"`
	UserID       uint64    `json:"user_id"`
	TokenHash    string    `json:"token_hash"`
	IPAddress    string    `json:"ip_address"`
	UserAgent    string    `json:"user_agent"`
	IsActive     bool      `json:"is_active"`
	LastActivity time.Time `json:"last_activity"`
	ExpiresAt    time.Time `json:"expires_at"`
	CreatedAt    time.Time `json:"created_at"`
}

type ActivityLog struct {
	ID        uint64    `json:"id"`
	UserID    uint64    `json:"user_id"`
	Action    string    `json:"action"` // login, logout, face_auth_login, session_refresh
	Status    string    `json:"status"` // success, failed
	IPAddress string    `json:"ip_address"`
	UserAgent string    `json:"user_agent"`
	Details   string    `json:"details,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}
