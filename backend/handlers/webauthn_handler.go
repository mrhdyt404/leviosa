package handlers

import (
	"encoding/json"
	"net/http"

	"leviosa-backend/middleware"
	"leviosa-backend/services"
)

type WebAuthnHandler struct {
	wa       *services.WebAuthnService
	auth     *services.AuthService
	activity *services.ActivityService
}

func NewWebAuthnHandler(wa *services.WebAuthnService, auth *services.AuthService, act *services.ActivityService) *WebAuthnHandler {
	return &WebAuthnHandler{
		wa:       wa,
		auth:     auth,
		activity: act,
	}
}

// RegisterOptions begins biometric / face auth registration
func (h *WebAuthnHandler) RegisterOptions(w http.ResponseWriter, r *http.Request) {
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

	options, _, err := h.wa.BeginRegistration(user)
	if err != nil {
		http.Error(w, `{"error":"Failed to generate registration options: `+err.Error()+`"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(options)
}

// RegisterVerify finishes face auth enrollment
func (h *WebAuthnHandler) RegisterVerify(w http.ResponseWriter, r *http.Request) {
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

	if err := h.wa.FinishRegistration(user, r); err != nil {
		http.Error(w, `{"error":"Failed to verify credential: `+err.Error()+`"}`, http.StatusBadRequest)
		return
	}

	h.activity.LogActivity(user.ID, "face_auth_enroll", "success", r.RemoteAddr, r.UserAgent(), "Face authentication registered")

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Autentikasi wajah (Face Authentication) berhasil didaftarkan!",
	})
}
