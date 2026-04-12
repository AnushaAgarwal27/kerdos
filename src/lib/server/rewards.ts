import "server-only";

import { normalizeCategory, SMARTSWIPE_CATEGORIES, type SmartSwipeCategory } from "@/lib/server/cardCatalog";
import { env } from "@/lib/server/env";

const BASE = "https://rewards-credit-card-api.p.rapidapi.com";

export const DEFAULT_FALLBACK_CARD_KEYS = [
  "amex-gold",
  "chase-sapphirepreferred",
  "citi-doublecash",
  "discover-cashback",
  "capitalone-venture",
];

const HEADERS = {
  "x-rapidapi-key": env.REWARDSCC_API_KEY,
  "x-rapidapi-host": "rewards-credit-card-api.p.rapidapi.com",
  "Content-Type": "application/json",
};

type RewardsSpendCategory = {
  spendBonusCategoryGroup?: string | null;
  spendBonusCategoryName?: string | null;
  spendBonusSubcategoryGroup?: string | null;
  earnMultiplier?: number | null;
};

type RewardsCardDetail = {
  cardKey?: string | null;
  cardName?: string | null;
  cardIssuer?: string | null;
  cardNetwork?: string | null;
  annualFee?: number | null;
  baseSpendEarnValuation?: number | null;
  baseSpendEarnIsCash?: number | null;
  baseSpendEarnCurrency?: string | null;
  spendBonusCategory?: RewardsSpendCategory[] | null;
};

type SearchResult = {
  cardKey?: string | null;
  cardName?: string | null;
  cardIssuer?: string | null;
  cardNetwork?: string | null;
};

type CardImageResult = {
  cardImageUrl?: string | null;
};

export type RewardCardProfile = {
  id: string;
  cardKey: string;
  cardName: string | null;
  cardIssuer: string | null;
  cardNetwork: string | null;
  annualFee: number | null;
  pointValuation: number | null;
  isCashback: boolean;
  baseSpendEarnCurrency: string;
  rewardRates: Record<SmartSwipeCategory, number>;
  imageUrl: string | null;
};

// In-process cache so repeated name-search queries (same word, multiple accounts) hit the API only once per process lifetime
const _nameSearchCache = new Map<string, SearchResult[]>();

async function getJson(path: string, revalidate = 3600): Promise<unknown> {
  const response = await fetch(`${BASE}${path}`, {
    headers: HEADERS,
    next: { revalidate },
  });

  if (!response.ok) {
    throw new Error(`rewardscc ${path}: ${response.status}`);
  }

  return response.json();
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function toArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  return value ? [value as T] : [];
}

function extractRewardRates(card: RewardsCardDetail): Record<SmartSwipeCategory, number> {
  const rates = SMARTSWIPE_CATEGORIES.reduce((acc, category) => {
    acc[category] = 1;
    return acc;
  }, {} as Record<SmartSwipeCategory, number>);

  for (const item of card.spendBonusCategory ?? []) {
    const keys = [
      item.spendBonusCategoryName ?? "",
      item.spendBonusSubcategoryGroup ?? "",
      item.spendBonusCategoryGroup ?? "",
    ];
    const rate = item.earnMultiplier ?? 1;

    for (const key of keys) {
      const category = normalizeCategory(key);
      if (category && rate > rates[category]) {
        rates[category] = rate;
        break;
      }
    }
  }

  return rates;
}

function buildProfile(detail: RewardsCardDetail, imageUrl: string | null = null): RewardCardProfile {
  return {
    id: detail.cardKey ?? "unknown-card",
    cardKey: detail.cardKey ?? "unknown-card",
    cardName: detail.cardName ?? null,
    cardIssuer: detail.cardIssuer ?? null,
    cardNetwork: detail.cardNetwork ?? null,
    annualFee: detail.annualFee ?? null,
    pointValuation: detail.baseSpendEarnValuation ?? null,
    isCashback: detail.baseSpendEarnIsCash === 1,
    baseSpendEarnCurrency: detail.baseSpendEarnCurrency ?? "points",
    rewardRates: extractRewardRates(detail),
    imageUrl,
  };
}

export async function getCardProfile(cardKey: string): Promise<RewardCardProfile> {
  const [detailRaw, imageRaw] = await Promise.all([
    getJson(`/creditcard-detail-bycard/${cardKey}`),
    getJson(`/creditcard-card-image/${cardKey}`).catch(() => null),
  ]);
  const detail = toArray<RewardsCardDetail>(detailRaw)[0];
  if (!detail) {
    throw new Error(`Card detail not found for key: ${cardKey}`);
  }
  const imageUrl = toArray<CardImageResult>(imageRaw)[0]?.cardImageUrl ?? null;
  return buildProfile(detail, imageUrl);
}

