import { NextResponse } from "next/server";
import { DEMO_USER_ID } from "@/lib/demoUser";
import { getStoredPlaidUser } from "@/lib/server/localStore";
import { getTransactionsWithRetry } from "@/lib/server/plaid";
import { DEFAULT_FALLBACK_CARD_KEYS } from "@/lib/server/rewards";
import { buildSmartSwipeRecommendation } from "@/lib/server/smartswipe";

type RecommendationPayload = {
  amount?: number | string;
  merchant?: string;
  category?: string;
  userId?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RecommendationPayload;
    const userId = body.userId?.trim() || DEMO_USER_ID;
    const amount = typeof body.amount === "string" ? Number.parseFloat(body.amount) : body.amount;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "A valid amount is required" }, { status: 400 });
    }

    const storedUser = await getStoredPlaidUser(userId);
    const linkedCards =
      storedUser?.linkedCards.length
        ? storedUser.linkedCards
        : DEFAULT_FALLBACK_CARD_KEYS.map((cardKey) => ({
            plaidAccountId: `fallback-${cardKey}`,
            plaidName: cardKey,
            plaidMask: "0000",
            cardId: cardKey,
            cardKey,
          }));

    const transactions = storedUser?.linkedCards.length
      ? (
          await Promise.all(
            storedUser.items.map((item) => getTransactionsWithRetry(item.accessToken))
          )
        ).flat()
      : [];
    const accountIds = new Set(linkedCards.map((card) => card.plaidAccountId));
    const relevantTransactions = transactions.filter((transaction) => accountIds.has(transaction.account_id));

    const recommendation = await buildSmartSwipeRecommendation({
      userId,
      amount,
      merchant: body.merchant ?? null,
      category: body.category ?? null,
      linkedCards,
      transactions: relevantTransactions,
    });

    return NextResponse.json(recommendation);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("smartswipe recommendation error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
