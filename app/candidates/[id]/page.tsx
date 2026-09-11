"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft, ArrowRight, Brain, CheckCircle2, XCircle,
  AlertCircle, Star, TrendingUp, Calendar, Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Candidate } from "@/types";
import { AriaCore } from "@/components/3d/AriaCore";
import { AuthMenu } from "@/components/auth/AuthMenu";
import { InterviewEnvironment } from "@/components/3d/InterviewEnvironment";

function ScoreCircle({ value, label }: { value: number; label: string }) {
  const r = 44;
  const circ = 2 * Math.PI * r;
  const progress = (value / 100) * circ;
  const color = value >= 70 ? "#34d399" : value >= 50 ? "#facc15" : "#fb923c";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-28 h-28">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
          <motion.circle
            cx="50" cy="50" r={r}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: circ - progress }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-white">{value}</span>
        </div>
      </div>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

function DayTimeline({ completedDays, skippedDays }: { completedDays: number[]; skippedDays: number[] }) {
  const allDays = Array.from({ length: 14 }, (_, i) => i + 1);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-emerald-500/30 border border-emerald-500/50" /> Completed</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-red-500/20 border border-red-500/30" /> Skipped</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-white/5 border border-white/10" /> Not Started</div>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {allDays.map((d) => {
          const completed = completedDays.includes(d);
          const skipped = skippedDays.includes(d);
          return (
            <motion.div
              key={d}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: d * 0.04 }}
              className={`
                aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-all
                ${completed ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300" : ""}
                ${skipped ? "bg-red-500/10 border border-red-500/25 text-red-400" : ""}
                ${!completed && !skipped ? "bg-white/[0.03] border border-white/8 text-muted-foreground" : ""}
              `}
            >
              {d}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export default function CandidateProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/candidates/${params.id}`)
      .then((r) => r.json())
      .then((data) => { setCandidate(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [params.id]);

  const startInterview = async () => {
    if (!candidate) return;
    setStarting(true);
    setError("");
    try {
      const res = await fetch("/api/interview/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId: candidate.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start interview");
      router.push(`/interview/${data.sessionId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start interview");
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#080810] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (!candidate) {
    return (
      <main className="min-h-screen bg-[#080810] flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Candidate not found</p>
          <Link href="/candidates"><Button variant="glass">Back to Candidates</Button></Link>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen bg-[#05070b] text-white overflow-hidden interview-depth">
      <InterviewEnvironment intensity="low" />
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-indigo-600/5 rounded-full blur-[100px]" />
        <div className="lab-grid absolute inset-0 opacity-25" />
      </div>

      {/* Header */}
      <div className="relative z-10 border-b border-border/40 px-8 py-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/candidates">
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-white">
                <ArrowLeft size={14} />
                Candidates
              </Button>
            </Link>
            <div className="w-px h-4 bg-border" />
            <span className="text-sm text-muted-foreground">Candidate Profile</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                <Brain size={15} className="text-white" />
              </div>
              <span className="font-semibold text-white text-sm">Aria</span>
            </div>
            <AuthMenu />
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-8 py-12">
        <div className="mb-8 flex justify-end">
          <div className="aria-stage premium-panel h-32 w-64 overflow-hidden rounded-3xl opacity-95">
            <AriaCore compact className="h-full w-full" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left — Profile */}
          <div className="lg:col-span-1 space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="p-6">
                <div className="flex flex-col items-center text-center gap-4">
                  <Avatar className="w-20 h-20">
                    <AvatarFallback className="text-xl font-bold">{candidate.avatar}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h1 className="text-xl font-bold text-white">{candidate.name}</h1>
                    <p className="text-sm text-muted-foreground">{candidate.role}</p>
                    <p className="text-xs text-indigo-400 mt-1">{candidate.cohort}</p>
                  </div>
                </div>

                <div className="mt-6 flex justify-around">
                  <ScoreCircle value={candidate.overallProgress} label="Progress" />
                  <ScoreCircle value={candidate.confidenceLevel} label="Confidence" />
                </div>
              </Card>
            </motion.div>

            {/* Bio */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="p-6">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <Target size={14} className="text-indigo-400" />
                  Background
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{candidate.bio}</p>
              </Card>
            </motion.div>

            {/* Start Button */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              {error && (
                <div className="mb-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}
              <Button
                variant="brand"
                size="xl"
                className="w-full group"
                onClick={startInterview}
                disabled={starting}
              >
                {starting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Starting Interview...
                  </>
                ) : (
                  <>
                    <Brain size={18} />
                    Start Interview with Aria
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-2">
                Requires Ollama running locally
              </p>
            </motion.div>
          </div>

          {/* Right — Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Day Timeline */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <Card className="p-6">
                <CardHeader className="p-0 mb-6">
                  <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                    <Calendar size={14} className="text-indigo-400" />
                    Curriculum Progress — 14 Day Journey
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <DayTimeline completedDays={candidate.completedDays} skippedDays={candidate.skippedDays} />
                  <div className="grid grid-cols-3 gap-4 mt-6">
                    <div className="rounded-xl bg-emerald-500/8 border border-emerald-500/15 p-4 text-center">
                      <CheckCircle2 size={18} className="text-emerald-400 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-white">{candidate.completedDays.length}</div>
                      <div className="text-xs text-muted-foreground">Completed</div>
                    </div>
                    <div className="rounded-xl bg-red-500/8 border border-red-500/15 p-4 text-center">
                      <XCircle size={18} className="text-red-400 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-white">{candidate.skippedDays.length}</div>
                      <div className="text-xs text-muted-foreground">Skipped</div>
                    </div>
                    <div className="rounded-xl bg-white/[0.04] border border-white/8 p-4 text-center">
                      <TrendingUp size={18} className="text-blue-400 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-white">{14 - candidate.completedDays.length - candidate.skippedDays.length}</div>
                      <div className="text-xs text-muted-foreground">Remaining</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Strong & Weak Topics */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <Star size={14} className="text-emerald-400" />
                  Strong Topics
                </h3>
                <div className="space-y-2">
                  {candidate.strongTopics.map((t) => (
                    <div key={t} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span className="text-sm text-muted-foreground">{t}</span>
                    </div>
                  ))}
                </div>
              </Card>
              <Card className="p-6">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <AlertCircle size={14} className="text-orange-400" />
                  Weak Topics
                </h3>
                <div className="space-y-2">
                  {candidate.weakTopics.length > 0 ? candidate.weakTopics.map((t) => (
                    <div key={t} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                      <span className="text-sm text-muted-foreground">{t}</span>
                    </div>
                  )) : (
                    <p className="text-sm text-muted-foreground">No significant weak areas identified.</p>
                  )}
                </div>
              </Card>
            </motion.div>

            {/* Interview Preview */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <Card className="p-6 border-indigo-500/15 bg-indigo-500/5">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <Brain size={14} className="text-indigo-400" />
                  What Aria Will Focus On
                </h3>
                <div className="space-y-2">
                  {candidate.weakTopics.slice(0, 2).map((t) => (
                    <div key={t} className="flex items-center gap-3 text-sm">
                      <div className="w-1 h-1 rounded-full bg-indigo-400/60" />
                      <span className="text-muted-foreground">Probe depth on <span className="text-indigo-300">{t}</span></span>
                    </div>
                  ))}
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-1 h-1 rounded-full bg-indigo-400/60" />
                    <span className="text-muted-foreground">Cover days: <span className="text-indigo-300">{candidate.completedDays.slice(0, 4).join(", ")}</span></span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-1 h-1 rounded-full bg-indigo-400/60" />
                    <span className="text-muted-foreground">Start difficulty: <span className="text-indigo-300">{candidate.confidenceLevel >= 70 ? "Intermediate" : "Beginner"}</span></span>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </main>
  );
}
