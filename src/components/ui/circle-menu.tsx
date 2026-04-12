"use client";

import { useState } from "react";
import { motion, AnimatePresence, useAnimationControls } from "framer-motion";

const ITEM_SIZE = 48;
const CONTAINER_SIZE = 220;
const OPEN_STAGGER = 0.02;
const CLOSE_STAGGER = 0.07;

function pointOnCircle(
  i: number, n: number, r: number, cx = 0, cy = 0
): { x: number; y: number } {
  const theta = (2 * Math.PI * i) / n - Math.PI / 2;
  return { x: cx + r * Math.cos(theta), y: cy + r * Math.sin(theta) };
}

type CategoryItem = {
  id: string;
  label: string;
  icon: string;
};

type MenuItemProps = {
  item: CategoryItem;
  index: number;
  total: number;
  radius: number;
  isOpen: boolean;
  isSelected: boolean;
  onSelect: (id: string) => void;
};

function MenuItem({ item, index, total, radius, isOpen, isSelected, onSelect }: MenuItemProps) {
  const { x, y } = pointOnCircle(index, total, radius);

  return (
    <motion.button
      onClick={() => onSelect(item.id)}
      initial={false}
      animate={isOpen ? {
        x, y, opacity: 1, scale: 1,
        transition: {
          type: "spring", stiffness: 380, damping: 28,
          delay: index * OPEN_STAGGER,
        },
      } : {
        x: 0, y: 0, opacity: 0, scale: 0.5,
        transition: {
          type: "spring", stiffness: 420, damping: 32,
          delay: (total - index - 1) * CLOSE_STAGGER,
        },
      }}
      whileHover={{ scale: isOpen ? 1.15 : 1 }}
      whileTap={{ scale: 0.9 }}
      style={{
        position: "absolute",
        width: ITEM_SIZE,
        height: ITEM_SIZE,
        borderRadius: "50%",
        border: isSelected
          ? "1.5px solid rgba(0,200,5,0.7)"
          : "1px solid rgba(255,255,255,0.12)",
        background: isSelected
          ? "rgba(0,200,5,0.18)"
          : "rgba(30,30,30,0.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        gap: 1,
        boxShadow: isSelected
          ? "0 0 18px rgba(0,200,5,0.22)"
          : "0 2px 12px rgba(0,0,0,0.4)",
        transform: "translate(-50%, -50%)",
        left: "50%",
        top: "50%",
      }}
      title={item.label}
    >
      <span style={{ fontSize: 18, lineHeight: 1 }}>{item.icon}</span>
      <span style={{
        fontSize: 8,
        fontWeight: 700,
        color: isSelected ? "rgba(0,200,5,0.9)" : "rgba(255,255,255,0.5)",
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        fontFamily: "var(--font-display)",
        lineHeight: 1,
      }}>
        {item.label}
      </span>
    </motion.button>
  );
}

type CircleMenuProps = {
  items: CategoryItem[];
  selected: string;
  onSelect: (id: string) => void;
  openIcon?: React.ReactNode;
  closeIcon?: React.ReactNode;
};

export function CircleMenu({ items, selected, onSelect, openIcon, closeIcon }: CircleMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const controls = useAnimationControls();

  const selectedItem = items.find(i => i.id === selected);

  const handleToggle = () => {
    setIsOpen(prev => !prev);
  };

  const handleSelect = (id: string) => {
    onSelect(id);
    setIsOpen(false);
  };

  return (
    <div
      style={{
        position: "relative",
        width: CONTAINER_SIZE,
        height: CONTAINER_SIZE,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {/* Radial items */}
      <AnimatePresence>
        {items.map((item, i) => (
          <MenuItem
            key={item.id}
            item={item}
            index={i}
            total={items.length}
            radius={82}
            isOpen={isOpen}
            isSelected={selected === item.id}
            onSelect={handleSelect}
          />
        ))}
      </AnimatePresence>

      {/* Center trigger */}
      <motion.button
        onClick={handleToggle}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        animate={{ rotate: isOpen ? 45 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 32 }}
        style={{
          position: "relative",
          zIndex: 10,
          width: 64,
          height: 64,
          borderRadius: "50%",
          border: isOpen
            ? "1.5px solid rgba(0,200,5,0.5)"
            : "1px solid rgba(255,255,255,0.15)",
          background: isOpen
            ? "rgba(0,200,5,0.12)"
            : "rgba(28,28,28,0.9)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
          boxShadow: isOpen
            ? "0 0 28px rgba(0,200,5,0.18), 0 4px 20px rgba(0,0,0,0.5)"
            : "0 4px 20px rgba(0,0,0,0.5)",
        }}
      >
        {!isOpen && selectedItem ? (
          <>
            <span style={{ fontSize: 22, lineHeight: 1 }}>{selectedItem.icon}</span>
            <span style={{
              fontSize: 7,
              fontWeight: 800,
              color: "rgba(0,200,5,0.8)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              fontFamily: "var(--font-display)",
            }}>
              {selectedItem.label}
            </span>
          </>
        ) : (
          openIcon ?? (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <line x1="10" y1="3" x2="10" y2="17" stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeLinecap="round"/>
              <line x1="3" y1="10" x2="17" y2="10" stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          )
        )}
      </motion.button>
    </div>
  );
}
