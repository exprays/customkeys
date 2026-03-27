"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { formatDate, actionLabel } from "@/lib/utils";
import type { AuditEvent } from "@/types";
import { ScrollText, Loader2, ChevronLeft, ChevronRight, Filter } from "lucide-react";

const ACTION_COLORS: Record<string, string> = {
  "secret.read": "text-blue-400 bg-blue-950/30 border-blue-800/50",
  "secret.write": "text-green-400 bg-green-950/30 border-green-800/50",
  "secret.delete": "text-red-400 bg-red-950/30 border-red-800/50",
  "secret.bulk_read": "text-purple-400 bg-purple-950/30 border-purple-800/50",
  "project.created": "text-indigo-400 bg-indigo-950/30 border-indigo-800/50",
  "project.deleted": "text-red-400 bg-red-950/30 border-red-800/50",
  "environment.created": "text-cyan-400 bg-cyan-950/30 border-cyan-800/50",
  "org.created": "text-indigo-400 bg-indigo-950/30 border-indigo-800/50",
  "token.created": "text-yellow-400 bg-yellow-950/30 border-yellow-800/50",
  "token.revoked": "text-orange-400 bg-orange-950/30 border-orange-800/50",
};

const ACTIONS = [
  "secret.read", "secret.write", "secret.delete",
  "project.created", "project.deleted", "token.created", "token.revoked",
];

export default function AuditPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [filterAction, setFilterAction] = useState("");
  const limit = 25;

  useEffect(() => {
    loadEvents();
  }, [offset, filterAction]);

  async function loadEvents() {
    setLoading(true);
    try {
      const data = await api.listAuditEvents({
        limit,
        offset,
        action: filterAction || undefined,
      }) as { events: AuditEvent[] };
      setEvents(data?.events || []);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Audit Log</h1>
          <p className="text-sm text-gray-400 mt-1">
            Immutable, tamper-evident record of all activity
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        <Filter size={14} className="text-gray-500" />
        <select
          value={filterAction}
          onChange={(e) => { setFilterAction(e.target.value); setOffset(0); }}
          className="px-3 py-1.5 bg-gray-900 border border-gray-800 rounded-lg text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All actions</option>
          {ACTIONS.map((a) => (
            <option key={a} value={a}>{actionLabel(a)}</option>
          ))}
        </select>
        {filterAction && (
          <button
            onClick={() => { setFilterAction(""); setOffset(0); }}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            Clear filter
          </button>
        )}
      </div>

      {/* Events table */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="animate-spin text-indigo-500" size={24} />
        </div>
      ) : events.length === 0 ? (
        <div className="surface p-12 text-center">
          <ScrollText size={40} className="text-gray-700 mx-auto mb-4" />
          <p className="text-sm text-gray-500">No audit events yet</p>
        </div>
      ) : (
        <div className="surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Action</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3 hidden sm:table-cell">Resource</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3 hidden md:table-cell">Details</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3 hidden lg:table-cell">IP</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {events.map((event) => {
                  const colorClass = ACTION_COLORS[event.action] || "text-gray-400 bg-gray-800/30 border-gray-700/50";
                  const meta = event.metadata as Record<string, unknown>;
                  return (
                    <tr key={event.id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <span className={`inline-block text-xs font-mono font-medium px-2 py-0.5 rounded border ${colorClass}`}>
                          {event.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-xs text-gray-400">{event.resource_type}</span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {meta && typeof meta.key === 'string' && (
                          <span className="text-xs font-mono text-gray-300 bg-gray-800 px-1.5 py-0.5 rounded">
                            {meta.key}
                          </span>
                        )}
                        {meta && typeof meta.project_name === 'string' && (
                          <span className="text-xs text-gray-400">{meta.project_name}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-xs font-mono text-gray-600">{event.ip_address || "—"}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-500">{formatDate(event.ts)}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800">
            <p className="text-xs text-gray-500">
              Showing {offset + 1}–{offset + events.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setOffset(Math.max(0, offset - limit))}
                disabled={offset === 0}
                className="p-1.5 rounded text-gray-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setOffset(offset + limit)}
                disabled={events.length < limit}
                className="p-1.5 rounded text-gray-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
