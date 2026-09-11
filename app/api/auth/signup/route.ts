import { NextResponse } from "next/server";
import { createSession, createUser, AUTH_COOKIE_MAX_AGE, AUTH_COOKIE_NAME } from "@/lib/auth-server";

export const runtime = "nodejs";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { name?: string; email?: string; password?: string };
    const name = body.name?.trim() ?? "";
    const email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";

    if (name.length < 2) return jsonError("Enter your full name.");
    if (name.length > 80) return jsonError("Name is too long.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return jsonError("Enter a valid email address.");
    if (password.length < 8) return jsonError("Password must be at least 8 characters.");

    const user = createUser(name, email, password);
    const session = createSession(user);
    const response = NextResponse.json({ user: { id: user.id, email: user.email, name: user.name, demo: false } }, { status: 201 });
    response.cookies.set(AUTH_COOKIE_NAME, session, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: AUTH_COOKIE_MAX_AGE,
    });
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create your account.";
    const duplicate = message.toLowerCase().includes("already exists") || message.toLowerCase().includes("unique constraint");
    return jsonError(duplicate ? "An account with this email already exists." : "Unable to create your account.", duplicate ? 409 : 500);
  }
}
