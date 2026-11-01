package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"leviosa-backend/middleware"
	"leviosa-backend/services"
)

type ActivityHandler struct {
	activity *services.ActivityService
}

func NewActivityHandler(act *services.ActivityService) *ActivityHandler {
	return &ActivityHandler{activity: act}
}

func (h *ActivityHandler) GetLogs(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middleware.UserIDKey).(uint64)
	if !ok {
		http.Error(w, `{"error":"Unauthorized"}`, http.StatusUnauthorized)
		return
	}

	limit := 30
	if l := r.URL.Query().Get("limit"); l != "" {
		if val, err := strconv.Atoi(l); err == nil {
			limit = val
		}
	}

	logs, err := h.activity.GetUserLogs(userID, limit)
	if err != nil {
		http.Error(w, `{"error":"Database error: `+err.Error()+`"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    logs,
	})
}

func (h *ActivityHandler) GetActiveSessions(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middleware.UserIDKey).(uint64)
	if !ok {
		http.Error(w, `{"error":"Unauthorized"}`, http.StatusUnauthorized)
		return
	}

	sessions, err := h.activity.GetUserActiveSessions(userID)
	if err != nil {
		http.Error(w, `{"error":"Database error: `+err.Error()+`"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    sessions,
	})
}
