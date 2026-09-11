import { NextRequest, NextResponse } from "next/server";
import { InterviewAgent } from "@/agents/InterviewAgent";
import { loadSession, saveSession } from "@/lib/session";
import { cookies } from "next/headers";
import {
  getUserBySession,
  getDemoUsageFromCookie,
  setDemoUsageCookie,
  AUTH_COOKIE_NAME,
  DEMO_USAGE_COOKIE,
  DEMO_QUESTION_LIMIT,
} from "@/lib/auth-server";

export async function POST(req: NextRequest) {
  try {
    const { sessionId, content, sessionState } = await req.json();

    if (!sessionId || !content) {
      return NextResponse.json(
        { error: "sessionId and content are required" },
        { status: 400 }
      );
    }

    let session = loadSession(sessionId);

    // On Vercel, /tmp is instance-local. If this request lands on a different
    // serverless instance than /api/interview/start, seed that instance from
    // the session state kept in the current browser tab.
    if (!session && sessionState && typeof sessionState === "object" && sessionState.sessionId === sessionId) {
      try {
        saveSession(sessionState);
        session = loadSession(sessionId);
      } catch {}
    }

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    if (session.status === "completed") {
      return NextResponse.json(
        { error: "Interview is already completed", isComplete: true },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const user = getUserBySession(cookieStore.get(AUTH_COOKIE_NAME)?.value);
    if (!user) {
      return NextResponse.json({ error: "Authentication required. Please log in or create an account." }, { status: 401 });
    }

    const currentDemoUsage = user.demo
      ? getDemoUsageFromCookie(cookieStore.get(DEMO_USAGE_COOKIE)?.value)
      : 0;

    if (user.demo && currentDemoUsage >= DEMO_QUESTION_LIMIT) {
      return NextResponse.json({
        error: `Your ${DEMO_QUESTION_LIMIT}-question demo preview is complete. Please log in or create an account to continue.`,
        code: "DEMO_LIMIT_REACHED",
        demoLimitReached: true,
        demoQuestionsUsed: currentDemoUsage,
        demoQuestionsRemaining: 0,
      }, { status: 403 });
    }

    const agent = new InterviewAgent();
    const result = await agent.processAnswer(sessionId, content);

    const nextDemoUsage = user.demo ? currentDemoUsage + 1 : currentDemoUsage;
    const demoLimitReached = Boolean(
      user.demo && nextDemoUsage >= DEMO_QUESTION_LIMIT
    );

    const response = NextResponse.json({
      evaluation: result.evaluation,
      nextMessage: result.nextMessage,
      isComplete: result.isComplete,
      updatedSession: result.updatedSession,
      sessionState: result.updatedSession,
      demoLimitReached,
      demoQuestionsUsed: user.demo ? nextDemoUsage : undefined,
      demoQuestionsRemaining: user.demo
        ? Math.max(0, DEMO_QUESTION_LIMIT - nextDemoUsage)
        : undefined,
    });

    if (user.demo) {
      setDemoUsageCookie(response, nextDemoUsage);
    }

    return response;
  } catch (error) {
    console.error("[/api/interview/message]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
