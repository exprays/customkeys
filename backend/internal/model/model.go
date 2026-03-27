package model

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type PlanTier string

const (
	PlanFree       PlanTier = "free"
	PlanTeam       PlanTier = "team"
	PlanBusiness   PlanTier = "business"
	PlanEnterprise PlanTier = "enterprise"
)

type Role string

const (
	RoleOwner     Role = "owner"
	RoleAdmin     Role = "admin"
	RoleDeveloper Role = "developer"
	RoleReader    Role = "reader"
)

type Organization struct {
	ID        uuid.UUID `json:"id" db:"id"`
	Name      string    `json:"name" db:"name"`
	PlanTier  PlanTier  `json:"plan_tier" db:"plan_tier"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

type User struct {
	ID           uuid.UUID  `json:"id" db:"id"`
	OrgID        *uuid.UUID `json:"org_id" db:"org_id"`
	Email        string     `json:"email" db:"email"`
	Role         Role       `json:"role" db:"role"`
	MFAEnabled   bool       `json:"mfa_enabled" db:"mfa_enabled"`
	LastLoginAt  *time.Time `json:"last_login_at" db:"last_login_at"`
	CreatedAt    time.Time  `json:"created_at" db:"created_at"`
}

type Project struct {
	ID          uuid.UUID `json:"id" db:"id"`
	OrgID       uuid.UUID `json:"org_id" db:"org_id"`
	Name        string    `json:"name" db:"name"`
	Slug        string    `json:"slug" db:"slug"`
	Description string    `json:"description" db:"description"`
	CreatedBy   uuid.UUID `json:"created_by" db:"created_by"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
}

type Environment struct {
	ID          uuid.UUID `json:"id" db:"id"`
	ProjectID   uuid.UUID `json:"project_id" db:"project_id"`
	Name        string    `json:"name" db:"name"`
	Slug        string    `json:"slug" db:"slug"`
	IsProtected bool      `json:"is_protected" db:"is_protected"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
}

type Secret struct {
	ID             uuid.UUID  `json:"id" db:"id"`
	EnvID          uuid.UUID  `json:"env_id" db:"env_id"`
	Key            string     `json:"key" db:"key"`
	EncryptedValue string     `json:"-" db:"encrypted_value"`
	EncryptedDEK   string     `json:"-" db:"encrypted_dek"`
	Version        int        `json:"version" db:"version"`
	ExpiresAt      *time.Time `json:"expires_at" db:"expires_at"`
	CreatedBy      uuid.UUID  `json:"created_by" db:"created_by"`
	CreatedAt      time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at" db:"updated_at"`
	// Populated on read, never stored
	Value          string     `json:"value,omitempty"`
}

type SecretVersion struct {
	ID             uuid.UUID `json:"id" db:"id"`
	SecretID       uuid.UUID `json:"secret_id" db:"secret_id"`
	EncryptedValue string    `json:"-" db:"encrypted_value"`
	EncryptedDEK   string    `json:"-" db:"encrypted_dek"`
	Version        int       `json:"version" db:"version"`
	CreatedBy      uuid.UUID `json:"created_by" db:"created_by"`
	CreatedAt      time.Time `json:"created_at" db:"created_at"`
}

type AuditEvent struct {
	ID           uuid.UUID  `json:"id" db:"id"`
	OrgID        uuid.UUID  `json:"org_id" db:"org_id"`
	ActorID      uuid.UUID  `json:"actor_id" db:"actor_id"`
	ActorType    string     `json:"actor_type" db:"actor_type"`
	Action       string     `json:"action" db:"action"`
	ResourceType string     `json:"resource_type" db:"resource_type"`
	ResourceID   *uuid.UUID       `json:"resource_id" db:"resource_id"`
	Metadata     json.RawMessage  `json:"metadata" db:"metadata"`
	IPAddress    string           `json:"ip_address" db:"ip_address"`
	UserAgent    string     `json:"user_agent" db:"user_agent"`
	Ts           time.Time  `json:"ts" db:"ts"`
	PrevHMAC     string     `json:"-" db:"prev_hmac"`
	HMAC         string     `json:"-" db:"hmac"`
}

type APIToken struct {
	ID          uuid.UUID  `json:"id" db:"id"`
	OrgID       uuid.UUID  `json:"org_id" db:"org_id"`
	UserID      uuid.UUID  `json:"user_id" db:"user_id"`
	Name        string     `json:"name" db:"name"`
	TokenHash   string     `json:"-" db:"token_hash"`
	Scopes      []string   `json:"scopes" db:"scopes"`
	LastUsedAt  *time.Time `json:"last_used_at" db:"last_used_at"`
	ExpiresAt   *time.Time `json:"expires_at" db:"expires_at"`
	CreatedAt   time.Time  `json:"created_at" db:"created_at"`
	// Only set on creation, never stored
	PlainToken  string     `json:"token,omitempty"`
}

type ProjectMember struct {
	ID        uuid.UUID `json:"id" db:"id"`
	ProjectID uuid.UUID `json:"project_id" db:"project_id"`
	UserID    uuid.UUID `json:"user_id" db:"user_id"`
	Role      Role      `json:"role" db:"role"`
	GrantedBy uuid.UUID `json:"granted_by" db:"granted_by"`
	GrantedAt time.Time `json:"granted_at" db:"granted_at"`
}

// Auth context key
type ContextKey string

const (
	CtxUserID  ContextKey = "user_id"
	CtxOrgID   ContextKey = "org_id"
	CtxRole    ContextKey = "role"
	CtxEmail   ContextKey = "email"
)
