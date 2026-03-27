"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { formatDate, relativeTime } from "@/lib/utils";
import type { APIToken } from "@/types";
import { Key, Plus, Trash2, Copy, Check, Loader2, ShieldAlert, X, Play } from "lucide-react";

export default function TokensPage() {
  const [tokens, setTokens] = useState<APIToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState<string[]>(["secrets:read"]);
  const [creating, setCreating] = useState(false);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  // Test token state
  const [testToken, setTestToken] = useState("");
  const [testEnvId, setTestEnvId] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; status: number; body: string } | null>(null);

  const SCOPES = ["secrets:read", "secrets:write", "secrets:delete"];

  useEffect(() => {
    loadTokens();
  }, []);

  async function loadTokens() {
    try {
      const data = await api.listTokens() as APIToken[];
      setTokens(data || []);
    } finally {
      setLoading(false);
    }
  }

  function toggleScope(scope: string) {
    setScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    );
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || scopes.length === 0) return;
    setCreating(true);
    setError("");
    try {
      const token = await api.createToken(name.trim(), scopes) as APIToken;
      setNewToken(token.token || null);
      setName("");
      setScopes(["secrets:read"]);
      setShowForm(false);
      await loadTokens();
    } catch (err: any) {
      setError(err.message || "Failed to create token");
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(id: string, tokenName: string) {
    if (!confirm(`Revoke token "${tokenName}"? Apps using this token will lose access immediately.`)) return;
    try {
      await api.revokeToken(id);
      setTokens((prev) => prev.filter((t) => t.id !== id));
    } catch (err: any) {
      alert(err.message || "Failed to revoke token");
    }
  }

  function copyToken(token: string) {
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleTestToken(e: React.FormEvent) {
    e.preventDefault();
    if (!testToken.trim() || !testEnvId.trim()) return;
    setTesting(true);
    setTestResult(null);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const res = await fetch(`${API_URL}/v1/envs/${testEnvId.trim()}/secrets/values`, {
        headers: { Authorization: `Bearer ${testToken.trim()}` },
      });
      const body = await res.text();
      setTestResult({ ok: res.ok, status: res.status, body });
    } catch (err: any) {
      setTestResult({ ok: false, status: 0, body: err.message || "Network error" });
    } finally {
      setTesting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-indigo-500" size={24} />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">API Tokens</h1>
          <p className="text-sm text-gray-400 mt-1">
            Long-lived tokens for SDK and CI/CD access
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus size={15} />
          New token
        </button>
      </div>

      {/* New token reveal banner */}
      {newToken && (
        <div className="mb-6 p-4 bg-green-950/40 border border-green-800/60 rounded-xl">
          <div className="flex items-start gap-3">
            <ShieldAlert size={18} className="text-green-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-green-300 mb-1">
                Token created — copy it now
              </p>
              <p className="text-xs text-green-600 mb-3">
                This token will not be shown again. Store it securely.
              </p>
              <div className="flex items-center gap-2 bg-gray-950 border border-gray-800 rounded-lg px-3 py-2">
                <code className="text-xs font-mono text-white flex-1 break-all">{newToken}</code>
                <button
                  onClick={() => copyToken(newToken)}
                  className="flex-shrink-0 text-gray-400 hover:text-white transition-colors"
                >
                  {copied ? <Check size={15} className="text-green-400" /> : <Copy size={15} />}
                </button>
              </div>
            </div>
            <button onClick={() => setNewToken(null)} className="text-gray-600 hover:text-gray-400">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <div className="surface p-5 mb-6">
          <h3 className="text-sm font-semibold text-white mb-4">New API token</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Token name</label>
              <input
                autoFocus
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="GitHub Actions CI"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">Scopes</label>
              <div className="space-y-2">
                {SCOPES.map((scope) => (
                  <label key={scope} className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={scopes.includes(scope)}
                      onChange={() => toggleScope(scope)}
                      className="w-4 h-4 rounded bg-gray-800 border-gray-600 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm font-mono text-gray-300">{scope}</span>
                  </label>
                ))}
              </div>
            </div>
            {error && <p className="text-xs text-red-400">{error}</p>}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={creating || !name.trim() || scopes.length === 0}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                {creating && <Loader2 size={14} className="animate-spin" />}
                Create token
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setError(""); }}
                className="px-4 py-2 text-gray-400 hover:text-white text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tokens list */}
      {tokens.length === 0 ? (
        <div className="surface p-12 text-center">
          <Key size={40} className="text-gray-700 mx-auto mb-4" />
          <h3 className="text-base font-semibold text-white mb-2">No API tokens</h3>
          <p className="text-sm text-gray-500 mb-4">
            Create tokens for SDK and CI/CD access
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus size={15} />
            Create token
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {tokens.map((token) => (
            <div key={token.id} className="surface p-4 flex items-center gap-4">
              <div className="w-9 h-9 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0">
                <Key size={16} className="text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">{token.name}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {token.scopes.map((scope) => (
                    <span key={scope} className="text-xs font-mono text-indigo-400 bg-indigo-950/40 border border-indigo-800/50 px-1.5 py-0.5 rounded">
                      {scope}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Created {formatDate(token.created_at)}
                  {token.last_used_at && ` · Last used ${relativeTime(token.last_used_at)}`}
                </p>
              </div>
              <button
                onClick={() => handleRevoke(token.id, token.name)}
                className="p-2 text-gray-600 hover:text-red-400 transition-colors rounded-lg hover:bg-red-950/20 flex-shrink-0"
                title="Revoke token"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Test Token Section */}
      <div className="mt-8 surface p-5">
        <h3 className="text-sm font-semibold text-white mb-1">Test a Token</h3>
        <p className="text-xs text-gray-500 mb-4">
          Verify a token by pulling secrets from an environment. Uses <code className="text-gray-400">GET /v1/envs/&#123;eid&#125;/secrets/values</code>.
        </p>
        <form onSubmit={handleTestToken} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">API Token</label>
            <input
              type="text"
              value={testToken}
              onChange={(e) => setTestToken(e.target.value)}
              placeholder="nano_XXXXXXXXXXXXXXXX"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white font-mono placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Environment ID</label>
            <input
              type="text"
              value={testEnvId}
              onChange={(e) => setTestEnvId(e.target.value)}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white font-mono placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
          </div>
          <button
            type="submit"
            disabled={testing || !testToken.trim() || !testEnvId.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {testing ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
            Test token
          </button>
        </form>

        {testResult && (
          <div className={`mt-4 rounded-lg border p-3 ${testResult.ok ? "bg-green-950/30 border-green-800/50" : "bg-red-950/30 border-red-800/50"}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs font-semibold ${testResult.ok ? "text-green-400" : "text-red-400"}`}>
                {testResult.ok ? "✓ Success" : "✗ Failed"} — HTTP {testResult.status}
              </span>
            </div>
            <pre className="text-xs font-mono text-gray-300 whitespace-pre-wrap break-all max-h-48 overflow-y-auto">
              {(() => {
                try { return JSON.stringify(JSON.parse(testResult.body), null, 2); }
                catch { return testResult.body; }
              })()}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
