"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Brain, Send, Clock, Sparkles, AlertCircle, ChevronRight,
  TrendingUp, CheckCircle2, Circle, ArrowLeft, Square, Zap,
  Volume2, VolumeX, Shield, FastForward
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { InterviewSession, Message, Candidate, DifficultyLevel } from "@/types";
import { useSpeech } from "@/hooks/useSpeech";
import { AriaCore } from "@/components/3d/AriaCore";
import { InterviewEnvironment } from "@/components/3d/InterviewEnvironment";
import { AuthMenu } from "@/components/auth/AuthMenu";
import { getAuthSession } from "@/lib/auth";

// Typing animation component
function TypewriterText({ text, speed = 15 }: { text: string; speed?: number }) {
  const [displayedText, setDisplayedText] = useState("");
  const indexRef = useRef(0);

  useEffect(() => {
    setDisplayedText("");
    indexRef.current = 0;
    const timer = setInterval(() => {
      if (indexRef.current < text.length) {
        setDisplayedText((prev) => prev + text.charAt(indexRef.current));
        indexRef.current++;
      } else {
        clearInterval(timer);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed]);

  return <span>{displayedText}</span>;
}

// Thinking Indicator component
function ThinkingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="premium-panel flex items-center gap-3 p-4 rounded-2xl text-indigo-200 w-fit"
    >
      <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center">
        <Brain className="w-4 h-4 text-indigo-400 animate-pulse" />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Aria is evaluating and thinking</span>
        <div className="flex gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.3s]" />
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.15s]" />
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" />
        </div>
      </div>
    </motion.div>
  );
}

