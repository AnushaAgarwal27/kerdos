// ─── THEME ───────────────────────────────────────────────────────────────────

export const COLORS = {
  bg:      '#0f0f0f',
  bgCard:  '#1a1a1a',
  bgCard2: '#232323',
  border:  '#2c2c2e',
  borderStrong: 'rgba(255,255,255,0.18)',

  text:          '#ffffff',
  textSecondary: '#8e8e93',
  textMuted:     '#48484a',

  green:    '#00c805',   // Fidelity green
  greenDim: 'rgba(0,200,5,0.12)',
  blue:     '#0a84ff',
  blueDim:  'rgba(10,132,255,0.12)',
  purple:   '#bf5af2',
  purpleDim:'rgba(191,90,242,0.12)',
  yellow:   '#ffd60a',
  red:      '#ff3b30',

  tabBar: '#111111',
};

export const ANIM = {
  fast:   200,
  normal: 350,
  slow:   600,
  orb:    2500,
};

export const CARD_GRADIENTS: Record<string, [string, string]> = {
  amex:    ['#1a1a2e', '#0f3460'],
  chase:   ['#1a0533', '#2d0d63'],
  citi:    ['#0a1628', '#1a3a5c'],
  discover:['#1a0a00', '#5c2a00'],
  capital: ['#001a0a', '#005c26'],
};
