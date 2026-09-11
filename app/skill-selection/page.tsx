"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Brain, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthMenu } from "@/components/auth/AuthMenu";
import { AriaCore } from "@/components/3d/AriaCore";
import { InterviewEnvironment } from "@/components/3d/InterviewEnvironment";
import { INTERVIEW_SKILLS, getSelectedSkill, setSelectedSkill, clearSelectedLevel } from "@/lib/interview-preferences";

function SkillSelectionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedNext = searchParams.get("next") || "/";
  const next = requestedNext.startsWith("/") && !requestedNext.startsWith("//") ? requestedNext : "/";
  const [selected, setSelected] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSelected(getSelectedSkill()?.id ?? "");
  }, []);

  function continueToApp() {
    if (!selected) return;
    setSaving(true);
    setSelectedSkill(selected);
    clearSelectedLevel();
    router.replace(`/level-selection?next=${encodeURIComponent(next)}`);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#04060a] text-white interview-depth">
      <InterviewEnvironment intensity="low" />
      <div className="pointer-events-none fixed inset-0">
        <div className="login-grid absolute inset-0 opacity-30" />
        <div className="absolute left-1/2 top-[-220px] h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-indigo-500/[0.055] blur-[140px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-5 py-7 sm:px-8">
        <header className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600">
              <Brain size={19} />
            </div>
            <div>
              <div className="font-semibold">Aria</div>
              <div className="text-xs text-slate-500">Interview calibration</div>
            </div>
          </div>
          <AuthMenu />
        </header>

        <div className="grid items-center gap-10 lg:grid-cols-[1fr_360px]">
          <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5 }}>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-400/15 bg-indigo-400/[0.04] px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-indigo-200/80">
              <Sparkles size={12} /> Personalize your assessment
            </div>
            <h1 className="max-w-2xl text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
              Which skill do you want to interview for?
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400">
              Choose one focus area. Aria will use it to steer the interview questions and evaluation toward that technical skill. You will choose the interview level next.
            </p>

            <div className="skill-grid-3d mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {INTERVIEW_SKILLS.map((skill) => {
                const active = selected === skill.id;
                return (
                  <button
                    key={skill.id}
                    type="button"
                    onClick={() => setSelected(skill.id)}
                    onPointerMove={(event) => {
                      const rect = event.currentTarget.getBoundingClientRect();
                      const px = (event.clientX - rect.left) / rect.width;
                      const py = (event.clientY - rect.top) / rect.height;
                      event.currentTarget.style.setProperty("--rx", `${(0.5 - py) * 5}deg`);
                      event.currentTarget.style.setProperty("--ry", `${(px - 0.5) * 6}deg`);
                      event.currentTarget.style.setProperty("--mx", `${px * 100}%`);
                      event.currentTarget.style.setProperty("--my", `${py * 100}%`);
                    }}
                    onPointerLeave={(event) => {
                      event.currentTarget.style.setProperty("--rx", "0deg");
                      event.currentTarget.style.setProperty("--ry", "0deg");
                      event.currentTarget.style.setProperty("--mx", "50%");
                      event.currentTarget.style.setProperty("--my", "50%");
                    }}
                    aria-pressed={active}
                    className={`skill-card-3d spatial-card group rounded-2xl border p-5 text-left transition-all duration-200 ${
                      active
                        ? "border-indigo-400/60 bg-indigo-500/[0.10] shadow-[0_0_30px_rgba(99,102,241,0.08)]"
                        : "border-white/10 bg-white/[0.025] hover:border-white/20 hover:bg-white/[0.045]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="relative z-10">
                        <span className="skill-card-sheen" aria-hidden="true" />
                        {skill.category && <div className="mb-1 text-[9px] uppercase tracking-[0.16em] text-indigo-300/60">{skill.category}</div>}
                        <h2 className="font-medium text-white">{skill.label}</h2>
                        <p className="mt-1.5 text-xs leading-5 text-slate-500">{skill.description}</p>
                      </div>
                      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${active ? "border-indigo-300/60 bg-indigo-400 text-white" : "border-white/10 text-transparent"}`}>
                        <Check size={13} />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-7 flex items-center justify-between gap-4 rounded-2xl border border-white/8 bg-white/[0.02] p-4">
              <div>
                <p className="text-sm font-medium text-white">Choose your interview domain</p>
                <p className="mt-1 text-xs text-slate-500">Next, choose whether you want a Low, Medium or High level interview.</p>
              </div>
              <Button variant="brand" size="lg" onClick={continueToApp} disabled={!selected || saving}>
                {saving ? "Preparing…" : <>Continue <ArrowRight size={16} /></>}
              </Button>
            </div>
          </motion.section>

          <motion.div initial={{ opacity: 0, x: 18, scale: .97 }} animate={{ opacity: 1, x: 0, scale: 1 }} transition={{ duration: .6, delay: .08 }} className="skill-aria-stage premium-panel relative hidden h-[500px] overflow-hidden rounded-[32px] lg:block">
            <div className="skill-stage-grid absolute inset-0" aria-hidden="true" />
            <div className="skill-stage-glow absolute inset-0" aria-hidden="true" />
            <div className="skill-stage-ring skill-stage-ring-a" aria-hidden="true" />
            <div className="skill-stage-ring skill-stage-ring-b" aria-hidden="true" />
            <div className="skill-stage-floor absolute left-1/2 top-[58%] h-[190px] w-[470px] -translate-x-1/2" aria-hidden="true" />
            <div className="relative z-10 h-full w-full">
              <AriaCore state={selected ? "thinking" : "idle"} className="h-full w-full" />
            </div>
            <div className="pointer-events-none absolute left-6 top-5 z-20">
              <div className="text-[9px] font-medium uppercase tracking-[0.2em] text-slate-500">ARIA / INTERVIEW CALIBRATION</div>
              <div className="mt-2 flex items-center gap-2 text-xs text-slate-400"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,.55)]" /> Intelligence core online</div>
            </div>
            <div className="pointer-events-none absolute bottom-5 left-6 right-6 z-20 flex items-end justify-between border-t border-white/[0.07] pt-4">
              <div>
                <div className="text-[9px] uppercase tracking-[0.18em] text-slate-600">Selected domain</div>
                <div className="mt-1 text-sm font-medium text-white">{selected ? (INTERVIEW_SKILLS.find((skill) => skill.id === selected)?.label ?? "Calibrating") : "Awaiting selection"}</div>
              </div>
              <div className="font-mono text-[8px] tracking-[0.18em] text-indigo-200/40">DOMAIN MATRIX · 01</div>
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  );
}

export default function SkillSelectionPage() {
  return (
    <Suspense fallback={null}>
      <SkillSelectionContent />
    </Suspense>
  );
}
