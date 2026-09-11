import { NextRequest, NextResponse } from "next/server";
import { InterviewAgent } from "@/agents/InterviewAgent";
import { loadSession, saveReport } from "@/lib/session";
import { cookies } from "next/headers";
import { getUserBySession, getDemoUsage, AUTH_COOKIE_NAME } from "@/lib/auth-server";

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId required" }, { status: 400 });
    }

    const session = loadSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const cookieStore = await cookies();
    const user = getUserBySession(cookieStore.get(AUTH_COOKIE_NAME)?.value);
    if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    if (user.demo) {
      const usage = getDemoUsage(user.id);
      if (usage.used < 2) {
        return NextResponse.json({ error: "The demo preview requires two answered questions before it can end." }, { status: 403 });
      }
      return NextResponse.json({ error: "Your demo preview is complete. Please log in or create an account to access the full report." }, { status: 403 });
    }

    const agent = new InterviewAgent();
    const report = await agent.generateFinalReport(sessionId);

    saveReport(report);

    return NextResponse.json({ report, sessionId });
  } catch (error) {
    console.error("[/api/interview/finish]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
