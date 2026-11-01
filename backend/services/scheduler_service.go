package services

import (
	"context"
	"database/sql"
	"encoding/json"
	"log"
	"time"

	"leviosa-backend/models"
)

type SchedulerService struct {
	db     *sql.DB
	sidobe *SidobeService
	stopCh chan struct{}
}

func NewSchedulerService(db *sql.DB, sidobe *SidobeService) *SchedulerService {
	return &SchedulerService{
		db:     db,
		sidobe: sidobe,
		stopCh: make(chan struct{}),
	}
}

func (s *SchedulerService) Start(ctx context.Context) {
	ticker := time.NewTicker(30 * time.Second)
	log.Println("[SCHEDULER] Background WhatsApp reminder worker started (interval: 30s)")

	go func() {
		// Run initial check immediately
		s.processPendingReminders()

		for {
			select {
			case <-ticker.C:
				s.processPendingReminders()
			case <-s.stopCh:
				ticker.Stop()
				log.Println("[SCHEDULER] Background worker stopped.")
				return
			case <-ctx.Done():
				ticker.Stop()
				log.Println("[SCHEDULER] Context cancelled, stopping worker.")
				return
			}
		}
	}()
}

func (s *SchedulerService) Stop() {
	close(s.stopCh)
}

func (s *SchedulerService) processPendingReminders() {
	if s.db == nil {
		return
	}

	query := `
		SELECT id, user_id, schedule_uuid, reminder_type, schedule_title, 
		       event_time, send_time, recipient_phone, message_content, status, retry_count
		FROM whatsapp_notifications
		WHERE status = 'pending' AND send_time <= NOW()
		ORDER BY send_time ASC
		LIMIT 20
	`

	rows, err := s.db.Query(query)
	if err != nil {
		log.Printf("[SCHEDULER ERROR] Querying pending notifications: %v", err)
		return
	}
	defer rows.Close()

	var pendingList []*models.WhatsAppNotification
	for rows.Next() {
		var n models.WhatsAppNotification
		err := rows.Scan(
			&n.ID, &n.UserID, &n.ScheduleUUID, &n.ReminderType, &n.ScheduleTitle,
			&n.EventTime, &n.SendTime, &n.RecipientPhone, &n.MessageContent, &n.Status, &n.RetryCount,
		)
		if err != nil {
			log.Printf("[SCHEDULER ERROR] Scan row: %v", err)
			continue
		}
		pendingList = append(pendingList, &n)
	}

	for _, notif := range pendingList {
		resp, err := s.sidobe.SendMessage(notif.RecipientPhone, notif.MessageContent)
		now := time.Now()

		var respStr string
		if resp != nil {
			bytes, _ := json.Marshal(resp)
			respStr = string(bytes)
		}

		if err != nil {
			log.Printf("[SCHEDULER WARNING] Failed sending reminder ID %d to %s: %v", notif.ID, notif.RecipientPhone, err)
			// Increment retry or mark failed if retried > 3 times
			newStatus := "pending"
			if notif.RetryCount >= 3 {
				newStatus = "failed"
			}
			_, _ = s.db.Exec(`
				UPDATE whatsapp_notifications 
				SET retry_count = retry_count + 1, status = ?, sidobe_response = ?, updated_at = NOW() 
				WHERE id = ?`,
				newStatus, respStr+" | err: "+err.Error(), notif.ID,
			)
		} else {
			log.Printf("[SCHEDULER SUCCESS] Reminder ID %d sent successfully to %s", notif.ID, notif.RecipientPhone)
			_, _ = s.db.Exec(`
				UPDATE whatsapp_notifications 
				SET status = 'sent', sent_at = ?, sidobe_response = ?, updated_at = NOW() 
				WHERE id = ?`,
				now, respStr, notif.ID,
			)
		}
	}
}
