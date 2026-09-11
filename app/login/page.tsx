"use client";

import { FormEvent, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight, Brain, Eye, EyeOff, LockKeyhole, Mail,
  ShieldCheck, Sparkles
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AriaCore } from "@/components/3d/AriaCore";
import { InterviewEnvironment } from "@/components/3d/InterviewEnvironment";
import { demoLogin, getAuthSession, login } from "@/lib/auth";

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function Spinner() {
  return <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden="true" />;
}

export default function LoginPage() {
  const router = useRouter();
  const [destination] = useState(() => {
    if (typeof window === "undefined") return "/skill-selection";
    const next = new URLSearchParams(window.location.search).get("next");
    return next && next.startsWith("/") ? next : "/skill-selection";
  });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "demo">("login");
  const [error, setError] = useState("");

  const emailError =
    submitted && !email.trim()
      ? "Email is required."
      : submitted && !isEmail(email)
        ? "Enter a valid email address."
        : "";

  const passwordError =
    submitted && !password ? "Password is required." : "";

  const canSubmit = isEmail(email) && password.length >= 8;

  useEffect(() => {
    getAuthSession().then((session) => {
      if (session) router.replace(destination);
    });
  }, [destination, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    setError("");
    if (!canSubmit) return;

    setLoading(true);
    setMode("login");
    try {
      await new Promise((resolve) => setTimeout(resolve, 550));
      await login(email, password);
      router.replace(destination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid email or password.");
      setLoading(false);
    }
  }

  async function handleDemo() {
    setSubmitted(false);
    setError("");
    setLoading(true);
    setMode("demo");
    try {
      await new Promise((resolve) => setTimeout(resolve, 450));
      await demoLogin();
      router.replace(destination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start demo session. Please try again.");
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
          <motion.section
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55 }}
            className="hidden lg:block"
          >
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-indigo-400/15 bg-indigo-400/[0.04] px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-indigo-200/80">
              <Sparkles size={12} />
              AI recruiting intelligence
            </div>
            <h1 className="max-w-xl text-5xl font-semibold leading-[1.02] tracking-[-0.045em]">
              Enter the interview lab.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-slate-400">
              Aria turns technical interviews into an adaptive, evidence-based assessment experience.
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
                <div className="login-core-shell">
                  <div className="login-core-glow" />
                  <div className="login-core-grid" />
                  <div className="login-core-dot" />
                </div>
                <span className="login-node login-node-1" />
                <span className="login-node login-node-2" />
                <span className="login-node login-node-3" />
                <span className="login-node login-node-4" />
                <div className="login-scanline" />
                <div className="login-telemetry">
                  <span>NEURAL CORE</span><span>ARIA / 01</span><span>ONLINE</span>
                </div>
              </div>
              <AriaCore compact className="absolute inset-0 h-full w-full opacity-90" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,transparent_0%,rgba(4,6,10,.06)_35%,rgba(4,6,10,.72)_100%)]" />
              <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between rounded-2xl border border-white/10 bg-black/45 px-5 py-3.5 backdrop-blur-xl">
                <div>
                  <p className="text-xs font-medium text-white">ARIA</p>
                  <p className="text-[10px] text-slate-500">Adaptive technical interviewer</p>
                </div>
                <span className="flex items-center gap-2 text-[10px] text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                  System ready
                </span>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-5 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><ShieldCheck size={13} /> Private demo session</span>
              <span>Gemini 2.5 Flash</span>
            </div>
          </motion.section>

          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="premium-panel w-full rounded-3xl p-6 sm:p-8"
          >
            <div className="mb-7 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
                <Brain size={22} className="text-indigo-300" />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight">ARIA</h2>
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">AI Technical Interviewer</p>
              <p className="mx-auto mt-4 max-w-xs text-sm leading-6 text-slate-400">
                Your intelligent technical interview companion.
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <div>
                <label htmlFor="aria-email" className="mb-2 block text-sm font-medium text-slate-200">Email</label>
                <div className={`relative rounded-xl border bg-white/[0.025] transition-colors ${emailError ? "border-red-400/50" : "border-white/10 focus-within:border-indigo-400/50"}`}>
                  <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" aria-hidden="true" />
                  <input
                    id="aria-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    placeholder="you@example.com"
                    className="w-full bg-transparent py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-600"
                    aria-invalid={!!emailError}
                    aria-describedby={emailError ? "aria-email-error" : undefined}
                  />
                </div>
                {emailError && <p id="aria-email-error" className="mt-1.5 text-xs text-red-300" role="alert">{emailError}</p>}
              </div>

              <div>
                <label htmlFor="aria-password" className="mb-2 block text-sm font-medium text-slate-200">Password</label>
                <div className={`relative rounded-xl border bg-white/[0.025] transition-colors ${passwordError ? "border-red-400/50" : "border-white/10 focus-within:border-indigo-400/50"}`}>
                  <LockKeyhole className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" aria-hidden="true" />
                  <input
                    id="aria-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                    placeholder="Enter your password"
                    className="w-full bg-transparent py-3 pl-10 pr-11 text-sm text-white outline-none placeholder:text-slate-600"
                    aria-invalid={!!passwordError}
                    aria-describedby={passwordError ? "aria-password-error" : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-2 top-1.5 rounded-lg p-2 text-slate-500 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {passwordError && <p id="aria-password-error" className="mt-1.5 text-xs text-red-300" role="alert">{passwordError}</p>}
              </div>

              {error && (
                <div className="rounded-xl border border-red-400/20 bg-red-400/[0.05] px-3.5 py-3 text-xs leading-5 text-red-200" role="alert" aria-live="polite">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                variant="brand"
                size="lg"
                disabled={!canSubmit || loading}
                className="h-11 w-full rounded-xl"
                aria-label="Sign in to Aria"
              >
                {loading && mode === "login" ? <Spinner /> : <ArrowRight size={16} />}
                {loading && mode === "login" ? "Signing in..." : "Sign in"}
              </Button>
            </form>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-white/8" />
              <span className="text-[10px] uppercase tracking-[0.18em] text-slate-600">or</span>
              <div className="h-px flex-1 bg-white/8" />
            </div>

            <Button
              type="button"
              variant="glass"
              size="lg"
              onClick={handleDemo}
              disabled={loading}
              className="h-11 w-full rounded-xl"
              aria-label="Continue as demo"
            >
              {loading && mode === "demo" ? <Spinner /> : <Sparkles size={15} />}
              {loading && mode === "demo" ? "Opening demo..." : "Continue as Demo · 3-question preview"}
            </Button>

            <div className="mt-5 text-center text-xs text-slate-500">
              New to ARIA? <Link href="/signup" className="font-medium text-indigo-300 transition-colors hover:text-indigo-200">Create an account</Link>
            </div>
            <p className="mt-4 text-center text-[10px] leading-5 text-slate-600">
              Accounts are securely stored on the ARIA server. Passwords are hashed and never stored in plain text.
            </p>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
