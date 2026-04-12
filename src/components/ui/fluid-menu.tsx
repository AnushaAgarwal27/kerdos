"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface MenuItemProps {
  children?: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  icon?: React.ReactNode
  label?: string
  isActive?: boolean
}

export function MenuItem({ children, onClick, disabled = false, icon, label, isActive = false }: MenuItemProps) {
  return (
    <button
      className={`relative flex items-center justify-center w-full h-full group
        ${disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"}
      `}
      role="menuitem"
      title={label}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && (
        <span className="flex items-center justify-center flex-shrink-0 transition-all duration-200 group-hover:[&_svg]:stroke-[2.5]">
          {icon}
        </span>
      )}
      {children}
    </button>
  )
}

interface MenuContainerProps {
  children: React.ReactNode
  onToggle?: (expanded: boolean) => void
  activeKey?: string
  /** Which direction pills expand. Default: "right" */
  direction?: "left" | "right"
}

export function MenuContainer({ children, onToggle, activeKey, direction = "right" }: MenuContainerProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const childrenArray = React.Children.toArray(children)

  const handleToggle = () => {
    const next = !isExpanded
    setIsExpanded(next)
    onToggle?.(next)
  }

  const W     = 68   // pill width
  const H     = 52   // pill height
  const R     = H / 2
  const GAP   = 8    // gap between pills
  const LABEL = 20   // space below pill for label

  const getLabel = (child: React.ReactNode): string | undefined => {
    if (React.isValidElement(child)) return (child.props as MenuItemProps).label
    return undefined
  }

  const triggerLabel = getLabel(childrenArray[0])
  const otherItems   = childrenArray.slice(1)
  const dir          = direction === "left" ? -1 : 1

  return (
    <div className="relative" style={{ width: W, height: H }} data-expanded={isExpanded}>

      {/* Items 1…n — slide out on open */}
      {otherItems.map((child, index) => {
        const label = getLabel(child)
        const clipLeft  = direction === "right" ? "8px" : "0"
        const clipRight = direction === "left"  ? "8px" : "0"
        const isLast    = index === otherItems.length - 1

        return (
          <div
            key={index}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: W,
              height: H,
              borderRadius: R,
              background: "rgba(26,26,26,0.92)",
              border: "1px solid rgba(255,255,255,0.11)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              transform: `translateX(${isExpanded ? dir * (index + 1) * (W + GAP) : 0}px)`,
              opacity: isExpanded ? 1 : 0,
              zIndex: 30 - index,
              clipPath: isLast
                ? `inset(0 0 0 0 round ${R}px)`
                : `inset(0 ${clipRight} 0 ${clipLeft} round ${R}px)`,
              transition: `transform ${isExpanded ? "340ms" : "260ms"} cubic-bezier(0.4, 0, 0.2, 1),
                           opacity  ${isExpanded ? "200ms" : "280ms"} ease`,
              transitionDelay: isExpanded
                ? `${index * 40}ms`
                : `${(otherItems.length - 1 - index) * 24}ms`,
            }}
          >
            {child}

            {/* Label below pill */}
            {label && (
              <motion.span
                initial={false}
                animate={{ opacity: isExpanded ? 1 : 0, y: isExpanded ? 0 : -6 }}
                transition={{
                  duration: 0.18,
                  delay: isExpanded ? index * 0.04 + 0.15 : 0,
                  ease: [0.4, 0, 0.2, 1],
                }}
                style={{
                  position: "absolute",
                  top: H + 4,
                  left: "50%",
                  transform: "translateX(-50%)",
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  fontFamily: "var(--font-display)",
                  color: "rgba(255,255,255,0.55)",
                  whiteSpace: "nowrap",
                  pointerEvents: "none",
                }}
              >
                {label}
              </motion.span>
            )}
          </div>
        )
      })}

      {/* Trigger pill */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: W,
          height: H,
          borderRadius: R,
          background: isExpanded ? "rgba(0,200,5,0.13)" : "rgba(26,26,26,0.92)",
          border: isExpanded ? "1.5px solid rgba(0,200,5,0.55)" : "1px solid rgba(255,255,255,0.16)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          cursor: "pointer",
          zIndex: 50,
          overflow: "hidden",
          boxShadow: isExpanded
            ? "0 0 24px rgba(0,200,5,0.2), 0 4px 18px rgba(0,0,0,0.55)"
            : "0 4px 18px rgba(0,0,0,0.5)",
          transition: "background 0.22s, border-color 0.22s, box-shadow 0.22s",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        onClick={handleToggle}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeKey ?? "trigger"}
            initial={{ opacity: 0, scale: 0.72, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.72, y: -4 }}
            transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%" }}
          >
            {childrenArray[0]}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Trigger label — always visible below trigger, green to signal active */}
      {triggerLabel && (
        <motion.span
          key={activeKey}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          style={{
            position: "absolute",
            top: H + 4,
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            fontFamily: "var(--font-display)",
            color: "rgba(0,200,5,0.8)",
            whiteSpace: "nowrap",
            pointerEvents: "none",
          }}
        >
          {triggerLabel}
        </motion.span>
      )}
    </div>
  )
}
