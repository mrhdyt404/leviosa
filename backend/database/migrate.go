package database

import (
	"database/sql"
	"fmt"
	"log"
)

func AutoMigrate(db *sql.DB) error {
	queries := []string{
		`CREATE TABLE IF NOT EXISTS users (
			id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
			uuid VARCHAR(36) NOT NULL UNIQUE,
			name VARCHAR(150) NOT NULL,
			username VARCHAR(100) NOT NULL UNIQUE,
			email VARCHAR(150) NOT NULL UNIQUE,
			phone VARCHAR(25) NULL,
			password_hash VARCHAR(255) NULL,
			google_id VARCHAR(100) NULL UNIQUE,
			avatar_url VARCHAR(255) NULL,
			face_auth_enrolled BOOLEAN DEFAULT FALSE,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
			INDEX idx_users_username (username),
			INDEX idx_users_email (email),
			INDEX idx_users_phone (phone)
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

		`CREATE TABLE IF NOT EXISTS sessions (
			id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
			user_id BIGINT UNSIGNED NOT NULL,
			token_hash VARCHAR(64) NOT NULL UNIQUE,
			ip_address VARCHAR(45) NULL,
			user_agent TEXT NULL,
			is_active BOOLEAN DEFAULT TRUE,
			last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			expires_at TIMESTAMP NOT NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
			INDEX idx_sessions_user_active (user_id, is_active)
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

		`CREATE TABLE IF NOT EXISTS activity_logs (
			id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
			user_id BIGINT UNSIGNED NOT NULL,
			action VARCHAR(50) NOT NULL,
			status VARCHAR(20) NOT NULL,
			ip_address VARCHAR(45) NULL,
			user_agent TEXT NULL,
			details TEXT NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
			INDEX idx_activity_user_time (user_id, created_at)
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

		`CREATE TABLE IF NOT EXISTS webauthn_credentials (
			id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
			user_id BIGINT UNSIGNED NOT NULL,
			credential_id VARBINARY(255) NOT NULL UNIQUE,
			public_key BLOB NOT NULL,
			attestation_type VARCHAR(50) NOT NULL,
			aaguid VARBINARY(16) NOT NULL,
			sign_count INT UNSIGNED NOT NULL DEFAULT 0,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

		`CREATE TABLE IF NOT EXISTS whatsapp_notifications (
			id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
			user_id BIGINT UNSIGNED NOT NULL,
			schedule_uuid VARCHAR(36) NOT NULL,
			reminder_type VARCHAR(20) NOT NULL,
			schedule_title VARCHAR(255) NOT NULL,
			event_time DATETIME NOT NULL,
			send_time DATETIME NOT NULL,
			recipient_phone VARCHAR(25) NOT NULL,
			message_content TEXT NOT NULL,
			status VARCHAR(20) DEFAULT 'pending',
			sidobe_response TEXT NULL,
			retry_count INT DEFAULT 0,
			sent_at DATETIME NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
			FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
			INDEX idx_notif_pending_send (status, send_time),
			INDEX idx_notif_user_schedule (user_id, schedule_uuid)
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

		`CREATE TABLE IF NOT EXISTS ai_recommendations (
			id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
			user_id BIGINT UNSIGNED NOT NULL,
			reason_type VARCHAR(50) NOT NULL,
			schedule_uuid VARCHAR(36) NOT NULL,
			original_data JSON NOT NULL,
			recommended_data JSON NOT NULL,
			explanation TEXT NOT NULL,
			status VARCHAR(20) DEFAULT 'pending',
			responded_at DATETIME NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
			INDEX idx_ai_rec_status (user_id, status)
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,
	}

	for i, q := range queries {
		if _, err := db.Exec(q); err != nil {
			return fmt.Errorf("migration step %d failed: %w", i+1, err)
		}
	}

	log.Println("[MIGRATION] All 6 tables verified / created.")
	return nil
}
