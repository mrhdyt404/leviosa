package config

import (
	"log"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	Port            string
	AppEnv          string
	AppURL          string
	DBDriver        string
	DBHost          string
	DBPort          string
	DBUser          string
	DBPassword      string
	DBName          string
	JWTSecret       string
	JWTExpiryHours  int
	SidobeAPIURL    string
	SidobeSecretKey string
	GeminiAPIKey    string
	WebAuthnRPID    string
	WebAuthnRPName  string
	WebAuthnOrigin  string
}

func LoadConfig() *Config {
	// Attempt to load .env from current directory or parent directory
	_ = godotenv.Load(".env")
	_ = godotenv.Load("../.env")

	port := getEnv("PORT", "8080")
	jwtExpiry, _ := strconv.Atoi(getEnv("JWT_EXPIRY_HOURS", "72"))

	cfg := &Config{
		Port:            port,
		AppEnv:          getEnv("APP_ENV", "development"),
		AppURL:          getEnv("APP_URL", "http://localhost:"+port),
		DBDriver:        getEnv("DB_DRIVER", "mysql"),
		DBHost:          getEnv("DB_HOST", "127.0.0.1"),
		DBPort:          getEnv("DB_PORT", "3306"),
		DBUser:          getEnv("DB_USER", "leviosa"),
		DBPassword:      getEnv("DB_PASSWORD", "LeviosaSecurePass2026!"),
		DBName:          getEnv("DB_NAME", "leviosa"),
		JWTSecret:       getEnv("JWT_SECRET", "leviosa_super_secret_jwt_key_2026_xyz!"),
		JWTExpiryHours:  jwtExpiry,
		SidobeAPIURL:    getEnv("SIDOBE_API_URL", "https://api.sidobe.com/wa/v1"),
		SidobeSecretKey: getEnv("SIDOBE_SECRET_KEY", "lWRBndGzxoDBZDilgoKTsLvePaYEaspKZCyFbirxRTyaxzrOEO"),
		GeminiAPIKey:    getEnv("GEMINI_API_KEY", ""),
		WebAuthnRPID:    getEnv("WEBAUTHN_RP_ID", "localhost"),
		WebAuthnRPName:  getEnv("WEBAUTHN_RP_NAME", "Leviosa AI Personal Assistant"),
		WebAuthnOrigin:  getEnv("WEBAUTHN_ORIGIN", "http://localhost:"+port),
	}

	log.Printf("[CONFIG] Environment: %s, Port: %s, DB: %s@%s:%s/%s",
		cfg.AppEnv, cfg.Port, cfg.DBUser, cfg.DBHost, cfg.DBPort, cfg.DBName)

	return cfg
}

func getEnv(key, defaultVal string) string {
	if val, exists := os.LookupEnv(key); exists && val != "" {
		return val
	}
	return defaultVal
}
