"use client";

import React from "react";
import dynamic from "next/dynamic";
import type { CSSProperties, ComponentType } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import MarketTicker from "@/components/MarketTicker";
import LiquidityDominanceChart from "@/components/invest/LiquidityDominanceChart";
import PortfolioLandscapeChart from "@/components/invest/PortfolioLandscapeChart";
import { DEMO_USER_ID } from "@/lib/demoUser";
import {
  getPortfolioGain,
  getPortfolioValue,
  getUninvestedBalance,
  logInvestment,
  type InvestmentAllocation,
} from "@/lib/investmentStore";
import { getMarketClock, getMarketStatusLabel } from "@/lib/marketHours";

type RewardTransaction = {
  id: string;
  cardId: string;
  estimatedValue: number;
  createdAt: string;
};

type RewardSummary = {
  totalEarned: number;
  totalPoints: number;
  totalSpend: number;
  cards: Record<string, { totalEarned: number; totalPoints: number; totalSpend: number }>;
  transactions: RewardTransaction[];
};

type RewardCard = {
  id: string;
  cardName: string | null;
  cardIssuer: string | null;
  imageUrl?: string | null;
};

type StockData = {
  ticker: string;
  name: string;
  price: number;
  change?: number;
  changePct: number;
};

type Allocation = {
  ticker: string;
  percentage: number;
  rationale: string;
  description: string;
  annualReturn?: number;
};

type MarketRegime = {
  regime: "bullish" | "defensive" | "mixed";
  description: string;
  volatility: "low" | "medium" | "high";
  bloombergPrediction?: string;
  bquantScore?: number;
};

type AIAdvice = {
  allocations: Allocation[];
  summary: string;
  projectedAnnualReturn: number;
  insights: string[];
  marketRegime: MarketRegime;
  threshold: number;
};

const STOCK_TICKERS: StockData[] = [
  { ticker: "VOO", name: "Vanguard S&P 500", price: 498.32, change: 3.21, changePct: 0.65 },
  { ticker: "QQQ", name: "Invesco Nasdaq 100", price: 432.18, change: 5.44, changePct: 1.27 },
  { ticker: "VTI", name: "Vanguard Total Market", price: 242.53, change: -0.87, changePct: -0.36 },
  { ticker: "BND", name: "Vanguard Bond", price: 73.14, change: -0.12, changePct: -0.16 },
  { ticker: "JPM", name: "JPMorgan Chase", price: 224.56, change: 1.84, changePct: 0.83 },
];

const DEFAULT_ALLOCATIONS: Allocation[] = [
  { ticker: "VOO", percentage: 60, rationale: "Broad market exposure", description: "Vanguard S&P 500 ETF", annualReturn: 8.5 },
  { ticker: "QQQ", percentage: 25, rationale: "Growth tilt", description: "Invesco Nasdaq 100 ETF", annualReturn: 12 },
  { ticker: "CASH", percentage: 15, rationale: "Liquidity buffer", description: "High-yield cash reserve", annualReturn: 4.5 },
];

const ALLOCATION_COLORS = ["#00c805", "#60a5fa", "#a78bfa", "#fbbf24", "#f87171"];
type EChartsProps = { option: unknown; style?: CSSProperties; className?: string; onChartReady?: (chart: { resize(): void }) => void };
const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false }) as ComponentType<EChartsProps>;

function buildMonthlyChart(transactions: RewardTransaction[]) {
  const now = new Date();

  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const value = transactions
      .filter((transaction) => transaction.createdAt.startsWith(monthKey))
      .reduce((sum, transaction) => sum + transaction.estimatedValue, 0);

    return {
      month: date.toLocaleString("default", { month: "short" }),
      value: Number(value.toFixed(2)),
    };
  });
}

