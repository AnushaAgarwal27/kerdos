"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ChevronRight, Bell, Search, User, Camera, X } from "lucide-react";
import MarketTicker from "@/components/MarketTicker";
import CreditCard, { type CreditCardData } from "@/components/CreditCard";
import { DEMO_USER_ID } from "@/lib/demoUser";
import { cardAccent } from "@/lib/cardDisplay";
import { getLinkedCardIds } from "@/lib/linkedCards";

const MANUAL_CARDS_KEY = "manual_cards";

type ManualCard = {
  id: string;
  name: string;
  last4: string;
  photoUrl: string;
};

type HomeApiCard = {
  id: string;
  cardIssuer?: string | null;
  cardName?: string | null;
  cardNetwork?: string | null;
  imageUrl?: string | null;
};

function isHomeApiCardArray(value: unknown): value is HomeApiCard[] {
  return Array.isArray(value);
}

function loadManualCards(): ManualCard[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(MANUAL_CARDS_KEY) ?? "[]") as ManualCard[];
  } catch { return []; }
}

function saveManualCards(cards: ManualCard[]) {
  localStorage.setItem(MANUAL_CARDS_KEY, JSON.stringify(cards));
}

const INDEX_CARDS = [
  { label: "DJIA",    value: "40,657.56", change: "-26.00", pct: "-0.09%", up: false },
  { label: "NASDAQ",  value: "18,657.56", change: "+74.12", pct: "+0.19%", up: true  },
  { label: "S&P 500", value: "5,657.56",  change: "+8.25",  pct: "+0.15%", up: true  },
];

const NEWS = [
  {
    id: 1,
    source: "REUTERS",
    time: "2m",
    headline: "US STOCKS — Slide In Growth Stocks Pummel Nasdaq, Powell Testimony In Focus As Rate Outlook Shifts",
    tickers: [{ t: "MSFT", v: -1.25 }, { t: "AAPL", v: +1.25 }],
  },
  {
    id: 2,
    source: "BENZINGA",
    time: "2m",
    headline: "'Pentium Under Pressure As Market Shifts Toward AI-Centric Chip Designs' — Financial Times",
    tickers: [{ t: "MSFT", v: -1.25 }, { t: "AAPL", v: +1.25 }],
  },
  {
    id: 3,
    source: "REUTERS",
    time: "33m",
    headline: "Reuters Cites Filing: Aggressive Pivot Toward Proprietary AI Hardware Prompts Concerns About Supply Chain",
    tickers: [{ t: "MSFT", v: -1.25 }, { t: "AAPL", v: +1.25 }],
  },
];

