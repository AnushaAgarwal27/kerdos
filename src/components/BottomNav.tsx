"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CreditCard, ArrowUpDown, TrendingUp, PieChart } from "lucide-react";

const TABS = [
  { href: "/",            label: "Home",       Icon: Home },
  { href: "/smartswipe",  label: "SmartSwipe", Icon: CreditCard },
  { href: "/transact",    label: "Transact",   Icon: ArrowUpDown, center: true },
  { href: "/rewardvest",  label: "Invest",     Icon: TrendingUp },
  { href: "/wealthsplit", label: "Summary",    Icon: PieChart },
];

export default function BottomNav() {
  const path = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 w-full flex justify-around items-end pb-6 pt-3 px-4 z-50"
      style={{
        background: "rgba(11,15,11,0.9)",
        backdropFilter: "blur(28px)",
        WebkitBackdropFilter: "blur(28px)",
        borderRadius: "24px 24px 0 0",
        boxShadow: "0 -12px 48px rgba(0,0,0,0.7)",
      }}
    >
      {TABS.map(({ href, label, Icon, center }) => {
        const active = path === href;

        if (center) {
          return (
            <Link key={href} href={href} className="flex flex-col items-center -translate-y-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, var(--green) 0%, #00a804 100%)",
                  boxShadow: "0 0 28px rgba(0,200,5,0.35)",
                }}
              >
                <Icon size={26} color="#000" strokeWidth={2.5} />
              </div>
              <span
                className="text-[10px] mt-2 font-bold uppercase tracking-widest"
                style={{ color: "var(--green)" }}
              >
                {label}
              </span>
            </Link>
          );
        }

        return (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center justify-center gap-1 py-2 px-4 rounded-2xl transition-all duration-200"
            style={{
              background: active ? "rgba(255,255,255,0.07)" : "transparent",
              transform: active ? "scale(1.08)" : "scale(1)",
            }}
          >
            <Icon
              size={22}
              strokeWidth={active ? 2.5 : 1.8}
              color={active ? "var(--green)" : "var(--text-3)"}
            />
            <span
              className="text-[10px] font-semibold uppercase tracking-widest"
              style={{ color: active ? "var(--green)" : "var(--text-3)" }}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
