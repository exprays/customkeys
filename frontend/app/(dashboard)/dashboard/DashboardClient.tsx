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
      <div className="flex items-center justify-center h-full bg-black">
        <div className="w-8 h-8 border-2 border-[#faff69] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const stats = [
    { label: "Projects", value: projects.length, icon: FolderKanban, href: "/projects" },
    { label: "Plan", value: org?.plan_tier ? org.plan_tier.toUpperCase() : "FREE", icon: ShieldCheck, href: "#" },
    { label: "Audit Log", value: recentAudit.length > 0 ? "STABLE" : "IDLE", icon: ScrollText, href: "/audit" },
    { label: "Auth", value: "SECURE", icon: Key, href: "/tokens" },
  ];

  const ACTION_COLORS: Record<string, string> = {
    "secret.read": "text-[#faff69]",
    "secret.write": "text-white",
    "secret.delete": "text-red-500",
    "secret.bulk_read": "text-[#faff69]",
    "project.created": "text-[#faff69]",
    "token.created": "text-white",
    "token.revoked": "text-red-500",
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-[rgba(65,65,65,0.4)]">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight uppercase">
            {org?.name || "Vault Overview"}
          </h1>
          <p className="text-white/40 text-sm mt-2 font-mono uppercase tracking-widest">
            Production Environment • Secure Access Enabled
          </p>
        </div>
        {org?.id && (
          <div className="bg-[#141414] border border-[rgba(65,65,65,0.8)] px-4 py-2 rounded-[4px]">
            <CopyableId label="ORG_ID" value={org.id} />
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="group block bg-[#0a0a0a] border border-[rgba(65,65,65,0.8)] p-6 rounded-[4px] hover:border-[#faff69] transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="w-10 h-10 rounded-[4px] bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-[#faff69]/10 group-hover:border-[#faff69]/30 transition-colors">
                <stat.icon size={20} className="text-white/40 group-hover:text-[#faff69] transition-colors" />
              </div>
              <ArrowRight size={16} className="text-white/20 group-hover:text-[#faff69] translate-x-0 group-hover:translate-x-1 transition-all" />
            </div>
            <p className="text-3xl font-bold text-white tracking-tight">{stat.value}</p>
            <p className="text-[11px] font-bold text-white/30 uppercase tracking-[0.2em] mt-1">{stat.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Projects */}
        <div className="bg-[#0a0a0a] border border-[rgba(65,65,65,0.8)] rounded-[4px] flex flex-col">
          <div className="p-6 border-b border-[rgba(65,65,65,0.4)] flex items-center justify-between">
            <h2 className="text-[13px] font-bold text-white uppercase tracking-[0.2em]">Active Projects</h2>
            <Link
              href="/projects"
              className="text-[11px] font-bold text-[#faff69] hover:underline uppercase tracking-wider flex items-center gap-2"
            >
              Browse all <ArrowRight size={14} />
            </Link>
          </div>

          <div className="p-2 flex-1">
            {projects.length === 0 ? (
              <div className="text-center py-16">
                <FolderKanban size={40} className="text-white/10 mx-auto mb-4" />
                <p className="text-sm text-white/40 mb-6 uppercase tracking-widest font-mono">No Active Clusters Found</p>
                <Link
                  href="/projects"
                  className="btn-neon inline-flex h-10 leading-10 items-center"
                >
                  <Plus size={16} className="mr-2" /> Initialize Project
                </Link>
              </div>
            ) : (
              <div className="space-y-1">
                {projects.slice(0, 5).map((p) => (
                  <Link
                    key={p.id}
                    href={`/projects/${p.id}`}
                    className="flex items-center gap-4 p-4 rounded-[4px] hover:bg-white/5 transition-colors group border border-transparent hover:border-white/10"
                  >
                    <div className="w-10 h-10 rounded-[4px] bg-[#141414] border border-[rgba(65,65,65,0.8)] flex items-center justify-center flex-shrink-0 group-hover:border-[#faff69]/40">
                      <FolderKanban size={18} className="text-white/40 group-hover:text-[#faff69]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate uppercase tracking-tight">{p.name}</p>
                      <p className="text-[10px] text-white/40 font-mono uppercase mt-0.5">{relativeTime(p.created_at)}</p>
                    </div>
                    <ArrowRight size={18} className="text-white/10 group-hover:text-[#faff69] transition-colors flex-shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent audit events */}
        <div className="bg-[#0a0a0a] border border-[rgba(65,65,65,0.8)] rounded-[4px] flex flex-col">
          <div className="p-6 border-b border-[rgba(65,65,65,0.4)] flex items-center justify-between">
            <h2 className="text-[13px] font-bold text-white uppercase tracking-[0.2em]">Security Audit</h2>
            <Link
              href="/audit"
              className="text-[11px] font-bold text-[#faff69] hover:underline uppercase tracking-wider flex items-center gap-2"
            >
              Full Log <ArrowRight size={14} />
            </Link>
          </div>

          <div className="p-6 flex-1">
            {recentAudit.length === 0 ? (
              <div className="text-center py-16">
                <ScrollText size={40} className="text-white/10 mx-auto mb-4" />
                <p className="text-sm text-white/40 uppercase tracking-widest font-mono">Standby Mode</p>
              </div>
            ) : (
              <div className="space-y-6">
                {recentAudit.map((event) => (
                  <div key={event.id} className="flex items-start gap-4">
                    <div className="w-2 h-2 rounded-full bg-[#faff69] mt-1.5 flex-shrink-0 shadow-[0_0_8px_#faff69]" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-mono font-bold uppercase ${ACTION_COLORS[event.action] || "text-white/60"}`}>
                          {event.action.replace('.', ' :: ')}
                        </span>
                      </div>
                      {event.metadata && typeof event.metadata === "object" && "key" in event.metadata && (
                        <div className="mt-1 bg-[#141414] px-2 py-1 inline-block border border-white/5 rounded">
                          <span className="text-[10px] text-white/50 font-mono">
                            OBJID__{String(event.metadata.key).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <p className="text-[10px] text-white/30 font-mono mt-1 uppercase">{relativeTime(event.ts)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