export async function getCardsByKeys(cardKeys: string[]): Promise<RewardCardProfile[]> {
  const unique = [...new Set(cardKeys.filter(Boolean))];
  return Promise.all(unique.map((cardKey) => getCardProfile(cardKey)));
}

export async function searchRewardsCards(query: string): Promise<SearchResult[]> {
  const trimmed = dedupeQueryWords(query);
  if (!trimmed) return [];
  const cacheKey = trimmed.toLowerCase();
  if (_nameSearchCache.has(cacheKey)) return _nameSearchCache.get(cacheKey)!;
  try {
    const raw = await getJson(`/creditcard-detail-namesearch/${encodeURIComponent(trimmed)}`, 3600);
    const results = toArray<SearchResult>(raw);
    _nameSearchCache.set(cacheKey, results);
    return results;
  } catch (error) {
    if (error instanceof Error && error.message.includes(": 429")) {
      _nameSearchCache.set(cacheKey, []);
      return [];
    }

    throw error;
  }
}

function normalizeSearchText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function dedupeQueryWords(value: string) {
  const words = normalizeSearchText(value).split(" ").filter(Boolean);
  const deduped: string[] = [];

  for (const word of words) {
    if (deduped[deduped.length - 1] !== word) {
      deduped.push(word);
    }
  }

  return deduped.join(" ").trim();
}

const ISSUER_ALIASES: Record<string, string[]> = {
  "american express": ["american express", "amex"],
  "bank of america": ["bank of america", "bofa"],
  "capital one": ["capital one", "capitalone"],
  chase: ["chase"],
  citi: ["citi", "citibank"],
  discover: ["discover"],
  "us bank": ["us bank", "u s bank", "usbank"],
  "wells fargo": ["wells fargo", "wells"],
  truist: ["truist"],
  pnc: ["pnc"],
  barclays: ["barclays"],
  synchrony: ["synchrony"],
  "navy federal": ["navy federal", "nfcu"],
};

const GENERIC_QUERY_TOKENS = new Set([
  "card",
  "credit",
  "visa",
  "mastercard",
  "world",
  "worldelite",
  "signature",
  "rewards",
  "bank",
  "account",
  "plaid",
]);

function detectExpectedIssuer(queries: string[]) {
  const haystack = normalizeSearchText(queries.join(" "));

  for (const [issuer, aliases] of Object.entries(ISSUER_ALIASES)) {
    if (aliases.some((alias) => haystack.includes(normalizeSearchText(alias)))) {
      return issuer;
    }
  }

  return null;
}

function getDistinctiveTokens(queries: string[]) {
  return [...new Set(
    queries
      .flatMap((query) => normalizeSearchText(query).split(" "))
      .filter((token) => token.length > 2 && !GENERIC_QUERY_TOKENS.has(token))
  )];
}

function buildSearchQueries(input: { name: string; officialName?: string | null }) {
  const rawQueries = [input.officialName ?? "", input.name]
    .map((value) => dedupeQueryWords(value))
    .filter(Boolean);
  const expectedIssuer = detectExpectedIssuer(rawQueries);
  const distinctiveTokens = getDistinctiveTokens(rawQueries);
  const searchQueries = new Set<string>();

  for (const query of rawQueries) {
    searchQueries.add(query);

    const normalizedTokens = normalizeSearchText(query)
      .split(" ")
      .filter((token) => token.length > 1 && !GENERIC_QUERY_TOKENS.has(token));

    if (normalizedTokens.length > 0) {
      searchQueries.add(normalizedTokens.join(" "));
      searchQueries.add(normalizedTokens.slice(0, 4).join(" "));
    }
  }

  if (expectedIssuer) {
    searchQueries.add(expectedIssuer);
    if (distinctiveTokens.length > 0) {
      searchQueries.add(`${expectedIssuer} ${distinctiveTokens.join(" ")}`.trim());
      searchQueries.add(`${expectedIssuer} ${distinctiveTokens.slice(0, 2).join(" ")}`.trim());
    }
  }

  for (const token of distinctiveTokens) {
    searchQueries.add(token);
    if (expectedIssuer) {
      searchQueries.add(`${expectedIssuer} ${token}`.trim());
    }
  }

  return [...searchQueries].filter((query) => query.length >= 3);
}

