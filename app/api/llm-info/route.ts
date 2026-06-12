import { NextResponse } from "next/server";
import { currentProvider } from "@/lib/agents/llm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/llm-info → which provider + model are currently powering the agents. */
export async function GET() {
  return NextResponse.json({ data: currentProvider(), error: null });
}
