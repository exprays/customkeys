"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { relativeTime } from "@/lib/utils";
import type { Secret, Environment, Project } from "@/types";
import {
  ArrowLeft, Plus, Eye, EyeOff, Copy, Pencil,
  Trash2, Check, Lock, Loader2, KeyRound, X,
  ChevronDown, ChevronUp, History,
} from "lucide-react";
import { CopyableId } from "@/components/ui/CopyableId";

interface SecretRowProps {
  secret: Secret;
  onDelete: (id: string) => void;
  onUpdated: () => void;
}

function SecretRow({ secret, onDelete, onUpdated }: SecretRowProps) {
  const [revealed, setRevealed] = useState(false);
  const [value, setValue] = useState<string | null>(null);
  const [loadingValue, setLoadingValue] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  async function revealValue() {
    if (value !== null) {
      setRevealed(!revealed);
      return;
    }
    setLoadingValue(true);
    try {
      const data = await api.getSecret(secret.id) as Secret;
      setValue(data.value || "");
      setRevealed(true);
    } finally {
      setLoadingValue(false);
    }
  }

  async function copyValue() {
    let v = value;
    if (!v) {
      const data = await api.getSecret(secret.id) as Secret;
      v = data.value || "";
      setValue(v);
    }
    navigator.clipboard.writeText(v);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function saveEdit() {
    if (!editValue.trim()) return;
    setSaving(true);
    try {
      await api.updateSecret(secret.id, editValue);
      setValue(editValue);
      setEditing(false);
      onUpdated();
    } finally {
      setSaving(false);
    }
  }

  function startEdit() {
    setEditValue(value || "");
    setEditing(true);
  }

  return (
    <div className="border border-gray-800 rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-900">
        {/* Key name */}
        <KeyRound size={14} className="text-gray-600 flex-shrink-0" />
        <span className="font-mono text-sm font-semibold text-white flex-1 min-w-0 truncate">
          {secret.key}
        </span>
        <span className="text-xs text-gray-600 hidden sm:block">v{secret.version}</span>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={copyValue}
            className="p-1.5 text-gray-500 hover:text-white rounded transition-colors"
            title="Copy value"
          >
            {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
          </button>
          <button
            onClick={revealValue}
            className="p-1.5 text-gray-500 hover:text-white rounded transition-colors"
            title={revealed ? "Hide value" : "Reveal value"}
          >
            {loadingValue ? (
              <Loader2 size={14} className="animate-spin" />
            ) : revealed ? (
              <EyeOff size={14} />
            ) : (
              <Eye size={14} />
            )}
          </button>
          <button
            onClick={startEdit}
            className="p-1.5 text-gray-500 hover:text-indigo-400 rounded transition-colors"
            title="Edit value"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => onDelete(secret.id)}
            className="p-1.5 text-gray-500 hover:text-red-400 rounded transition-colors"
            title="Delete secret"
          >
            <Trash2 size={14} />
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 text-gray-500 hover:text-white rounded transition-colors"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Value display */}
      {(revealed || editing) && (
        <div className="px-4 py-3 bg-gray-950 border-t border-gray-800">
          {editing ? (
            <div className="space-y-2">
              <textarea
                autoFocus
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={saveEdit}
                  disabled={saving}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {saving && <Loader2 size={12} className="animate-spin" />}
                  Save
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="px-3 py-1.5 text-gray-400 hover:text-white text-xs transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <code className="text-xs text-green-300 font-mono break-all whitespace-pre-wrap">
              {value}
            </code>
          )}
        </div>
      )}

      {/* Metadata */}
      {expanded && !editing && (
        <div className="px-4 py-3 border-t border-gray-800 bg-gray-950/50 flex items-center gap-6 flex-wrap">
          <span className="text-xs text-gray-500">
            Updated <strong className="text-gray-400">{relativeTime(secret.updated_at)}</strong>
          </span>
          <span className="text-xs text-gray-500">
            Version <strong className="text-gray-400">#{secret.version}</strong>
          </span>
          {secret.expires_at && (
            <span className="text-xs text-yellow-600">
              Expires {relativeTime(secret.expires_at)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default function EnvironmentSecretsPage() {
  const { pid, eid } = useParams<{ pid: string; eid: string }>();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [env, setEnv] = useState<Environment | null>(null);
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");
  const [search, setSearch] = useState("");

  const loadSecrets = useCallback(async () => {
    const data = await api.listSecrets(pid, eid) as Secret[];
    setSecrets(data || []);
  }, [pid, eid]);

  useEffect(() => {
    async function load() {
      try {
        const [projectData, envsData, secretsData] = await Promise.all([
          api.getProject(pid) as Promise<Project>,
          api.listEnvironments(pid) as Promise<Environment[]>,
          api.listSecrets(pid, eid) as Promise<Secret[]>,
        ]);
        setProject(projectData);
        setEnv(envsData?.find((e) => e.id === eid) || null);
        setSecrets(secretsData || []);
      } catch {
        router.push(`/dashboard/projects/${pid}`);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [pid, eid, router]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newKey.trim() || !newValue) return;
    setAdding(true);
    setAddError("");
    try {
      await api.createSecret(pid, eid, newKey.trim(), newValue);
      setNewKey("");
      setNewValue("");
      setShowAdd(false);
      await loadSecrets();
    } catch (err: any) {
      setAddError(err.message || "Failed to create secret");
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id: string) {
    const secret = secrets.find((s) => s.id === id);
    if (!confirm(`Delete secret "${secret?.key}"?`)) return;
    try {
      await api.deleteSecret(id);
      setSecrets((prev) => prev.filter((s) => s.id !== id));
    } catch (err: any) {
      alert(err.message || "Failed to delete");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-indigo-500" size={24} />
      </div>
    );
  }

  const filteredSecrets = secrets.filter((s) =>
    s.key.toLowerCase().includes(search.toLowerCase())
  );

  const ENV_BADGE: Record<string, string> = {
    production: "bg-red-950/50 text-red-400 border-red-800/60",
    staging: "bg-yellow-950/50 text-yellow-400 border-yellow-800/60",
    development: "bg-green-950/50 text-green-400 border-green-800/60",
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-5">
        <Link href="/projects" className="hover:text-gray-300 transition-colors">
          Projects
        </Link>
        <span>/</span>
        <Link href={`/projects/${pid}`} className="hover:text-gray-300 transition-colors">
          {project?.name}
        </Link>
        <span>/</span>
        <span className="text-gray-300">{env?.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white capitalize">{env?.name}</h1>
            <span className={`text-xs font-semibold uppercase px-2.5 py-1 rounded-md border ${ENV_BADGE[env?.name || ""] || "bg-indigo-950/50 text-indigo-400 border-indigo-800/60"}`}>
              {env?.name}
            </span>
            {env?.is_protected && (
              <span className="flex items-center gap-1 text-xs text-yellow-500 bg-yellow-950/30 border border-yellow-800/40 px-2 py-1 rounded-md">
                <Lock size={11} /> Protected
              </span>
            )}
          </div>
          {eid && <CopyableId label="Env ID" value={eid} />}
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus size={15} />
          Add secret
        </button>
      </div>

      {/* Add secret form */}
      {showAdd && (
        <div className="surface p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">New secret</h3>
            <button onClick={() => setShowAdd(false)} className="text-gray-500 hover:text-white">
              <X size={16} />
            </button>
          </div>
          <form onSubmit={handleAdd} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Key</label>
              <input
                autoFocus
                type="text"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value.toUpperCase())}
                placeholder="DATABASE_URL"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white font-mono placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Value</label>
              <textarea
                rows={3}
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="postgres://user:pass@host:5432/db"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white font-mono placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition"
              />
            </div>
            {addError && <p className="text-xs text-red-400">{addError}</p>}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={adding || !newKey.trim() || !newValue}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                {adding && <Loader2 size={14} className="animate-spin" />}
                Add secret
              </button>
              <button
                type="button"
                onClick={() => { setShowAdd(false); setAddError(""); }}
                className="px-4 py-2 text-gray-400 hover:text-white text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      {secrets.length > 0 && (
        <div className="mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search secrets…"
            className="w-full sm:w-72 px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          />
        </div>
      )}

      {/* Secrets count */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-500">
          {filteredSecrets.length} secret{filteredSecrets.length !== 1 ? "s" : ""}
          {search && ` matching "${search}"`}
        </p>
      </div>

      {/* Secrets list */}
      {filteredSecrets.length === 0 ? (
        <div className="surface p-12 text-center">
          <KeyRound size={40} className="text-gray-700 mx-auto mb-4" />
          <h3 className="text-base font-semibold text-white mb-2">
            {search ? "No secrets match your search" : "No secrets yet"}
          </h3>
          {!search && (
            <button
              onClick={() => setShowAdd(true)}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Plus size={15} />
              Add your first secret
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredSecrets.map((secret) => (
            <SecretRow
              key={secret.id}
              secret={secret}
              onDelete={handleDelete}
              onUpdated={loadSecrets}
            />
          ))}
        </div>
      )}
    </div>
  );
}
