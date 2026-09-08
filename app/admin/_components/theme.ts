/**
 * Chart tokens for the admin dashboard, in both site themes.
 *
 * The values mirror the CSS variables in globals.css (Tokyo Night dark, and
 * the light counterpart) so the admin pages read as part of the site rather
 * than a separate grey app. Where a raw hex is needed in JS — luminance
 * decisions, SVG ramp steps — it is duplicated here; layout colours that can
 * be CSS should use the variables directly.
 *
 * Dark mode is *selected*, not an automatic flip: each mode's series and ramp
 * steps were validated against that mode's own surface. The site's own dark
 * accents could not be used as-is — Tokyo Night's pastels sit above the
 * lightness band (L 0.72-0.80 vs 0.48-0.67) and its green and amber are
 * indistinguishable under deuteranopia (ΔE 0.8) — so the dark series are
 * darker steps of the same four hues.
 */

export type ThemeMode = 'dark' | 'light';

export interface ChartTheme {
  mode: ThemeMode;
  /** Card surface. */
  surface: string;
  /** Inset panel inside a card. */
  surfaceSunken: string;
  /** Page background. */
  page: string;
  border: string;
  ink: string;
  inkMuted: string;
  /** Hairline gridlines. */
  grid: string;
  /** Baseline / axis. */
  axis: string;
  /** Tooltip surface and its border. */
  tooltipSurface: string;
  tooltipBorder: string;
  /** Track behind a bar-list bar, and a "no data" heatmap cell. */
  track: string;
  emptyCell: string;
  /** Row background for the selected item in a list. */
  selectedRow: string;
  /**
   * Fixed categorical order — assign by slot, never cycle. Slot N is the same
   * hue in both modes (purple, amber, blue, green), so a series keeps its
   * identity across a theme switch.
   */
  series: readonly [string, string, string, string];
  /** Single-hue magnitude ramp for the heatmap, low → high. */
  sequential: readonly string[];
  /** Magnitude ramp for map markers — every step visible on the map fill. */
  markerRamp: readonly string[];
  /** Map geography fills. */
  map: {
    land: string;
    landHover: string;
    landStroke: string;
    ocean: string;
    cityDot: string;
    cityLabel: string;
  };
  /** Reserved for state, never for a series. */
  status: { good: string; warning: string; serious: string; critical: string };
}

const DARK: ChartTheme = {
  mode: 'dark',
  surface: '#1a1b26',
  surfaceSunken: '#16161e',
  page: '#0f0f14',
  border: 'rgba(255, 255, 255, 0.06)',
  ink: '#c0caf5',
  inkMuted: '#7a83a8',
  grid: 'rgba(192, 202, 245, 0.08)',
  axis: 'rgba(192, 202, 245, 0.20)',
  tooltipSurface: '#24283b',
  tooltipBorder: 'rgba(192, 202, 245, 0.18)',
  track: '#24283b',
  emptyCell: '#1e2030',
  selectedRow: '#2a2545',
  // Darker steps of the site's purple / amber / blue / green.
  series: ['#9d7cd8', '#c98500', '#5f87d8', '#4f9d5a'],
  sequential: ['#342742', '#4a385d', '#614a7a', '#795d98', '#9270b7', '#ab84d7', '#c699f8'],
  markerRamp: ['#7d4dad', '#976dc5', '#b28cde', '#ceacf7'],
  map: {
    land: '#1a1f2e',
    landHover: '#232940',
    landStroke: '#2d3548',
    ocean: '#0d1117',
    cityDot: '#7d7d7d',
    cityLabel: '#9a9a9a',
  },
  status: { good: '#0ca30c', warning: '#fab219', serious: '#ec835a', critical: '#d03b3b' },
};

const LIGHT: ChartTheme = {
  mode: 'light',
  surface: '#ffffff',
  surfaceSunken: '#f5f5f7',
  page: '#f5f5f7',
  border: 'rgba(0, 0, 0, 0.08)',
  ink: '#1a1b26',
  inkMuted: '#6b7280',
  grid: 'rgba(26, 27, 38, 0.10)',
  axis: 'rgba(26, 27, 38, 0.28)',
  tooltipSurface: '#ffffff',
  tooltipBorder: 'rgba(0, 0, 0, 0.14)',
  track: '#e8e8ec',
  emptyCell: '#eeeef1',
  selectedRow: '#ede9fe',
  // The site's own light accents, in the same hue order as dark.
  series: ['#7c3aed', '#d97706', '#2563eb', '#16a34a'],
  sequential: ['#f3eaff', '#dbcbf0', '#c4ace0', '#ad8ed1', '#9771c0', '#8152b0', '#6c329f'],
  markerRamp: ['#a975e0', '#8f5ac4', '#763ea9', '#5e218f'],
  map: {
    land: '#dcdce3',
    landHover: '#cfcfd9',
    landStroke: '#b8b8c4',
    ocean: '#f0f0f4',
    cityDot: '#8a8a96',
    cityLabel: '#5c5c68',
  },
  status: { good: '#15803d', warning: '#b45309', serious: '#c2410c', critical: '#b91c1c' },
};

export function getChartTheme(mode: ThemeMode): ChartTheme {
  return mode === 'light' ? LIGHT : DARK;
}

/**
 * Height of the viewport below the fixed navbar.
 *
 * The root layout renders pages inside `<main class="pt-14">`, so a plain
 * 100vh box starts 56px down the page and overflows by the navbar's height.
 * Use this for full-height page backgrounds, which start below the navbar.
 */
export const CONTENT_MIN_HEIGHT = 'calc(100dvh - 3.5rem)';

/**
 * Centres a lone card against the true centre of the viewport.
 *
 * Subtracting the navbar's height from the box (CONTENT_MIN_HEIGHT) centres
 * within the space *below* the navbar, which still leaves the card half a
 * navbar low. The negative margin instead cancels the layout's `pt-14`, so the
 * box spans the whole viewport and its centre is the screen's centre.
 *
 * The card is centred with `margin: auto` rather than `align-items: center`:
 * auto margins collapse to zero when space runs out, so on a very short
 * viewport the card pins to the top and stays reachable instead of being
 * clipped above the scroll origin.
 */
export const VIEWPORT_CENTERED = {
  minHeight: '100dvh',
  marginTop: '-3.5rem',
  display: 'flex',
} as const;

export const VIEWPORT_CENTERED_CARD = { margin: 'auto' } as const;

/**
 * Pick a ramp step for `value` on a 0..max scale.
 * Zero returns the empty-cell colour so "none" never reads as "a little".
 */
export function rampColor(theme: ChartTheme, value: number, max: number): string {
  if (value <= 0 || max <= 0) return theme.emptyCell;
  // sqrt keeps the low end readable when the distribution is long-tailed.
  const t = Math.sqrt(value / max);
  const steps = theme.sequential;
  const i = Math.min(steps.length - 1, Math.max(0, Math.round(t * (steps.length - 1))));
  return steps[i];
}

/** Pick a marker ramp step for `value` on a 0..max scale. */
export function markerColor(theme: ChartTheme, value: number, max: number): string {
  const steps = theme.markerRamp;
  if (max <= 0) return steps[0];
  const t = Math.sqrt(Math.max(0, value) / max);
  const i = Math.min(steps.length - 1, Math.max(0, Math.round(t * (steps.length - 1))));
  return steps[i];
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
