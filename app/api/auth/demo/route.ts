import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  createDemoSession,
  getDemoUsageFromCookie,
  setDemoUsageCookie,
  DEMO_QUESTION_LIMIT,
  AUTH_COOKIE_MAX_AGE,
  AUTH_COOKIE_NAME,
  DEMO_USAGE_COOKIE,
} from "@/lib/auth-server";

export const runtime = "nodejs";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const demoUsage = getDemoUsageFromCookie(cookieStore.get(DEMO_USAGE_COOKIE)?.value);

    if (demoUsage >= DEMO_QUESTION_LIMIT) {
      return NextResponse.json(
        {
          error: `Your ${DEMO_QUESTION_LIMIT}-question demo preview is complete. Please log in or create an account to continue.`,
          code: "DEMO_LIMIT_REACHED",
        },
        { status: 403 }
      );
    }

    // Demo is available to every visitor. The usage counter is stored in
    // a signed, httpOnly browser cookie so visitors do not share one
    // global demo-question counter.
    const session = createDemoSession();
    const user = {
      id: "demo",
      email: "demo@aria.ai",
      name: "Demo Candidate",
      demo: true,
    };

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        demo: true,
        demoQuestionsUsed: demoUsage,
        demoQuestionsRemaining: Math.max(0, DEMO_QUESTION_LIMIT - demoUsage),
      },
    });

    response.cookies.set(AUTH_COOKIE_NAME, session, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: AUTH_COOKIE_MAX_AGE,
    });
    setDemoUsageCookie(response, demoUsage);

    return response;
  } catch {
    return NextResponse.json({ error: "Unable to start the demo session." }, { status: 500 });
  }
}
