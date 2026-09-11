"use client";

import { useCallback, useEffect, useState } from "react";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  demo: boolean;
  demoQuestionsUsed?: number;
  demoQuestionsRemaining?: number;
}

export interface AuthSession {
  isAuthenticated: true;
  user: AuthUser;
  authenticatedAt: string;
}

function sessionFromUser(user: AuthUser): AuthSession {
  return { isAuthenticated: true, user, authenticatedAt: new Date().toISOString() };
}

async function requestAuth(path: string, body?: unknown) {
  const response = await fetch(path, {
    method: "POST",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error || "Authentication request failed.");
  return data as { user: AuthUser };
}

export async function getAuthSession(): Promise<AuthSession | null> {
  try {
    const response = await fetch("/api/auth/me", { credentials: "include", cache: "no-store" });
    if (!response.ok) {
      return null;
    }
    const data = await response.json() as { user: AuthUser | null };
    if (!data.user) {
      return null;
    }
    return sessionFromUser(data.user);
  } catch {
    return null;
  }
}

export async function login(email: string, password: string): Promise<AuthSession> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error("Enter a valid email address.");
  }
  if (!password) throw new Error("Enter your password.");

  const { user } = await requestAuth("/api/auth/login", { email: normalizedEmail, password });
  return sessionFromUser(user);
}

export async function signup(name: string, email: string, password: string): Promise<AuthSession> {
  const cleanName = name.trim();
  const normalizedEmail = email.trim().toLowerCase();
  if (cleanName.length < 2) throw new Error("Enter your full name.");
  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error("Enter a valid email address.");
  }
  if (password.length < 8) throw new Error("Password must be at least 8 characters.");

  const { user } = await requestAuth("/api/auth/signup", { name: cleanName, email: normalizedEmail, password });
  return sessionFromUser(user);
}

export async function demoLogin(): Promise<AuthSession> {
  const { user } = await requestAuth("/api/auth/demo");
  return sessionFromUser(user);
}

export async function logout(): Promise<void> {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
  try {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
  } finally {
    try { window.localStorage.removeItem("aria-interview-skill"); } catch {}
  }
}

export function useAuth() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    getAuthSession().then((next) => {
      if (!active) return;
      setSession(next);
      setReady(true);
    });
    return () => { active = false; };
  }, []);

  const signOut = useCallback(async () => {
    await logout();
    setSession(null);
  }, []);

  return {
    ready,
    isAuthenticated: !!session?.isAuthenticated,
    user: session?.user ?? null,
    session,
    login,
    signup,
    demoLogin,
    logout: signOut,
  };
}
