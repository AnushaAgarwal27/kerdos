import { NextResponse } from "next/server";
import { DEMO_USER_ID } from "@/lib/demoUser";
import { resetUserRewardsLedger } from "@/lib/server/rewardsLedger";

type ResetPayload = {
  userId?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as ResetPayload;
    const userId = body.userId?.trim() || DEMO_USER_ID;
    const summary = await resetUserRewardsLedger(userId);
    return NextResponse.json({ reset: true, summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
