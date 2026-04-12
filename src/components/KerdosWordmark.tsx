"use client";

import { motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

const PILL_H  = 52;  // p-1.5 (6px×2) + h-10 (40px) — matches nav pill exactly
const PILL_PX = 16;  // horizontal padding inside the pill
const NAV_H   = 72;

function computePos(isHome: boolean) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  if (isHome) {
    const fontSize    = Math.min(220, Math.max(130, vw * 0.18));
    const bandCenterY = NAV_H + (vh - NAV_H) / 6;
    // div height = fontSize, alignItems:center → text center = y + fontSize/2 = bandCenterY
    return { x: vw * 0.1, y: bandCenterY - fontSize / 2, height: fontSize, fontSize, px: 0 };
  } else {
    // pill centered in 72px header: y = (72 - 52) / 2 = 10
    return { x: 32, y: (NAV_H - PILL_H) / 2, height: PILL_H, fontSize: 18, px: PILL_PX };
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
    <motion.div
      onClick={() => { if (!isHome) router.push("/"); }}
      style={{
        position:          "fixed",
        left:              0,
        top:               0,
        zIndex:            50,
        display:           "flex",
        alignItems:        "center",
        borderRadius:      9999,
        borderWidth:       1,
        borderStyle:       "solid",
        fontFamily:        "var(--font-display)",
        fontWeight:        800,
        color:             "#fff",
        lineHeight:        1,
        userSelect:        "none",
        pointerEvents:     isHome ? "none" : "auto",
        cursor:            isHome ? "default" : "pointer",
        transformOrigin:   "left top",
        willChange:        "transform",
        backdropFilter:    isHome ? "none" : "blur(20px)",
        WebkitBackdropFilter: isHome ? "none" : "blur(20px)",
      }}
      animate={{
        x:           pos.x,
        y:           pos.y,
        height:      pos.height,
        fontSize:    pos.fontSize,
        paddingLeft:  pos.px,
        paddingRight: pos.px,
        borderColor:  isHome ? "rgba(255,255,255,0)" : "rgba(255,255,255,0.07)",
        background:   isHome ? "rgba(22,22,22,0)"    : "rgba(22,22,22,0.85)",
        boxShadow:    isHome
          ? "0 0px 0px rgba(0,0,0,0)"
          : "0 4px 32px rgba(0,0,0,0.5)",
      }}
      // No bounce on either direction — overdamped springs (ζ > 1)
      transition={isHome
        // Maximize: deliberate, smooth, no overshoot
        ? { type: "spring", stiffness: 65, damping: 20, mass: 1 }
        // Minimize: quick, clean exit
        : { type: "spring", stiffness: 220, damping: 30, mass: 1 }
      }
    >
      Kerdos
    </motion.div>
  );
}
