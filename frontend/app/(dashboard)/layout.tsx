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
        "flex items-center gap-3 px-4 py-2.5 rounded-[4px] text-[13px] font-bold uppercase tracking-wider transition-all duration-200",
        active
          ? "bg-[#faff69] text-black border border-[#faff69]"
          : "text-white/50 hover:text-white hover:bg-white/5 border border-transparent"
      )}
    >
      <Icon size={16} strokeWidth={active ? 2.5 : 2} />
      {label}
    </Link>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [userEmail, setUserEmail] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  const isOnboarding = pathname?.startsWith("/onboarding");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserEmail(data.user.email || "");
    });
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
    <div className="flex flex-col h-full bg-black">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-[rgba(65,65,65,0.8)]">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[4px] bg-[#faff69] flex items-center justify-center flex-shrink-0">
            <Lock size={16} className="text-black" />
          </div>
          <div>
            <span className="font-bold text-white tracking-tight block leading-none">NANO</span>
            <span className="text-[10px] text-white/40 font-mono tracking-widest uppercase">Security</span>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        <div className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-4 px-2">Management</div>
        {navItems.map((item) => (
          <NavItem key={item.href} {...item} onClick={() => setMobileOpen(false)} />
        ))}
      </nav>

      {/* User */}
      <div className="px-4 py-6 border-t border-[rgba(65,65,65,0.8)]">
        <div className="flex items-center gap-3 px-3 py-3 rounded-[4px] bg-[#141414] border border-[rgba(65,65,65,0.8)]">
          <div className="w-8 h-8 rounded-full bg-[#faff69]/10 border border-[#faff69]/30 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-[#faff69]">
              {userEmail.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold text-white truncate uppercase tracking-tight">{userEmail.split('@')[0]}</p>
            <p className="text-[10px] text-white/40 font-mono tracking-tighter uppercase">Vault Admin</p>
          </div>
          <button
            onClick={handleSignOut}
            className="text-white/40 hover:text-[#faff69] transition-colors p-1"
            title="Sign out"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-black font-sans">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-[rgba(65,65,65,0.8)] bg-black flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-black border-r border-[rgba(65,65,65,0.8)] z-50">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <div className="md:hidden flex items-center justify-between px-6 py-4 border-b border-[rgba(65,65,65,0.8)] bg-black">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-[4px] bg-[#faff69] flex items-center justify-center">
              <Lock size={14} className="text-black" />
            </div>
            <span className="font-bold text-white text-sm tracking-tight">NANO</span>
          </div>
          <button onClick={() => setMobileOpen(true)} className="text-white/60 hover:text-white">
            <Menu size={20} />
          </button>
        </div>

        <main className="flex-1 overflow-y-auto bg-black">
          {children}
        </main>
      </div>
    </div>
  );
}
