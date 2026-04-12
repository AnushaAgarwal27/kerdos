"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, LayoutGroup } from "framer-motion";
import { Home, CreditCard, TrendingUp, PieChart, User } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/",            label: "Home",       Icon: Home,       labelWidth: 44 },
  { href: "/smartswipe",  label: "SmartSwipe", Icon: CreditCard, labelWidth: 84 },
  { href: "/rewardvest",  label: "Invest",     Icon: TrendingUp, labelWidth: 50 },
  { href: "/wealthsplit", label: "Summary",    Icon: PieChart,   labelWidth: 64 },
];

export default function Navbar() {
  const path = usePathname();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const isBlurred = (idx: number) => {
    if (hoveredIndex !== null) return hoveredIndex !== idx;
    return false;
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5">

      {/* Spacer — keeps pill centered; KerdosWordmark floats here independently */}
      <div style={{ width: "120px" }} />

      {/* Pill nav */}
      <motion.nav
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 26 }}
        role="navigation"
        aria-label="Main navigation"
        className="flex items-center p-1.5 rounded-full space-x-1"
        onMouseLeave={() => setHoveredIndex(null)}
        style={{
          background: "rgba(22,22,22,0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.07)",
          boxShadow: "0 4px 32px rgba(0,0,0,0.5)",
        }}
      >
        <LayoutGroup>
          {NAV_LINKS.map(({ href, label, Icon, labelWidth }, idx) => {
            const active = path === href;
            const blurred = isBlurred(idx);

            return (
              <motion.div
                key={href}
                layout
                onMouseEnter={() => setHoveredIndex(idx)}
                animate={{
                  filter:  blurred ? "blur(1px)" : "blur(0px)",
                  opacity: blurred ? 0.75 : 1,
                }}
                transition={{ duration: 0.3 }}
              >
                <Link
                  href={href}
                  aria-label={label}
                  className={cn(
                    "flex items-center px-3 py-2 rounded-full h-10",
                    active && "bg-white/10"
                  )}
                >
                  <Icon
                    size={20}
                    strokeWidth={active ? 2.5 : 1.8}
                    color="#fff"
                    aria-hidden
                  />

                  <motion.div
                    initial={false}
                    animate={{
                      width:      active ? `${labelWidth}px` : "0px",
                      opacity:    active ? 1 : 0,
                      marginLeft: active ? "8px" : "0px",
                    }}
                    transition={{
                      width:      { type: "spring", stiffness: 500, damping: 36 },
                      opacity:    { duration: 0.12 },
                      marginLeft: { duration: 0.12 },
                    }}
                    className="overflow-hidden flex items-center"
                  >
                    <span className="font-medium text-xs whitespace-nowrap select-none text-white">
                      {label}
                    </span>
                  </motion.div>
                </Link>
              </motion.div>
            );
          })}
        </LayoutGroup>
      </motion.nav>

      {/* Profile — top right, same width as logo spacer to keep pill centered */}
      <div style={{ width: "120px" }} className="flex justify-end">
        <button
          aria-label="Profile"
          className="flex items-center justify-center rounded-full"
          style={{
            width: 52, height: 52,
            background: "rgba(22,22,22,0.85)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.07)",
            boxShadow: "0 4px 32px rgba(0,0,0,0.5)",
            color: "#fff",
            flexShrink: 0,
          }}
        >
          <User size={20} strokeWidth={1.5} />
        </button>
      </div>

    </header>
  );
}
