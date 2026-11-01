package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"

	"leviosa-backend/config"
	"leviosa-backend/models"
)

type SidobeService struct {
	apiURL    string
	secretKey string
	client    *http.Client
}

type sidobePayload struct {
	Phone   string `json:"phone"`
	Message string `json:"message"`
	IsAsync bool   `json:"is_async"`
}

type sidobeResponse struct {
	IsSuccess bool                   `json:"is_success"`
	Message   string                 `json:"message"`
	ErrorCode string                 `json:"error_code,omitempty"`
	Error     map[string]interface{} `json:"error,omitempty"`
	Data      json.RawMessage        `json:"data,omitempty"`
}

func NewSidobeService(cfg *config.Config) *SidobeService {
	return &SidobeService{
		apiURL:    cfg.SidobeAPIURL,
		secretKey: cfg.SidobeSecretKey,
		client: &http.Client{
			Timeout: 15 * time.Second,
		},
	}
}

// CleanPhoneNumber normalizes phone number to strict E.164 with leading '+' (e.g. 0812... -> +62812...)
func CleanPhoneNumber(phone string) string {
	cleaned := strings.TrimSpace(phone)
	cleaned = strings.ReplaceAll(cleaned, "-", "")
	cleaned = strings.ReplaceAll(cleaned, " ", "")
	cleaned = strings.ReplaceAll(cleaned, "(", "")
	cleaned = strings.ReplaceAll(cleaned, ")", "")

	// Remove any leading '+' temporarily for clean parsing
	cleaned = strings.TrimPrefix(cleaned, "+")

	if strings.HasPrefix(cleaned, "08") {
		cleaned = "628" + cleaned[2:]
	} else if strings.HasPrefix(cleaned, "8") {
		cleaned = "62" + cleaned
	}

	if cleaned == "" {
		return ""
	}

	return "+" + cleaned
}

// SendMessage dispatches a WhatsApp message via Sidobe Cloud API
func (s *SidobeService) SendMessage(phone, message string) (*sidobeResponse, error) {
	formattedPhone := CleanPhoneNumber(phone)
	if formattedPhone == "" {
		return nil, fmt.Errorf("phone number is empty or invalid")
	}

	payload := sidobePayload{
		Phone:   formattedPhone,
		Message: message,
		IsAsync: true,
	}

	bodyBytes, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal sidobe payload: %w", err)
	}

	endpoint := strings.TrimRight(s.apiURL, "/") + "/send-message"
	req, err := http.NewRequest("POST", endpoint, bytes.NewBuffer(bodyBytes))
	if err != nil {
		return nil, fmt.Errorf("failed to create sidobe request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Secret-Key", s.secretKey)

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to contact sidobe API: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read sidobe response: %w", err)
	}

	log.Printf("[SIDOBE WA] Sent to %s | Status: %d | Resp: %s", formattedPhone, resp.StatusCode, string(respBody))

	var sidobeResp sidobeResponse
	if err := json.Unmarshal(respBody, &sidobeResp); err != nil {
		return &sidobeResponse{
			IsSuccess: resp.StatusCode >= 200 && resp.StatusCode < 300,
			Message:   string(respBody),
		}, nil
	}

	if resp.StatusCode >= 400 {
		errDetail := sidobeResp.Message
		if len(sidobeResp.Error) > 0 {
			errBytes, _ := json.Marshal(sidobeResp.Error)
			errDetail = fmt.Sprintf("%s (%s)", sidobeResp.Message, string(errBytes))
		}
		return &sidobeResp, fmt.Errorf("sidobe error (%d): %s", resp.StatusCode, errDetail)
	}

	return &sidobeResp, nil
}

// FormatReminderMessage creates an elegant, structured WhatsApp message
func FormatReminderMessage(notif *models.WhatsAppNotification, location, notes string) string {
	reminderLabel := ""
	switch notif.ReminderType {
	case models.ReminderH7:
		reminderLabel = "Pengingat Awal (H-7)"
	case models.ReminderH1:
		reminderLabel = "Pengingat Besok (H-1)"
	case models.ReminderH1Hour:
		reminderLabel = "Pengingat 1 Jam Lagi (H-1 Jam)"
	case models.ReminderHariH:
		reminderLabel = "Kegiatan Dimulai Sekarang!"
	default:
		reminderLabel = "Pengingat Jadwal"
	}

	wibTime := notif.EventTime.In(time.FixedZone("WIB", 7*3600))
	dateStr := wibTime.Format("Monday, 02 January 2006")
	timeStr := wibTime.Format("15:04 WIB")

	// Translate day to Indonesian
	dayMap := map[string]string{
		"Sunday": "Minggu", "Monday": "Senin", "Tuesday": "Selasa",
		"Wednesday": "Rabu", "Thursday": "Kamis", "Friday": "Jumat", "Saturday": "Sabtu",
	}
	for eng, ind := range dayMap {
		dateStr = strings.Replace(dateStr, eng, ind, 1)
	}

	var sb strings.Builder
	sb.WriteString("✨ *LEVIOSA AI PERSONAL ASSISTANT* ✨\n")
	sb.WriteString(fmt.Sprintf("🔔 *%s*\n\n", reminderLabel))
	sb.WriteString("Halo! Anda memiliki jadwal yang sudah mendekati waktu pelaksanaan:\n\n")
	sb.WriteString(fmt.Sprintf("📌 *Aktivitas:* %s\n", notif.ScheduleTitle))
	sb.WriteString(fmt.Sprintf("🗓 *Tanggal:* %s\n", dateStr))
	sb.WriteString(fmt.Sprintf("🕘 *Waktu:* %s\n", timeStr))

	if location != "" {
		sb.WriteString(fmt.Sprintf("📍 *Lokasi:* %s\n", location))
	}
	if notes != "" {
		sb.WriteString(fmt.Sprintf("📝 *Catatan:* %s\n", notes))
	}

	sb.WriteString("\n💡 _Persiapkan kebutuhan Anda agar kegiatan berjalan lancar dan optimal._\n")
	sb.WriteString("_\"You don't need more time. You need a smarter way to live it.\"_")

	return sb.String()
}
