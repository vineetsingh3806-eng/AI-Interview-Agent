"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Brain, BarChart3, MessageSquare, Shield, Sparkles, Target, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AriaCore } from "@/components/3d/AriaCore";
import { InterviewEnvironment } from "@/components/3d/InterviewEnvironment";
import { AuthMenu } from "@/components/auth/AuthMenu";

const features = [
  ["Adaptive Intelligence", "Questions adjust to evidence from your answers, not a fixed script.", Brain],
  ["Natural Conversation", "Follow-ups, memory and challenge depth make the session feel interviewer-led.", MessageSquare],
  ["Curriculum Aware", "The agent uses completed days, weak areas and confidence as the technical baseline.", Target],
  ["Evidence-Based Scoring", "Every answer contributes to a structured technical assessment.", BarChart3],
  ["Gemini AI Runtime", "The Gemini API powers the interview experience in local and cloud deployments.", Zap],
  ["Hiring Report", "A professional assessment with strengths, gaps, curriculum and hiring recommendation.", Shield],
] as const;

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#05070b] text-white interview-depth">
      <InterviewEnvironment intensity="high" />
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 lab-grid opacity-30" />
        <div className="absolute left-1/2 top-[-240px] h-[680px] w-[920px] -translate-x-1/2 rounded-full bg-indigo-500/[0.055] blur-[130px]" />
        <div className="absolute bottom-[-240px] left-1/2 h-[520px] w-[800px] -translate-x-1/2 rounded-full bg-cyan-500/[0.035] blur-[120px]" />
      </div>

      <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.045] shadow-[0_10px_40px_rgba(0,0,0,.35)]">
            <Brain size={17} className="text-indigo-300" />
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight">ARIA</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">AI Technical Interviewer</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden rounded-full border border-emerald-400/15 bg-emerald-400/[0.06] px-3 py-1.5 text-[10px] font-medium text-emerald-300 sm:inline-flex">
            ABTalks · Interview Lab
          </span>
          <div className="flex items-center gap-2">
            <AuthMenu />
            <Link href="/interview/start">
              <Button variant="glass" size="sm" className="gap-2 border-white/10">
                Enter Interview Lab <ArrowRight size={14} />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative z-10 mx-auto grid max-w-7xl items-center gap-4 px-6 pb-20 pt-10 lg:grid-cols-[0.9fr_1.1fr] lg:px-10 lg:pb-28 lg:pt-16">
        <div className="max-w-2xl">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mb-7 inline-flex items-center gap-2 rounded-full border border-indigo-400/15 bg-indigo-400/[0.05] px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-indigo-200/80">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,.45)]" />
            Technical assessment system · online
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .08 }} className="text-balance text-5xl font-semibold leading-[1.02] tracking-[-0.045em] text-white sm:text-6xl lg:text-7xl">
            Meet your next
            <span className="block text-slate-400">technical interviewer.</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .16 }} className="mt-7 max-w-xl text-base leading-7 text-slate-400 sm:text-lg">
            ARIA turns the existing interview engine into an immersive technical assessment room — adaptive questioning, evidence-based evaluation and a hiring-grade report.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .24 }} className="mt-9 flex flex-wrap items-center gap-3">
            <Link href="/interview/start">
              <Button variant="brand" size="xl" className="group gap-2 rounded-xl px-6 shadow-[0_14px_50px_rgba(99,102,241,.18)]">
                Start Interview
                <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <span className="text-xs text-slate-500">Powered by Gemini AI</span>
          </motion.div>

          <div className="mt-12 grid max-w-xl grid-cols-3 gap-3">
            {[
              ["ADAPTIVE", "Questioning"],
              ["REAL-TIME", "Evaluation"],
              ["HIRING", "Assessment"],
            ].map(([eyebrow, label]) => (
              <div key={label} className="premium-panel rounded-2xl px-4 py-4">
                <div className="font-mono text-[9px] tracking-[0.2em] text-slate-600">{eyebrow}</div>
                <div className="mt-1 text-xs font-medium text-slate-200">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <motion.div initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: .12, duration: .8 }} className="relative min-h-[520px]">
          <div className="absolute inset-10 rounded-full border border-white/[0.045] [transform:rotateX(68deg)]" />
          <div className="absolute inset-20 rounded-full border border-cyan-300/[0.055] [transform:rotateX(68deg)]" />
          <div className="premium-panel absolute inset-6 overflow-hidden rounded-[32px] border-white/[0.08]">
            <div className="absolute left-6 right-6 top-5 flex items-center justify-between">
              <span className="font-mono text-[9px] tracking-[0.2em] text-slate-600">ARIA CORE / 01</span>
              <span className="flex items-center gap-2 text-[9px] text-emerald-300/70"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> ONLINE</span>
            </div>
            <AriaCore state="idle" className="h-full w-full" />
            <div className="absolute bottom-5 left-6 right-6 flex items-end justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-slate-600">AI interviewer</div>
                <div className="mt-1 text-sm font-medium text-slate-200">Adaptive technical reasoning</div>
              </div>
              <div className="text-right font-mono text-[9px] leading-5 text-slate-600">CLOUD RUNTIME<br />GEMINI AI</div>
            </div>
          </div>
        </motion.div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-24 lg:px-10">
        <div className="mb-9 flex items-end justify-between gap-6">
          <div>
            <div className="font-mono text-[9px] tracking-[0.22em] text-indigo-300/60">SYSTEM CAPABILITIES</div>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">Built around the interview, not the dashboard.</h2>
          </div>
          <p className="hidden max-w-sm text-right text-xs leading-5 text-slate-500 md:block">3D is reserved for presence, context and depth. The working surface stays calm, readable and fast.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {features.map(([title, desc, Icon], i) => (
            <motion.div key={title} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ delay: i * .04 }} className="premium-panel group rounded-2xl p-5 transition-transform duration-300 hover:-translate-y-1">
              <div className="mb-5 flex h-9 w-9 items-center justify-center rounded-xl border border-white/8 bg-white/[0.035]">
                <Icon size={16} className="text-indigo-300" />
              </div>
              <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
              <p className="mt-2 text-xs leading-5 text-slate-500">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/6 px-6 py-7 text-center text-[10px] uppercase tracking-[0.2em] text-slate-600">
        ARIA · AI Interview Agent · ABTalks
      </footer>
    </main>
  );
}
