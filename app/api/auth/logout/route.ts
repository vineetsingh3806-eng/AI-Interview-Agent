import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { deleteSession, AUTH_COOKIE_NAME } from "@/lib/auth-server";

export const runtime = "nodejs";

export async function POST() {
  const cookieStore = await cookies();
  deleteSession(cookieStore.get(AUTH_COOKIE_NAME)?.value);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(AUTH_COOKIE_NAME, "", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 0 });
  return response;
}
