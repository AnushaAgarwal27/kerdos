"use client";

import { useState, useRef } from "react";

const CARD_GRADIENTS: Record<string, { from: string; to: string; accent: string }> = {
  'amex-gold':       { from: '#1c1408', to: '#3d2e0a', accent: '#c9a84c' },
  'chase-sapphire':  { from: '#050f25', to: '#0d2353', accent: '#4a7fd4' },
  'citi-double':     { from: '#030d1e', to: '#0a2240', accent: '#5b9bd5' },
  'discover-it':     { from: '#1a0800', to: '#3d1500', accent: '#f07f2a' },
  'capital-venture': { from: '#06100a', to: '#0d2918', accent: '#2ecc71' },
  other:             { from: '#111111', to: '#222222', accent: '#888888' },
};

const CARD_STATS: Record<string, { txns: string; rewards: string; rank: number }> = {
  'amex-gold':       { txns: '847',    rewards: '$312',  rank: 2 },
  'chase-sapphire':  { txns: '1,203',  rewards: '$528',  rank: 1 },
  'citi-double':     { txns: '634',    rewards: '$189',  rank: 3 },
  'discover-it':     { txns: '412',    rewards: '$97',   rank: 4 },
  'capital-venture': { txns: '291',    rewards: '$61',   rank: 5 },
  other:             { txns: '—',      rewards: '—',     rank: 0 },
};

export interface CreditCardData {
  id: string;
  issuer: string;
  name: string;
  last4: string;
  network: string;
  color: string;
  imageUrl?: string;
}

export interface CardLiveStats {
  txns: string;
  rewards: string;
  rank: number;
}

export default function CreditCard({ card, width = 280, liveStats }: { card: CreditCardData; width?: number; liveStats?: CardLiveStats }) {
  const [flipped, setFlipped] = useState(false);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const height   = Math.round(width * 0.63);
  const gradient = CARD_GRADIENTS[card.id] ?? CARD_GRADIENTS.other;
  const stats    = liveStats ?? CARD_STATS[card.id] ?? CARD_STATS.other;
  const pad      = Math.round(width * 0.083);

  const BACK_STATS = [
    { label: "Transactions", value: stats.txns },
    { label: "Rewards",      value: stats.rewards },
    { label: "Most Used",    value: stats.rank > 0 ? `#${stats.rank}` : "—" },
  ];

  return (
    <div
      onMouseEnter={() => { hoverTimer.current = setTimeout(() => setFlipped(true), 700); }}
      onMouseLeave={() => { if (hoverTimer.current) clearTimeout(hoverTimer.current); setFlipped(false); }}
      style={{ width, height, flexShrink: 0, perspective: "1000px", cursor: "pointer" }}
    >
      <div style={{
        position: "relative", width: "100%", height: "100%",
        transformStyle: "preserve-3d",
        transition: "transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)",
        transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
      }}>

        {/* ── FRONT ── */}
        <div style={{
          position: "absolute", inset: 0, borderRadius: 18, overflow: "hidden",
          backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden",
        }}>
          {card.imageUrl ? (
            <img
              src={card.imageUrl} alt={card.name} draggable={false}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <div style={{
              position: "absolute", inset: 0,
              background: `linear-gradient(135deg, ${gradient.from} 0%, ${gradient.to} 100%)`,
            }} />
          )}
          <div style={{
            position: "absolute", inset: 0, borderRadius: 18,
            border: "1px solid rgba(255,255,255,0.12)", pointerEvents: "none",
          }} />
        </div>

        {/* ── BACK ── */}
        <div style={{
          position: "absolute", inset: 0, borderRadius: 18, overflow: "hidden",
          backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden",
          transform: "rotateY(180deg)",
          background: `linear-gradient(145deg, ${gradient.from} 0%, ${gradient.to} 100%)`,
          display: "flex", flexDirection: "column", justifyContent: "center",
          padding: `${pad}px`,
          gap: Math.round(height * 0.06),
        }}>

          {/* Card name header */}
          <div style={{ marginBottom: 4 }}>
            <p style={{
              fontSize: Math.round(width * 0.042),
              fontWeight: 800,
              color: gradient.accent,
              fontFamily: "var(--font-display)",
              letterSpacing: "-0.01em",
              lineHeight: 1,
            }}>
              {card.name || card.issuer}
            </p>
            <p style={{
              fontSize: Math.round(width * 0.034),
              fontWeight: 500,
              color: "rgba(255,255,255,0.35)",
              fontFamily: "monospace",
              letterSpacing: "0.08em",
              marginTop: 4,
            }}>
              •••• {card.last4}
            </p>
          </div>

          {/* Divider */}
          <div style={{
            height: 1,
            background: `linear-gradient(to right, ${gradient.accent}44, transparent)`,
          }} />

          {/* Stats */}
          {BACK_STATS.map(({ label, value }) => (
            <div key={label} style={{
              display: "flex", justifyContent: "space-between", alignItems: "baseline",
            }}>
              <span style={{
                fontSize: Math.round(width * 0.038),
                fontWeight: 600,
                color: "rgba(255,255,255,0.4)",
                fontFamily: "var(--font-display)",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}>
                {label}
              </span>
              <span style={{
                fontSize: Math.round(width * 0.052),
                fontWeight: 800,
                color: "#fff",
                fontFamily: "var(--font-display)",
                letterSpacing: "-0.02em",
                lineHeight: 1,
              }}>
                {value}
              </span>
            </div>
          ))}

          <div style={{
            position: "absolute", inset: 0, borderRadius: 18,
            border: "1px solid rgba(255,255,255,0.1)", pointerEvents: "none",
          }} />
        </div>

      </div>
    </div>
  );
}
