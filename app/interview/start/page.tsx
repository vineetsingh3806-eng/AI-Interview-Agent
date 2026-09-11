"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Brain, CheckCircle2, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { Candidate } from "@/types";
import { AriaCore } from "@/components/3d/AriaCore";
import { AuthMenu } from "@/components/auth/AuthMenu";
import { getSelectedSkill, getSelectedLevel, type InterviewSkill, type InterviewLevel } from "@/lib/interview-preferences";
import { InterviewEnvironment } from "@/components/3d/InterviewEnvironment";

export default function StartInterviewPage() {
  const router=useRouter(); const [candidates,setCandidates]=useState<Candidate[]>([]); const [skill,setSkill]=useState<InterviewSkill | null>(null); const [level,setLevel]=useState<InterviewLevel | null>(null); const [candidateId,setCandidateId]=useState("candidate-001"); const [name,setName]=useState(""); const [loading,setLoading]=useState(false); const [error,setError]=useState("");
  useEffect(()=>{
    const selectedSkill = getSelectedSkill();
    const selectedLevel = getSelectedLevel();
    if (!selectedSkill || !selectedLevel) { router.replace(!selectedSkill ? "/skill-selection?next=/interview/start" : "/level-selection?next=/interview/start"); return; }
    setSkill(selectedSkill);
    setLevel(selectedLevel);
    fetch("/api/candidates").then(r=>r.json()).then(setCandidates).catch(()=>setError("Unable to load candidates."));
  },[router]);
  const selected=candidates.find(c=>c.id===candidateId);
  async function start(){ if(!selected)return; setLoading(true); setError(""); try{const r=await fetch("/api/interview/start",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({candidateId,candidateName:name.trim()||selected.name,targetSkill:skill?.id,interviewLevel:level})}); const d=await r.json(); if(!r.ok)throw new Error(d.error||"Unable to start"); try { sessionStorage.setItem(`aria-interview-session:${d.sessionId}`, JSON.stringify(d.session)); } catch {} router.push(`/interview/${d.sessionId}`);}catch(e){setError(e instanceof Error?e.message:"Unable to start interview");setLoading(false);} }
  return <main className="relative min-h-screen bg-[#05070b] text-white px-6 py-12 overflow-hidden interview-depth">
      <InterviewEnvironment intensity="low" /><div className="pointer-events-none fixed inset-0 lab-grid opacity-20" /><div className="pointer-events-none fixed left-1/2 top-[-180px] h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-indigo-500/[0.045] blur-[120px]" /><div className="relative max-w-6xl mx-auto"><div className="flex items-center justify-between gap-3 mb-12"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center"><Brain size={20}/></div><div><div className="font-semibold">Aria</div><div className="text-xs text-muted-foreground">Candidate calibration</div></div></div><AuthMenu /></div><motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="grid gap-10 lg:grid-cols-[1fr_360px] items-start">
<div className="max-w-3xl"><Badge className="mb-5">ABTalks AI Cohort · {skill?.label || "Skill interview"} · {level === "advanced" ? "High" : level === "intermediate" ? "Medium" : "Low"} Level</Badge><h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Who is Aria interviewing?</h1><p className="text-muted-foreground text-lg mb-10">You selected <span className="text-white font-medium">{skill?.label}</span>. Choose the candidate profile and tell Aria what she should call you. The interview will stay focused on this skill and selected level.</p><div className="grid md:grid-cols-3 gap-4 mb-8">{candidates.map(c=><button key={c.id} onClick={()=>setCandidateId(c.id)} className={`spatial-card text-left rounded-2xl border p-5 transition-all ${candidateId===c.id?"border-indigo-400/60 bg-indigo-500/10":"border-white/10 bg-white/[0.02] hover:bg-white/[0.04]"}`}><div className="flex justify-between"><div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center font-bold">{c.avatar}</div>{candidateId===c.id&&<CheckCircle2 className="text-indigo-400" size={18}/>}</div><h2 className="font-semibold mt-4">{c.name}</h2><p className="text-xs text-muted-foreground mt-1">{c.role}</p><Progress value={c.overallProgress} className="mt-4 h-1.5"/><div className="text-xs text-muted-foreground mt-2">{c.overallProgress}% cohort progress · {c.completedDays.length} days complete</div></button>)}</div><label className="block text-sm font-medium mb-2">What should I call you?</label><div className="flex gap-3 mb-3"><div className="flex-1 relative"><UserRound size={16} className="absolute left-3 top-3.5 text-muted-foreground"/><input value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")start()}} placeholder={selected?.name||"Your name"} className="w-full rounded-xl border border-white/10 bg-white/[0.03] pl-10 pr-4 py-3.5 outline-none focus:border-indigo-400/60 text-sm"/></div><Button variant="brand" size="lg" onClick={start} disabled={loading||!selected}>{loading?"Preparing Aria…":<>Start Interview <ArrowRight size={16}/></>}</Button></div>{selected&&<p className="text-xs text-muted-foreground">Aria will focus on {selected.weakTopics.slice(0,2).join(" and ")} while also testing {selected.strongTopics.slice(0,2).join(" and ")}.</p>}{error&&<p className="text-sm text-red-400 mt-4">{error}</p>}</div></motion.div><div className="aria-stage premium-panel hidden lg:block h-[390px] rounded-[32px] overflow-hidden"><AriaCore state="idle" className="h-full w-full" /></div></div></main>;
}
