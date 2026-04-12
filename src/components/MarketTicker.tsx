"use client";

interface IndexQuote {
  label: string;
  value: string;
  change: string;
  up: boolean;
}

const INDICES: IndexQuote[] = [
  { label: "DJIA",    value: "40,657",  change: "+0.37%", up: true  },
  { label: "NASDAQ",  value: "18,657",  change: "-0.02%", up: false },
  { label: "S&P 500", value: "5,657",   change: "+0.73%", up: true  },
  { label: "VIX",     value: "18.42",   change: "-2.10%", up: false },
  { label: "10Y",     value: "4.38%",   change: "+0.03",  up: true  },
  { label: "BTC",     value: "83,412",  change: "+1.24%", up: true  },
  { label: "ETH",     value: "3,241",   change: "+0.88%", up: true  },
  { label: "GOLD",    value: "2,318",   change: "+0.15%", up: true  },
  { label: "OIL",     value: "78.42",   change: "-0.62%", up: false },
];

function TickerItem({ idx }: { idx: IndexQuote }) {
  return (
    <div
      className="flex items-center gap-2.5 shrink-0"
      style={{ padding: "0 28px", borderRight: "1px solid rgba(255,255,255,0.07)", minWidth: "calc(100vw / 9)" }}
    >
      <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", fontFamily: "var(--font-display)" }}>
        {idx.label}
      </span>
      <span style={{ fontSize: 12, fontWeight: 700, color: "#fff", fontFamily: "var(--font-display)" }}>
        {idx.value}
      </span>
      <span style={{ fontSize: 11, fontWeight: 600, color: idx.up ? "var(--green)" : "var(--red)", fontFamily: "var(--font-display)" }}>
        {idx.change}
      </span>
    </div>
  );
}

export default function MarketTicker() {
  return (
    <div
      className="relative overflow-hidden border-b"
      style={{
        background: "rgba(15,15,15,0.45)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderColor: "rgba(255,255,255,0.07)",
        height: 52,
      }}
    >
      <style>{`
        @keyframes ticker-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .ticker-track {
          display: flex;
          align-items: center;
          width: max-content;
          height: 100%;
          animation: ticker-scroll 28s linear infinite;
        }
        .ticker-track:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div className="ticker-track">
        {/* Render twice for seamless loop */}
        {[...INDICES, ...INDICES].map((idx, i) => (
          <TickerItem key={i} idx={idx} />
        ))}
      </div>
    </div>
  );
}
