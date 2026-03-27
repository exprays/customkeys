"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FolderKanban,
  ScrollText,
  Key,
  LogOut,
  ChevronDown,
  Lock,
  Users,
  Menu,
  X,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/audit", label: "Audit Log", icon: ScrollText },
  { href: "/tokens", label: "API Tokens", icon: Key },
  { href: "/members", label: "Members", icon: Users },
];

function NavItem({ href, label, icon: Icon, exact, onClick }: {
  href: string; label: string; icon: React.ElementType; exact?: boolean; onClick?: () => void;
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
        active
          ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
          : "text-gray-400 hover:text-white hover:bg-gray-800"
      )}
    >
      <Icon size={16} />
      {label}
    </Link>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [userEmail, setUserEmail] = useState("");
  const [orgName, setOrgName] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  const isOnboarding = pathname?.startsWith("/onboarding");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserEmail(data.user.email || "");
    });
    // Try to get org name from API
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/orgs/me`, {
      headers: { Authorization: "" },
    })
      .then(() => {})
      .catch(() => {});
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  // During onboarding, render children full-screen without sidebar
  if (isOnboarding) {
    return <>{children}</>;
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-gray-800">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-indigo-600 flex items-center justify-center flex-shrink-0">
            <Lock size={14} className="text-white" />
          </div>
          <span className="font-bold text-white tracking-tight">Nano</span>
          <span className="ml-auto text-xs text-gray-600 font-mono">v0.1</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavItem key={item.href} {...item} onClick={() => setMobileOpen(false)} />
        ))}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-gray-800">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-gray-800/50">
          <div className="w-7 h-7 rounded-full bg-indigo-900 border border-indigo-700 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-semibold text-indigo-300">
              {userEmail.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">{userEmail}</p>
            <p className="text-xs text-gray-500">Free plan</p>
          </div>
          <button
            onClick={handleSignOut}
            className="text-gray-500 hover:text-gray-300 transition-colors p-1 rounded"
            title="Sign out"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-gray-950">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 flex-col border-r border-gray-800 bg-gray-950 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-56 bg-gray-950 border-r border-gray-800 z-50">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-gray-800">
          <button onClick={() => setMobileOpen(true)} className="text-gray-400 hover:text-white">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-indigo-600 flex items-center justify-center">
              <Lock size={12} className="text-white" />
            </div>
            <span className="font-bold text-white text-sm">Nano</span>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
