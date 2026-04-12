export function cardAccent(seed: string) {
  const palette = [
    "#60a5fa",
    "#a78bfa",
    "#22d3ee",
    "#fb923c",
    "#4ade80",
    "#f87171",
    "#facc15",
    "#2dd4bf",
  ];

  let hash = 0;
  for (const char of seed) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }

  return palette[hash % palette.length];
}
