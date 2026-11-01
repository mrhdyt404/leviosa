package services

import (
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"errors"
	"fmt"
	"strings"
	"time"

	"leviosa-backend/config"
	"leviosa-backend/models"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type AuthService struct {
	db  *sql.DB
	cfg *config.Config
}

func NewAuthService(db *sql.DB, cfg *config.Config) *AuthService {
	return &AuthService{
		db:  db,
		cfg: cfg,
	}
}

// Register registers a new user with name, username, email, password, and phone
func (s *AuthService) Register(req *models.RegisterRequest) (*models.User, error) {
	if req.Username == "" || req.Email == "" || req.Password == "" {
		return nil, errors.New("nama, username, email, dan password wajib diisi")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	userUUID := uuid.New().String()
	now := time.Now()

	query := `
		INSERT INTO users (uuid, name, username, email, phone, password_hash, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)
	`

	res, err := s.db.Exec(query, userUUID, req.Name, req.Username, req.Email, CleanPhoneNumber(req.Phone), string(hashedPassword), now, now)
	if err != nil {
		return nil, fmt.Errorf("gagal mendaftarkan user (username atau email mungkin sudah digunakan): %w", err)
	}

	id, _ := res.LastInsertId()

	return &models.User{
		ID:               uint64(id),
		UUID:             userUUID,
		Name:             req.Name,
		Username:         req.Username,
		Email:            req.Email,
		Phone:            CleanPhoneNumber(req.Phone),
		FaceAuthEnrolled: false,
		CreatedAt:        now,
		UpdatedAt:        now,
	}, nil
}

// Login authenticates user with username or email and password
func (s *AuthService) Login(req *models.LoginRequest, ip, userAgent string) (*models.User, string, time.Time, error) {
	query := `
		SELECT id, uuid, name, username, email, phone, password_hash, face_auth_enrolled, created_at, updated_at
		FROM users
		WHERE username = ? OR email = ?
		LIMIT 1
	`

	var u models.User
	var phone sql.NullString
	err := s.db.QueryRow(query, req.UsernameOrEmail, req.UsernameOrEmail).Scan(
		&u.ID, &u.UUID, &u.Name, &u.Username, &u.Email, &phone,
		&u.PasswordHash, &u.FaceAuthEnrolled, &u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		return nil, "", time.Time{}, errors.New("kredensial login tidak valid")
	}

	if phone.Valid {
		u.Phone = phone.String
	}

	if err := bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(req.Password)); err != nil {
		return nil, "", time.Time{}, errors.New("password salah")
	}

	token, expiresAt, err := s.generateJWT(&u)
	if err != nil {
		return nil, "", time.Time{}, err
	}

	// Record session in database
	s.createSession(u.ID, token, ip, userAgent, expiresAt)

	return &u, token, expiresAt, nil
}

// GoogleLogin handles authentication via Google OAuth
func (s *AuthService) GoogleLogin(req *models.GoogleAuthRequest, ip, userAgent string) (*models.User, string, time.Time, error) {
	if req.Email == "" {
		return nil, "", time.Time{}, errors.New("email Google diperlukan")
	}

	query := `
		SELECT id, uuid, name, username, email, phone, face_auth_enrolled, created_at, updated_at
		FROM users
		WHERE email = ? OR google_id = ?
		LIMIT 1
	`

	var u models.User
	var phone sql.NullString
	err := s.db.QueryRow(query, req.Email, req.IDToken).Scan(
		&u.ID, &u.UUID, &u.Name, &u.Username, &u.Email, &phone,
		&u.FaceAuthEnrolled, &u.CreatedAt, &u.UpdatedAt,
	)

	now := time.Now()
	if err == sql.ErrNoRows {
		// Auto-register user from Google Account
		userUUID := uuid.New().String()
		username := "g_" + strings.Split(req.Email, "@")[0]
		res, err := s.db.Exec(`
			INSERT INTO users (uuid, name, username, email, google_id, avatar_url, created_at, updated_at)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
			userUUID, req.Name, username, req.Email, req.IDToken, req.Avatar, now, now,
		)
		if err != nil {
			return nil, "", time.Time{}, fmt.Errorf("failed to register google user: %w", err)
		}
		id, _ := res.LastInsertId()
		u = models.User{
			ID:               uint64(id),
			UUID:             userUUID,
			Name:             req.Name,
			Username:         username,
			Email:            req.Email,
			AvatarURL:        req.Avatar,
			FaceAuthEnrolled: false,
			CreatedAt:        now,
			UpdatedAt:        now,
		}
	} else if err != nil {
		return nil, "", time.Time{}, err
	}

	if phone.Valid {
		u.Phone = phone.String
	}

	token, expiresAt, err := s.generateJWT(&u)
	if err != nil {
		return nil, "", time.Time{}, err
	}

	s.createSession(u.ID, token, ip, userAgent, expiresAt)
	return &u, token, expiresAt, nil
}

func (s *AuthService) generateJWT(user *models.User) (string, time.Time, error) {
	expiresAt := time.Now().Add(time.Duration(s.cfg.JWTExpiryHours) * time.Hour)
	claims := jwt.MapClaims{
		"sub":      user.ID,
		"uuid":     user.UUID,
		"username": user.Username,
		"email":    user.Email,
		"exp":      expiresAt.Unix(),
		"iat":      time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(s.cfg.JWTSecret))
	if err != nil {
		return "", time.Time{}, err
	}

	return tokenString, expiresAt, nil
}

func (s *AuthService) createSession(userID uint64, token, ip, userAgent string, expiresAt time.Time) {
	hash := sha256.Sum256([]byte(token))
	tokenHash := hex.EncodeToString(hash[:])

	_, _ = s.db.Exec(`
		INSERT INTO sessions (user_id, token_hash, ip_address, user_agent, is_active, last_activity, expires_at, created_at)
		VALUES (?, ?, ?, ?, 1, NOW(), ?, NOW())`,
		userID, tokenHash, ip, userAgent, expiresAt,
	)
}

func (s *AuthService) Logout(token string) error {
	hash := sha256.Sum256([]byte(token))
	tokenHash := hex.EncodeToString(hash[:])

	_, err := s.db.Exec(`UPDATE sessions SET is_active = 0 WHERE token_hash = ?`, tokenHash)
	return err
}

func (s *AuthService) GetUserByID(userID uint64) (*models.User, error) {
	var u models.User
	var phone sql.NullString
	query := `SELECT id, uuid, name, username, email, phone, face_auth_enrolled, created_at, updated_at FROM users WHERE id = ?`
	err := s.db.QueryRow(query, userID).Scan(
		&u.ID, &u.UUID, &u.Name, &u.Username, &u.Email, &phone,
		&u.FaceAuthEnrolled, &u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	if phone.Valid {
		u.Phone = phone.String
	}
	return &u, nil
}
