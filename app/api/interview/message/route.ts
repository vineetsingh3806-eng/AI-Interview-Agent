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
import type { InterviewSession } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const { sessionId, content, sessionState } = await req.json();

    if (!sessionId || !content) {
      return NextResponse.json(
        { error: "sessionId and content are required" },
        { status: 400 }
      );
    }

    /*
     * Vercel-safe session handling:
     *
     * Prefer the session state sent by the browser.
     * This avoids depending on Vercel's instance-local /tmp filesystem.
     */
    let session: InterviewSession | null = null;

    if (
      sessionState &&
      typeof sessionState === "object" &&
      sessionState.sessionId === sessionId
    ) {
      session = sessionState as InterviewSession;
    } else {
      session = loadSession(sessionId);
    }

    /*
     * Best-effort fallback:
     * If we received browser state, also seed the current instance.
     */
    if (session) {
      try {
        saveSession(session);
      } catch (error) {
        console.warn(
          "[/api/interview/message] Could not persist session:",
          error
        );
      }
    }

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    if (session.status === "completed") {
      return NextResponse.json(
        {
          error: "Interview is already completed",
          isComplete: true,
        },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();

    const user = getUserBySession(
      cookieStore.get(AUTH_COOKIE_NAME)?.value
    );

    if (!user) {
      return NextResponse.json(
        {
          error:
            "Authentication required. Please log in or create an account.",
        },
        { status: 401 }
      );
    }

    /*
     * Demo users are limited to exactly 3 submitted answers.
     */
    const currentDemoUsage = user.demo
      ? getDemoUsageFromCookie(
          cookieStore.get(DEMO_USAGE_COOKIE)?.value
        )
      : 0;

    if (
      user.demo &&
      currentDemoUsage >= DEMO_QUESTION_LIMIT
    ) {
      return NextResponse.json(
        {
          error: `Your ${DEMO_QUESTION_LIMIT}-question demo preview is complete. Please log in or create an account to continue.`,
          code: "DEMO_LIMIT_REACHED",
          demoLimitReached: true,
          demoQuestionsUsed: currentDemoUsage,
          demoQuestionsRemaining: 0,
        },
        { status: 403 }
      );
    }

    const agent = new InterviewAgent();

    /*
     * IMPORTANT:
     * Pass the browser's current session directly to InterviewAgent.
     * The agent will no longer be forced to reload the session from
     * Vercel's /tmp filesystem.
     */
    const result = await agent.processAnswer(
      sessionId,
      content,
      session
    );

    const nextDemoUsage = user.demo
      ? currentDemoUsage + 1
      : currentDemoUsage;

    const demoLimitReached = Boolean(
      user.demo &&
        nextDemoUsage >= DEMO_QUESTION_LIMIT
    );

    const response = NextResponse.json({
      evaluation: result.evaluation,
      nextMessage: result.nextMessage,
      isComplete: result.isComplete,

      /*
       * Frontend should store this updated session state
       * and send it with the next answer.
       */
      updatedSession: result.updatedSession,
      sessionState: result.updatedSession,

      demoLimitReached,

      demoQuestionsUsed: user.demo
        ? nextDemoUsage
        : undefined,

      demoQuestionsRemaining: user.demo
        ? Math.max(
            0,
            DEMO_QUESTION_LIMIT - nextDemoUsage
          )
        : undefined,
    });

    if (user.demo) {
      setDemoUsageCookie(
        response,
        nextDemoUsage
      );
    }

    return response;
  } catch (error) {
    console.error(
      "[/api/interview/message]",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Internal server error",
      },
      { status: 500 }
    );
  }
}