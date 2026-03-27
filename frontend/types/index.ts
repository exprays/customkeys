export type PlanTier = "free" | "team" | "business" | "enterprise";
export type Role = "owner" | "admin" | "developer" | "reader";

export interface Organization {
  id: string;
  name: string;
  plan_tier: PlanTier;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  org_id: string | null;
  email: string;
  role: Role;
  mfa_enabled: boolean;
  last_login_at: string | null;
  created_at: string;
}

export interface Project {
  id: string;
  org_id: string;
  name: string;
  slug: string;
  description: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Environment {
  id: string;
  project_id: string;
  name: string;
  slug: string;
  is_protected: boolean;
  created_at: string;
}

export interface Secret {
  id: string;
  env_id: string;
  key: string;
  value?: string;
  version: number;
  expires_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface SecretVersion {
  id: string;
  secret_id: string;
  version: number;
  created_by: string;
  created_at: string;
}

export interface AuditEvent {
  id: string;
  org_id: string;
  actor_id: string;
  actor_type: "user" | "api_token" | "system";
  action: string;
  resource_type: string;
  resource_id: string | null;
  metadata: Record<string, unknown>;
  ip_address: string;
  user_agent: string;
  ts: string;
}

export interface APIToken {
  id: string;
  org_id: string;
  user_id: string;
  name: string;
  scopes: string[];
  token?: string; // Only present on creation
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
}
