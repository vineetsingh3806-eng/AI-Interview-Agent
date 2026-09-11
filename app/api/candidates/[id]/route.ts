import { NextResponse } from "next/server";
import candidatesData from "@/data/candidates.json";
import type { Candidate } from "@/types";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const candidate = (candidatesData as Candidate[]).find((c) => c.id === id);
  if (!candidate) {
    return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
  }
  return NextResponse.json(candidate);
}
