import "server-only";

import type { Transaction } from "plaid";
import { normalizeCategory, type SmartSwipeCategory } from "@/lib/server/cardCatalog";
import type { StoredLinkedCard } from "@/lib/server/localStore";
import { getMerchantSpecificValue, getCardProfile, type RewardCardProfile } from "@/lib/server/rewards";
import { inferCategoryFromTransaction } from "@/lib/server/plaid";

export type SmartSwipeRecommendation = {
  cardId: string;
  cardKey: string;
  cardName: string | null;
  issuer: string | null;
  rate: number;
  estimatedValue: number;
  rewardCurrency: string;
  reason: string;
  source: "merchant" | "category";
};

export type SmartSwipeResponse = {
  winner: SmartSwipeRecommendation | null;
  rankings: SmartSwipeRecommendation[];
  meta: {
    amount: number;
    merchant: string | null;
    category: SmartSwipeCategory;
    source: "merchant" | "category";
    userId: string;
    linkedCardCount: number;
  };
};

function scoreCategoryCard(profile: RewardCardProfile, amount: number, category: SmartSwipeCategory) {
  const rate = profile.rewardRates[category] ?? profile.rewardRates.other ?? 1;
  const estimatedValue = profile.isCashback
    ? (rate / 100) * amount
    : amount * rate * ((profile.pointValuation ?? 1) / 100);

  return {
    rate,
    estimatedValue,
    source: "category" as const,
  };
}

type ScoreResult = {
  rate: number;
  estimatedValue: number;
  source: "merchant" | "category";
};

function categoryReason(profile: RewardCardProfile, category: SmartSwipeCategory, rate: number, estimatedValue: number) {
  const issuer = profile.cardIssuer ?? "This card";
  return `${issuer} earns ${rate}x on ${category}, worth about $${estimatedValue.toFixed(2)} on this purchase.`;
}

function merchantReason(profile: RewardCardProfile, merchant: string, estimatedValue: number) {
  const issuer = profile.cardIssuer ?? "This card";
  return `${issuer} has the strongest merchant-specific return for ${merchant}, worth about $${estimatedValue.toFixed(2)} here.`;
}

// Well-known merchants → category, used when the RewardsCC merchant API returns null
const KNOWN_MERCHANT_CATEGORIES: Array<[string[], SmartSwipeCategory]> = [
  [["starbucks", "dunkin", "mcdonald", "chipotle", "subway", "taco bell", "chick-fil", "wendy", "burger king", "domino", "pizza hut", "panera", "shake shack", "sweetgreen", "nobu", "olive garden", "applebee", "cheesecake factory", "red lobster", "ihop", "denny"], "dining"],
  [["whole foods", "trader joe", "safeway", "kroger", "costco", "walmart", "target", "publix", "aldi", "wegman", "sprouts", "fresh market", "giant", "stop & shop", "h-e-b", "market basket"], "groceries"],
  [["american airlines", "delta", "united", "southwest", "jetblue", "alaska airlines", "spirit airlines", "frontier", "british airways", "lufthansa", "air france", "marriott", "hilton", "hyatt", "sheraton", "westin", "holiday inn", "hampton inn", "airbnb", "vrbo", "expedia", "booking.com", "priceline", "kayak", "hertz", "enterprise", "avis", "budget", "lyft", "uber", "amtrak"], "travel"],
  [["shell", "chevron", "exxon", "mobil", "bp", "marathon", "sunoco", "circle k", "speedway", "wawa", "casey"], "gas"],
  [["netflix", "spotify", "hulu", "disney", "apple tv", "hbo", "amazon prime", "youtube premium", "amc", "regal", "cinemark", "ticketmaster", "stubhub", "eventbrite", "twitch", "xbox", "playstation", "steam"], "entertainment"],
];

function inferCategoryFromMerchantName(merchant: string): SmartSwipeCategory | null {
  const normalized = merchant.trim().toLowerCase();
  for (const [keywords, category] of KNOWN_MERCHANT_CATEGORIES) {
    if (keywords.some((kw) => normalized.includes(kw))) return category;
  }
  return null;
}

