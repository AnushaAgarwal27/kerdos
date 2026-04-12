import { NextRequest, NextResponse } from "next/server";
import { DEMO_USER_ID } from "@/lib/demoUser";
import { getStoredPlaidUser } from "@/lib/server/localStore";
import { getCardsByKeys } from "@/lib/server/rewards";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId")?.trim() || DEMO_USER_ID;
    const requestedCardKeys = request.nextUrl.searchParams.getAll("cardKey").filter(Boolean);

    if (requestedCardKeys.length > 0) {
      return NextResponse.json(await getCardsByKeys(requestedCardKeys));
    }

    const storedUser = await getStoredPlaidUser(userId);
    if (storedUser?.linkedCards.length) {
      return NextResponse.json(
        await getCardsByKeys(storedUser.linkedCards.map((card) => card.cardKey ?? card.cardId))
      );
    }

    return NextResponse.json([]);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("rewardscc error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

