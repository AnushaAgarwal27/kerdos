"use client";

import { AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <AnimatePresence mode="popLayout">
      <div key={pathname} style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {children}
      </div>
    </AnimatePresence>
  );
}