export function inferCategoryFromMerchantHistory(merchant: string | null | undefined, transactions: Transaction[]): SmartSwipeCategory | null {
  if (!merchant) return null;
  const normalizedMerchant = merchant.trim().toLowerCase();
  if (!normalizedMerchant) return null;

  // First try static lookup — fast and reliable for well-known merchants
  const staticCategory = inferCategoryFromMerchantName(merchant);
  if (staticCategory) return staticCategory;

  // Then fall back to transaction history matching
  const scores = new Map<SmartSwipeCategory, number>();
  for (const transaction of transactions) {
    const txMerchant = (transaction.merchant_name ?? transaction.name ?? "").toLowerCase();
    if (!txMerchant || !txMerchant.includes(normalizedMerchant)) continue;
    const category = inferCategoryFromTransaction(transaction);
    scores.set(category, (scores.get(category) ?? 0) + 1);
  }

  const ranked = [...scores.entries()].sort((a, b) => b[1] - a[1]);
  return ranked[0]?.[0] ?? null;
}

function merchantTypeFromCategory(category: SmartSwipeCategory): string {
  switch (category) {
    case "dining":
      return "restaurant";
    case "groceries":
      return "grocery_store";
    case "travel":
      return "travel";
    case "gas":
      return "gas_station";
    case "entertainment":
      return "entertainment";
    default:
      return "other";
  }
}

function dedupeRecommendationCards(linkedCards: StoredLinkedCard[]) {
  const byCardKey = new Map<string, StoredLinkedCard>();

  for (const card of linkedCards) {
    const key = card.cardKey ?? card.cardId;
    if (!key || byCardKey.has(key)) continue;
    byCardKey.set(key, card);
  }

  return [...byCardKey.values()];
}

export async function buildSmartSwipeRecommendation(input: {
  userId: string;
  amount: number;
  merchant?: string | null;
  category?: string | null;
  linkedCards: StoredLinkedCard[];
  transactions: Transaction[];
}): Promise<SmartSwipeResponse> {
  // Merchant name overrides the selected category when it maps to something specific
  const merchantCategory = inferCategoryFromMerchantName(input.merchant ?? "");
  const inferredCategory =
    merchantCategory ??
    normalizeCategory(input.category) ??
    inferCategoryFromMerchantHistory(input.merchant, input.transactions) ??
    "other";

  const uniqueLinkedCards = dedupeRecommendationCards(input.linkedCards);

  const profiles = await Promise.all(
    uniqueLinkedCards
      .filter((card) => Boolean(card.cardKey ?? card.cardId))
      .map((card) => getCardProfile(card.cardKey ?? card.cardId))
  );

  const merchantType = merchantTypeFromCategory(inferredCategory);

  const rankings = await Promise.all(
    profiles.map(async (profile) => {
      const fallback = scoreCategoryCard(profile, input.amount, inferredCategory);
      const merchantSpecific = input.merchant
        ? await getMerchantSpecificValue(profile.cardKey, input.merchant, merchantType)
        : null;

      // Only use merchant-specific rate when it's meaningfully better than 1x.
      // Recompute estimatedValue ourselves (scaled by amount) since the API
      // doesn't receive amount and returns per-dollar values.
      const score: ScoreResult = (() => {
        if (!merchantSpecific || merchantSpecific.rewardRate <= 1) return fallback;
        const rate = merchantSpecific.rewardRate;
        const estimatedValue = profile.isCashback
          ? (rate / 100) * input.amount
          : input.amount * rate * ((profile.pointValuation ?? 1) / 100);
        return { rate, estimatedValue, source: "merchant" as const };
      })();

      // If merchant scoring lost to category scoring, use category but keep source honest
      const best = score.estimatedValue >= fallback.estimatedValue ? score : fallback;

      return {
        cardId: profile.id,
        cardKey: profile.cardKey,
        cardName: profile.cardName,
        issuer: profile.cardIssuer,
        rate: best.rate,
        estimatedValue: best.estimatedValue,
        rewardCurrency: profile.baseSpendEarnCurrency,
        reason: best.source === "merchant"
          ? merchantReason(profile, input.merchant ?? "this merchant", best.estimatedValue)
          : categoryReason(profile, inferredCategory, best.rate, best.estimatedValue),
        source: best.source,
      };
    })
  );

  rankings.sort((left, right) => right.estimatedValue - left.estimatedValue);

  return {
    winner: rankings[0] ?? null,
    rankings,
    meta: {
      amount: input.amount,
      merchant: input.merchant ?? null,
      category: inferredCategory,
      source: rankings[0]?.source ?? "category",
      userId: input.userId,
      linkedCardCount: uniqueLinkedCards.length,
    },
  };
}
