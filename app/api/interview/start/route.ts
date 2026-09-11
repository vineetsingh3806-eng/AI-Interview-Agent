import { NextRequest, NextResponse } from "next/server";
import { InterviewAgent } from "@/agents/InterviewAgent";

export async function POST(req: NextRequest) {
  try {
    const { candidateId, candidateName, targetSkill, interviewLevel } = await req.json();
    if (!candidateId) return NextResponse.json({ error: "candidateId is required" }, { status: 400 });

    const agent = new InterviewAgent();
    const { session, firstMessage } = await agent.startInterview(candidateId, candidateName, targetSkill, interviewLevel);

    return NextResponse.json({
      sessionId: session.sessionId,
      firstMessage,
      session,
    });
  } catch (error) {
    console.error("[/api/interview/start]", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal server error" }, { status: 500 });
  }
}
