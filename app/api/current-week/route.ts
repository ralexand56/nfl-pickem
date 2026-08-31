// app/api/current-week/route.ts
import { NextResponse } from "next/server";
import { getCurrentNfl } from "@/lib/server";

export const runtime = "nodejs"; // make sure we’re in a Node runtime

export async function GET() {
  const { week, season } = await getCurrentNfl();
  return NextResponse.json({
    week: week ?? 1,
    season: season ?? new Date().getFullYear(),
  });
}
