"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Brain, Check, Gauge, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthMenu } from "@/components/auth/AuthMenu";
import { AriaCore } from "@/components/3d/AriaCore";
import { InterviewEnvironment } from "@/components/3d/InterviewEnvironment";
import { getSelectedSkill, getSelectedLevel, INTERVIEW_LEVELS, setSelectedLevel, type InterviewLevel } from "@/lib/interview-preferences";

function LevelSelectionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedNext = searchParams.get("next") || "/";
  const next = requestedNext.startsWith("/") && !requestedNext.startsWith("//") ? requestedNext : "/";
  const [selected, setSelected] = useState<InterviewLevel | "">("");
  const [skillLabel, setSkillLabel] = useState("your selected skill");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const skill = getSelectedSkill();
    if (!skill) { router.replace(`/skill-selection?next=${encodeURIComponent(next)}`); return; }
    setSkillLabel(skill.label);
    setSelected(getSelectedLevel() || "");
  }, [router, next]);

  function continueToApp() {
    if (!selected) return;
    setSaving(true);
    setSelectedLevel(selected);
    router.replace(next);
  }

  return (
    <main className="relative min-h-screen interview-depth overflow-hidden bg-[#04060a] text-white">
      <InterviewEnvironment intensity="low" />
      <div className="pointer-events-none fixed inset-0"><div className="login-grid absolute inset-0 opacity-30" /><div className="absolute left-1/2 top-[-220px] h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-indigo-500/[0.055] blur-[140px]" /></div>
      <div className="relative z-10 mx-auto max-w-6xl px-5 py-7 sm:px-8">
        <header className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600"><Brain size={19} /></div><div><div className="font-semibold">Aria</div><div className="text-xs text-slate-500">Interview calibration</div></div></div><AuthMenu />
        </header>
        <div className="mb-6 flex items-center gap-2 text-xs text-slate-500"><button type="button" onClick={() => router.back()} className="inline-flex items-center gap-1 hover:text-white"><ArrowLeft size={13}/> Change domain</button><span>/</span><span className="text-indigo-200">{skillLabel}</span></div>
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_360px]">
          <motion.section initial={{opacity:0,y:18}} animate={{opacity:1,y:0}} transition={{duration:.5}}>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-400/15 bg-indigo-400/[0.04] px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-indigo-200/80"><Gauge size={12}/> Interview difficulty</div>
            <h1 className="max-w-2xl text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">What level interview do you want?</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400">You selected <span className="text-white">{skillLabel}</span>. Choose the level Aria should use for the questions, depth and evaluation.</p>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {INTERVIEW_LEVELS.map(level => { const active=selected===level.id; return <button key={level.id} type="button" onClick={()=>setSelected(level.id)} aria-pressed={active} className={`spatial-card group rounded-2xl border p-6 text-left transition-all duration-200 ${active ? "border-indigo-400/60 bg-indigo-500/[0.10] shadow-[0_0_35px_rgba(99,102,241,0.10)]" : "border-white/10 bg-white/[0.025] hover:border-white/20 hover:bg-white/[0.045]"}`}><div className="flex items-start justify-between gap-4"><div><div className="mb-2 text-[9px] uppercase tracking-[0.16em] text-indigo-300/60">{level.difficulty}</div><h2 className="text-lg font-medium text-white">{level.label}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{level.description}</p></div><span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${active ? "border-indigo-300/60 bg-indigo-400 text-white" : "border-white/10 text-transparent"}`}><Check size={14}/></span></div></button> })}
            </div>
            <div className="mt-7 flex items-center justify-between gap-4 rounded-2xl border border-white/8 bg-white/[0.02] p-4"><div><p className="text-sm font-medium text-white">Ready for calibration?</p><p className="mt-1 text-xs text-slate-500">Aria will vary questions across the selected domain instead of repeating the same fixed sequence.</p></div><Button variant="brand" size="lg" onClick={continueToApp} disabled={!selected || saving}>{saving ? "Preparing…" : <>Continue <ArrowRight size={16}/></>}</Button></div>
          </motion.section>
          <motion.div initial={{opacity:0,scale:.97}} animate={{opacity:1,scale:1}} transition={{duration:.55,delay:.05}} className="premium-panel hidden h-[400px] overflow-hidden rounded-[30px] lg:block"><AriaCore state={selected ? "thinking" : "idle"} className="h-full w-full" /></motion.div>
        </div>
      </div>
    </main>
  );
}


export default function LevelSelectionPage() {
  return (
    <Suspense fallback={null}>
      <LevelSelectionContent />
    </Suspense>
  );
}
