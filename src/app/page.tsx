"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { TrendingUp, Wallet, Star, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import CreditCard, { type CreditCardData } from "@/components/CreditCard";
import { USER_CARDS } from "@/lib/userCards";
import { getLinkedCardIds } from "@/lib/linkedCards";

const STATS = [
  { label: "Cashback",      value: "$340",    delta: "+8.2%",  sub: "from last cycle",  icon: Wallet,     color: "var(--green)" },
  { label: "Points Earned", value: "174,800", delta: "+12.1%", sub: "accelerated earn", icon: Star,       color: "#80ecff"       },
  { label: "Net Gain",      value: "$847",    delta: "+15.3%", sub: "portfolio boost",  icon: TrendingUp, color: "var(--green)" },
];

const CARDS_PER_PAGE = 4;
const CARD_WIDTH     = 270;
const CARD_GAP       = 20;

export default function HomePage() {
  const [cards, setCards]                 = useState<CreditCardData[]>([]);
  const [linkedIds, setLinkedIds]         = useState<string[] | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);

  useEffect(() => {
    fetch("/api/rewards")
      .then(r => r.json())
      .then(async (apiCards: any[]) => {
        // Build base card list first so UI isn't blank while images load
        const base: CreditCardData[] = apiCards.map(c => ({
          id: c.id, issuer: c.cardIssuer ?? c.id, name: c.cardName ?? c.id,
          last4: USER_CARDS[c.id]?.last4 ?? "0000",
          network: c.cardNetwork ?? "",
          color: c.id,
          // store the rewardscc slug for image fetching
          _cardKey: c.cardKey ?? c.id,
        } as any));
        setCards(base);

        // Fetch card images using the rewardscc cardKey slug (not the internal id)
        const imageResults = await Promise.allSettled(
          apiCards.map(c =>
            fetch(`/api/rewards/image?cardKey=${c.cardKey ?? c.id}`)
              .then(r => r.json())
              .then((data: any) => {
                const item = Array.isArray(data) ? data[0] : data;
                return { id: c.id, imageUrl: item?.cardImageUrl ?? null };
              })
              .catch(() => ({ id: c.id, imageUrl: null }))
          )
        );

        const imageMap: Record<string, string> = {};
        for (const result of imageResults) {
          if (result.status === "fulfilled" && result.value.imageUrl) {
            imageMap[result.value.id] = result.value.imageUrl;
          }
        }

        setCards(prev => prev.map(c => ({ ...c, imageUrl: imageMap[c.id] ?? c.imageUrl })));
      })
      .catch(() => {});

    setLinkedIds(getLinkedCardIds());
  }, []);

  const totalItems = cards.length + 1;
  const maxIndex   = Math.max(0, totalItems - CARDS_PER_PAGE);
  const canPrev    = carouselIndex > 0;
  const canNext    = carouselIndex < maxIndex;

  return (
    <div className="h-screen overflow-hidden flex flex-col" style={{ paddingTop: "72px" }}>

      {/* ── Band 1: Logo | Rewards ── */}
      <motion.div className="flex-1 flex flex-row min-h-0">

        {/* Left — invisible placeholder preserves layout space for the floating KerdosWordmark */}
        <div className="w-1/2 flex items-center pl-[10vw]">
          <div
            aria-hidden
            className="font-extrabold tracking-tighter leading-none select-none invisible"
            style={{ fontSize: "clamp(130px, 18vw, 220px)", fontFamily: "var(--font-display)" }}
          >
            Kerdos
          </div>
        </div>

        {/* Right — rewards */}
        <motion.div
          className="w-1/2 flex flex-col items-end justify-center gap-5 pr-[15vw]"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <p style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.55)", letterSpacing: "0.13em", textTransform: "uppercase", fontFamily: "var(--font-display)", textAlign: "right" }}>
            Total Rewards Balance
          </p>
          <p className="font-extrabold tracking-tighter leading-none text-right"
            style={{ fontSize: "clamp(52px, 7vw, 88px)", fontFamily: "var(--font-display)", color: "var(--green)" }}>
            $1,187<span style={{ color: "rgba(0,200,5,0.38)" }}>.00</span>
          </p>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full"
            style={{ background: "var(--green-dim)", border: "1px solid rgba(0,200,5,0.18)" }}>
            <TrendingUp size={12} strokeWidth={2.5} color="var(--green)" />
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--green)", fontFamily: "var(--font-display)" }}>+12.4%</span>
            <span style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.52)", fontFamily: "var(--font-display)" }}>this month</span>
          </div>
        </motion.div>
      </motion.div>

      {/* ── Band 2: Cards Carousel ── */}
      <motion.div
        className="flex-1 flex flex-col justify-center min-h-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.18 }}
      >
        {/* Header — bounded by same 10vw–85vw as Band 1 */}
        <div className="flex items-center justify-between mb-4 shrink-0" style={{ paddingLeft: "10vw", paddingRight: "15vw" }}>
          <span className="font-bold text-white" style={{ fontSize: 16, letterSpacing: "-0.01em", fontFamily: "var(--font-display)" }}>Your Cards</span>
          {linkedIds && (
            <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.5)", fontFamily: "var(--font-display)", letterSpacing: "0.02em" }}>
              {linkedIds.length} linked via Plaid
            </span>
          )}
        </div>

        {/* Track — arrows on left/right, fade both sides */}
        <div className="relative flex-1 flex items-center min-h-0">

          {/* Left arrow */}
          <button
            onClick={() => setCarouselIndex(i => Math.max(0, i - 1))}
            disabled={!canPrev}
            className="absolute z-10 flex items-center justify-center rounded-full transition-all shrink-0"
            style={{
              left: "calc(10vw - 52px)",
              width: 40, height: 40,
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.2)",
              opacity: canPrev ? 1 : 0.35,
              cursor: canPrev ? "pointer" : "default",
              boxShadow: canPrev ? "0 2px 12px rgba(0,0,0,0.4)" : "none",
            }}
          >
            <ChevronLeft size={20} color="#fff" strokeWidth={2} />
          </button>

          {/* Right arrow — positioned at the 85vw boundary */}
          <button
            onClick={() => setCarouselIndex(i => Math.min(maxIndex, i + 1))}
            disabled={!canNext}
            className="absolute z-10 flex items-center justify-center rounded-full transition-all shrink-0"
            style={{
              right: "calc(15vw - 52px)",
              width: 40, height: 40,
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.2)",
              opacity: canNext ? 1 : 0.35,
              cursor: canNext ? "pointer" : "default",
              boxShadow: canNext ? "0 2px 12px rgba(0,0,0,0.4)" : "none",
            }}
          >
            <ChevronRight size={20} color="#fff" strokeWidth={2} />
          </button>

          {/* Fade reaches 0 just before the 85vw right boundary */}
          <div
            className="overflow-hidden w-full h-full flex items-center"
            style={{
              paddingLeft: "10vw",
              maskImage: "linear-gradient(to right, transparent 0%, black 7%, black 80%, transparent 95%)",
              WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 7%, black 80%, transparent 95%)",
            }}
          >
            <motion.div
              className="flex"
              style={{ gap: CARD_GAP }}
              animate={{ x: -(carouselIndex * (CARD_WIDTH + CARD_GAP)) }}
              transition={{ type: "spring", stiffness: 300, damping: 32 }}
            >
              {cards.map((card, i) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.07, type: "spring", stiffness: 200, damping: 24 }}
                  whileHover={{ y: -6, scale: 1.02, transition: { duration: 0.2 } }}
                  className="shrink-0 cursor-pointer"
                >
                  <CreditCard card={card} width={CARD_WIDTH} />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Add Card — centered below carousel, 1/3 card height */}
        <div className="flex justify-center shrink-0 mt-3">
          <Link href="/plaid-link" target="_blank">
            <Button
              className="rounded-full gap-2 font-bold tracking-wide"
              style={{
                height: Math.round(CARD_WIDTH * 0.63 / 3),
                paddingLeft: 24,
                paddingRight: 24,
                background: "rgba(0,200,5,0.12)",
                border: "1px solid rgba(0,200,5,0.4)",
                color: "var(--green)",
                fontFamily: "var(--font-display)",
                fontSize: 13,
                letterSpacing: "0.04em",
                boxShadow: "0 0 16px rgba(0,200,5,0.12)",
              }}
            >
              <Plus size={14} strokeWidth={2.2} />
              Add Card
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* ── Band 3: Stats ── */}
      <motion.div
        className="flex-1 flex flex-row items-center gap-4 min-h-0"
        style={{ paddingLeft: "10vw", paddingRight: "15vw", paddingBottom: "16px" }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28 }}
      >
        {STATS.map(({ label, value, delta, sub, icon: Icon, color }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.07 }}
            className="flex-1 h-full flex flex-col justify-between"
            style={{
              background: "rgba(16,16,16,0.75)",
              border: "1px solid rgba(255,255,255,0.07)",
              backdropFilter: "blur(24px)",
              borderRadius: 20,
              padding: "20px 22px 18px",
              maxHeight: 136,
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Subtle colored glow in corner */}
            <div style={{
              position: "absolute", top: -20, right: -20,
              width: 80, height: 80, borderRadius: "50%",
              background: `radial-gradient(circle, ${color === "var(--green)" ? "rgba(0,200,5,0.12)" : "rgba(128,236,255,0.10)"} 0%, transparent 70%)`,
              pointerEvents: "none",
            }} />

            {/* Label row */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `color-mix(in srgb, ${color} 18%, transparent)` }}>
                <Icon size={12} color={color} strokeWidth={2} />
              </div>
              <span style={{
                fontSize: 11, fontWeight: 700,
                color: "rgba(255,255,255,0.55)",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                fontFamily: "var(--font-display)",
              }}>
                {label}
              </span>
            </div>

            {/* Value — hero number */}
            <p style={{
              fontSize: "clamp(26px, 2.6vw, 36px)",
              fontWeight: 800,
              lineHeight: 1,
              letterSpacing: "-0.02em",
              fontFamily: "var(--font-display)",
              color: "#fff",
            }}>
              {value}
            </p>

            {/* Delta row */}
            <div className="flex items-center gap-1.5">
              <span style={{
                fontSize: 12, fontWeight: 700,
                color,
                letterSpacing: "0.01em",
                fontFamily: "var(--font-display)",
              }}>
                {delta}
              </span>
              <span style={{ fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.42)", fontFamily: "var(--font-display)" }}>
                {sub}
              </span>
            </div>
          </motion.div>
        ))}
      </motion.div>

    </div>
  );
}
