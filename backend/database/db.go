package database

import (
	"database/sql"
	"fmt"
	"log"
	"time"

	"leviosa-backend/config"

	_ "github.com/go-sql-driver/mysql"
)

var DB *sql.DB

func ConnectDB(cfg *config.Config) (*sql.DB, error) {
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		cfg.DBUser, cfg.DBPassword, cfg.DBHost, cfg.DBPort, cfg.DBName)

	db, err := sql.Open("mysql", dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to open database connection: %w", err)
	}

	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(5 * time.Minute)

	// Verify database connection with timeout
	if err := db.Ping(); err != nil {
		log.Printf("[DB WARNING] Cannot ping MariaDB (%s): %v", dsn, err)
		log.Printf("[DB ADVICE] Pastikan database 'leviosa' dan user 'leviosa' sudah dibuat.")
		log.Printf("[DB ADVICE] Jalankan: sudo mysql < /var/www/html/leviosa/init_db.sql")
		return nil, err
	}

	log.Printf("[DB SUCCESS] Connected to MariaDB database: %s", cfg.DBName)
	DB = db

	// Run automatic table migrations
	if err := AutoMigrate(db); err != nil {
		log.Printf("[DB MIGRATION WARNING] Failed to complete auto-migration: %v", err)
	} else {
		log.Printf("[DB SUCCESS] Database tables verified and migrated successfully.")
	}

	return db, nil
}
