"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { relativeTime } from "@/lib/utils";
import type { Organization, Project, AuditEvent } from "@/types";
import {
  FolderKanban,
  Key,
  ScrollText,
  ArrowRight,
  Plus,
  ShieldCheck,
} from "lucide-react";
import { CopyableId } from "@/components/ui/CopyableId";

export default function DashboardClient() {
  const router = useRouter();
  const [org, setOrg] = useState<Organization | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [recentAudit, setRecentAudit] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [orgData, projectsData, auditData] = await Promise.all([
          api.getMyOrg() as Promise<Organization>,
          api.listProjects() as Promise<Project[]>,
          api.listAuditEvents({ limit: 5 }) as Promise<{ events: AuditEvent[] }>,
        ]);

        if (!orgData) {
          router.push("/onboarding");
          return;
        }

        setOrg(orgData);
        setProjects(projectsData || []);
        setRecentAudit(auditData?.events || []);
        setLoading(false);
      } catch (err: any) {
        if (err.status === 403 || err.status === 404) {
          router.push("/onboarding");
        } else {
          setLoading(false);
        }
      }
    }
    load();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const stats = [
    { label: "Projects", value: projects.length, icon: FolderKanban, href: "/projects" },
    { label: "Plan", value: org?.plan_tier ? org.plan_tier.charAt(0).toUpperCase() + org.plan_tier.slice(1) : "Free", icon: ShieldCheck, href: "#" },
    { label: "Audit Events", value: recentAudit.length > 0 ? "Active" : "None", icon: ScrollText, href: "/audit" },
    { label: "API Tokens", value: "Manage", icon: Key, href: "/tokens" },
  ];

  const ACTION_COLORS: Record<string, string> = {
    "secret.read": "text-blue-400",
    "secret.write": "text-green-400",
    "secret.delete": "text-red-400",
    "secret.bulk_read": "text-purple-400",
    "project.created": "text-indigo-400",
    "token.created": "text-yellow-400",
    "token.revoked": "text-orange-400",
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">
          {org?.name || "Dashboard"}
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Manage your secrets and configuration
        </p>
        {org?.id && <CopyableId label="Org ID" value={org.id} />}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="surface p-4 hover:border-gray-700 transition-colors group"
          >
            <div className="flex items-center justify-between mb-3">
              <stat.icon size={16} className="text-gray-500 group-hover:text-indigo-400 transition-colors" />
              <ArrowRight size={12} className="text-gray-700 group-hover:text-gray-500 transition-colors" />
            </div>
            <p className="text-xl font-bold text-white">{stat.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Projects */}
        <div className="surface p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Recent Projects</h2>
            <Link
              href="/projects"
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight size={12} />
            </Link>
          </div>

          {projects.length === 0 ? (
            <div className="text-center py-8">
              <FolderKanban size={32} className="text-gray-700 mx-auto mb-3" />
              <p className="text-sm text-gray-500 mb-3">No projects yet</p>
              <Link
                href="/projects"
                className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                <Plus size={12} /> Create your first project
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {projects.slice(0, 5).map((p) => (
                <Link
                  key={p.id}
                  href={`/projects/${p.id}`}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-800 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-900/40 border border-indigo-800/50 flex items-center justify-center flex-shrink-0">
                    <FolderKanban size={14} className="text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{p.name}</p>
                    <p className="text-xs text-gray-500">{relativeTime(p.created_at)}</p>
                  </div>
                  <ArrowRight size={14} className="text-gray-700 group-hover:text-gray-400 transition-colors flex-shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent audit events */}
        <div className="surface p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Recent Activity</h2>
            <Link
              href="/audit"
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight size={12} />
            </Link>
          </div>

          {recentAudit.length === 0 ? (
            <div className="text-center py-8">
              <ScrollText size={32} className="text-gray-700 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No activity yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentAudit.map((event) => (
                <div key={event.id} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className={`text-xs font-mono font-medium ${ACTION_COLORS[event.action] || "text-gray-400"}`}>
                      {event.action}
                    </span>
                    {event.metadata && typeof event.metadata === "object" && "key" in event.metadata && (
                      <span className="text-xs text-gray-500 ml-1.5 font-mono">
                        {String(event.metadata.key)}
                      </span>
                    )}
                    <p className="text-xs text-gray-600 mt-0.5">{relativeTime(event.ts)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