function scoreSearchResult(result: SearchResult, queries: string[]) {
  const haystack = normalizeSearchText(`${result.cardIssuer ?? ""} ${result.cardName ?? ""} ${result.cardKey ?? ""}`);
  const expectedIssuer = detectExpectedIssuer(queries);
  const issuerText = normalizeSearchText(result.cardIssuer ?? "");
  let score = queries.reduce((current, query) => {
    const normalized = normalizeSearchText(query);
    if (!normalized) return current;
    if (haystack === normalized) return current + 200;
    if (haystack.includes(normalized)) return current + 100;
    const tokens = normalized.split(" ").filter(Boolean);
    return current + tokens.filter((token) => haystack.includes(token)).length * 10;
  }, 0);

  if (expectedIssuer) {
    const aliases = ISSUER_ALIASES[expectedIssuer] ?? [expectedIssuer];
    if (aliases.some((alias) => issuerText.includes(normalizeSearchText(alias)))) {
      score += 250;
    } else {
      score -= 300;
    }
  }

  const distinctiveTokens = getDistinctiveTokens(queries);
  const overlaps = distinctiveTokens.filter((token) => haystack.includes(token));
  score += overlaps.length * 35;

  if (distinctiveTokens.length > 0 && overlaps.length === 0) {
    score -= 200;
  }

  return score;
}

export async function resolveCardFromPlaidName(input: {
  name: string;
  officialName?: string | null;
}): Promise<RewardCardProfile | null> {
  const queries = buildSearchQueries(input);
  const expectedIssuer = detectExpectedIssuer(queries);
  const distinctiveTokens = getDistinctiveTokens(queries);

  const candidates = new Map<string, { result: SearchResult; score: number }>();

  let apiCallCount = 0;
  for (const query of queries) {
    // Throttle: insert a small delay between actual (non-cached) API calls to stay within rate limits
    const cacheKey = query.trim().toLowerCase();
    const wasCached = _nameSearchCache.has(cacheKey);
    if (!wasCached && apiCallCount > 0) await sleep(300);

    const results = await searchRewardsCards(query);
    if (!wasCached) apiCallCount++;

    for (const result of results) {
      if (!result.cardKey) continue;
      const score = scoreSearchResult(result, queries);
      const existing = candidates.get(result.cardKey);
      if (!existing || score > existing.score) {
        candidates.set(result.cardKey, { result, score });
      }
    }

    // Early exit: if we already have a highly confident match, stop firing more queries
    const best = [...candidates.values()].sort((a, b) => b.score - a.score)[0];
    if (best && best.score >= 400) break;
  }

  const ranked = [...candidates.values()].sort((left, right) => right.score - left.score);

  for (const candidate of ranked) {
    if (!candidate.result.cardKey) continue;
    if (candidate.score < 120) continue;

    const haystack = normalizeSearchText(
      `${candidate.result.cardIssuer ?? ""} ${candidate.result.cardName ?? ""} ${candidate.result.cardKey ?? ""}`
    );
    if (expectedIssuer) {
      const aliases = ISSUER_ALIASES[expectedIssuer] ?? [expectedIssuer];
      const issuerMatched = aliases.some((alias) => haystack.includes(normalizeSearchText(alias)));
      if (!issuerMatched) continue;
    }
    if (distinctiveTokens.length > 0 && !distinctiveTokens.some((token) => haystack.includes(token))) {
      continue;
    }

    try {
      return await getCardProfile(candidate.result.cardKey);
    } catch {
      continue;
    }
  }

  return null;
}

function pickNumeric(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value.replace(/[^0-9.-]/g, ""));
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

type MerchantSpendPayload = Record<string, unknown>;

export async function getMerchantSpecificValue(
  cardKey: string,
  merchant: string,
  merchantType: string
): Promise<{ estimatedValue: number; rewardRate: number; source: "merchant" } | null> {
  try {
    const raw = await getJson(
      `/creditcard-spend-googlemaps/${cardKey}/${encodeURIComponent(merchant)}/${encodeURIComponent(merchantType)}`,
      900
    );
    const payload = toArray<MerchantSpendPayload>(raw)[0] ?? {};
    const estimatedValue =
      pickNumeric(payload.cashValue) ??
      pickNumeric(payload.rewardValue) ??
      pickNumeric(payload.earnValue) ??
      pickNumeric(payload.pointValue);
    const rewardRate =
      pickNumeric(payload.earnMultiplier) ??
      pickNumeric(payload.rewardRate) ??
      pickNumeric(payload.pointsPerDollar);

    if (estimatedValue === null && rewardRate === null) {
      return null;
    }

    return {
      estimatedValue: estimatedValue ?? 0,
      rewardRate: rewardRate ?? 1,
      source: "merchant",
    };
  } catch {
    return null;
  }
}
