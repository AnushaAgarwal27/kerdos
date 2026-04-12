import { NextRequest, NextResponse } from "next/server";
import { DEMO_USER_ID } from "@/lib/demoUser";
import { getStoredPlaidUser } from "@/lib/server/localStore";
import { getTransactionsWithRetry, summarizeTransactions } from "@/lib/server/plaid";

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId")?.trim() || DEMO_USER_ID;
    const limit = Number.parseInt(request.nextUrl.searchParams.get("limit") ?? "50", 10);
    const storedUser = await getStoredPlaidUser(userId);

    if (!storedUser) {
      return NextResponse.json({ error: "No Plaid connection found for this user" }, { status: 404 });
    }

    const transactions = (
      await Promise.all(storedUser.items.map((item) => getTransactionsWithRetry(item.accessToken)))
    ).flat();
    const accountFilter = new Set(storedUser.linkedCards.map((card) => card.plaidAccountId));
    const normalized = summarizeTransactions(
      transactions.filter((transaction) => accountFilter.has(transaction.account_id)).slice(0, Math.max(limit, 1))
    );

    return NextResponse.json({
      userId,
      linkedCards: storedUser.linkedCards,
      transactions: normalized,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Plaid transactions error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
