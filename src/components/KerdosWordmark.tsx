"use client";

import { motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

const NAV_H = 72;

function computePos(isHome: boolean) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  if (isHome) {
    const fontSize    = Math.min(220, Math.max(130, vw * 0.18));
    const bandCenterY = NAV_H + (vh - NAV_H) / 6;
    return { x: vw * 0.1, y: bandCenterY - fontSize / 2, fontSize };
  } else {
    const fontSize = 36;
    return { x: 44, y: NAV_H / 2 - fontSize / 2, fontSize };
  }
}

export default function KerdosWordmark() {
  const path   = usePathname();
  const router = useRouter();
  const isHome = path === "/";

  const [pos,   setPos]   = useState<ReturnType<typeof computePos> | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setPos(computePos(path === "/"));
    setReady(true);
  }, [path]);

  useEffect(() => {
    function onResize() { setPos(computePos(path === "/")); }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [path]);

  if (!ready || !pos) return null;

  return (
    <motion.span
      onClick={() => { if (!isHome) router.push("/"); }}
      style={{
        position:       "fixed",
        left:           0,
        top:            0,
        zIndex:         50,
        fontFamily:     "var(--font-display)",
        fontWeight:     800,
        color:          "#fff",
        lineHeight:     1,
        userSelect:     "none",
        pointerEvents:  isHome ? "none" : "auto",
        cursor:         isHome ? "default" : "pointer",
        transformOrigin: "left top",
        willChange:     "transform",
      }}
      animate={{
        x:        pos.x,
        y:        pos.y,
        fontSize: pos.fontSize,
      }}
      transition={isHome
        ? { type: "spring", stiffness: 320, damping: 32, mass: 1 }
        : { type: "spring", stiffness: 380, damping: 36, mass: 1 }
      }
    >
      Kerdos
    </motion.span>
  );
}
