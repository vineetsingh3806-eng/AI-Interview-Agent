import { NextResponse } from "next/server";
import { loadReport } from "@/lib/session";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const report = loadReport(sessionId);

  if (!report) {
    return NextResponse.json(
      { error: "Report not found. Interview may still be processing." },
      { status: 404 }
    );
  }

  return NextResponse.json(report);
}
