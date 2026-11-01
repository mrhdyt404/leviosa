-- =====================================================================
-- LEVIOSA - AI Personal Assistant & Smart Productivity Management
-- Database Initialization & Dedicated User Privilege Setup
-- =====================================================================

-- 1. Create Database with full Unicode support (supports emoji & multilingual)
CREATE DATABASE IF NOT EXISTS `leviosa` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- 2. Create Dedicated User for Leviosa
-- Mengatur user privilege khusus database leviosa dengan password aman
CREATE USER IF NOT EXISTS 'leviosa'@'localhost' IDENTIFIED BY 'LeviosaSecurePass2026!';
CREATE USER IF NOT EXISTS 'leviosa'@'127.0.0.1' IDENTIFIED BY 'LeviosaSecurePass2026!';

-- 3. Grant Specific Privileges for Leviosa Database Only
GRANT ALL PRIVILEGES ON `leviosa`.* TO 'leviosa'@'localhost';
GRANT ALL PRIVILEGES ON `leviosa`.* TO 'leviosa'@'127.0.0.1';

-- 4. Flush Privileges to Apply Changes
FLUSH PRIVILEGES;

-- =====================================================================
-- 5. Core Tables Schema (Privacy-First Architecture)
-- Catatan Arsitektur: Data aktivitas & jadwal harian pengguna tersimpan 
-- di perangkat lokal pengguna (Client PWA IndexedDB).
-- Database internal server HANYA menyimpan registrasi, autentikasi sesi,
-- log aktivitas login/logout, WebAuthn (Face Auth), dan reminder queue.
-- =====================================================================

USE `leviosa`;

-- Tabel Pengguna (Multi-User Authentication)
CREATE TABLE IF NOT EXISTS `users` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `uuid` VARCHAR(36) NOT NULL UNIQUE,
    `name` VARCHAR(150) NOT NULL,
    `username` VARCHAR(100) NOT NULL UNIQUE,
    `email` VARCHAR(150) NOT NULL UNIQUE,
    `phone` VARCHAR(25) NULL,
    `password_hash` VARCHAR(255) NULL,
    `google_id` VARCHAR(100) NULL UNIQUE,
    `avatar_url` VARCHAR(255) NULL,
    `face_auth_enrolled` BOOLEAN DEFAULT FALSE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_users_username` (`username`),
    INDEX `idx_users_email` (`email`),
    INDEX `idx_users_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabel Sesi Login (Session & Token Tracking)
CREATE TABLE IF NOT EXISTS `sessions` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `token_hash` VARCHAR(64) NOT NULL UNIQUE,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` TEXT NULL,
    `is_active` BOOLEAN DEFAULT TRUE,
    `last_activity` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `expires_at` TIMESTAMP NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    INDEX `idx_sessions_user_active` (`user_id`, `is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabel Log Aktivitas Pengguna (Login/Logout/Status Aktif-Nonaktif)
CREATE TABLE IF NOT EXISTS `activity_logs` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `action` VARCHAR(50) NOT NULL, -- 'login', 'logout', 'session_refresh', 'face_auth_login', 'google_login'
    `status` VARCHAR(20) NOT NULL, -- 'success', 'failed'
    `ip_address` VARCHAR(45) NULL,
    `user_agent` TEXT NULL,
    `details` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    INDEX `idx_activity_user_time` (`user_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabel Kredensial WebAuthn (Passkeys / Face Authentication Biometrik)
CREATE TABLE IF NOT EXISTS `webauthn_credentials` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `credential_id` VARBINARY(255) NOT NULL UNIQUE,
    `public_key` BLOB NOT NULL,
    `attestation_type` VARCHAR(50) NOT NULL,
    `aaguid` VARBINARY(16) NOT NULL,
    `sign_count` INT UNSIGNED NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabel Antrean Pengingat WhatsApp (Sidobe Cloud API)
-- Dikirim pada H-7, H-1, H-1 Jam, dan Hari H secara otomatis oleh server
CREATE TABLE IF NOT EXISTS `whatsapp_notifications` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `schedule_uuid` VARCHAR(36) NOT NULL,
    `reminder_type` VARCHAR(20) NOT NULL, -- 'H-7', 'H-1', 'H-1_jam', 'hari_h', 'custom'
    `schedule_title` VARCHAR(255) NOT NULL,
    `event_time` DATETIME NOT NULL,
    `send_time` DATETIME NOT NULL,
    `recipient_phone` VARCHAR(25) NOT NULL,
    `message_content` TEXT NOT NULL,
    `status` VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'cancelled'
    `sidobe_response` TEXT NULL,
    `retry_count` INT DEFAULT 0,
    `sent_at` DATETIME NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    INDEX `idx_notif_pending_send` (`status`, `send_time`),
    INDEX `idx_notif_user_schedule` (`user_id`, `schedule_uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabel Riwayat Rekomendasi Perubahan Jadwal AI (Membutuhkan Konfirmasi Pengguna)
CREATE TABLE IF NOT EXISTS `ai_recommendations` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `reason_type` VARCHAR(50) NOT NULL, -- 'weather_conflict', 'national_holiday', 'overload', 'buffer_time'
    `schedule_uuid` VARCHAR(36) NOT NULL,
    `original_data` JSON NOT NULL,
    `recommended_data` JSON NOT NULL,
    `explanation` TEXT NOT NULL,
    `status` VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    `responded_at` DATETIME NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    INDEX `idx_ai_rec_status` (`user_id`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
