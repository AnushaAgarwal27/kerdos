import { NextRequest, NextResponse } from "next/server";
import { DEMO_USER_ID } from "@/lib/demoUser";
import { getStoredPlaidUser } from "@/lib/server/localStore";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId")?.trim() || DEMO_USER_ID;
    const storedUser = await getStoredPlaidUser(userId);
    const linkedCards = [...new Map(
      (storedUser?.linkedCards ?? []).map((card) => [card.cardKey ?? card.cardId, card])
    ).values()];

    return NextResponse.json({
      userId,
      linkedCards,
      connected: Boolean(storedUser),
      updatedAt: storedUser?.updatedAt ?? null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
