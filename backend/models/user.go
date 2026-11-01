package models

import "time"

type User struct {
	ID               uint64    `json:"id"`
	UUID             string    `json:"uuid"`
	Name             string    `json:"name"`
	Username         string    `json:"username"`
	Email            string    `json:"email"`
	Phone            string    `json:"phone,omitempty"`
	PasswordHash     string    `json:"-"`
	GoogleID         *string   `json:"google_id,omitempty"`
	AvatarURL        string    `json:"avatar_url,omitempty"`
	FaceAuthEnrolled bool      `json:"face_auth_enrolled"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}

type RegisterRequest struct {
	Name     string `json:"name"`
	Username string `json:"username"`
	Email    string `json:"email"`
	Phone    string `json:"phone"`
	Password string `json:"password"`
}

type LoginRequest struct {
	UsernameOrEmail string `json:"username_or_email"`
	Password        string `json:"password"`
}

type GoogleAuthRequest struct {
	IDToken string `json:"id_token"`
	Email   string `json:"email"`
	Name    string `json:"name"`
	Avatar  string `json:"avatar"`
}

type AuthResponse struct {
	Success bool      `json:"success"`
	Message string    `json:"message"`
	Token   string    `json:"token,omitempty"`
	User    *User     `json:"user,omitempty"`
	Expires time.Time `json:"expires_at,omitempty"`
}
