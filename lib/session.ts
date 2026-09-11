// ============================================================
// SESSION STORE — JSON-based persistence
// ============================================================

import fs from "fs";
import path from "path";
import type { InterviewSession } from "@/types";
import type { FinalReport } from "@/types";

const SESSIONS_DIR = process.env.SESSIONS_DIR
  ? path.resolve(process.env.SESSIONS_DIR)
  : process.env.VERCEL
    ? path.join("/tmp", "aria-sessions")
    : path.join(process.cwd(), "sessions");

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function sessionPath(sessionId: string): string {
  return path.join(SESSIONS_DIR, `${sessionId}.json`);
}

function reportPath(sessionId: string): string {
  return path.join(SESSIONS_DIR, `${sessionId}-report.json`);
}

export function saveSession(session: InterviewSession): void {
  ensureDir(SESSIONS_DIR);
  fs.writeFileSync(sessionPath(session.sessionId), JSON.stringify(session, null, 2));
}

export function loadSession(sessionId: string): InterviewSession | null {
  const p = sessionPath(sessionId);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf-8")) as InterviewSession;
  } catch {
    return null;
  }
}

export function saveReport(report: FinalReport): void {
  ensureDir(SESSIONS_DIR);
  fs.writeFileSync(reportPath(report.sessionId), JSON.stringify(report, null, 2));
}

export function loadReport(sessionId: string): FinalReport | null {
  const p = reportPath(sessionId);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf-8")) as FinalReport;
  } catch {
    return null;
  }
}

export function listSessions(): string[] {
  ensureDir(SESSIONS_DIR);
  return fs
    .readdirSync(SESSIONS_DIR)
    .filter((f) => f.endsWith(".json") && !f.endsWith("-report.json"))
    .map((f) => f.replace(".json", ""));
}
