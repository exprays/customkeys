package store

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/nan0/backend/internal/model"
)

func (s *Store) CreateOrganization(ctx context.Context, name string, planTier model.PlanTier) (*model.Organization, error) {
	org := &model.Organization{}
	err := s.pool.QueryRow(ctx, `
		INSERT INTO organizations (id, name, plan_tier)
		VALUES (gen_random_uuid(), $1, $2)
		RETURNING id, name, plan_tier, created_at, updated_at
	`, name, planTier).Scan(
		&org.ID, &org.Name, &org.PlanTier, &org.CreatedAt, &org.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("create org: %w", err)
	}
	return org, nil
}

func (s *Store) GetOrganizationByID(ctx context.Context, id uuid.UUID) (*model.Organization, error) {
	org := &model.Organization{}
	err := s.pool.QueryRow(ctx, `
		SELECT id, name, plan_tier, created_at, updated_at
		FROM organizations WHERE id = $1
	`, id).Scan(&org.ID, &org.Name, &org.PlanTier, &org.CreatedAt, &org.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("get org: %w", err)
	}
	return org, nil
}
