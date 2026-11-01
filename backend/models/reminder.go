package models

import "time"

type ReminderType string

const (
	ReminderH7     ReminderType = "H-7"
	ReminderH1     ReminderType = "H-1"
	ReminderH1Hour ReminderType = "H-1_jam"
	ReminderHariH  ReminderType = "hari_h"
	ReminderCustom ReminderType = "custom"
)

type WhatsAppNotification struct {
	ID             uint64       `json:"id"`
	UserID         uint64       `json:"user_id"`
	ScheduleUUID   string       `json:"schedule_uuid"`
	ReminderType   ReminderType `json:"reminder_type"`
	ScheduleTitle  string       `json:"schedule_title"`
	EventTime      time.Time    `json:"event_time"`
	SendTime       time.Time    `json:"send_time"`
	RecipientPhone string       `json:"recipient_phone"`
	MessageContent string       `json:"message_content"`
	Status         string       `json:"status"` // pending, sent, failed, cancelled
	SidobeResponse string       `json:"sidobe_response,omitempty"`
	RetryCount     int          `json:"retry_count"`
	SentAt         *time.Time   `json:"sent_at,omitempty"`
	CreatedAt      time.Time    `json:"created_at"`
	UpdatedAt      time.Time    `json:"updated_at"`
}

type SyncRemindersRequest struct {
	ScheduleUUID string `json:"schedule_uuid"`
	Title        string `json:"title"`
	EventTime    string `json:"event_time"` // ISO8601
	Location     string `json:"location,omitempty"`
	Notes        string `json:"notes,omitempty"`
	Reminders    []struct {
		Type     ReminderType `json:"type"` // H-7, H-1, H-1_jam, hari_h
		SendTime string       `json:"send_time"`
	} `json:"reminders"`
}

type TestWhatsAppRequest struct {
	Phone   string `json:"phone"`
	Message string `json:"message"`
}
