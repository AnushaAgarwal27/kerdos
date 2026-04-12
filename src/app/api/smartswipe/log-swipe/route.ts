import { NextResponse } from "next/server";
import { DEMO_USER_ID } from "@/lib/demoUser";
import { logSwipeTransaction } from "@/lib/server/rewardsLedger";

type LogSwipePayload = {
  userId?: string;
  cardId?: string;
  amount?: number | string;
  merchant?: string | null;
  category?: string;
  estimatedValue?: number | string;
  rate?: number | string;
  rewardCurrency?: string;
};

function calculateRewardUnits(amount: number, rate: number, rewardCurrency: string) {
  if (rewardCurrency.toLowerCase().includes("point")) {
    return Math.round(amount * rate);
  }

  return Number(((rate / 100) * amount).toFixed(2));
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LogSwipePayload;
    const userId = body.userId?.trim() || DEMO_USER_ID;
    const amount = typeof body.amount === "string" ? Number.parseFloat(body.amount) : body.amount;
    const estimatedValue =
      typeof body.estimatedValue === "string" ? Number.parseFloat(body.estimatedValue) : body.estimatedValue;
    const rate = typeof body.rate === "string" ? Number.parseFloat(body.rate) : body.rate;

    if (!body.cardId || !amount || amount <= 0 || !estimatedValue || estimatedValue <= 0 || !rate || rate <= 0 || !body.category) {
      return NextResponse.json({ error: "cardId, amount, category, estimatedValue, and rate are required" }, { status: 400 });
    }

    const transaction = await logSwipeTransaction({
      userId,
      cardId: body.cardId,
      amount,
      merchant: body.merchant ?? null,
      category: body.category,
      estimatedValue,
      rate,
      rewardCurrency: body.rewardCurrency ?? "points",
      rewardUnitsEarned: calculateRewardUnits(amount, rate, body.rewardCurrency ?? "points"),
    });

    return NextResponse.json({ logged: true, transaction });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
