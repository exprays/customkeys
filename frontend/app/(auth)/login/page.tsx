"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, Chrome as Google, Apple } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Get Started Now</h1>
        <p className="text-white/50">Please log in to your account to continue.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-[13px] font-bold text-white uppercase tracking-wider mb-2">
            Email address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            placeholder="workmail@gmail.com"
            className="w-full px-4 py-3 bg-transparent border border-[rgba(65,65,65,0.8)] rounded-[4px] text-white placeholder-white/20 focus:outline-none focus:border-[#faff69] transition-colors"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[13px] font-bold text-white uppercase tracking-wider">
              Password
            </label>
            <Link href="/forgot-password" title="Forgot password logic is not implemented yet" className="text-[13px] font-bold text-[#faff69] hover:text-[#faff69]/80 transition-colors">
              Forgot Password?
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••••••"
              className="w-full px-4 py-3 bg-transparent border border-[rgba(65,65,65,0.8)] rounded-[4px] text-white placeholder-white/20 focus:outline-none focus:border-[#faff69] transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {error && (
          <div className="px-4 py-3 bg-red-500/10 border border-red-500/50 rounded-[4px] text-red-400 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full btn-neon"
        >
          {loading ? "Signing in…" : "Log in"}
        </button>
      </form>

      <div className="mt-8 pt-8 border-t border-[rgba(65,65,65,0.4)] text-center">
        <p className="text-white/40 text-sm">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-[#faff69] font-bold hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
