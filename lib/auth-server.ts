import { createHmac, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";

export interface ServerUser {
  id: string;
  email: string;
  name: string;
  demo: boolean;
  createdAt: string;
  demoQuestionsUsed?: number;
  demoQuestionsRemaining?: number;
}

export const DEMO_QUESTION_LIMIT = 3;
export const DEMO_USAGE_COOKIE = "aria_demo_usage";

export interface AuthSessionPayload {
  sid: string;
  uid: string;
  exp: number;
}

const DB_PATH = process.env.AUTH_DB_PATH
  ? path.resolve(process.env.AUTH_DB_PATH)
  : path.join(process.cwd(), "data", "auth.sqlite");

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
const COOKIE_NAME = "aria_auth";

function getSecret() {
  const secret = process.env.AUTH_SESSION_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SESSION_SECRET is required in production.");
  }
  return "aria-local-development-secret-change-me";
}

function openDb() {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const db = new DatabaseSync(DB_PATH);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      demo INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      demo_questions_used INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
  `);

  // Existing databases created before the demo preview feature need a small
  // additive migration. No existing auth/session data is replaced.
  const columns = db.prepare("PRAGMA table_info(users)").all() as Array<{ name: string }>;
  if (!columns.some((column) => column.name === "demo_questions_used")) {
    db.exec("ALTER TABLE users ADD COLUMN demo_questions_used INTEGER NOT NULL DEFAULT 0");
  }

  return db;
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${derived}`;
}

function verifyPassword(password: string, encoded: string) {
  const [algorithm, salt, stored] = encoded.split(":");
  if (algorithm !== "scrypt" || !salt || !stored) return false;
  try {
    const derived = scryptSync(password, salt, 64);
    const expected = Buffer.from(stored, "hex");
    return expected.length === derived.length && timingSafeEqual(expected, derived);
  } catch {
    return false;
  }
}

