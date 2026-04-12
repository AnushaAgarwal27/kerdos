import "server-only";

export const CATEGORY_MAP: Record<string, string> = {
  dining: "dining",
  "all dining": "dining",
  restaurants: "dining",
  restaurant: "dining",
  groceries: "groceries",
  "grocery stores": "groceries",
  grocery: "groceries",
  supermarkets: "groceries",
  supermarket: "groceries",
  travel: "travel",
  "all airfare": "travel",
  airfare: "travel",
  flights: "travel",
  hotels: "travel",
  hotel: "travel",
  gas: "gas",
  fuel: "gas",
  "gas stations": "gas",
  entertainment: "entertainment",
  streaming: "entertainment",
  movies: "entertainment",
  other: "other",
};

export const SMARTSWIPE_CATEGORIES = [
  "dining",
  "groceries",
  "travel",
  "gas",
  "entertainment",
  "other",
] as const;

export type SmartSwipeCategory = (typeof SMARTSWIPE_CATEGORIES)[number];

export function normalizeCategory(input: string | null | undefined): SmartSwipeCategory | null {
  if (!input) return null;
  const normalized = CATEGORY_MAP[input.trim().toLowerCase()];
  return (normalized as SmartSwipeCategory | undefined) ?? null;
}

export function sanitizeCardKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
