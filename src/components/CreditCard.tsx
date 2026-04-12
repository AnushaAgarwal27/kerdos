"use client";

const CARD_GRADIENTS: Record<string, { from: string; to: string; accent: string }> = {
  'amex-gold':       { from: '#1c1408', to: '#3d2e0a', accent: '#c9a84c' },
  'chase-sapphire':  { from: '#050f25', to: '#0d2353', accent: '#4a7fd4' },
  'citi-double':     { from: '#030d1e', to: '#0a2240', accent: '#5b9bd5' },
  'discover-it':     { from: '#1a0800', to: '#3d1500', accent: '#f07f2a' },
  'capital-venture': { from: '#06100a', to: '#0d2918', accent: '#2ecc71' },
  other:             { from: '#111111', to: '#222222', accent: '#888888' },
};

export interface CreditCardData {
  id: string;
  issuer: string;
  name: string;
  last4: string;
  network: string;
  color: string;
  imageUrl?: string;
}

export default function CreditCard({ card, width = 280 }: { card: CreditCardData; width?: number }) {
  const height = Math.round(width * 0.63);
  const gradient = CARD_GRADIENTS[card.id] ?? CARD_GRADIENTS.other;
  const pad = Math.round(width * 0.067); // ~18px at 270

  return (
    <div style={{
      width, height,
      borderRadius: 18,
      position: 'relative',
      flexShrink: 0,
      overflow: 'hidden',
      boxShadow: '0 12px 40px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.35)',
    }}>

      {/* Background */}
      {card.imageUrl ? (
        <img
          src={card.imageUrl}
          alt={card.name}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          draggable={false}
        />
      ) : (
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(135deg, ${gradient.from} 0%, ${gradient.to} 100%)`,
        }} />
      )}


      {/* Border */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 18,
        border: '1px solid rgba(255,255,255,0.12)',
        pointerEvents: 'none',
      }} />

      {/* Chip only — no text overlay */}
      <div style={{
        position: 'absolute',
        top: pad,
        right: pad,
        width: Math.round(width * 0.105),
        height: Math.round(width * 0.073),
        borderRadius: 4,
        background: 'linear-gradient(135deg, #f0d080 0%, #c9a84c 50%, #a8862a 100%)',
        border: '1px solid rgba(255,255,255,0.3)',
        boxShadow: '0 2px 6px rgba(0,0,0,0.45)',
      }} />
    </div>
  );
}
