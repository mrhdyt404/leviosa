package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"leviosa-backend/middleware"
	"leviosa-backend/models"
	"leviosa-backend/services"
)

type ReminderHandler struct {
	db     *sql.DB
	sidobe *services.SidobeService
	auth   *services.AuthService
}

func NewReminderHandler(db *sql.DB, sidobe *services.SidobeService, auth *services.AuthService) *ReminderHandler {
	return &ReminderHandler{db: db, sidobe: sidobe, auth: auth}
}

// SyncReminders registers client reminders (H-7, H-1, H-1 hour, Hari H) into MariaDB
func (h *ReminderHandler) SyncReminders(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, `{"error":"Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	userID, ok := r.Context().Value(middleware.UserIDKey).(uint64)
	if !ok {
		http.Error(w, `{"error":"Unauthorized"}`, http.StatusUnauthorized)
		return
	}

	user, err := h.auth.GetUserByID(userID)
	if err != nil || user.Phone == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Nomor WhatsApp belum terdaftar di profil. Silakan perbarui nomor WhatsApp terlebih dahulu.",
		})
		return
	}

	var req models.SyncRemindersRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"Invalid request payload"}`, http.StatusBadRequest)
		return
	}

	eventTime, err := time.Parse(time.RFC3339, req.EventTime)
	if err != nil {
		eventTime, _ = time.Parse("2006-01-02 15:04:05", req.EventTime)
	}

	// Delete existing pending reminders for this schedule to avoid duplicates
	_, _ = h.db.Exec(`DELETE FROM whatsapp_notifications WHERE user_id = ? AND schedule_uuid = ? AND status = 'pending'`, userID, req.ScheduleUUID)

	createdCount := 0
	for _, rem := range req.Reminders {
		sendTime, err := time.Parse(time.RFC3339, rem.SendTime)
		if err != nil {
			sendTime, _ = time.Parse("2006-01-02 15:04:05", rem.SendTime)
		}

		// Don't schedule past reminders
		if sendTime.Before(time.Now()) {
			continue
		}

		dummyNotif := &models.WhatsAppNotification{
			ReminderType:  rem.Type,
			ScheduleTitle: req.Title,
			EventTime:     eventTime,
		}
		msg := services.FormatReminderMessage(dummyNotif, req.Location, req.Notes)

		_, err = h.db.Exec(`
			INSERT INTO whatsapp_notifications 
			(user_id, schedule_uuid, reminder_type, schedule_title, event_time, send_time, recipient_phone, message_content, status, created_at, updated_at)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW(), NOW())`,
			userID, req.ScheduleUUID, rem.Type, req.Title, eventTime, sendTime, user.Phone, msg,
		)
		if err == nil {
			createdCount++
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":        true,
		"message":        "Pengingat WhatsApp berhasil disinkronisasi ke server",
		"reminders_set":  createdCount,
		"schedule_uuid":  req.ScheduleUUID,
	})
}

// GetReminders lists user reminders
func (h *ReminderHandler) GetReminders(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middleware.UserIDKey).(uint64)
	if !ok {
		http.Error(w, `{"error":"Unauthorized"}`, http.StatusUnauthorized)
		return
	}

	rows, err := h.db.Query(`
		SELECT id, schedule_uuid, reminder_type, schedule_title, event_time, send_time, recipient_phone, status, retry_count, sent_at, created_at
		FROM whatsapp_notifications
		WHERE user_id = ?
		ORDER BY send_time DESC
		LIMIT 50`,
		userID,
	)
	if err != nil {
		http.Error(w, `{"error":"Database error"}`, http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var list []models.WhatsAppNotification
	for rows.Next() {
		var n models.WhatsAppNotification
		var sentAt sql.NullTime
		if err := rows.Scan(&n.ID, &n.ScheduleUUID, &n.ReminderType, &n.ScheduleTitle, &n.EventTime, &n.SendTime, &n.RecipientPhone, &n.Status, &n.RetryCount, &sentAt, &n.CreatedAt); err != nil {
			continue
		}
		if sentAt.Valid {
			n.SentAt = &sentAt.Time
		}
		list = append(list, n)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    list,
	})
}

// CancelReminders deletes pending reminders for a schedule
func (h *ReminderHandler) CancelReminders(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middleware.UserIDKey).(uint64)
	if !ok {
		http.Error(w, `{"error":"Unauthorized"}`, http.StatusUnauthorized)
		return
	}

	pathParts := strings.Split(r.URL.Path, "/")
	scheduleUUID := pathParts[len(pathParts)-1]
	if scheduleUUID == "" || scheduleUUID == "reminders" {
		http.Error(w, `{"error":"Schedule UUID is required"}`, http.StatusBadRequest)
		return
	}

	_, err := h.db.Exec(`UPDATE whatsapp_notifications SET status = 'cancelled' WHERE user_id = ? AND schedule_uuid = ? AND status = 'pending'`, userID, scheduleUUID)
	if err != nil {
		http.Error(w, `{"error":"Failed to cancel reminders"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Pengingat berhasil dibatalkan",
	})
}

// TestWhatsApp sends an instant test message using Sidobe API
func (h *ReminderHandler) TestWhatsApp(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, `{"error":"Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	var req models.TestWhatsAppRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"Invalid request payload"}`, http.StatusBadRequest)
		return
	}

	if req.Phone == "" {
		http.Error(w, `{"error":"Nomor telepon/WhatsApp wajib diisi"}`, http.StatusBadRequest)
		return
	}

	if req.Message == "" {
		req.Message = "✨ *LEVIOSA NOTIFICATION TEST* ✨\n\nSelamat! Integrasi WhatsApp Cloud API via Sidobe berhasil terhubung dengan Leviosa Personal Assistant.\n\n_\"You don't need more time. You need a smarter way to live it.\"_"
	}

	resp, err := h.sidobe.SendMessage(req.Phone, req.Message)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadGateway)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Gagal mengirim pesan via Sidobe: " + err.Error(),
			"details": resp,
		})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Pesan uji coba WhatsApp berhasil dikirim via Sidobe API!",
		"sidobe":  resp,
	})
}
