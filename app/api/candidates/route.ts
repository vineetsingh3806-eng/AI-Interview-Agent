import { NextResponse } from "next/server";
import candidatesData from "@/data/candidates.json";
import type { Candidate } from "@/types";

export async function GET() {
  return NextResponse.json(candidatesData as Candidate[]);
}