export default function RewardVestPage() {
  const [rewardSummary, setRewardSummary] = useState<RewardSummary>({
    totalEarned: 0,
    totalPoints: 0,
    totalSpend: 0,
    cards: {},
    transactions: [],
  });
  const [rewardCards, setRewardCards] = useState<RewardCard[]>([]);
  const [aiAdvice, setAiAdvice] = useState<AIAdvice | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isInvesting, setIsInvesting] = useState(false);
  const [showPortfolio, setShowPortfolio] = useState(false);
  const [investmentConfirmed, setInvestmentConfirmed] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [marketData, setMarketData] = useState<StockData[]>(STOCK_TICKERS);
  const [marketLoading, setMarketLoading] = useState(true);
  const [marketClock, setMarketClock] = useState(() => getMarketClock());
  const [livePortfolioValue, setLivePortfolioValue] = useState(0);
  const [portfolioGain, setPortfolioGain] = useState(0);

  const chartData = useMemo(() => buildMonthlyChart(rewardSummary.transactions), [rewardSummary.transactions]);
  const thisMonth = chartData[chartData.length - 1]?.value ?? 0;
  const totalEarned = rewardSummary.totalEarned;
  const uninvestedBalance = getUninvestedBalance(thisMonth);
  const displayAllocations = aiAdvice?.allocations ?? DEFAULT_ALLOCATIONS;
  const projectedReturn = aiAdvice?.projectedAnnualReturn ?? 7;
  const projectedAnnual = thisMonth * 12;
  const tenYearGrowth = Math.round(
    projectedReturn === 0
      ? thisMonth * 12 * 10
      : thisMonth * 12 * ((Math.pow(1 + projectedReturn / 100, 10) - 1) / (projectedReturn / 100))
  );
  const marketStatusLabel = getMarketStatusLabel(marketClock);
  const marketStatusColor = marketClock.isOpen ? "var(--green)" : "#fbbf24";

  const glass = {
    background: "rgba(14,14,14,0.68)",
    border: "1px solid rgba(255,255,255,0.09)",
    backdropFilter: "blur(22px)",
    WebkitBackdropFilter: "blur(22px)",
    borderRadius: 18,
  } satisfies React.CSSProperties;

  const glassStrong = {
    background: "rgba(10,10,10,0.82)",
    border: "1px solid rgba(255,255,255,0.11)",
    backdropFilter: "blur(28px)",
    WebkitBackdropFilter: "blur(28px)",
    borderRadius: 20,
  } satisfies React.CSSProperties;

  const labelStyle = "text-[10px] font-bold tracking-widest uppercase" as const;

  const refreshRewards = useCallback(async () => {
    const [summary, cards] = await Promise.all([
      fetch(`/api/rewards/summary?userId=${DEMO_USER_ID}`, { cache: "no-store" }).then((response) => response.json()),
      fetch(`/api/rewards?userId=${DEMO_USER_ID}`, { cache: "no-store" }).then((response) => response.json()),
    ]);

    setRewardSummary({
      totalEarned: summary.totalEarned ?? 0,
      totalPoints: summary.totalPoints ?? 0,
      totalSpend: summary.totalSpend ?? 0,
      cards: summary.cards ?? {},
      transactions: summary.transactions ?? [],
    });
    setRewardCards(cards ?? []);
  }, []);

  useEffect(() => {
    refreshRewards().catch(() => {});
    setLivePortfolioValue(getPortfolioValue());
    setPortfolioGain(getPortfolioGain());
    const timer = setTimeout(() => setShowPortfolio(true), 500);
    return () => clearTimeout(timer);
  }, [refreshRewards]);

  useEffect(() => {
    const tick = () => setMarketClock(getMarketClock());
    tick();
    const interval = setInterval(tick, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function fetchMarket() {
      try {
        const response = await fetch("/api/market");
        const json = await response.json();
        if (json.data?.length) setMarketData(json.data);
      } catch {
        // fallback stays in place
      } finally {
        setMarketLoading(false);
      }
    }

    fetchMarket();
    const interval = setInterval(fetchMarket, marketClock.isOpen ? 60000 : 900000);
    return () => clearInterval(interval);
  }, [marketClock.isOpen]);

  useEffect(() => {
    const interval = setInterval(() => {
      setLivePortfolioValue(getPortfolioValue());
      setPortfolioGain(getPortfolioGain());
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    setShowPortfolio(false);
    setAiError(null);
    setInvestmentConfirmed(false);

    try {
      const response = await fetch("/api/ai-advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          totalRewards: totalEarned,
          monthlyEarnings: chartData.map((point) => point.value),
          investmentAmount: uninvestedBalance,
          riskTolerance: "moderate",
        }),
      });
      const json = await response.json();
      if (!response.ok || json.error) {
        throw new Error(json.error ?? "Failed to generate advice");
      }
      setAiAdvice(json.data as AIAdvice);
    } catch (error) {
      setAiError(error instanceof Error ? error.message : "Failed to generate portfolio");
    } finally {
      setShowPortfolio(true);
      setIsGenerating(false);
    }
  }, [chartData, totalEarned, uninvestedBalance]);

  const handleInvest = useCallback(async () => {
    if (uninvestedBalance <= 0) return;

    setIsInvesting(true);
    try {
      const allocations: InvestmentAllocation[] = displayAllocations.map((allocation) => ({
        ticker: allocation.ticker,
        pct: allocation.percentage,
        annualReturn: allocation.annualReturn ?? projectedReturn,
      }));
      const blendedReturn = allocations.reduce((sum, allocation) => sum + allocation.annualReturn * (allocation.pct / 100), 0);
      logInvestment(uninvestedBalance, allocations, blendedReturn);
      setLivePortfolioValue(getPortfolioValue());
      setPortfolioGain(getPortfolioGain());
      setInvestmentConfirmed(true);
    } finally {
      setIsInvesting(false);
    }
  }, [displayAllocations, projectedReturn, uninvestedBalance]);

  const rewardBreakdown = rewardCards
    .map((card) => ({
      id: card.id,
      label: `${card.cardIssuer ?? ""} ${card.cardName ?? ""}`.trim() || card.id,
      earned: rewardSummary.cards[card.id]?.totalEarned ?? 0,
      points: rewardSummary.cards[card.id]?.totalPoints ?? 0,
    }))
    .filter((card) => card.earned > 0 || card.points > 0);

  return (
    <div className="min-h-screen" style={{ position: "relative", zIndex: 1 }}>

      <MarketTicker />

      <div style={{ padding: "16px 28px 48px", maxWidth: 1280, margin: "0 auto" }}>

        {/* ── Stat strip ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginBottom: 20 }}>
          {[
            { label: "This Month", value: `$${thisMonth.toFixed(2)}`, sub: "earned", color: "rgba(0,200,5,0.9)" },
            { label: "Available", value: `$${uninvestedBalance.toFixed(2)}`, sub: "to invest", color: "#60a5fa" },
            {
              label: "Portfolio Value",
              value: `$${livePortfolioValue.toFixed(2)}`,
              sub: portfolioGain >= 0 ? `+$${portfolioGain.toFixed(2)} gain` : `-$${Math.abs(portfolioGain).toFixed(2)} loss`,
              hint: marketStatusLabel,
              color: portfolioGain >= 0 ? "rgba(0,200,5,0.9)" : "#f87171",
            },
            { label: "Proj. Annual", value: `$${projectedAnnual.toLocaleString()}`, sub: "at current rate", color: "#a78bfa" },
            { label: "10-Year", value: `$${tenYearGrowth.toLocaleString()}`, sub: `at ${projectedReturn}% return`, color: "#fbbf24" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 * i, type: "spring", stiffness: 380, damping: 28 }}
              style={{ ...glass, padding: "14px 16px" }}
            >
              <p className={labelStyle} style={{ color: "rgba(255,255,255,0.3)", marginBottom: 6, fontSize: 9 }}>{stat.label}</p>
              <p style={{ fontSize: 18, fontWeight: 800, color: stat.color, fontFamily: "var(--font-display)", letterSpacing: "-0.02em", lineHeight: 1 }}>
                {stat.value}
              </p>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>{stat.sub}</p>
              {"hint" in stat && stat.hint && (
                <p style={{ fontSize: 9, color: marketStatusColor, fontWeight: 700, marginTop: 5 }}>{stat.hint}</p>
              )}
            </motion.div>
          ))}
        </div>

        {/* ── Main grid: charts left, sidebar right ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 16, alignItems: "start" }}>

          {/* Left — charts stacked */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              style={{ ...glassStrong, overflow: "hidden" }}
            >
              <LiquidityDominanceChart marketRegime={aiAdvice?.marketRegime ?? null} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.14 }}
              style={{ ...glassStrong, overflow: "hidden" }}
            >
              <PortfolioLandscapeChart
                allocations={displayAllocations}
                marketData={marketData}
                investableAmount={uninvestedBalance}
                marketStatusLabel={marketLoading ? "Loading..." : marketStatusLabel}
              />
            </motion.div>
          </div>

          {/* Right sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Portfolio donut card */}
            <AnimatePresence mode="wait">
              {showPortfolio ? (
                <motion.div
                  key="portfolio"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  style={{ ...glassStrong, padding: "22px 22px 18px", position: "relative", overflow: "hidden" }}
                >
                  {/* Ambient glow behind donut */}
                  <div style={{ position: "absolute", top: 60, left: "50%", transform: "translateX(-50%)", width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,200,5,0.07) 0%, transparent 70%)", pointerEvents: "none" }} />

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: 3, fontFamily: "var(--font-display)" }}>
                        Portfolio Split
                      </p>
                      <p style={{ fontSize: 18, fontWeight: 800, color: "#fff", fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>
                        ${uninvestedBalance.toFixed(2)}
                      </p>
                    </div>
                    {aiAdvice && (
                      <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(0,200,5,0.9)", background: "rgba(0,200,5,0.1)", border: "1px solid rgba(0,200,5,0.22)", borderRadius: 20, padding: "3px 10px" }}>
                        AI Generated
                      </span>
                    )}
                  </div>

                  {/* Donut with center label */}
                  <div style={{ position: "relative", width: "100%", height: 220 }}>
                    <ReactECharts
                      option={{
                        backgroundColor: "transparent",
                        tooltip: {
                          trigger: "item",
                          backgroundColor: "rgba(10,10,10,0.92)",
                          borderColor: "rgba(255,255,255,0.1)",
                          textStyle: { color: "#fff", fontSize: 12 },
                          formatter: (p: { name: string; value: number; percent: number }) =>
                            `<b>${p.name}</b><br/>$${((p.value / 100) * uninvestedBalance).toFixed(2)} &nbsp;<span style="color:rgba(255,255,255,0.5)">${p.percent}%</span>`,
                        },
                        series: [{
                          type: "pie",
                          radius: ["52%", "78%"],
                          center: ["50%", "50%"],
                          label: { show: false },
                          emphasis: {
                            scale: true,
                            scaleSize: 6,
                            itemStyle: { shadowBlur: 20, shadowColor: "rgba(0,0,0,0.5)" },
                          },
                          data: displayAllocations.map((a, i) => ({
                            value: a.percentage,
                            name: a.ticker,
                            itemStyle: {
                              color: ALLOCATION_COLORS[i % ALLOCATION_COLORS.length],
                              borderRadius: 4,
                              borderWidth: 2,
                              borderColor: "rgba(0,0,0,0)",
                            },
                          })),
                        }],
                      }}
                      style={{ width: "100%", height: "100%" }}
                      onChartReady={(chart) => { setTimeout(() => chart.resize(), 0); }}
                    />
                    {/* Center overlay */}
                    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                      <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: 2 }}>Investable</p>
                      <p style={{ fontSize: 20, fontWeight: 800, color: "#fff", fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>
                        ${uninvestedBalance.toFixed(0)}
                      </p>
                      <p style={{ fontSize: 10, color: "rgba(0,200,5,0.7)", fontWeight: 600, marginTop: 1 }}>
                        {projectedReturn}% est. return
                      </p>
                    </div>
                  </div>

                  {/* Allocation rows with progress bars */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16, marginBottom: 18 }}>
                    {displayAllocations.map((a, i) => (
                      <div key={a.ticker}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                            <div style={{ width: 7, height: 7, borderRadius: 2, background: ALLOCATION_COLORS[i % ALLOCATION_COLORS.length], flexShrink: 0 }} />
                            <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{a.ticker}</span>
                            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.description}</span>
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: ALLOCATION_COLORS[i % ALLOCATION_COLORS.length] }}>
                            {a.percentage}%
                          </span>
                        </div>
                        {/* Progress bar */}
                        <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${a.percentage}%` }}
                            transition={{ delay: 0.3 + i * 0.05, duration: 0.5, ease: "easeOut" }}
                            style={{ height: "100%", borderRadius: 2, background: ALLOCATION_COLORS[i % ALLOCATION_COLORS.length] }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    style={{ width: "100%", padding: "12px 0", borderRadius: 12, background: isGenerating ? "rgba(0,200,5,0.35)" : "rgba(0,200,5,0.9)", color: "#000", fontSize: 13, fontWeight: 800, border: "none", cursor: isGenerating ? "not-allowed" : "pointer", marginBottom: 8, transition: "background 0.2s" }}
                  >
                    {isGenerating ? "Analyzing signals..." : "Generate AI Split"}
                  </button>
                  <button
                    onClick={handleInvest}
                    disabled={isInvesting || uninvestedBalance <= 0}
                    style={{ width: "100%", padding: "12px 0", borderRadius: 12, background: "rgba(96,165,250,0.07)", color: "#60a5fa", fontSize: 13, fontWeight: 700, border: "1px solid rgba(96,165,250,0.22)", cursor: (isInvesting || uninvestedBalance <= 0) ? "not-allowed" : "pointer", opacity: (isInvesting || uninvestedBalance <= 0) ? 0.45 : 1 }}
                  >
                    {isInvesting ? "Logging..." : investmentConfirmed ? "Investment Logged ✓" : "I Invested This"}
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  style={{ ...glass, height: 200, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, border: "1px dashed rgba(255,255,255,0.1)" }}
                >
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.28)" }}>
                    {isGenerating ? "Analyzing market signals..." : "No portfolio split yet"}
                  </p>
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    style={{ padding: "9px 20px", borderRadius: 10, background: "rgba(0,200,5,0.12)", color: "rgba(0,200,5,0.85)", fontSize: 12, fontWeight: 700, border: "1px solid rgba(0,200,5,0.22)", cursor: "pointer" }}
                  >
                    Generate AI Split
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* AI Insight */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              style={{ ...glass, padding: "18px 20px" }}
            >
              <p className={labelStyle} style={{ color: "rgba(255,255,255,0.28)", marginBottom: 10, fontSize: 9 }}>AI Insight</p>
              <p style={{ fontSize: 12, lineHeight: 1.68, color: "rgba(255,255,255,0.62)" }}>
                {aiAdvice?.summary ?? "RewardVest takes the exact value logged in SmartSwipe and allocates only the uninvested portion into a suggested micro-portfolio."}
              </p>
              {aiAdvice?.insights?.length ? (
                <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6, borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 12 }}>
                  {aiAdvice.insights.slice(0, 3).map((insight) => (
                    <p key={insight} style={{ fontSize: 11, color: "rgba(255,255,255,0.36)", lineHeight: 1.5 }}>· {insight}</p>
                  ))}
                </div>
              ) : null}
              {aiError && <p style={{ marginTop: 10, fontSize: 11, color: "#f87171" }}>{aiError}</p>}
              {investmentConfirmed && <p style={{ marginTop: 10, fontSize: 11, color: "rgba(0,200,5,0.8)" }}>Investment tranche logged into WealthSplit.</p>}
            </motion.div>

            {/* Earnings by card */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.24 }}
              style={{ ...glass, padding: "18px 20px" }}
            >
              <p className={labelStyle} style={{ color: "rgba(255,255,255,0.28)", marginBottom: 12, fontSize: 9 }}>Earnings by Card</p>
              {rewardBreakdown.length === 0 ? (
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.28)" }}>Log a swipe in SmartSwipe to see earnings here.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {rewardBreakdown.map((card) => (
                    <div key={card.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 12, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{card.label}</p>
                        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.32)", marginTop: 2 }}>{card.points.toLocaleString()} pts</p>
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 800, color: "rgba(0,200,5,0.9)", whiteSpace: "nowrap", fontFamily: "var(--font-display)" }}>${card.earned.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

          </div>
        </div>
      </div>
    </div>
  );
}