export default function InterviewPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [session, setSession] = useState<InterviewSession | null>(null);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [thinking, setThinking] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [error, setError] = useState("");
  const [demoLimitReached, setDemoLimitReached] = useState(false);

  const { speak, stop, supported: speechSupported, isSpeaking } = useSpeech();
  // Track both the message id and normalized content. The content fingerprint
  // protects against an API/session refresh returning the same message with a
  // new object/id, while the id prevents React re-renders from replaying it.
  const spokenMessageKeysRef = useRef<Set<string>>(new Set());
  const initializedSpeechMessagesRef = useRef(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    return () => stop();
  }, [stop]);

  // Timer tick
  useEffect(() => {
    if (!session?.startedAt) return;
    const tick = () => setElapsedSeconds(Math.max(0, Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000)));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [session?.startedAt]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Load the actual session created by /api/interview/start.
  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      try {
        const sessionRes = await fetch(`/api/interview/session/${sessionId}`, { cache: "no-store" });
        let sessionData: InterviewSession | null = null;

        if (sessionRes.ok) {
          sessionData = await sessionRes.json() as InterviewSession;
        } else {
          // Vercel serverless instances do not share /tmp. Reuse the session
          // returned by /api/interview/start when the next request lands on a
          // different instance.
          try {
            const cached = sessionStorage.getItem(`aria-interview-session:${sessionId}`);
            if (cached) sessionData = JSON.parse(cached) as InterviewSession;
          } catch {}
        }

        if (!sessionData) {
          const errorData = await sessionRes.json().catch(() => ({}));
          throw new Error(errorData.error || "Session not found");
        }

        try {
          sessionStorage.setItem(`aria-interview-session:${sessionId}`, JSON.stringify(sessionData));
        } catch {}

        const candidateRes = await fetch(`/api/candidates/${sessionData.candidateId}`, { cache: "no-store" });
        const candidateData = await candidateRes.json();
        if (!candidateRes.ok) throw new Error(candidateData.error || "Candidate not found");

        if (!cancelled) {
          setSession(sessionData);
          setCandidate(candidateData);
          const auth = await getAuthSession();
          if (auth?.user.demo && (auth.user.demoQuestionsRemaining ?? 3) <= 0) {
            setDemoLimitReached(true);
          }
        }
      } catch (err) {
        console.error("Failed to load interview:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadData();
    return () => { cancelled = true; };
  }, [sessionId]);

  // Speak only newly arrived interviewer messages. The initial transcript is
  // marked as already seen so turning voice on never unexpectedly replays history.
  useEffect(() => {
    if (!session?.messages) return;

    const interviewerMessages = session.messages.filter(
      (message) =>
        message.role === "interviewer" &&
        Boolean(message.id) &&
        !message.isThinking
    );

    if (!initializedSpeechMessagesRef.current) {
      interviewerMessages.forEach((message) => {
        spokenMessageKeysRef.current.add(message.id);
        spokenMessageKeysRef.current.add(
          `content:${message.content.trim().replace(/\s+/g, " ").toLowerCase()}`
        );
      });
      initializedSpeechMessagesRef.current = true;
      return;
    }

    // Never replay a question that arrived while voice was OFF. Those messages
    // are considered seen; only questions generated after voice is ON can be
    // spoken automatically.
    if (!voiceEnabled || !speechSupported || session.status === "completed") {
      interviewerMessages.forEach((message) => {
        spokenMessageKeysRef.current.add(message.id);
        spokenMessageKeysRef.current.add(
          `content:${message.content.trim().replace(/\s+/g, " ").toLowerCase()}`
        );
      });
      return;
    }

    const newMessages = interviewerMessages.filter((message) => {
      const contentKey = `content:${message.content
        .trim()
        .replace(/\s+/g, " ")
        .toLowerCase()}`;

      return (
        !spokenMessageKeysRef.current.has(message.id) &&
        !spokenMessageKeysRef.current.has(contentKey)
      );
    });

    if (newMessages.length === 0) return;

    // Mark before speaking so React re-renders/API session refreshes cannot
    // replay the same interviewer message.
    newMessages.forEach((message) => {
      spokenMessageKeysRef.current.add(message.id);
      spokenMessageKeysRef.current.add(
        `content:${message.content.trim().replace(/\s+/g, " ").toLowerCase()}`
      );
    });

    // If multiple messages arrive together, only the newest one is relevant.
    speak(newMessages[newMessages.length - 1].content);
  }, [session?.messages, session?.status, voiceEnabled, speechSupported, speak]);

  // Voice is a global interview toggle. Disabling it stops current speech immediately.
  const handleVoiceToggle = () => {
    if (!speechSupported) {
      setError("Voice is not supported by this browser. You can continue the interview normally.");
      return;
    }

    setVoiceEnabled((enabled) => {
      const nextEnabled = !enabled;
      if (!nextEnabled) stop();
      return nextEnabled;
    });
  };

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [session?.messages, thinking]);

  // Send Candidate Answer
  const handleSend = async (answerOverride?: string) => {
    const userContent = (answerOverride ?? input).trim();
    if (!userContent || thinking || finishing || demoLimitReached) return;
    setInput("");
    stop();

    // Optimistically update messages
    const optimisticUserMsg: Message = {
      id: "temp-" + Date.now(),
      role: "candidate",
      content: userContent,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setSession((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        messages: [...prev.messages, optimisticUserMsg],
      };
    });

    setThinking(true);

    try {
      const res = await fetch("/api/interview/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, content: userContent, sessionState: session }),
      });

      const data = await res.json();
      if (data.code === "DEMO_LIMIT_REACHED" || data.demoLimitReached) {
        setDemoLimitReached(true);
        setError("");

        // After the third demo answer, require authentication before
        // allowing the visitor to continue the same interview.
        if (data.demoLimitReached) {
          router.push(`/login?next=${encodeURIComponent(`/interview/${sessionId}`)}`);
        }
        return;
      }
      if (!res.ok) throw new Error(data.error || "Failed to process message");

      setSession(data.updatedSession);
      try { sessionStorage.setItem(`aria-interview-session:${sessionId}`, JSON.stringify(data.updatedSession)); } catch {}
      setError("");
      if (data.demoLimitReached) setDemoLimitReached(true);

      if (data.isComplete) {
        router.push(`/report/${sessionId}`);
      }
    } catch (err) {
      console.error("Error sending answer:", err);
      setError(err instanceof Error ? err.message : "Aria could not process that answer. Please retry.");
    } finally {
      setThinking(false);
    }
  };

  // Skip Question shortcut
  const handleSkip = () => {
    handleSend("I don't know this yet. Please move to the next question.");
  };

  // Finish Interview manually
  const handleFinish = async () => {
    stop();
    setFinishing(true);
    try {
      const res = await fetch("/api/interview/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json();
      router.push(`/report/${sessionId}`);
    } catch (err) {
      console.error(err);
      setFinishing(false);
    }
  };

  const getDifficultyBadge = (level?: DifficultyLevel | string) => {
    switch (level) {
      case "advanced":
        return <Badge variant="destructive" className="text-xs">Advanced</Badge>;
      case "intermediate":
        return <Badge variant="warning" className="text-xs">Intermediate</Badge>;
      default:
        return <Badge variant="success" className="text-xs">Beginner</Badge>;
    }
  };

  if (loading || !session || !candidate) {
    return (
      <main className="min-h-screen bg-[#080810] flex items-center justify-center px-6">
        <div className="text-center">
          <div className="w-10 h-10 mx-auto mb-4 rounded-xl bg-indigo-500/15 flex items-center justify-center">
            <Brain className="w-5 h-5 text-indigo-400 animate-pulse" />
          </div>
          <p className="text-sm text-white">Loading your interview…</p>
          <p className="text-xs text-muted-foreground mt-1">Aria is preparing the first question.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="h-screen bg-[#05070b] flex flex-col overflow-hidden text-white interview-depth">
      <InterviewEnvironment intensity="high" />
      {error && <div className="relative z-30 px-6 py-2 bg-red-500/10 border-b border-red-500/20 text-red-300 text-xs flex items-center justify-between"><span>{error}</span><button onClick={()=>setError("")} className="underline">Dismiss</button></div>}
      {/* Ambient interview environment */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 lab-grid opacity-20" />
        <div className="absolute left-1/2 top-[-180px] h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-indigo-500/[0.045] blur-[120px]" />
      </div>

      {/* Top Navbar / Interview Header */}
      <header className="relative z-20 border-b border-white/6 px-5 py-3.5 bg-black/55 backdrop-blur-xl flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/candidates">
            <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground hover:text-white">
              <ArrowLeft size={16} />
            </Button>
          </Link>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <Brain size={16} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white text-sm">Aria</span>
                <span className="text-xs text-muted-foreground">· AI Technical Interviewer</span>
              </div>
              {session?.currentTopic && (
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-indigo-400 font-medium">Topic: {session.currentTopic}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Center Progress Indicators */}
        <div className="hidden md:flex items-center gap-6 bg-white/[0.03] border border-white/8 px-5 py-2 rounded-full">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Question</span>
            <span className="text-sm font-bold text-white">
              {session?.currentQuestionIndex || 1} <span className="text-muted-foreground font-normal">/ 12</span>
            </span>
          </div>

          <div className="w-px h-4 bg-border/60" />

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Difficulty</span>
            {getDifficultyBadge(session?.difficulty)}
          </div>

          <div className="w-px h-4 bg-border/60" />

          <div className="flex items-center gap-2 font-mono text-xs text-indigo-300">
            <Clock size={13} className="text-indigo-400" />
            {formatTime(elapsedSeconds)}
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <Button
            variant="glass"
            size="sm"
            onClick={handleVoiceToggle}
            disabled={!speechSupported}
            aria-label={voiceEnabled ? "Turn voice off" : "Turn voice on"}
            aria-pressed={voiceEnabled}
            title={
              speechSupported
                ? (voiceEnabled ? "Turn voice off" : "Turn voice on")
                : "Voice is not supported in this browser"
            }
            className={`text-xs gap-1.5 ${
              voiceEnabled
                ? "text-indigo-300 border-indigo-500/30 bg-indigo-500/10"
                : "text-muted-foreground"
            }`}
          >
            {voiceEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
            {voiceEnabled ? "Voice On" : "Voice Off"}
          </Button>

          <Button
            variant="destructive"
            size="sm"
            onClick={handleFinish}
            disabled={finishing || demoLimitReached}
            className="text-xs gap-1.5"
          >
            {finishing ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating Report...
              </>
            ) : (
              <>
                <Square size={12} className="fill-current" />
                Finish Interview
              </>
            )}
          </Button>
          <AuthMenu />
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        {/* Left Sidebar — Context & Progress */}
        <aside className="w-80 border-r border-white/6 bg-black/20 p-5 flex flex-col gap-5 hidden lg:flex">
          {/* Candidate Profile Summary */}
          {candidate && (
            <div className="glass-card rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="text-xs font-bold">{candidate.avatar}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium text-white text-sm">{candidate.name}</div>
                  <div className="text-xs text-muted-foreground">{candidate.role}</div>
                </div>
              </div>
              <div className="space-y-1.5 pt-2 border-t border-border/50">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Cohort Progress</span>
                  <span className="text-white font-medium">{candidate.overallProgress}%</span>
                </div>
                <Progress value={candidate.overallProgress} className="h-1" />
              </div>
            </div>
          )}

          {/* Question Timeline */}
          <div className="glass-card rounded-xl p-4 flex-1 flex flex-col">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3 flex items-center justify-between">
              <span>Question Timeline</span>
              <span className="text-indigo-400 font-mono">{session?.questionHistory?.length || 1}/12</span>
            </h4>

            <ScrollArea className="flex-1 pr-2">
              <div className="space-y-2">
                {Array.from({ length: 12 }).map((_, idx) => {
                  const qNum = idx + 1;
                  const record = session?.questionHistory?.[idx];
                  const isCurrent = (session?.currentQuestionIndex || 1) === qNum;
                  const isDone = Boolean(record?.answer);

                  return (
                    <div
                      key={qNum}
                      className={`
                        p-2.5 rounded-lg border text-xs flex items-center justify-between transition-all
                        ${isCurrent ? "bg-indigo-500/15 border-indigo-500/40 text-white font-medium" : ""}
                        ${isDone ? "bg-emerald-500/8 border-emerald-500/20 text-emerald-300" : ""}
                        ${!isCurrent && !isDone ? "bg-white/[0.02] border-white/5 text-muted-foreground" : ""}
                      `}
                    >
                      <div className="flex items-center gap-2">
                        {isDone ? (
                          <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                        ) : isCurrent ? (
                          <div className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-pulse shrink-0" />
                        ) : (
                          <Circle size={13} className="text-muted-foreground/50 shrink-0" />
                        )}
                        <span className="truncate max-w-[150px]">
                          {record ? `Q${qNum}: ${record.topic || "Question"}` : `Question ${qNum}`}
                        </span>
                      </div>

                      {record?.score !== undefined && (
                        <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                          record.score >= 7 ? "bg-emerald-500/20 text-emerald-400" :
                          record.score >= 5 ? "bg-yellow-500/20 text-yellow-400" :
                          "bg-red-500/20 text-red-400"
                        }`}>
                          {record.score}/10
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Active Memory */}
          <div className="glass-card rounded-xl p-4 space-y-2 text-xs">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="font-semibold text-white">Interview Memory</span>
              <Zap size={12} className="text-yellow-400" />
            </div>
            <div className="space-y-1 text-muted-foreground">
              <div className="flex justify-between">
                <span>Topics Covered:</span>
                <span className="text-white font-medium">{session?.memory?.coveredTopics?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Days Covered:</span>
                <span className="text-white font-medium">{session?.memory?.coveredDays?.length || 0}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Center Chat Section */}
        <section className="flex-1 flex flex-col overflow-hidden bg-black/25">
          <div className="hidden xl:flex h-[250px] shrink-0 items-center justify-center border-b border-white/6 bg-black/10">
            <div className="relative h-full w-[360px]">
              <AriaCore state={isSpeaking ? "speaking" : thinking ? "thinking" : "idle"} compact className="h-full w-full" />
              <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-white/7 bg-black/45 px-3 py-1.5 text-[9px] text-slate-500 backdrop-blur-md">
                {isSpeaking ? "ARIA IS SPEAKING" : thinking ? "ARIA IS THINKING" : "ARIA IS LISTENING"}
              </div>
            </div>
          </div>
          {/* Message Stream */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
            {/* Initial Welcome Banner */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="premium-panel p-4 rounded-2xl text-xs text-slate-400 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Shield size={14} className="text-indigo-400" />
                <span>Technical Interview in Progress · Simulated ABTalks AI Engineer</span>
              </div>
              <span className="text-indigo-300 font-mono">Session ID: {sessionId.slice(0, 8)}...</span>
            </motion.div>

            {/* Messages list */}
            {session?.messages?.map((msg, index) => {
              const isInterviewer = msg.role === "interviewer";
              const isLatestInterviewer = isInterviewer && index === session.messages.length - 1;

              return (
                <motion.div
                  key={msg.id || index}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex gap-3 max-w-3xl ${isInterviewer ? "" : "ml-auto flex-row-reverse"}`}
                >
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold ${
                    isInterviewer
                      ? "bg-gradient-to-br from-indigo-500 to-violet-600 text-white"
                      : "bg-white/10 text-white border border-white/10"
                  }`}>
                    {isInterviewer ? <Brain size={16} /> : (candidate?.avatar || "ME")}
                  </div>

                  {/* Message Bubble */}
                  <div className="space-y-1 max-w-2xl">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
                      <span className="font-medium text-white">{isInterviewer ? "Aria" : candidate?.name || "Candidate"}</span>
                      <span>·</span>
                      <span>{msg.timestamp}</span>
                      {msg.metadata?.topic && (
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 bg-indigo-500/10 border-indigo-500/20 text-indigo-300">
                          {msg.metadata.topic}
                        </Badge>
                      )}
                    </div>

                    <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                      isInterviewer
                        ? "glass-card text-slate-200 border-white/10 rounded-tl-sm shadow-[0_14px_50px_rgba(0,0,0,.18)]"
                        : "bg-white/[0.08] text-slate-100 border border-white/10 rounded-tr-sm shadow-[0_14px_40px_rgba(0,0,0,.22)]"
                    }`}>
                      {isLatestInterviewer ? (
                        <TypewriterText text={msg.content} />
                      ) : (
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {/* Thinking Animation when AI is generating follow-up */}
            <AnimatePresence>
              {thinking && <ThinkingIndicator />}
            </AnimatePresence>
          </div>

          {/* Bottom Answer Input Box */}
          <div className="p-4 border-t border-border/40 bg-black/60 backdrop-blur-md space-y-3">
            {/* Quick Action Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              <span className="text-muted-foreground shrink-0">Quick Options:</span>
              <button
                onClick={handleSkip}
                disabled={thinking || demoLimitReached}
                className="px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/10 text-muted-foreground hover:text-white hover:bg-white/10 transition-all shrink-0 flex items-center gap-1"
              >
                <FastForward size={11} />
                Skip this question
              </button>
              <button
                onClick={() => setInput((prev) => prev + " Can you clarify the context for this problem?")}
                disabled={thinking || demoLimitReached}
                className="px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/10 text-muted-foreground hover:text-white hover:bg-white/10 transition-all shrink-0"
              >
                Ask for clarification
              </button>
            </div>

            {/* Textarea + Action */}
            <div className="relative glass-card rounded-xl p-2 border-indigo-500/20 focus-within:border-indigo-500/50 transition-all">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Type your answer here... (Use Ctrl+Enter or click Send to submit)"
                disabled={thinking || finishing || demoLimitReached}
                rows={3}
                className="w-full bg-transparent text-sm text-white placeholder:text-muted-foreground/60 resize-none outline-none p-2"
              />

              <div className="flex items-center justify-between pt-2 border-t border-white/5 px-2">
                <span className="text-[11px] text-muted-foreground/70">
                  Tip: Be specific with code examples, tradeoffs, and system design choices.
                </span>

                <Button
                  variant="brand"
                  size="sm"
                  onClick={() => handleSend()}
                  disabled={!input.trim() || thinking || finishing || demoLimitReached}
                  className="gap-1.5 text-xs"
                >
                  <span>Submit Answer</span>
                  <Send size={13} />
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>

      <AnimatePresence>
        {demoLimitReached && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 px-5 backdrop-blur-md"
            role="dialog"
            aria-modal="true"
            aria-labelledby="demo-limit-title"
          >
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="premium-panel w-full max-w-md rounded-3xl border border-indigo-400/20 p-7 shadow-[0_30px_120px_rgba(0,0,0,.65)]"
            >
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-indigo-400/20 bg-indigo-500/10">
                <Shield className="h-6 w-6 text-indigo-300" />
              </div>
              <div className="text-center">
                <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-indigo-300/70">ARIA preview complete</div>
                <h2 id="demo-limit-title" className="mt-2 text-2xl font-semibold tracking-tight text-white">Your 3-question demo is complete.</h2>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  You have experienced the demo preview. Log in or create a free account to continue the full technical interview.
                </p>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <Link href={`/login?next=${encodeURIComponent(`/interview/${sessionId}`)}`} className="block">
                  <Button variant="glass" size="lg" className="h-11 w-full rounded-xl">Log in</Button>
                </Link>
                <Link href={`/signup?next=${encodeURIComponent(`/interview/${sessionId}`)}`} className="block">
                  <Button variant="brand" size="lg" className="h-11 w-full rounded-xl">Create account <ChevronRight size={16} /></Button>
                </Link>
              </div>
              <p className="mt-5 text-center text-[10px] leading-5 text-slate-600">Demo access is limited to three answered questions.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
