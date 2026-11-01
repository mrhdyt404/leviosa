package handlers

import (
	"encoding/json"
	"net/http"

	"leviosa-backend/middleware"
	"leviosa-backend/models"
	"leviosa-backend/services"
)

type AuthHandler struct {
	auth     *services.AuthService
	activity *services.ActivityService
}

func NewAuthHandler(auth *services.AuthService, act *services.ActivityService) *AuthHandler {
	return &AuthHandler{auth: auth, activity: act}
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, `{"error":"Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	var req models.RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"Invalid request payload"}`, http.StatusBadRequest)
		return
	}

	user, err := h.auth.Register(&req)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "message": err.Error()})
		return
	}

	// Log activity
	h.activity.LogActivity(user.ID, "register", "success", r.RemoteAddr, r.UserAgent(), "User registered successfully")

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(models.AuthResponse{
		Success: true,
		Message: "Registrasi berhasil, silakan login",
		User:    user,
	})
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, `{"error":"Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	var req models.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"Invalid request payload"}`, http.StatusBadRequest)
		return
	}

	user, token, expiresAt, err := h.auth.Login(&req, r.RemoteAddr, r.UserAgent())
	if err != nil {
		h.activity.LogActivity(0, "login", "failed", r.RemoteAddr, r.UserAgent(), err.Error())
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "message": err.Error()})
		return
	}

	h.activity.LogActivity(user.ID, "login", "success", r.RemoteAddr, r.UserAgent(), "Standard credentials login")

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(models.AuthResponse{
		Success: true,
		Message: "Login berhasil",
		Token:   token,
		User:    user,
		Expires: expiresAt,
	})
}

func (h *AuthHandler) GoogleLogin(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, `{"error":"Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	var req models.GoogleAuthRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"Invalid request payload"}`, http.StatusBadRequest)
		return
	}

	user, token, expiresAt, err := h.auth.GoogleLogin(&req, r.RemoteAddr, r.UserAgent())
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "message": err.Error()})
		return
	}

	h.activity.LogActivity(user.ID, "google_login", "success", r.RemoteAddr, r.UserAgent(), "Google account login")

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(models.AuthResponse{
		Success: true,
		Message: "Login Google berhasil",
		Token:   token,
		User:    user,
		Expires: expiresAt,
	})
}

func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	tokenStr, _ := r.Context().Value(middleware.TokenKey).(string)
	userID, _ := r.Context().Value(middleware.UserIDKey).(uint64)

	if tokenStr != "" {
		_ = h.auth.Logout(tokenStr)
	}

	h.activity.LogActivity(userID, "logout", "success", r.RemoteAddr, r.UserAgent(), "User logged out")

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Logout berhasil",
	})
}

func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middleware.UserIDKey).(uint64)
	if !ok {
		http.Error(w, `{"error":"Unauthorized"}`, http.StatusUnauthorized)
		return
	}

	user, err := h.auth.GetUserByID(userID)
	if err != nil {
		http.Error(w, `{"error":"User not found"}`, http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"user":    user,
	})
}
