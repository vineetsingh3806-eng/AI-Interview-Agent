import { NextResponse } from "next/server";
import { authenticateUser, createSession, AUTH_COOKIE_MAX_AGE, AUTH_COOKIE_NAME } from "@/lib/auth-server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { email?: string; password?: string };
    const email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password) {
      return NextResponse.json({ error: "Enter a valid email and password." }, { status: 400 });
    }

    const user = authenticateUser(email, password);
    const session = createSession(user);
    const response = NextResponse.json({ user: { id: user.id, email: user.email, name: user.name, demo: user.demo } });
    response.cookies.set(AUTH_COOKIE_NAME, session, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: AUTH_COOKIE_MAX_AGE,
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }
}
