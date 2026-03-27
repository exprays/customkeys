"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { User } from "@/types";
import { Users, Loader2, ShieldCheck, ShieldAlert } from "lucide-react";

const ROLE_BADGE: Record<string, string> = {
  owner: "text-yellow-400 bg-yellow-950/40 border-yellow-800/50",
  admin: "text-indigo-400 bg-indigo-950/40 border-indigo-800/50",
  developer: "text-green-400 bg-green-950/40 border-green-800/50",
  reader: "text-gray-400 bg-gray-800/40 border-gray-700/50",
};

export default function MembersPage() {
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMembers()
      .then((data) => setMembers((data as User[]) || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-indigo-500" size={24} />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Members</h1>
        <p className="text-sm text-gray-400 mt-1">
          {members.length} member{members.length !== 1 ? "s" : ""} in your organization
        </p>
      </div>

      <div className="surface overflow-hidden">
        {members.length === 0 ? (
          <div className="p-12 text-center">
            <Users size={40} className="text-gray-700 mx-auto mb-4" />
            <p className="text-sm text-gray-500">No members found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {members.map((member) => (
              <div key={member.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-800/30 transition-colors">
                <div className="w-9 h-9 rounded-full bg-indigo-900 border border-indigo-700 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-indigo-300">
                    {member.email.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{member.email}</p>
                  <p className="text-xs text-gray-600">Joined {formatDate(member.created_at)}</p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-md border capitalize ${ROLE_BADGE[member.role] || ROLE_BADGE.reader}`}>
                  {member.role}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 p-4 bg-gray-900/50 border border-gray-800 rounded-xl">
        <p className="text-xs text-gray-500 leading-relaxed">
          <strong className="text-gray-400">Phase 1:</strong> Member invitations and role management are coming in Phase 2.
          Currently all users who sign up and join the same organization appear here.
        </p>
      </div>
    </div>
  );
}
