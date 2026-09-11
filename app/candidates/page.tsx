"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Brain, CheckCircle2, XCircle, AlertCircle, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Candidate } from "@/types";
import { AuthMenu } from "@/components/auth/AuthMenu";
import { AriaCore } from "@/components/3d/AriaCore";
import { InterviewEnvironment } from "@/components/3d/InterviewEnvironment";

function ConfidenceMeter({ value }: { value: number }) {
  const color = value >= 70 ? "text-emerald-400" : value >= 50 ? "text-yellow-400" : "text-orange-400";
  const label = value >= 70 ? "High" : value >= 50 ? "Medium" : "Low";
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">Confidence</span>
        <span className={color}>{label} · {value}%</span>
      </div>
      <Progress value={value} className="h-1.5" />
    </div>
  );
}

function CandidateCard({ candidate, index }: { candidate: Candidate; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.12, duration: 0.5, ease: "easeInOut" }}
    >
      <Link href={`/candidates/${candidate.id}`}>
        <div className="glass-card glow-border spatial-card rounded-2xl p-6 cursor-pointer group transition-all duration-300 hover:bg-white/[0.04]">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12">
                <AvatarFallback className="text-sm font-bold">{candidate.avatar}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-white text-base group-hover:text-indigo-300 transition-colors">{candidate.name}</h3>
                <p className="text-xs text-muted-foreground">{candidate.role}</p>
              </div>
            </div>
            <ArrowRight size={16} className="text-muted-foreground group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
          </div>

          {/* Progress */}
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Overall Progress</span>
              <span className="text-white font-medium">{candidate.overallProgress}%</span>
            </div>
            <Progress value={candidate.overallProgress} className="h-1.5" />
          </div>

          <ConfidenceMeter value={candidate.confidenceLevel} />

          {/* Day Stats */}
          <div className="grid grid-cols-2 gap-3 mt-6">
            <div className="rounded-lg bg-emerald-500/8 border border-emerald-500/15 p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <CheckCircle2 size={12} className="text-emerald-400" />
                <span className="text-xs text-emerald-400 font-medium">Completed</span>
              </div>
              <div className="text-2xl font-bold text-white">{candidate.completedDays.length}</div>
              <div className="text-xs text-muted-foreground">days</div>
            </div>
            <div className="rounded-lg bg-red-500/8 border border-red-500/15 p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <XCircle size={12} className="text-red-400" />
                <span className="text-xs text-red-400 font-medium">Skipped</span>
              </div>
              <div className="text-2xl font-bold text-white">{candidate.skippedDays.length}</div>
              <div className="text-xs text-muted-foreground">days</div>
            </div>
          </div>

          {/* Weak Topics */}
          {candidate.weakTopics.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center gap-1.5 mb-2">
                <AlertCircle size={11} className="text-orange-400" />
                <span className="text-xs text-muted-foreground">Weak areas</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {candidate.weakTopics.slice(0, 3).map((t) => (
                  <Badge key={t} variant="warning" className="text-xs">{t}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="mt-6 pt-4 border-t border-border/50">
            <span className="text-xs text-indigo-400 font-medium flex items-center gap-1.5">
              <TrendingUp size={12} />
              Start Interview →
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/candidates")
      .then((r) => r.json())
      .then((data) => { setCandidates(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#05070b] text-white interview-depth">
      <InterviewEnvironment intensity="low" />
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-indigo-600/5 rounded-full blur-[100px]" />
        <div className="grid-bg absolute inset-0 opacity-30" />
      </div>

      {/* Header */}
      <div className="relative z-10 border-b border-border/40 px-8 py-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <Brain size={15} className="text-white" />
            </div>
            <span className="font-semibold text-white text-sm">Aria</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-muted-foreground md:inline">Select a candidate to begin</span>
            <AuthMenu />
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 flex items-end justify-between gap-8"
        >
          <div>
            <div className="aria-kicker mb-4"><span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,.55)]" /> Candidate intelligence matrix</div>
            <h1 className="text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">ABTalks Cohort</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">Select a candidate profile to begin a calibrated technical interview with Aria.</p>
          </div>
          <div className="aria-stage premium-panel hidden h-32 w-60 overflow-hidden rounded-3xl md:block">
            <AriaCore compact className="h-full w-full" />
            <div className="pointer-events-none absolute bottom-3 left-4 font-mono text-[8px] tracking-[0.18em] text-slate-600">ARIA / CANDIDATE CALIBRATION</div>
          </div>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[0, 1, 2].map((i) => (
              <div key={i} className="glass-card rounded-2xl h-72 shimmer" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {candidates.map((c, i) => (
              <CandidateCard key={c.id} candidate={c} index={i} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
