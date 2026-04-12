"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, Zap } from "lucide-react";
import MarketTicker from "@/components/MarketTicker";
import { DEMO_USER_ID } from "@/lib/demoUser";

const CATEGORIES = [
  { id: "dining", label: "Dining", icon: "DIN" },
  { id: "groceries", label: "Groceries", icon: "GRC" },
  { id: "travel", label: "Travel", icon: "TRV" },
  { id: "gas", label: "Gas", icon: "GAS" },
  { id: "entertainment", label: "Entertainment", icon: "ENT" },
  { id: "other", label: "Other", icon: "OTH" },
] as const;

type LinkedCardsResponse = {
  linkedCards: { cardId: string }[];
};

type RewardsSummary = {
  totalEarned?: number;
  totalPoints?: number;
  totalSpend?: number;
};

type CardResult = {
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

type RecommendationResponse = {
  winner: CardResult | null;
  rankings: CardResult[];
  meta: {
    category: string;
    source: "merchant" | "category";
    linkedCardCount: number;
  };
};

export default function SmartSwipePage() {
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("");
  const [merchant, setMerchant] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]["id"]>("dining");
  const [results, setResults] = useState<RecommendationResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLogging, setIsLogging] = useState(false);
  const [linkedCardIds, setLinkedCardIds] = useState<string[]>([]);
  const [summary, setSummary] = useState<RewardsSummary>({});
  const [error, setError] = useState<string | null>(null);
  const [logMessage, setLogMessage] = useState<string | null>(null);
  const [loggedForResult, setLoggedForResult] = useState(false);

  const parsedAmount = Number.parseFloat(amount) || 0;
  const effectiveLinkedCount = linkedCardIds.length;
  const rankingList = results?.rankings ?? [];
  const best = results?.winner ?? null;
  const barMax = rankingList[0]?.estimatedValue && rankingList[0].estimatedValue > 0
    ? rankingList[0].estimatedValue
    : 1;

  async function refreshSummary() {
    const nextSummary = await fetch(`/api/rewards/summary?userId=${DEMO_USER_ID}`, { cache: "no-store" })
      .then((response) => response.json()) as RewardsSummary;
    setSummary(nextSummary);
    return nextSummary;
  }

  useEffect(() => {
    fetch(`/api/plaid/linked-cards?userId=${DEMO_USER_ID}`, { cache: "no-store" })
      .then((response) => response.json())
      .then((data: LinkedCardsResponse) => setLinkedCardIds(data.linkedCards.map((card) => card.cardId)))
      .catch(() => {})
      .finally(() => setLoading(false));

    refreshSummary().catch(() => {});
  }, []);

  const analyze = async () => {
    if (parsedAmount <= 0) return;

    setIsAnalyzing(true);
    setResults(null);
    setError(null);
    setLogMessage(null);
    setLoggedForResult(false);

    try {
      const response = await fetch("/api/smartswipe/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: DEMO_USER_ID,
          amount: parsedAmount,
          merchant: merchant || undefined,
          category,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Recommendation failed");
      }

      setResults(data as RecommendationResponse);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Recommendation failed");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const logSwipe = async () => {
    if (!best || !results || loggedForResult) return;

    setIsLogging(true);
    setLogMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/smartswipe/log-swipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: DEMO_USER_ID,
          cardId: best.cardId,
          amount: parsedAmount,
          merchant: merchant || null,
          category: results.meta.category,
          estimatedValue: best.estimatedValue,
          rate: best.rate,
          rewardCurrency: best.rewardCurrency,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to log swipe");
      }

      const nextSummary = await refreshSummary();
      setLoggedForResult(true);
      setLogMessage(`Swipe logged. Total rewards are now $${(nextSummary.totalEarned ?? 0).toFixed(2)}.`);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to log swipe");
    } finally {
      setIsLogging(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="px-4 pt-12 pb-3">
        <span className="text-[10px] font-bold tracking-widest" style={{ color: "var(--green)" }}>SMARTSWIPE</span>
        <h1 className="text-2xl font-bold text-white mt-1">Best Card Recommender</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-2)" }}>
          {loading
            ? "Loading linked cards..."
            : effectiveLinkedCount > 0
              ? `${effectiveLinkedCount} linked card${effectiveLinkedCount !== 1 ? "s" : ""} synced to SmartSwipe`
              : "No linked cards yet. You can still test recommendations with the demo catalog."}
        </p>
      </div>

      <MarketTicker />

      <div className="px-4 pt-4 space-y-3 pb-6">
        <div className="fid-card px-4 py-4">
          <p className="text-xs mb-1 font-semibold" style={{ color: "var(--text-2)" }}>LOGGED REWARDS</p>
          <p className="text-3xl font-bold text-white">${(summary.totalEarned ?? 0).toFixed(2)}</p>
          <div className="mt-2 flex flex-wrap gap-4 text-xs" style={{ color: "var(--text-2)" }}>
            <span>{(summary.totalPoints ?? 0).toLocaleString()} points</span>
            <span>${(summary.totalSpend ?? 0).toFixed(2)} spend tracked</span>
          </div>
        </div>

        <div className="fid-card px-4 py-4">
          <p className="text-xs mb-2 font-semibold" style={{ color: "var(--text-2)" }}>AMOUNT</p>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-light" style={{ color: "var(--text-2)" }}>$</span>
            <input
              type="number"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="0.00"
              className="flex-1 bg-transparent text-3xl font-bold text-white focus:outline-none"
            />
          </div>
        </div>

        <div className="fid-card px-4 py-4">
          <p className="text-xs mb-2 font-semibold" style={{ color: "var(--text-2)" }}>MERCHANT (optional)</p>
          <input
            type="text"
            value={merchant}
            onChange={(event) => setMerchant(event.target.value)}
            placeholder="e.g. Delta, Starbucks, Whole Foods"
            className="w-full bg-transparent text-sm text-white focus:outline-none"
            style={{ caretColor: "var(--green)" }}
          />
        </div>

        <div className="fid-card p-4">
          <p className="text-xs mb-3 font-semibold" style={{ color: "var(--text-2)" }}>CATEGORY</p>
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.map((item) => (
              <button
                key={item.id}
                onClick={() => setCategory(item.id)}
                className="flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all"
                style={{
                  background: category === item.id ? "var(--green-dim)" : "var(--surface-2)",
                  borderColor: category === item.id ? "var(--green)" : "transparent",
                }}
              >
                <span className="text-[11px] font-bold">{item.icon}</span>
                <span
                  className="text-[11px] font-medium"
                  style={{ color: category === item.id ? "var(--green)" : "var(--text-2)" }}
                >
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={analyze}
          disabled={parsedAmount <= 0 || isAnalyzing || loading}
          className="w-full py-4 rounded-2xl text-black font-bold text-base transition-all disabled:opacity-40"
          style={{ background: "var(--green)" }}
        >
          {isAnalyzing ? "Analyzing..." : "Find Best Card ->"}
        </button>

        {error && (
          <div className="fid-card p-4">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <AnimatePresence>
          {results && best && rankingList.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              <div className="fid-card p-4" style={{ borderLeft: "3px solid var(--green)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <Zap size={14} color="var(--green)" />
                  <span className="text-xs font-bold tracking-widest" style={{ color: "var(--green)" }}>
                    BEST CARD
                  </span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-bold text-white">{best.issuer ?? "Recommended Card"}</p>
                    <p className="text-sm" style={{ color: "var(--text-2)" }}>{best.cardName}</p>
                    <p className="text-xs mt-1" style={{ color: "var(--text-2)" }}>
                      {best.rate}x on {results.meta.category} · {best.rewardCurrency}
                    </p>
                    <p className="text-xs mt-2 max-w-sm" style={{ color: "var(--text-2)" }}>{best.reason}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold" style={{ color: "var(--green)" }}>
                      ${best.estimatedValue.toFixed(2)}
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-2)" }}>estimated value</p>
                    <button
                      onClick={logSwipe}
                      disabled={isLogging || loggedForResult}
                      className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition-all disabled:opacity-60"
                      style={{
                        background: loggedForResult ? "rgba(74,222,128,0.15)" : "var(--green-dim)",
                        color: "var(--green)",
                        border: "1px solid var(--green)",
                      }}
                    >
                      <CheckCircle size={11} />
                      {isLogging ? "Logging..." : loggedForResult ? "Logged to RewardVest" : "Log This Swipe"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="fid-card p-4">
                <p className="text-xs font-bold mb-4" style={{ color: "var(--text-2)" }}>ALL CARDS RANKED</p>
                <div className="space-y-4">
                  {rankingList.map((card, index) => (
                    <motion.div
                      key={`${card.cardId}-${index}`}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0"
                            style={{
                              background: index === 0 ? "var(--green)" : "var(--surface-2)",
                              color: index === 0 ? "#000" : "var(--text-2)",
                            }}
                          >
                            {index + 1}
                          </span>
                          <div>
                            <span className="text-sm text-white font-medium">{card.issuer}</span>
                            <span className="text-xs ml-1" style={{ color: "var(--text-2)" }}>{card.cardName}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-semibold" style={{ color: index === 0 ? "var(--green)" : "var(--text-2)" }}>
                            ${card.estimatedValue.toFixed(2)}
                          </span>
                          <span className="text-xs ml-1" style={{ color: "var(--text-3)" }}>({card.rate}x)</span>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--surface-2)" }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(card.estimatedValue / barMax) * 100}%` }}
                          transition={{ duration: 0.5, delay: index * 0.06 }}
                          className="h-full rounded-full"
                          style={{ background: index === 0 ? "var(--green)" : "var(--surface-3)" }}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="fid-card p-4">
                <p className="text-xs font-bold mb-2" style={{ color: "var(--text-2)" }}>AI INSIGHT</p>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>
                  Using <span className="text-white font-semibold">{best.issuer} {best.cardName}</span> returns <span className="font-semibold" style={{ color: "var(--green)" }}>${best.estimatedValue.toFixed(2)}</span> on this swipe,
                  based on {best.source === "merchant" ? " merchant-specific" : " category"} scoring.
                </p>
              </div>

              {logMessage && (
                <div className="fid-card p-4">
                  <p className="text-sm text-green-400">{logMessage}</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
