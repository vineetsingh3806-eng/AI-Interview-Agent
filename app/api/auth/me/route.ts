import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserBySession, getDemoUsageFromCookie, AUTH_COOKIE_NAME, DEMO_USAGE_COOKIE, DEMO_QUESTION_LIMIT } from "@/lib/auth-server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const user = getUserBySession(cookieStore.get(AUTH_COOKIE_NAME)?.value);
    if (!user) return NextResponse.json({ user: null }, { status: 401 });

    const demoUsage = user.demo
      ? getDemoUsageFromCookie(cookieStore.get(DEMO_USAGE_COOKIE)?.value)
      : 0;

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        demo: user.demo,
        demoQuestionsUsed: user.demo ? demoUsage : 0,
        demoQuestionsRemaining: user.demo
          ? Math.max(0, DEMO_QUESTION_LIMIT - demoUsage)
          : 0,
      },
    });
  } catch {
    return NextResponse.json({ user: null }, { status: 401 });
  }
}
