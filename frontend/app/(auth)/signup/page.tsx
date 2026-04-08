"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, Mail, CheckCircle2 } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (!agree) {
      setError("You must agree to the Terms & Privacy");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { 
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: name }
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (data?.session) {
      router.push("/onboarding");
      router.refresh();
      return;
    }

    setDone(true);
  }

  if (done) {
    return (
      <div className="w-full text-center">
        <div className="w-16 h-16 rounded-full bg-[#faff69]/10 border border-[#faff69]/30 flex items-center justify-center mx-auto mb-6">
          <Mail className="w-8 h-8 text-[#faff69]" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-4 tracking-tight">Check your email</h1>
        <p className="text-white/50 mb-8 leading-relaxed">
          We sent a confirmation link to <strong className="text-white">{email}</strong>.<br />
          Click it to activate your account and start managing your secrets.
        </p>
        <Link href="/login" className="btn-neon inline-block w-full">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Create Account</h1>
        <p className="text-white/50">Free forever, no credit card required.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-[13px] font-bold text-white uppercase tracking-wider mb-2">
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
            placeholder="Enter your name..."
            className="w-full px-4 py-3 bg-transparent border border-[rgba(65,65,65,0.8)] rounded-[4px] text-white placeholder-white/20 focus:outline-none focus:border-[#faff69] transition-colors"
          />
        </div>

        <div>
          <label className="block text-[13px] font-bold text-white uppercase tracking-wider mb-2">
            Email address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="workmail@gmail.com"
            className="w-full px-4 py-3 bg-transparent border border-[rgba(65,65,65,0.8)] rounded-[4px] text-white placeholder-white/20 focus:outline-none focus:border-[#faff69] transition-colors"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[13px] font-bold text-white uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Min 8 chars"
                className="w-full px-4 py-3 bg-transparent border border-[rgba(65,65,65,0.8)] rounded-[4px] text-white placeholder-white/20 focus:outline-none focus:border-[#faff69] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-[13px] font-bold text-white uppercase tracking-wider mb-2">
              Confirm
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-transparent border border-[rgba(65,65,65,0.8)] rounded-[4px] text-white placeholder-white/20 focus:outline-none focus:border-[#faff69] transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div 
            onClick={() => setAgree(!agree)}
            className={`w-5 h-5 rounded-[4px] border border-[rgba(65,65,65,0.8)] flex items-center justify-center cursor-pointer transition-colors ${agree ? 'bg-[#faff69] border-[#faff69]' : 'bg-transparent'}`}
          >
            {agree && <CheckCircle2 size={14} className="text-black" />}
          </div>
          <span className="text-sm text-white/60">
            I agree to the <Link href="/terms" className="text-white hover:underline">Terms</Link> & <Link href="/privacy" className="text-white hover:underline">Privacy</Link>
          </span>
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
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-white/40 text-sm">
          Already have an account?{" "}
          <Link href="/login" className="text-[#faff69] font-bold hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