export default function HomePage() {
  const [newsTab, setNewsTab]   = useState<"top" | "portfolio">("top");
  const [linkedIds, setLinkedIds] = useState<string[] | null>(() => getLinkedCardIds());
  const [rewardSummary, setRewardSummary] = useState({ totalEarned: 0, totalPoints: 0, totalSpend: 0 });
  const [linkedMeta, setLinkedMeta] = useState<Record<string, { last4: string }>>({});
  const [manualCards, setManualCards] = useState<ManualCard[]>(() => loadManualCards());
  const [apiCards, setApiCards] = useState<HomeApiCard[]>([]);

  // Camera / scan-card state
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null);
  const [photoCardName, setPhotoCardName] = useState("");
  const [photoLast4, setPhotoLast4] = useState("");

  type LinkedCardApi = {
    cardId: string;
    cardName?: string;
    cardIssuer?: string;
    cardNetwork?: string;
    plaidMask?: string;
  };

  useEffect(() => {
    fetch(`/api/plaid/linked-cards?userId=${DEMO_USER_ID}`, { cache: "no-store" })
      .then((response) => response.json())
      .then((data: { linkedCards?: LinkedCardApi[] }) => {
        const linkedCards = data.linkedCards ?? [];
        setLinkedIds(linkedCards.map((card) => card.cardId));
        const nextMeta = Object.fromEntries(
          linkedCards.map((card) => [card.cardId, { last4: card.plaidMask ?? "0000" }])
        );
        setLinkedMeta(nextMeta);
      })
      .catch(() => {});

    fetch(`/api/rewards/summary?userId=${DEMO_USER_ID}`, { cache: "no-store" })
      .then((response) => response.json())
      .then((data: { totalEarned?: number; totalPoints?: number; totalSpend?: number }) =>
        setRewardSummary({
          totalEarned: data.totalEarned ?? 0,
          totalPoints: data.totalPoints ?? 0,
          totalSpend: data.totalSpend ?? 0,
        })
      )
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch(`/api/rewards?userId=${DEMO_USER_ID}`, { cache: "no-store" })
      .then((response) => response.json())
      .then((cards: unknown) => setApiCards(isHomeApiCardArray(cards) ? cards : []))
      .catch(() => setApiCards([]));
  }, [linkedIds]);

  // ---------- camera handlers ----------
  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPendingPhoto(reader.result as string);
    reader.readAsDataURL(file);
    // Reset input so the same file can be selected again if needed
    e.target.value = "";
  };

  const confirmPhotoCard = () => {
    if (!pendingPhoto) return;
    const trimmedName = photoCardName.trim() || "My Card";
    const trimmedLast4 = photoLast4.replace(/\D/g, "").slice(-4).padStart(4, "0");
    const newCard: ManualCard = {
      id: `manual-${Date.now()}`,
      name: trimmedName,
      last4: trimmedLast4,
      photoUrl: pendingPhoto,
    };
    const next = [...manualCards, newCard];
    saveManualCards(next);
    setManualCards(next);
    setPendingPhoto(null);
    setPhotoCardName("");
    setPhotoLast4("");
  };

  const cancelPhotoCard = () => {
    setPendingPhoto(null);
    setPhotoCardName("");
    setPhotoLast4("");
  };

  const linkedCardCount = linkedIds?.length ?? 0;
  const cards = useMemo<CreditCardData[]>(() => {
    const linkedCardKeys = linkedIds ?? [];
    const plaidCards = (Array.isArray(apiCards) ? apiCards : [])
      .filter((card) => linkedCardKeys.includes(card.id))
      .map((card) => ({
        id: card.id,
        issuer: card.cardIssuer ?? card.id,
        name: card.cardName ?? card.id,
        last4: linkedMeta[card.id]?.last4 ?? "0000",
        network: card.cardNetwork ?? "",
        color: cardAccent(card.id),
        photoUrl: card.imageUrl ?? undefined,
      }));

    const scannedCards = manualCards.map((card) => ({
      id: card.id,
      issuer: "Card",
      name: card.name,
      last4: card.last4,
      network: "",
      color: "other",
      photoUrl: card.photoUrl,
    }));

    return [...plaidCards, ...scannedCards];
  }, [apiCards, linkedIds, linkedMeta, manualCards]);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-12 pb-3" style={{ background: "var(--bg)" }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-black text-sm font-bold" style={{ background: "var(--green)" }}>
            K
          </div>
          <span className="text-base font-semibold text-white">Kerdos</span>
        </div>
        <div className="flex items-center gap-4">
          <Search size={20} color="var(--text-2)" />
          <Bell size={20} color="var(--text-2)" />
          <User size={20} color="var(--text-2)" />
        </div>
      </div>

      {/* Index ticker */}
      <MarketTicker />

      <div className="px-4 pt-4 space-y-4 pb-6">

        {/* Market index cards */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-white">Markets open</span>
            <Link href="/wealthsplit" className="text-xs flex items-center gap-0.5" style={{ color: "var(--green)" }}>
              View all <ChevronRight size={13} />
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {INDEX_CARDS.map((idx, i) => (
              <motion.div key={idx.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="fid-card p-3">
                <div className="flex items-center gap-1 mb-2">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: idx.up ? "var(--green)" : "var(--red)" }} />
                  <span className="text-[10px] font-bold" style={{ color: "var(--text-2)" }}>{idx.label}</span>
                </div>
                <p className="text-sm font-bold text-white leading-tight">{idx.value}</p>
                <p className="text-[11px] font-semibold mt-0.5" style={{ color: idx.up ? "var(--green)" : "var(--red)" }}>
                  {idx.change} ({idx.pct})
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { href: "/smartswipe",  label: "SmartSwipe", emoji: "💳" },
            { href: "/rewardvest",  label: "Invest",     emoji: "📈" },
            { href: "/wealthsplit", label: "Summary",    emoji: "⚖️"  },
          ].map((a) => (
            <Link key={a.href} href={a.href}>
              <div className="fid-card p-4 flex flex-col items-center gap-2 active:opacity-70 transition-opacity">
                <span className="text-2xl">{a.emoji}</span>
                <span className="text-xs font-medium" style={{ color: "var(--text-2)" }}>{a.label}</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Rewards snapshot */}
        <div className="fid-card p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-white">Rewards This Month</span>
            <Link href="/wealthsplit" className="text-xs" style={{ color: "var(--green)" }}>Details</Link>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Cashback", value: `$${rewardSummary.totalEarned.toFixed(2)}` },
              { label: "Points",   value: rewardSummary.totalPoints.toLocaleString() },
              { label: "Net Gain", value: `$${rewardSummary.totalEarned.toFixed(2)}` },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-lg font-bold text-white">{s.value}</p>
                <p className="text-[10px] mt-0.5" style={{ color: "var(--text-2)" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Cards carousel */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-white">Your Cards</span>
            <div className="flex items-center gap-2">
              {/* Camera / scan card */}
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="text-xs px-2.5 py-1 rounded-lg border font-semibold transition-colors flex items-center gap-1"
                style={{ borderColor: "var(--green)", color: "var(--green)" }}
              >
                <Camera size={12} /> Scan
              </button>
              <Link
                href="/plaid-link"
                target="_blank"
                className="text-xs px-2.5 py-1 rounded-lg border font-semibold transition-colors"
                style={{ borderColor: "var(--green)", color: "var(--green)" }}
              >
                + Connect
              </Link>
            </div>
          </div>

          <p className="text-xs mb-2" style={{ color: "var(--text-2)" }}>
            {linkedCardCount} linked card{linkedCardCount !== 1 ? "s" : ""}{manualCards.length > 0 ? ` + ${manualCards.length} scanned` : ""}
          </p>

          {/* Hidden camera input */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: "none" }}
            onChange={handleCameraCapture}
          />

          {cards.length === 0 ? (
            <div className="fid-card p-4 text-center">
              <p className="text-sm mb-1" style={{ color: "var(--text-2)" }}>No cards added yet</p>
              <p className="text-xs" style={{ color: "var(--text-3)" }}>Scan a card or connect via Plaid</p>
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
              {cards.map((card, i) => (
                <motion.div key={card.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
                  <CreditCard card={card} width={200} />
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Photo card confirmation modal */}
        <AnimatePresence>
          {pendingPhoto && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-end justify-center"
              style={{ background: "rgba(0,0,0,0.7)" }}
              onClick={cancelPhotoCard}
            >
              <motion.div
                initial={{ y: 80 }}
                animate={{ y: 0 }}
                exit={{ y: 80 }}
                className="w-full max-w-md rounded-t-2xl p-5 space-y-4"
                style={{ background: "var(--card)" }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">Add This Card</span>
                  <button onClick={cancelPhotoCard}><X size={18} color="var(--text-2)" /></button>
                </div>

                {/* Card preview */}
                <div className="flex justify-center">
                  <CreditCard
                    card={{ id: "preview", issuer: "Card", name: photoCardName || "My Card", last4: photoLast4.slice(-4).padStart(4, "0"), network: "", color: "other", photoUrl: pendingPhoto }}
                    width={260}
                  />
                </div>

                {/* Card name */}
                <div>
                  <label className="text-[10px] font-bold tracking-widest" style={{ color: "var(--text-2)" }}>CARD NAME</label>
                  <input
                    className="w-full mt-1 px-3 py-2 rounded-xl text-sm text-white bg-white/5 border border-white/10 outline-none focus:border-green-400/40"
                    placeholder="e.g. Capital One Venture"
                    value={photoCardName}
                    onChange={(e) => setPhotoCardName(e.target.value)}
                    autoFocus
                  />
                </div>

                {/* Last 4 digits */}
                <div>
                  <label className="text-[10px] font-bold tracking-widest" style={{ color: "var(--text-2)" }}>LAST 4 DIGITS</label>
                  <input
                    className="w-full mt-1 px-3 py-2 rounded-xl text-sm text-white bg-white/5 border border-white/10 outline-none focus:border-green-400/40"
                    placeholder="e.g. 1234"
                    maxLength={4}
                    inputMode="numeric"
                    value={photoLast4}
                    onChange={(e) => setPhotoLast4(e.target.value.replace(/\D/g, ""))}
                  />
                </div>

                <button
                  onClick={confirmPhotoCard}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-black transition-opacity active:opacity-70"
                  style={{ background: "var(--green)" }}
                >
                  Add Card
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* News */}
        <div className="fid-card">
          <div className="flex items-center justify-between px-4 pt-4 pb-3">
            <span className="text-sm font-semibold text-white">News</span>
            <button className="text-xs flex items-center gap-0.5" style={{ color: "var(--green)" }}>
              More topics <ChevronRight size={13} />
            </button>
          </div>
          <div className="px-4 pb-3">
            <div className="segment">
              <button className={`segment-btn ${newsTab === "top" ? "active" : ""}`} onClick={() => setNewsTab("top")}>Top News</button>
              <button className={`segment-btn ${newsTab === "portfolio" ? "active" : ""}`} onClick={() => setNewsTab("portfolio")}>Portfolio News</button>
            </div>
          </div>
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {NEWS.map((item, i) => (
              <motion.div key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 * i }} className="px-4 py-3">
                <p className="text-[10px] mb-1.5 font-medium" style={{ color: "var(--text-3)" }}>{item.source} • {item.time}</p>
                <p className="text-sm text-white leading-snug mb-2">{item.headline}</p>
                <div className="flex gap-2 flex-wrap">
                  {item.tickers.map((tk) => (
                    <span key={tk.t} className="ticker-tag" style={{ color: tk.v >= 0 ? "var(--green)" : "var(--red)" }}>
                      {tk.t} {tk.v >= 0 ? "+" : ""}{tk.v.toFixed(2)}%
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Planning */}
        <Link href="/wealthsplit">
          <div className="fid-card flex items-center justify-between px-4 py-4">
            <span className="text-sm font-semibold text-white">Planning</span>
            <ChevronRight size={18} color="var(--text-3)" />
          </div>
        </Link>

        {/* Feedback */}
        <div className="flex justify-center py-2">
          <button className="flex items-center gap-2 px-5 py-2.5 rounded-full border text-sm font-medium" style={{ borderColor: "var(--border)", color: "var(--text-2)" }}>
            💬 Send us feedback
          </button>
        </div>

      </div>
    </div>
  );
}
