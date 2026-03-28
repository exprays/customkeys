package store

import (
	"context"

	"github.com/google/uuid"
	"github.com/nan0/backend/internal/model"
)

func (s *Store) UpdateOrgBilling(ctx context.Context, orgID uuid.UUID, customerID, subscriptionID, variantID string, plan model.PlanTier, retentionDays int) error {
	_, err := s.pool.Exec(ctx, `
		UPDATE organizations
		SET ls_customer_id=$2, ls_subscription_id=$3, ls_variant_id=$4,
		    plan_tier=$5, audit_retention_days=$6, updated_at=NOW()
		WHERE id=$1`,
		orgID, customerID, subscriptionID, variantID, plan, retentionDays)
	return err
}

func (s *Store) UpdateOrgPlan(ctx context.Context, orgID uuid.UUID, plan model.PlanTier, retentionDays int) error {
	_, err := s.pool.Exec(ctx, `
		UPDATE organizations SET plan_tier=$2, audit_retention_days=$3, updated_at=NOW() WHERE id=$1`,
		orgID, plan, retentionDays)
	return err
}

func (s *Store) GetOrgByLSCustomerID(ctx context.Context, customerID string) (*model.Organization, error) {
	row := s.pool.QueryRow(ctx, `
		SELECT id, name, plan_tier, ls_customer_id, ls_subscription_id, ls_variant_id,
		       seat_count, billing_email, audit_retention_days, created_at, updated_at
		FROM organizations WHERE ls_customer_id=$1`, customerID)
	return scanOrg(row)
}

func (s *Store) GetOrgByLSSubscriptionID(ctx context.Context, subID string) (*model.Organization, error) {
	row := s.pool.QueryRow(ctx, `
		SELECT id, name, plan_tier, ls_customer_id, ls_subscription_id, ls_variant_id,
		       seat_count, billing_email, audit_retention_days, created_at, updated_at
		FROM organizations WHERE ls_subscription_id=$1`, subID)
	return scanOrg(row)
}

func (s *Store) UpdateOrgSeatCount(ctx context.Context, orgID uuid.UUID, count int) error {
	_, err := s.pool.Exec(ctx, `UPDATE organizations SET seat_count=$2, updated_at=NOW() WHERE id=$1`, orgID, count)
	return err
}

type orgRow interface {
	Scan(dest ...any) error
}

func scanOrg(row orgRow) (*model.Organization, error) {
	var org model.Organization
	if err := row.Scan(&org.ID, &org.Name, &org.PlanTier, &org.LSCustomerID, &org.LSSubscriptionID,
		&org.LSVariantID, &org.SeatCount, &org.BillingEmail, &org.AuditRetentionDays,
		&org.CreatedAt, &org.UpdatedAt); err != nil {
		return nil, err
	}
	return &org, nil
}
