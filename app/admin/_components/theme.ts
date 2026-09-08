/**
 * Chart tokens for the admin dashboard.
 *
 * The categorical order below was validated against the dashboard's own dark
 * surface (#141414): all four slots clear the lightness band, chroma floor,
 * adjacent-pair CVD separation and 3:1 contrast. Only the first THREE clear the
 * all-pairs gates, so forms where every pair can sit side by side (the map,
 * scatter) cap out at three series; past that, fold into "Other".
 */

export const SURFACE = '#141414';
export const SURFACE_SUNKEN = '#0f0f0f';
export const PAGE = '#0a0a0a';
export const BORDER = '#2a2a2a';

/**
 * Height of the viewport below the fixed navbar.
 *
 * The root layout renders pages inside `<main class="pt-14">`, so a plain
 * 100vh box starts 56px down the page — it overflows by the navbar's height
 * and centres its contents that much too low.
 */
export const CONTENT_MIN_HEIGHT = 'calc(100dvh - 3.5rem)';

export const INK = '#ededed';
export const INK_MUTED = '#8a8a8a';
export const GRID = '#242424';
export const AXIS = '#333333';

/** Fixed categorical order — assign by slot, never cycle. */
export const SERIES = ['#9085e9', '#d95926', '#199e70', '#c98500'] as const;

/** Single-hue magnitude ramp, low → high. Validated monotone, 4° hue spread. */
export const SEQUENTIAL = [
  '#2a2447', '#3b3168', '#4f4090', '#6455bd', '#7c6cd8', '#9085e9', '#ada2f0',
] as const;

/** Reserved for state, never for a series. */
export const STATUS = {
  good: '#0ca30c',
  warning: '#fab219',
  serious: '#ec835a',
  critical: '#d03b3b',
} as const;

/** A "no data" cell, distinct from the ramp's near-zero step. */
export const EMPTY_CELL = '#1c1c1c';

/**
 * Pick a ramp step for `value` on a 0..max scale.
 * Zero returns the empty-cell colour so "none" never reads as "a little".
 */
export function rampColor(value: number, max: number): string {
  if (value <= 0 || max <= 0) return EMPTY_CELL;
  // sqrt keeps the low end readable when the distribution is long-tailed.
  const t = Math.sqrt(value / max);
  const i = Math.min(SEQUENTIAL.length - 1, Math.max(0, Math.round(t * (SEQUENTIAL.length - 1))));
  return SEQUENTIAL[i];
}

// ---------------------------------------------------------------------------
// Formatters
// ---------------------------------------------------------------------------

export function formatCount(n: number): string {
  if (!Number.isFinite(n)) return '—';
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (Math.abs(n) >= 10_000) return `${(n / 1000).toFixed(0)}K`;
  if (Math.abs(n) >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(Math.round(n));
}

export function formatExact(n: number): string {
  return Number.isFinite(n) ? Math.round(n).toLocaleString('en-US') : '—';
}

export function formatDuration(seconds?: number | null): string {
  if (typeof seconds !== 'number' || !Number.isFinite(seconds) || seconds < 0) return '—';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  if (mins < 60) return secs ? `${mins}m ${secs}s` : `${mins}m`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ${mins % 60}m`;
}

export function formatPercent(fraction: number, digits = 0): string {
  if (!Number.isFinite(fraction)) return '—';
  return `${(fraction * 100).toFixed(digits)}%`;
}

/** Axis ticks rounded to a clean 1 / 2 / 5 × 10ⁿ step. */
export function niceTicks(max: number, count = 4): number[] {
  if (max <= 0) return [0];
  const rough = max / count;
  const mag = Math.pow(10, Math.floor(Math.log10(rough)));
  const step = [1, 2, 5, 10].map((m) => m * mag).find((s) => s >= rough) ?? 10 * mag;
  const ticks: number[] = [];
  for (let t = 0; t <= max + step * 0.001; t += step) ticks.push(Math.round(t * 1000) / 1000);
  return ticks;
}
