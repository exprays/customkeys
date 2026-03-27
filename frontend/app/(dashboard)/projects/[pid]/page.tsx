"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Project, Environment } from "@/types";
import {
  ArrowLeft, Plus, ShieldAlert, ShieldCheck,
  Layers, ArrowRight, Loader2, Lock
} from "lucide-react";
import { CopyableId } from "@/components/ui/CopyableId";

export default function ProjectPage() {
  const { pid } = useParams<{ pid: string }>();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [envs, setEnvs] = useState<Environment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [envName, setEnvName] = useState("");
  const [isProtected, setIsProtected] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [projectData, envsData] = await Promise.all([
          api.getProject(pid) as Promise<Project>,
          api.listEnvironments(pid) as Promise<Environment[]>,
        ]);
        setProject(projectData);
        setEnvs(envsData || []);
      } catch {
        router.push("/projects");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [pid, router]);

  async function handleCreateEnv(e: React.FormEvent) {
    e.preventDefault();
    if (!envName.trim()) return;
    setCreating(true);
    setError("");
    try {
      await api.createEnvironment(pid, envName.trim(), isProtected);
      setEnvName("");
      setIsProtected(false);
      setShowForm(false);
      const updated = await api.listEnvironments(pid) as Environment[];
      setEnvs(updated || []);
    } catch (err: any) {
      setError(err.message || "Failed to create environment");
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-indigo-500" size={24} />
      </div>
    );
  }

  const ENV_COLORS: Record<string, string> = {
    production: "text-red-400 bg-red-950/40 border-red-800/50",
    staging: "text-yellow-400 bg-yellow-950/40 border-yellow-800/50",
    development: "text-green-400 bg-green-950/40 border-green-800/50",
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <Link
        href="/projects"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 mb-5 transition-colors"
      >
        <ArrowLeft size={14} /> Projects
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">{project?.name}</h1>
          {project?.description && (
            <p className="text-sm text-gray-400 mt-1">{project.description}</p>
          )}
          {project?.id && <CopyableId label="Project ID" value={project.id} />}
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus size={15} />
          New environment
        </button>
      </div>

      {/* New environment form */}
      {showForm && (
        <div className="surface p-5 mb-6">
          <h3 className="text-sm font-semibold text-white mb-4">New environment</h3>
          <form onSubmit={handleCreateEnv} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Name</label>
              <input
                autoFocus
                type="text"
                value={envName}
                onChange={(e) => setEnvName(e.target.value)}
                placeholder="e.g. preview, qa, canary"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isProtected}
                onChange={(e) => setIsProtected(e.target.checked)}
                className="w-4 h-4 rounded bg-gray-800 border-gray-600 text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <span className="text-sm text-gray-300">Protected environment</span>
                <p className="text-xs text-gray-500">Only owners and admins can read/write secrets</p>
              </div>
            </label>
            {error && <p className="text-xs text-red-400">{error}</p>}
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={creating || !envName.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                {creating && <Loader2 size={14} className="animate-spin" />}
                Create
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

      {/* Environments grid */}
      {envs.length === 0 ? (
        <div className="surface p-12 text-center">
          <Layers size={40} className="text-gray-700 mx-auto mb-4" />
          <p className="text-sm text-gray-500">No environments found</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {envs.map((env) => {
            const colorClass = ENV_COLORS[env.name] || "text-indigo-400 bg-indigo-950/40 border-indigo-800/50";
            return (
              <Link
                key={env.id}
                href={`/projects/${pid}/environments/${env.id}`}
                className="surface p-5 hover:border-gray-700 transition-colors group block"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`px-2.5 py-1 rounded-md border text-xs font-semibold uppercase tracking-wide ${colorClass}`}>
                    {env.name}
                  </div>
                  {env.is_protected && (
                    <span title="Protected">
                      <Lock size={14} className="text-yellow-500" />
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600 font-mono">{env.slug}</p>
                    {env.is_protected && (
                      <p className="text-xs text-yellow-600 mt-1">Protected</p>
                    )}
                  </div>
                  <ArrowRight size={15} className="text-gray-700 group-hover:text-indigo-400 transition-colors" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
