package rbac

import (
	"github.com/nan0/backend/internal/model"
)

// Permission constants for actions
type Permission string

const (
	PermReadSecrets   Permission = "secrets:read"
	PermWriteSecrets  Permission = "secrets:write"
	PermDeleteSecrets Permission = "secrets:delete"
	PermViewAudit     Permission = "audit:read"
	PermManageMembers Permission = "members:manage"
	PermManageBilling Permission = "billing:manage"
	PermManageTokens  Permission = "tokens:manage"
)

// rolePermissions maps roles to their allowed permissions.
var rolePermissions = map[model.Role][]Permission{
	model.RoleOwner: {
		PermReadSecrets, PermWriteSecrets, PermDeleteSecrets,
		PermViewAudit, PermManageMembers, PermManageBilling, PermManageTokens,
	},
	model.RoleAdmin: {
		PermReadSecrets, PermWriteSecrets, PermDeleteSecrets,
		PermViewAudit, PermManageMembers, PermManageTokens,
	},
	model.RoleDeveloper: {
		PermReadSecrets, PermWriteSecrets, PermManageTokens,
	},
	model.RoleReader: {
		PermReadSecrets,
	},
}

// HasPermission checks if a role has a given permission.
func HasPermission(role model.Role, perm Permission) bool {
	perms, ok := rolePermissions[role]
	if !ok {
		return false
	}
	for _, p := range perms {
		if p == perm {
			return true
		}
	}
	return false
}

// CanReadSecret checks if a role can read secrets (all roles can read non-prod).
func CanReadSecret(role model.Role, isProtected bool) bool {
	if !isProtected {
		return HasPermission(role, PermReadSecrets)
	}
	// Only owner and admin can read protected envs
	return role == model.RoleOwner || role == model.RoleAdmin
}

// CanWriteSecret checks if a role can write secrets.
func CanWriteSecret(role model.Role, isProtected bool) bool {
	if !isProtected {
		return HasPermission(role, PermWriteSecrets)
	}
	// Only owner and admin can write to protected envs
	return role == model.RoleOwner || role == model.RoleAdmin
}

// CanDeleteSecret checks if a role can delete secrets.
func CanDeleteSecret(role model.Role) bool {
	return role == model.RoleOwner || role == model.RoleAdmin
}

// IsAtLeast checks if a role is at least as privileged as minRole.
func IsAtLeast(role, minRole model.Role) bool {
	order := map[model.Role]int{
		model.RoleReader:    1,
		model.RoleDeveloper: 2,
		model.RoleAdmin:     3,
		model.RoleOwner:     4,
	}
	return order[role] >= order[minRole]
}
