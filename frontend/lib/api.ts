import { createClient } from "./supabase/client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

class APIError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "APIError";
  }
}

async function getAuthHeader(): Promise<string> {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new APIError(401, "Not authenticated");
  return `Bearer ${token}`;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const auth = await getAuthHeader();

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: auth,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return undefined as T;

  const data = await res.json();
  if (!res.ok) {
    throw new APIError(res.status, data.message || "Request failed");
  }
  return data as T;
}

export const api = {
  // Org
  createOrg: (name: string) => request("POST", "/v1/orgs", { name }),
  getMyOrg: () => request("GET", "/v1/orgs/me"),
  getMe: () => request("GET", "/v1/me"),
  getMembers: () => request("GET", "/v1/orgs/me/members"),

  // Projects
  listProjects: () => request("GET", "/v1/projects"),
  createProject: (name: string, description: string) =>
    request("POST", "/v1/projects", { name, description }),
  getProject: (pid: string) => request("GET", `/v1/projects/${pid}`),
  deleteProject: (pid: string) => request("DELETE", `/v1/projects/${pid}`),

  // Environments
  listEnvironments: (pid: string) =>
    request("GET", `/v1/projects/${pid}/envs`),
  createEnvironment: (pid: string, name: string, isProtected: boolean) =>
    request("POST", `/v1/projects/${pid}/envs`, { name, is_protected: isProtected }),

  // Secrets
  listSecrets: (pid: string, eid: string) =>
    request("GET", `/v1/projects/${pid}/envs/${eid}/secrets`),
  createSecret: (pid: string, eid: string, key: string, value: string) =>
    request("POST", `/v1/projects/${pid}/envs/${eid}/secrets`, { key, value }),
  getSecret: (sid: string) => request("GET", `/v1/secrets/${sid}`),
  updateSecret: (sid: string, value: string) =>
    request("PUT", `/v1/secrets/${sid}`, { value }),
  deleteSecret: (sid: string) => request("DELETE", `/v1/secrets/${sid}`),
  listSecretVersions: (sid: string) =>
    request("GET", `/v1/secrets/${sid}/versions`),

  // Audit
  listAuditEvents: (params?: { limit?: number; offset?: number; action?: string }) => {
    const q = new URLSearchParams();
    if (params?.limit) q.set("limit", String(params.limit));
    if (params?.offset) q.set("offset", String(params.offset));
    if (params?.action) q.set("action", params.action);
    return request("GET", `/v1/orgs/me/audit?${q}`);
  },

  // Tokens
  listTokens: () => request("GET", "/v1/tokens"),
  createToken: (name: string, scopes: string[]) =>
    request("POST", "/v1/tokens", { name, scopes }),
  revokeToken: (tid: string) => request("DELETE", `/v1/tokens/${tid}`),
};

