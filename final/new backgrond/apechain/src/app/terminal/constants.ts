import type { SceneId } from './types';

// ─── Dark Glass UI Token System ──────────────────────────────────
// Premium institutional quant terminal — THEME ONLY
// Same structure as original, only colors + glass effects changed

function rgba(hex: string, a: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

export const TOKENS = {
  // ── Backgrounds ── Dark layered depth
  bg0: '#0A0A0F',                 // Page background — deep dark (fallback)
  bg1: 'rgba(255,255,255,0.04)',  // Panels, topbar — subtle glass
  bg2: 'rgba(255,255,255,0.06)',  // Cards, containers — glass card
  bg3: 'rgba(255,255,255,0.10)',  // Hover states, active rows, sidebar
  bg4: 'rgba(255,255,255,0.14)',  // Pressed states, deeper hover
  bg5: 'rgba(255,255,255,0.20)',  // Dropdowns, popovers, modals

  // ── Borders ── Subtle glass borders
  b1: 'rgba(255,255,255,0.10)',   // Default borders
  b2: 'rgba(255,255,255,0.18)',   // Hover borders
  b3: '#E7C07B',                  // Active / focus — gold accent

  // ── Text ── Light on dark
  t0: '#F5F7FA',              // Primary headings, values — bright white
  t1: '#C7D2D9',              // Secondary body — light gray
  t2: '#94A3B8',              // Tertiary labels — muted gray
  t3: '#64748B',              // Disabled, placeholders — dim gray

  // ── Semantic ── Premium accents
  chartPrimary: '#E7C07B',    // Gold — primary accent
  chartSecondary: '#6EC5D6',  // Cyan — secondary
  positive: '#7FD6A3',        // Soft green — positive
  negative: '#E26A6A',        // Soft red — negative
  warning: '#DDBA6C',         // Warm gold — warning
  gold: '#E7C07B',            // Gold accent for highlights

  // ── Alpha helpers ──
  alpha: rgba,

  // ── Shadows ── Dark depth, subtle
  shadowCard: '0 4px 24px rgba(0,0,0,0.25)',
  shadowElevated: '0 12px 40px rgba(0,0,0,0.35)',
  shadowModal: '0 24px 64px rgba(0,0,0,0.45)',
} as const;

// ─── Typography ──────────────────────────────────────────────────
export const TYPOGRAPHY = {
  display: 'var(--font-playfair), "Playfair Display", Georgia, serif',
  body: 'var(--font-inter), "Inter", system-ui, sans-serif',
  mono: 'var(--font-jetbrains), "JetBrains Mono", "IBM Plex Mono", monospace',
} as const;

// ─── Spacing Scale ───────────────────────────────────────────────
export const SPACE = {
  section: '80px',     // Section vertical padding
  sectionLarge: '120px',
  card: '28px',        // Card internal padding
  cardLarge: '32px',
  grid: '24px',        // Grid gap
  gridLarge: '32px',
} as const;

// ─── Scene Order & Keymap ────────────────────────────────────────
export const SCENE_ORDER: SceneId[] = [
  'executive-summary',
  'performance',
  'risk',
  'drawdowns',
  'monte-carlo',
  'trade-diagnostics',
  'ai-insights',
  'final-verdict',
];

export const SCENE_MAP: Record<string, SceneId> = {
  '1': 'executive-summary',
  '2': 'performance',
  '3': 'risk',
  '4': 'drawdowns',
  '5': 'monte-carlo',
  '6': 'trade-diagnostics',
  '7': 'ai-insights',
  '8': 'final-verdict',
};

export const SCENE_LABELS: Record<SceneId, string> = {
  'executive-summary': 'Executive Summary',
  'performance': 'Performance',
  'risk': 'Risk Analysis',
  'drawdowns': 'Drawdowns',
  'monte-carlo': 'Monte Carlo',
  'trade-diagnostics': 'Trade Diagnostics',
  'ai-insights': 'AI Insights',
  'final-verdict': 'Final Verdict',
};

export const NAV_ITEMS: { id: SceneId; label: string }[] = [
  { id: 'executive-summary', label: 'Executive Summary' },
  { id: 'performance', label: 'Performance' },
  { id: 'risk', label: 'Risk Analysis' },
  { id: 'drawdowns', label: 'Drawdowns' },
  { id: 'monte-carlo', label: 'Monte Carlo' },
  { id: 'trade-diagnostics', label: 'Trade Diagnostics' },
  { id: 'ai-insights', label: 'AI Insights' },
  { id: 'final-verdict', label: 'Final Verdict' },
];

// ─── Report metadata ─────────────────────────────────────────────
export const REPORT_META = {
  model: 'Q-3.2',
  latency: '32ms',
  coverage: '95%',
  universe: 'NIFTY 50 + SPX',
  regimes: '5 detected',
  lastRun: '02:18 UTC',
};