function encodePayload(payload: AuthSessionPayload) {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function sign(value: string) {
  return createHmac("sha256", getSecret()).update(value).digest("base64url");
}

export function createSession(user: ServerUser) {
  const db = openDb();
  try {
    const sid = randomUUID();
    const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
    const createdAt = new Date().toISOString();
    db.prepare("INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)")
      .run(sid, user.id, exp, createdAt);

    const payload = encodePayload({ sid, uid: user.id, exp });
    return `${payload}.${sign(payload)}`;
  } finally {
    db.close();
  }
}

export function createDemoSession(): string {
  const sid = randomUUID();
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  // Demo authentication is cookie-only so it works on Vercel/serverless
  // without writing the read-only deployment filesystem.
  const payload = encodePayload({ sid, uid: `demo:${sid}`, exp });
  return `${payload}.${sign(payload)}`;
}

export function verifySessionCookie(value: string | undefined): AuthSessionPayload | null {
  if (!value) return null;
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as AuthSessionPayload;
    if (!parsed.sid || !parsed.uid || !Number.isFinite(parsed.exp) || parsed.exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function getUserBySession(value: string | undefined): ServerUser | null {
  const payload = verifySessionCookie(value);
  if (!payload) return null;

  // Demo sessions are fully cookie-based and do not depend on SQLite.
  if (payload.uid.startsWith("demo:")) {
    return {
      id: payload.uid,
      email: "demo@aria.ai",
      name: "Demo Candidate",
      demo: true,
      createdAt: new Date(payload.exp * 1000 - SESSION_TTL_SECONDS * 1000).toISOString(),
      demoQuestionsUsed: 0,
      demoQuestionsRemaining: DEMO_QUESTION_LIMIT,
    };
  }

  const db = openDb();
  try {
    const row = db.prepare(`
      SELECT u.id, u.email, u.name, u.demo, u.created_at, u.demo_questions_used
      FROM sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.id = ? AND s.expires_at > ?
      LIMIT 1
    `).get(payload.sid, Math.floor(Date.now() / 1000)) as {
      id: string; email: string; name: string; demo: number; created_at: string; demo_questions_used: number;
    } | undefined;

    if (!row || row.id !== payload.uid) return null;
    const used = row.demo === 1 ? row.demo_questions_used : 0;
    return {
      id: row.id, email: row.email, name: row.name, demo: row.demo === 1,
      createdAt: row.created_at, demoQuestionsUsed: used,
      demoQuestionsRemaining: Math.max(0, DEMO_QUESTION_LIMIT - used)
    };
  } finally {
    db.close();
  }
}

export function createUser(name: string, email: string, password: string) {
  const db = openDb();
  try {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = db.prepare("SELECT id FROM users WHERE email = ? LIMIT 1").get(normalizedEmail);
    if (existing) throw new Error("An account with this email already exists.");

    const user: ServerUser = {
      id: randomUUID(),
      email: normalizedEmail,
      name: name.trim(),
      demo: false,
      createdAt: new Date().toISOString(),
    };

    db.prepare(`
      INSERT INTO users (id, email, name, password_hash, demo, created_at)
      VALUES (?, ?, ?, ?, 0, ?)
    `).run(user.id, user.email, user.name, hashPassword(password), user.createdAt);

    return user;
  } finally {
    db.close();
  }
}

export function authenticateUser(email: string, password: string) {
  const db = openDb();
  try {
    const normalizedEmail = email.trim().toLowerCase();
    const row = db.prepare(`
      SELECT id, email, name, password_hash, demo, created_at
      FROM users WHERE email = ? LIMIT 1
    `).get(normalizedEmail) as {
      id: string; email: string; name: string; password_hash: string; demo: number; created_at: string;
    } | undefined;

    if (!row || !verifyPassword(password, row.password_hash)) {
      throw new Error("Invalid email or password.");
    }

    return {
      id: row.id,
      email: row.email,
      name: row.name,
      demo: row.demo === 1,
      createdAt: row.created_at,
    } satisfies ServerUser;
  } finally {
    db.close();
  }
}

export function getOrCreateDemoUser() {
  const db = openDb();
  try {
    const existing = db.prepare("SELECT id, email, name, demo, created_at, demo_questions_used FROM users WHERE email = ? LIMIT 1").get("demo@aria.ai") as {
      id: string; email: string; name: string; demo: number; created_at: string; demo_questions_used: number;
    } | undefined;
    if (existing) {
      const used = existing.demo_questions_used ?? 0;
      return { id: existing.id, email: existing.email, name: existing.name, demo: true, createdAt: existing.created_at, demoQuestionsUsed: used, demoQuestionsRemaining: Math.max(0, DEMO_QUESTION_LIMIT - used) } satisfies ServerUser;
    }

    const user: ServerUser = {
      id: randomUUID(),
      email: "demo@aria.ai",
      name: "Demo Candidate",
      demo: true,
      createdAt: new Date().toISOString(),
    };
    db.prepare(`INSERT INTO users (id, email, name, password_hash, demo, created_at) VALUES (?, ?, ?, ?, 1, ?)`)
      .run(user.id, user.email, user.name, hashPassword(randomBytes(24).toString("hex")), user.createdAt);
    return user;
  } finally {
    db.close();
  }
}

export function getDemoUsage(userId: string) {
  const db = openDb();
  try {
    const row = db.prepare("SELECT demo, demo_questions_used FROM users WHERE id = ? LIMIT 1").get(userId) as { demo: number; demo_questions_used: number } | undefined;
    const used = row?.demo === 1 ? (row.demo_questions_used ?? 0) : 0;
    return { used, remaining: Math.max(0, DEMO_QUESTION_LIMIT - used), limit: DEMO_QUESTION_LIMIT, isDemo: row?.demo === 1 };
  } finally {
    db.close();
  }
}

export function reserveDemoQuestion(userId: string) {
  const db = openDb();
  try {
    const result = db.prepare(`
      UPDATE users
      SET demo_questions_used = demo_questions_used + 1
      WHERE id = ? AND demo = 1 AND demo_questions_used < ?
    `).run(userId, DEMO_QUESTION_LIMIT) as { changes: number };
    if (Number(result.changes) !== 1) {
      const row = db.prepare("SELECT demo_questions_used FROM users WHERE id = ? LIMIT 1").get(userId) as { demo_questions_used: number } | undefined;
      const used = row?.demo_questions_used ?? 0;
      return { allowed: false, used, remaining: Math.max(0, DEMO_QUESTION_LIMIT - used), limit: DEMO_QUESTION_LIMIT };
    }
    const row = db.prepare("SELECT demo_questions_used FROM users WHERE id = ? LIMIT 1").get(userId) as { demo_questions_used: number } | undefined;
    const used = row?.demo_questions_used ?? 0;
    return { allowed: true, used, remaining: Math.max(0, DEMO_QUESTION_LIMIT - used), limit: DEMO_QUESTION_LIMIT };
  } finally {
    db.close();
  }
}

export function releaseDemoQuestion(userId: string) {
  const db = openDb();
  try {
    db.prepare(`UPDATE users SET demo_questions_used = CASE WHEN demo_questions_used > 0 THEN demo_questions_used - 1 ELSE 0 END WHERE id = ? AND demo = 1`).run(userId);
  } finally {
    db.close();
  }
}


function encodeDemoUsage(count: number) {
  const safeCount = Math.max(0, Math.min(DEMO_QUESTION_LIMIT, Math.floor(count)));
  const value = `demo:${safeCount}`;
  return `${safeCount}.${sign(value)}`;
}

export function getDemoUsageFromCookie(value: string | undefined) {
  if (!value) return 0;
  const [countText, signature] = value.split(".");
  const count = Number(countText);
  if (!Number.isInteger(count) || count < 0 || count > DEMO_QUESTION_LIMIT || !signature) return 0;
  const expected = sign(`demo:${count}`);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return 0;
  return count;
}

export function setDemoUsageCookie(response: NextResponse, count: number) {
  response.cookies.set(DEMO_USAGE_COOKIE, encodeDemoUsage(count), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export function deleteSession(value: string | undefined) {
  const payload = verifySessionCookie(value);
  if (!payload || payload.uid.startsWith("demo:")) return;
  const db = openDb();
  try {
    db.prepare("DELETE FROM sessions WHERE id = ?").run(payload.sid);
  } finally {
    db.close();
  }
}

export function cleanupExpiredSessions() {
  const db = openDb();
  try {
    db.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(Math.floor(Date.now() / 1000));
  } finally {
    db.close();
  }
}

export const AUTH_COOKIE_NAME = COOKIE_NAME;
export const AUTH_COOKIE_MAX_AGE = SESSION_TTL_SECONDS;
