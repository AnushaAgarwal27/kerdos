const KEY = 'plaid_linked_cards';

export type LinkedCardMapping = {
  plaidAccountId: string;
  plaidName:      string;
  plaidMask:      string;
  cardId:         string; // dynamic card identifier, typically the rewardscc cardKey
  cardKey?:       string;
  cardName?:      string;
  cardIssuer?:    string;
};

export function getLinkedCards(): LinkedCardMapping[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as LinkedCardMapping[]) : null;
  } catch {
    return null;
  }
}

function mergeLinkedCardMappings(cards: LinkedCardMapping[]): LinkedCardMapping[] {
  const byAccountId = new Map<string, LinkedCardMapping>();

  for (const card of cards) {
    byAccountId.set(card.plaidAccountId, card);
  }

  return [...byAccountId.values()];
}

export function setLinkedCards(cards: LinkedCardMapping[]): void {
  if (typeof window === 'undefined') return;
  const existing = getLinkedCards() ?? [];
  localStorage.setItem(KEY, JSON.stringify(mergeLinkedCardMappings([...existing, ...cards])));
}

export function clearLinkedCards(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(KEY);
}

export function getLinkedCardIds(): string[] | null {
  const cards = getLinkedCards();
  return cards ? cards.map(c => c.cardId) : null;
}
