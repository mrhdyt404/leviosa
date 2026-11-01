package services

import (
	"database/sql"

	"leviosa-backend/models"
)

type ActivityService struct {
	db *sql.DB
}

func NewActivityService(db *sql.DB) *ActivityService {
	return &ActivityService{db: db}
}

// LogActivity records login, logout, and other session activities to MariaDB
func (a *ActivityService) LogActivity(userID uint64, action, status, ip, userAgent, details string) {
	if a.db == nil {
		return
	}
	_, _ = a.db.Exec(`
		INSERT INTO activity_logs (user_id, action, status, ip_address, user_agent, details, created_at)
		VALUES (?, ?, ?, ?, ?, ?, NOW())`,
		userID, action, status, ip, userAgent, details,
	)
}

// GetUserLogs retrieves recent activity logs for a user
func (a *ActivityService) GetUserLogs(userID uint64, limit int) ([]models.ActivityLog, error) {
	if limit <= 0 {
		limit = 50
	}

	rows, err := a.db.Query(`
		SELECT id, user_id, action, status, ip_address, user_agent, details, created_at
		FROM activity_logs
		WHERE user_id = ?
		ORDER BY created_at DESC
		LIMIT ?`,
		userID, limit,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs []models.ActivityLog
	for rows.Next() {
		var l models.ActivityLog
		var ip, ua, details sql.NullString
		if err := rows.Scan(&l.ID, &l.UserID, &l.Action, &l.Status, &ip, &ua, &details, &l.CreatedAt); err != nil {
			continue
		}
		if ip.Valid {
			l.IPAddress = ip.String
		}
		if ua.Valid {
			l.UserAgent = ua.String
		}
		if details.Valid {
			l.Details = details.String
		}
		logs = append(logs, l)
	}

	return logs, nil
}

// GetUserActiveSessions retrieves list of active sessions
func (a *ActivityService) GetUserActiveSessions(userID uint64) ([]models.Session, error) {
	rows, err := a.db.Query(`
		SELECT id, user_id, token_hash, ip_address, user_agent, is_active, last_activity, expires_at, created_at
		FROM sessions
		WHERE user_id = ? AND is_active = 1 AND expires_at > NOW()
		ORDER BY last_activity DESC`,
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var sessions []models.Session
	for rows.Next() {
		var s models.Session
		var ip, ua sql.NullString
		if err := rows.Scan(&s.ID, &s.UserID, &s.TokenHash, &ip, &ua, &s.IsActive, &s.LastActivity, &s.ExpiresAt, &s.CreatedAt); err != nil {
			continue
		}
		if ip.Valid {
			s.IPAddress = ip.String
		}
		if ua.Valid {
			s.UserAgent = ua.String
		}
		sessions = append(sessions, s)
	}
	return sessions, nil
}
