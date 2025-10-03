// app/api/current-week/route.ts
import { NextResponse } from "next/server";
import { getCurrentNflWeek } from "@/lib/server";

export const runtime = "nodejs"; // make sure we’re in a Node runtime

export async function GET() {
  const week = (await getCurrentNflWeek()) ?? 1;
  return NextResponse.json({ week });
}
