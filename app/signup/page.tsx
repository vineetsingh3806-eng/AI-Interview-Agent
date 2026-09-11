"use client";

import { FormEvent, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Brain, Check, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AriaCore } from "@/components/3d/AriaCore";
import { InterviewEnvironment } from "@/components/3d/InterviewEnvironment";
import { getAuthSession, signup } from "@/lib/auth";

function Spinner() {
  return <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden="true" />;
}

export default function SignupPage() {
  const router = useRouter();
  const [destination] = useState(() => {
    if (typeof window === "undefined") return "/skill-selection";
    const next = new URLSearchParams(window.location.search).get("next");
    return next && next.startsWith("/") ? next : "/skill-selection";
  });
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getAuthSession().then((session) => {
      if (session) router.replace(destination);
    });
  }, [destination, router]);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const passwordStrong = password.length >= 8;
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const canSubmit = name.trim().length >= 2 && emailValid && passwordStrong && passwordsMatch;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    setError("");
    if (!canSubmit) return;
    setLoading(true);
    try {
      await signup(name, email, password);
      router.replace(destination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create your account.");
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#04060a] text-white">
      <InterviewEnvironment intensity="low" />
      <div className="pointer-events-none fixed inset-0">
        <div className="login-grid absolute inset-0 opacity-35" />
        <div className="absolute left-1/2 top-[-260px] h-[650px] w-[900px] -translate-x-1/2 rounded-full bg-indigo-500/[0.06] blur-[140px]" />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-5 py-10">
        <div className="grid w-full max-w-6xl items-center gap-14 lg:grid-cols-[minmax(0,1fr)_420px]">
          <motion.section initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.55 }} className="hidden lg:block">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-indigo-400/15 bg-indigo-400/[0.04] px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-indigo-200/80">
              <Sparkles size={12} /> Secure candidate identity
            </div>
            <h1 className="max-w-xl text-5xl font-semibold leading-[1.02] tracking-[-0.045em]">Create your ARIA profile.</h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-slate-400">
              Save your interview identity securely and return to your technical assessment workspace whenever you need it.
            </p>

            <div className="login-3d-stage relative mt-8 h-[25rem] overflow-hidden rounded-[2rem] border border-white/10 bg-black/35 shadow-[0_30px_100px_rgba(0,0,0,.45)]">
              <div className="login-3d-space absolute inset-0" aria-hidden="true">
                <div className="login-chamber-backdrop" />
                <div className="login-chamber-glass login-chamber-glass-a" />
                <div className="login-chamber-glass login-chamber-glass-b" />
                <div className="login-light-beam login-light-beam-a" />
                <div className="login-light-beam login-light-beam-b" />
                <div className="login-3d-halo login-3d-halo-a" />
                <div className="login-3d-halo login-3d-halo-b" />
                <div className="login-orbit login-orbit-x" />
                <div className="login-orbit login-orbit-y" />
                <div className="login-orbit login-orbit-z" />
                <div className="login-core-shadow" />
                <div className="login-core-shell"><div className="login-core-glow" /><div className="login-core-grid" /><div className="login-core-dot" /></div>
                <span className="login-node login-node-1" /><span className="login-node login-node-2" /><span className="login-node login-node-3" /><span className="login-node login-node-4" />
                <div className="login-scanline" />
                <div className="login-telemetry"><span>IDENTITY CORE</span><span>ARIA / 01</span><span>READY</span></div>
              </div>
              <AriaCore compact className="absolute inset-0 h-full w-full opacity-90" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,transparent_0%,rgba(4,6,10,.06)_35%,rgba(4,6,10,.72)_100%)]" />
              <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between rounded-2xl border border-white/10 bg-black/45 px-5 py-3.5 backdrop-blur-xl">
                <div><p className="text-xs font-medium text-white">ARIA</p><p className="text-[10px] text-slate-500">Private technical assessment identity</p></div>
                <span className="flex items-center gap-2 text-[10px] text-emerald-300"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> Secure</span>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3 text-[10px] text-slate-500">
              <span className="flex items-center gap-1.5"><ShieldCheck size={13} /> Server-side auth</span>
              <span className="flex items-center gap-1.5"><LockKeyhole size={13} /> Hashed passwords</span>
              <span className="flex items-center gap-1.5"><Check size={13} /> Persistent account</span>
            </div>
          </motion.section>

          <motion.div initial={{ opacity: 0, y: 18, scale: 0.985 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5 }} className="premium-panel w-full rounded-3xl p-6 sm:p-8">
            <div className="mb-7 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]"><Brain size={22} className="text-indigo-300" /></div>
              <h2 className="text-2xl font-semibold tracking-tight">Create account</h2>
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">Join the ARIA interview lab</p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <label htmlFor="aria-name" className="mb-2 block text-sm font-medium text-slate-200">Full name</label>
                <div className={`relative rounded-xl border bg-white/[0.025] transition-colors ${submitted && name.trim().length < 2 ? "border-red-400/50" : "border-white/10 focus-within:border-indigo-400/50"}`}>
                  <UserRound className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                  <input id="aria-name" name="name" autoComplete="name" value={name} onChange={(e) => { setName(e.target.value); setError(""); }} placeholder="Your full name" className="w-full bg-transparent py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-600" />
                </div>
              </div>

              <div>
                <label htmlFor="aria-signup-email" className="mb-2 block text-sm font-medium text-slate-200">Email</label>
                <div className={`relative rounded-xl border bg-white/[0.025] transition-colors ${submitted && !emailValid ? "border-red-400/50" : "border-white/10 focus-within:border-indigo-400/50"}`}>
                  <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                  <input id="aria-signup-email" name="email" type="email" autoComplete="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }} placeholder="you@example.com" className="w-full bg-transparent py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-600" />
                </div>
              </div>

              <div>
                <label htmlFor="aria-signup-password" className="mb-2 block text-sm font-medium text-slate-200">Password</label>
                <div className={`relative rounded-xl border bg-white/[0.025] transition-colors ${submitted && !passwordStrong ? "border-red-400/50" : "border-white/10 focus-within:border-indigo-400/50"}`}>
                  <LockKeyhole className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                  <input id="aria-signup-password" name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }} placeholder="At least 8 characters" className="w-full bg-transparent py-3 pl-10 pr-11 text-sm text-white outline-none placeholder:text-slate-600" />
                  <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-2.5 rounded-lg p-1.5 text-slate-500 hover:text-white" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                </div>
              </div>

              <div>
                <label htmlFor="aria-confirm-password" className="mb-2 block text-sm font-medium text-slate-200">Confirm password</label>
                <div className={`relative rounded-xl border bg-white/[0.025] transition-colors ${submitted && !passwordsMatch ? "border-red-400/50" : "border-white/10 focus-within:border-indigo-400/50"}`}>
                  <LockKeyhole className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                  <input id="aria-confirm-password" name="confirmPassword" type={showConfirm ? "text" : "password"} autoComplete="new-password" value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }} placeholder="Repeat your password" className="w-full bg-transparent py-3 pl-10 pr-11 text-sm text-white outline-none placeholder:text-slate-600" />
                  <button type="button" onClick={() => setShowConfirm((v) => !v)} className="absolute right-3 top-2.5 rounded-lg p-1.5 text-slate-500 hover:text-white" aria-label={showConfirm ? "Hide password" : "Show password"}>{showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                </div>
              </div>

              {error && <div className="rounded-xl border border-red-400/20 bg-red-400/[0.05] px-3.5 py-3 text-xs leading-5 text-red-200" role="alert">{error}</div>}

              <Button type="submit" variant="brand" size="lg" disabled={!canSubmit || loading} className="h-11 w-full rounded-xl">
                {loading ? <Spinner /> : <ArrowRight size={16} />}
                {loading ? "Creating account..." : "Create account"}
              </Button>
            </form>

            <div className="my-6 flex items-center gap-3"><div className="h-px flex-1 bg-white/8" /><span className="text-[10px] uppercase tracking-[0.18em] text-slate-600">already registered?</span><div className="h-px flex-1 bg-white/8" /></div>
            <Link href="/login" className="block">
              <Button type="button" variant="glass" size="lg" className="h-11 w-full rounded-xl">Sign in to ARIA</Button>
            </Link>
            <p className="mt-5 text-center text-[10px] leading-5 text-slate-600">Your account is stored server-side. Passwords are protected with salted scrypt hashing.</p>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
