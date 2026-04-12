import { NextRequest, NextResponse } from "next/server";
import { DEMO_USER_ID } from "@/lib/demoUser";
import { getUserRewardsSummary } from "@/lib/server/rewardsLedger";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId")?.trim() || DEMO_USER_ID;
    const summary = await getUserRewardsSummary(userId);
    return NextResponse.json(summary);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
