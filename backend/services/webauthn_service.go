package services

import (
	"database/sql"
	"fmt"
	"net/http"
	"sync"

	"leviosa-backend/config"
	"leviosa-backend/models"

	"github.com/go-webauthn/webauthn/protocol"
	"github.com/go-webauthn/webauthn/webauthn"
)

type WebAuthnService struct {
	wa      *webauthn.WebAuthn
	db      *sql.DB
	session sync.Map // In-memory session store for challenge verification
}

type webAuthnUser struct {
	user        *models.User
	credentials []webauthn.Credential
}

func (u *webAuthnUser) WebAuthnID() []byte {
	return []byte(u.user.UUID)
}

func (u *webAuthnUser) WebAuthnName() string {
	return u.user.Username
}

func (u *webAuthnUser) WebAuthnDisplayName() string {
	return u.user.Name
}

func (u *webAuthnUser) WebAuthnCredentials() []webauthn.Credential {
	return u.credentials
}

func (u *webAuthnUser) WebAuthnIcon() string {
	return u.user.AvatarURL
}

func NewWebAuthnService(cfg *config.Config, db *sql.DB) (*WebAuthnService, error) {
	wconfig := &webauthn.Config{
		RPDisplayName: cfg.WebAuthnRPName,
		RPID:          cfg.WebAuthnRPID,
		RPOrigins:     []string{cfg.WebAuthnOrigin, "http://localhost:8080", "http://127.0.0.1:8080"},
		AuthenticatorSelection: protocol.AuthenticatorSelection{
			UserVerification: protocol.VerificationPreferred,
		},
	}

	wa, err := webauthn.New(wconfig)
	if err != nil {
		return nil, fmt.Errorf("failed to init webauthn: %w", err)
	}

	return &WebAuthnService{
		wa: wa,
		db: db,
	}, nil
}

func (s *WebAuthnService) BeginRegistration(user *models.User) (*protocol.CredentialCreation, *webauthn.SessionData, error) {
	waUser := &webAuthnUser{
		user:        user,
		credentials: s.loadUserCredentials(user.ID),
	}

	options, sessionData, err := s.wa.BeginRegistration(waUser)
	if err != nil {
		return nil, nil, err
	}

	s.session.Store(fmt.Sprintf("reg_%d", user.ID), sessionData)
	return options, sessionData, nil
}

func (s *WebAuthnService) FinishRegistration(user *models.User, r *http.Request) error {
	val, ok := s.session.Load(fmt.Sprintf("reg_%d", user.ID))
	if !ok {
		return fmt.Errorf("session challenge expired or not found")
	}
	sessionData := val.(*webauthn.SessionData)
	defer s.session.Delete(fmt.Sprintf("reg_%d", user.ID))

	waUser := &webAuthnUser{
		user:        user,
		credentials: s.loadUserCredentials(user.ID),
	}

	credential, err := s.wa.FinishRegistration(waUser, *sessionData, r)
	if err != nil {
		return fmt.Errorf("webauthn registration failed: %w", err)
	}

	// Save to database
	_, err = s.db.Exec(`
		INSERT INTO webauthn_credentials (user_id, credential_id, public_key, attestation_type, aaguid, sign_count, created_at)
		VALUES (?, ?, ?, ?, ?, ?, NOW())`,
		user.ID, credential.ID, credential.PublicKey, credential.AttestationType, credential.Authenticator.AAGUID, credential.Authenticator.SignCount,
	)
	if err != nil {
		return fmt.Errorf("failed to save credential: %w", err)
	}

	// Update user flag
	_, _ = s.db.Exec(`UPDATE users SET face_auth_enrolled = 1 WHERE id = ?`, user.ID)
	return nil
}

func (s *WebAuthnService) BeginLogin(user *models.User) (*protocol.CredentialAssertion, *webauthn.SessionData, error) {
	waUser := &webAuthnUser{
		user:        user,
		credentials: s.loadUserCredentials(user.ID),
	}

	options, sessionData, err := s.wa.BeginLogin(waUser)
	if err != nil {
		return nil, nil, err
	}

	s.session.Store(fmt.Sprintf("login_%d", user.ID), sessionData)
	return options, sessionData, nil
}

func (s *WebAuthnService) FinishLogin(user *models.User, r *http.Request) error {
	val, ok := s.session.Load(fmt.Sprintf("login_%d", user.ID))
	if !ok {
		return fmt.Errorf("session challenge expired or not found")
	}
	sessionData := val.(*webauthn.SessionData)
	defer s.session.Delete(fmt.Sprintf("login_%d", user.ID))

	waUser := &webAuthnUser{
		user:        user,
		credentials: s.loadUserCredentials(user.ID),
	}

	credential, err := s.wa.FinishLogin(waUser, *sessionData, r)
	if err != nil {
		return fmt.Errorf("face authentication verification failed: %w", err)
	}

	// Update sign count
	_, _ = s.db.Exec(`UPDATE webauthn_credentials SET sign_count = ? WHERE credential_id = ?`,
		credential.Authenticator.SignCount, credential.ID,
	)
	return nil
}

func (s *WebAuthnService) loadUserCredentials(userID uint64) []webauthn.Credential {
	var list []webauthn.Credential
	rows, err := s.db.Query(`SELECT credential_id, public_key, attestation_type, aaguid, sign_count FROM webauthn_credentials WHERE user_id = ?`, userID)
	if err != nil {
		return list
	}
	defer rows.Close()

	for rows.Next() {
		var c webauthn.Credential
		var aaguid []byte
		if err := rows.Scan(&c.ID, &c.PublicKey, &c.AttestationType, &aaguid, &c.Authenticator.SignCount); err != nil {
			continue
		}
		c.Authenticator.AAGUID = aaguid
		list = append(list, c)
	}
	return list
}
