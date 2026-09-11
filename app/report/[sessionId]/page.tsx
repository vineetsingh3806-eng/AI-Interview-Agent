"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Brain, Download, ArrowLeft, CheckCircle2, AlertTriangle,
  Award, BookOpen, Layers, Sparkles, RefreshCw, BarChart2,
  FileText, ShieldCheck, Target, ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { FinalReport, HiringRecommendation } from "@/types";
import { KnowledgeGraph } from "@/components/3d/KnowledgeGraph";
import { AuthMenu } from "@/components/auth/AuthMenu";
import { AriaCore } from "@/components/3d/AriaCore";
import { InterviewEnvironment } from "@/components/3d/InterviewEnvironment";


function AnimatedScore({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const duration = 900;
    const from = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (value - from) * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    const frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return <>{display}</>;
}

export default function ReportPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [report, setReport] = useState<FinalReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchReport() {
      try {
        const res = await fetch(`/api/report/${sessionId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Report not found");
        setReport(data);
      } catch (err) {
        try {
          const genRes = await fetch(`/api/interview/finish`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId }) });
          const genData = await genRes.json();
          if (!genRes.ok) throw new Error(genData.error || "Failed to generate report");
          setReport(genData.report);
        } catch (e) { setError(e instanceof Error ? e.message : "Failed to load report"); }
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
  }, [sessionId]);

  const handleExportPDF = async () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const getHiringBadge = (rec?: HiringRecommendation | string) => {
    switch (rec) {
      case "strong-hire":
        return (
          <Badge className="bg-emerald-500/20 border-emerald-500/50 text-emerald-300 text-sm px-3 py-1 gap-1.5">
            <ShieldCheck size={15} />
            Strong Hire
          </Badge>
        );
      case "hire":
        return (
          <Badge className="bg-blue-500/20 border-blue-500/50 text-blue-300 text-sm px-3 py-1 gap-1.5">
            <CheckCircle2 size={15} />
            Hire
          </Badge>
        );
      case "borderline":
        return (
          <Badge className="bg-yellow-500/20 border-yellow-500/50 text-yellow-300 text-sm px-3 py-1 gap-1.5">
            <AlertTriangle size={15} />
            Needs Work / Borderline
          </Badge>
        );
      default:
        return (
          <Badge className="bg-red-500/20 border-red-500/50 text-red-300 text-sm px-3 py-1 gap-1.5">
            <AlertTriangle size={15} />
            Do Not Hire
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#080810] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground text-sm font-medium animate-pulse">
          Aria is generating candidate feedback report...
        </p>
      </main>
    );
  }

  if (error || !report) {
    return (
      <main className="min-h-screen bg-[#080810] flex items-center justify-center p-6">
        <div className="glass-card rounded-2xl p-8 max-w-md text-center space-y-4">
          <AlertTriangle size={32} className="text-yellow-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">Report Generation</h2>
          <p className="text-sm text-muted-foreground">{error || "Could not retrieve report for this session."}</p>
          <Link href="/candidates">
            <Button variant="brand">Return to Candidates</Button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen bg-[#05070b] pb-20 text-white interview-depth">
      <InterviewEnvironment intensity="low" />
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-600/5 rounded-full blur-[120px]" />
        <div className="lab-grid absolute inset-0 opacity-20" />
      </div>

      {/* Top Navbar */}
      <header className="relative z-10 border-b border-border/40 px-8 py-4 bg-black/40 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/candidates">
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-white">
                <ArrowLeft size={14} />
                Candidates
              </Button>
            </Link>
            <div className="w-px h-4 bg-border" />
            <span className="text-sm text-muted-foreground">Technical Evaluation Report</span>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="glass" size="sm" onClick={handleExportPDF} className="gap-2 text-xs">
              <Download size={14} />
              Export PDF
            </Button>
            <Link href="/candidates">
              <Button variant="brand" size="sm" className="gap-2 text-xs">
                New Interview
              </Button>
            </Link>
            <AuthMenu />
          </div>
        </div>
      </header>

      {/* Report Content Container */}
      <div ref={reportRef} className="relative z-10 max-w-6xl mx-auto px-8 pt-10 space-y-8">
        {/* Hero Score Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="report-hero premium-panel glow-border rounded-3xl p-8 border-indigo-500/15"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="aria-stage premium-panel hidden h-36 w-52 shrink-0 overflow-hidden rounded-3xl md:block">
              <AriaCore compact state="complete" className="h-full w-full" />
            </div>
            <div className="space-y-3 text-center md:text-left">
              <div className="flex items-center gap-3 justify-center md:justify-start">
                {getHiringBadge(report.hiringRecommendation)}
                <span className="text-xs text-muted-foreground">Session ID: {report.sessionId.slice(0, 8)}</span>
              </div>
              <h1 className="text-3xl font-bold text-white tracking-tight">
                Technical Evaluation Summary
              </h1>
              <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
                {report.executiveSummary}
              </p>
            </div>

            {/* Score Radial/Gauge */}
            <div className="flex flex-col items-center p-6 rounded-2xl bg-white/[0.03] border border-white/8 shrink-0">
              <div className="text-5xl font-extrabold text-white mb-1">
                <AnimatedScore value={report.overallScore} /><span className="text-lg text-indigo-400 font-normal">/100</span>
              </div>
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                Overall Interview Score
              </span>
            </div>
          </div>
        </motion.div>

        {/* Evaluation Dimensions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {report.dimensions?.map((dim, i) => (
            <motion.div
              key={dim.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="glass-card rounded-2xl p-5 space-y-3"
            >
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground font-medium">{dim.name}</span>
                <span className="text-white font-bold">{dim.score}%</span>
              </div>
              <Progress value={dim.score} className="h-1.5" />
              <p className="text-xs text-muted-foreground/80 leading-snug">{dim.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Tabs for Detailed Breakdown */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-black/40 border border-white/10 p-1 rounded-xl">
            <TabsTrigger value="overview" className="text-xs">Overview & Insights</TabsTrigger>
            <TabsTrigger value="topics" className="text-xs">Topic Breakdown</TabsTrigger>
            <TabsTrigger value="actionplan" className="text-xs">Learning & Projects Plan</TabsTrigger>
            <TabsTrigger value="skillmap" className="text-xs">Skill Map</TabsTrigger>
            <TabsTrigger value="transcript" className="text-xs">Interview Transcript</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Strengths */}
              <Card className="p-6 space-y-4">
                <CardHeader className="p-0 flex flex-row items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-400" />
                  <CardTitle className="text-sm font-semibold text-white">Demonstrated Strengths</CardTitle>
                </CardHeader>
                <CardContent className="p-0 space-y-2">
                  {report.strengths.map((s, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-emerald-500/8 border border-emerald-500/15 text-xs text-emerald-200">
                      {s}
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Weaknesses */}
              <Card className="p-6 space-y-4">
                <CardHeader className="p-0 flex flex-row items-center gap-2">
                  <AlertTriangle size={16} className="text-orange-400" />
                  <CardTitle className="text-sm font-semibold text-white">Growth Areas</CardTitle>
                </CardHeader>
                <CardContent className="p-0 space-y-2">
                  {report.weaknesses.map((w, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-orange-500/8 border border-orange-500/15 text-xs text-orange-200">
                      {w}
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Missed Concepts */}
              <Card className="p-6 space-y-4">
                <CardHeader className="p-0 flex flex-row items-center gap-2">
                  <Target size={16} className="text-red-400" />
                  <CardTitle className="text-sm font-semibold text-white">Missed Core Concepts</CardTitle>
                </CardHeader>
                <CardContent className="p-0 space-y-2">
                  {report.missedConcepts.map((m, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-red-500/8 border border-red-500/15 text-xs text-red-200">
                      {m}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Topic Breakdown Tab */}
          <TabsContent value="topics" className="space-y-4">
            <Card className="p-6 space-y-4">
              <CardTitle className="text-sm font-semibold text-white">Curriculum Topic Scores</CardTitle>
              <div className="space-y-4">
                {report.topicScores.map((topic) => (
                  <div key={topic.topic} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium text-white">Day {topic.day}: {topic.topic}</span>
                      <span className="font-bold text-indigo-400">{topic.score}%</span>
                    </div>
                    <Progress value={topic.score} className="h-1.5" />
                    <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                      <span>Questions asked: {topic.questionsAsked}</span>
                      <span>·</span>
                      <span>Coverage: {topic.coverage}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Learning & Projects Plan */}
          <TabsContent value="actionplan" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Action Plan & Days */}
              <Card className="p-6 space-y-4">
                <CardHeader className="p-0 flex flex-row items-center gap-2">
                  <BookOpen size={16} className="text-indigo-400" />
                  <CardTitle className="text-sm font-semibold text-white">Recommended Curriculum Revisits</CardTitle>
                </CardHeader>
                <CardContent className="p-0 space-y-3">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {report.recommendedDays.map((day) => (
                      <Badge key={day} className="bg-indigo-500/20 text-indigo-300 border-indigo-500/40 text-xs px-3 py-1">
                        Day {day} Revision
                      </Badge>
                    ))}
                  </div>
                  <div className="space-y-2">
                    {report.improvementPlan.map((step, idx) => (
                      <div key={idx} className="flex gap-2 text-xs text-muted-foreground">
                        <span className="text-indigo-400 font-bold">{idx + 1}.</span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recommended Projects */}
              <Card className="p-6 space-y-4">
                <CardHeader className="p-0 flex flex-row items-center gap-2">
                  <Layers size={16} className="text-violet-400" />
                  <CardTitle className="text-sm font-semibold text-white">Suggested Practice Projects</CardTitle>
                </CardHeader>
                <CardContent className="p-0 space-y-3">
                  {report.recommendedProjects.map((proj, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-white/[0.03] border border-white/8 text-xs text-white flex items-center justify-between">
                      <span>{proj}</span>
                      <ExternalLink size={12} className="text-muted-foreground" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Skill Map / Knowledge Graph */}
          <TabsContent value="skillmap" className="space-y-6">
            <Card className="p-6">
              <CardHeader className="p-0 mb-6">
                <CardTitle className="text-sm font-semibold text-white">Adaptive Skill Map</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">Topics are positioned from the actual interview evidence. Higher scores indicate demonstrated mastery; lower scores indicate learning opportunities.</p>
              </CardHeader>
              <KnowledgeGraph
                nodes={report.topicScores.slice(0, 8).map((topic) => ({
                  id: `${topic.day}-${topic.topic}`.replace(/\s+/g, "-").toLowerCase(),
                  label: topic.topic,
                  score: topic.score,
                }))}
              />
            </Card>
          </TabsContent>

          {/* Transcript Tab */}
          <TabsContent value="transcript" className="space-y-4">
            <Card className="p-6">
              <CardTitle className="text-sm font-semibold text-white mb-6">Full Interview Transcript & Replay</CardTitle>
              <div className="space-y-6">
                {report.transcript?.map((msg, idx) => (
                  <div key={idx} className={`p-4 rounded-2xl text-xs leading-relaxed space-y-1 ${
                    msg.role === "interviewer"
                      ? "bg-indigo-500/8 border border-indigo-500/15 text-slate-200"
                      : "bg-white/[0.04] border border-white/10 text-slate-100"
                  }`}>
                    <div className="flex justify-between font-semibold text-[11px] text-muted-foreground mb-1">
                      <span className={msg.role === "interviewer" ? "text-indigo-300" : "text-emerald-300"}>
                        {msg.role === "interviewer" ? "Aria (AI Interviewer)" : "Candidate"}
                      </span>
                      <span>{msg.timestamp}</span>
                    </div>
                    <div>{msg.content}</div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
