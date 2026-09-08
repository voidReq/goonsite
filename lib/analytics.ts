/**
 * Visitor-log analytics.
 *
 * Reads the append-only JSONL files under data/visitors/ and turns them into
 * the aggregates the admin dashboard renders: totals, a bucketed time series,
 * top pages/referrers/geos, device breakdowns and an activity heatmap.
 *
 * Everything is computed in REPORT_TZ so that reported "days" line up with the
 * day boundaries the log files themselves are named after.
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const VISITORS_DIR = join(process.cwd(), 'data', 'visitors');

/** Log files are named for the LA-local date, so all reporting uses that zone. */
export const REPORT_TZ = 'America/Los_Angeles';

/** A session ends after this much inactivity from the same IP. */
const SESSION_GAP_MS = 30 * 60 * 1000;

export type Bucket = 'tenmin' | 'hour' | 'day' | 'week' | 'month';

export type RangePreset =
  | '1h' | '24h' | '7d' | '30d' | '90d'
  | 'day' | 'week' | 'month' | 'quarter' | 'year'
  | '12m' | 'all';

/** Calendar presets support prev/next navigation; rolling windows do not. */
export const CALENDAR_PRESETS: RangePreset[] = ['day', 'week', 'month', 'quarter', 'year'];

export interface RawEntry {
  type?: string;
  ip?: string;
  timestamp: string;
  path: string;
  user_agent?: string;
  referer?: string | null;
  duration_seconds?: number;
  screen?: string;
  language?: string;
}

export interface GeoInfo {
  city: string;
  region: string;
  country_name: string;
  country_code: string;
  org: string;
  asn?: string;
  latitude: number;
  longitude: number;
  timezone: string;
  zip?: string;
}

// ---------------------------------------------------------------------------
// Timezone helpers
// ---------------------------------------------------------------------------

const partsFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: REPORT_TZ,
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hour12: false,
});

export interface TzParts {
  year: number; month: number; day: number; hour: number; minute: number;
  /** 0 = Sunday */
  weekday: number;
}

const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;

/**
 * REPORT_TZ offset from UTC at an instant, straight from Intl.
 *
 * This is the only place that pays for `formatToParts`; everything else goes
 * through the cached `offsetAt` below, because an aggregation converts tens of
 * thousands of timestamps and `formatToParts` costs ~20µs a call.
 */
function rawOffsetMs(ts: number): number {
  const out: Record<string, string> = {};
  for (const part of partsFormatter.formatToParts(new Date(ts))) {
    if (part.type !== 'literal') out[part.type] = part.value;
  }
  const asUtc = Date.UTC(
    Number(out.year), Number(out.month) - 1, Number(out.day),
    // Some ICU builds render midnight as hour "24".
    Number(out.hour) % 24, Number(out.minute),
  );
  // Zero out seconds on both sides so the difference is a clean offset.
  return asUtc - Math.floor(ts / 60_000) * 60_000;
}

/**
 * Offset caches. Almost every UTC day has a single offset, so one probe at each
 * end of the day settles it; only the two DST-transition days per year fall
 * back to per-hour resolution.
 */
const dayOffsets = new Map<number, number | null>();
const hourOffsets = new Map<number, number>();
const OFFSET_CACHE_MAX = 20_000;

function offsetAt(ts: number): number {
  const day = Math.floor(ts / DAY_MS);
  let uniform = dayOffsets.get(day);

  if (uniform === undefined) {
    const atStart = rawOffsetMs(day * DAY_MS);
    const atEnd = rawOffsetMs(day * DAY_MS + DAY_MS - 1);
    uniform = atStart === atEnd ? atStart : null;
    if (dayOffsets.size >= OFFSET_CACHE_MAX) dayOffsets.clear();
    dayOffsets.set(day, uniform);
  }
  if (uniform !== null) return uniform;

  // A DST boundary falls inside this day, so resolve at hour granularity.
  const hour = Math.floor(ts / HOUR_MS);
  let offset = hourOffsets.get(hour);
  if (offset === undefined) {
    offset = rawOffsetMs(hour * HOUR_MS);
    if (hourOffsets.size >= OFFSET_CACHE_MAX) hourOffsets.clear();
    hourOffsets.set(hour, offset);
  }
  return offset;
}

/** Break a Date into its REPORT_TZ calendar parts. */
export function tzParts(date: Date): TzParts {
  const ts = date.getTime();
  // Shift into the local wall clock, then read the parts arithmetically.
  const local = new Date(ts + offsetAt(ts));
  return {
    year: local.getUTCFullYear(),
    month: local.getUTCMonth() + 1,
    day: local.getUTCDate(),
    hour: local.getUTCHours(),
    minute: local.getUTCMinutes(),
    weekday: local.getUTCDay(),
  };
}

/** YYYY-MM-DD in REPORT_TZ — the same key the log filenames use. */
export function tzDateKey(date: Date): string {
  const { year, month, day } = tzParts(date);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * The instant corresponding to a REPORT_TZ wall-clock time.
 * Two passes, because the offset itself depends on the instant (DST).
 */
export function tzTime(year: number, month: number, day: number, hour = 0, minute = 0): Date {
  const guess = Date.UTC(year, month - 1, day, hour, minute);
  const corrected = guess - offsetAt(guess);
  // Re-check: a DST boundary between guess and corrected shifts the offset.
  return new Date(guess - offsetAt(corrected));
}

/** Start of the REPORT_TZ day containing `date`, shifted by `dayDelta` days. */
function startOfTzDay(date: Date, dayDelta = 0): Date {
  const { year, month, day } = tzParts(date);
  return tzTime(year, month, day + dayDelta);
}

// ---------------------------------------------------------------------------
// Range resolution
// ---------------------------------------------------------------------------

export interface ResolvedRange {
  preset: RangePreset;
  offset: number;
  from: Date | null;
  to: Date;
  bucket: Bucket;
  label: string;
  /** The equally-sized window immediately before `from`, for deltas. */
  comparison: { from: Date; to: Date; label: string } | null;
  /** Whether prev/next navigation applies to this preset. */
  navigable: boolean;
  /** True when `offset` is already at the most recent period. */
  atLatest: boolean;
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

/** Auto bucket granularity for a window of `spanMs`. */
export function autoBucket(spanMs: number): Bucket {
  const hours = spanMs / 3_600_000;
  if (hours <= 3) return 'tenmin';
  if (hours <= 49) return 'hour';
  if (hours <= 24 * 70) return 'day';
  if (hours <= 24 * 200) return 'week';
  return 'month';
}

/**
 * Turn a preset (plus how many periods back) into concrete bounds, a bucket
 * granularity, a human label and a comparison window.
 */
export function resolveRange(
  preset: RangePreset,
  offset = 0,
  bucketOverride?: Bucket | null,
  now: Date = new Date(),
): ResolvedRange {
  const navigable = CALENDAR_PRESETS.includes(preset);
  const back = navigable ? Math.max(0, Math.floor(offset)) : 0;

  let from: Date | null = null;
  let to = now;
  let label = '';

  const rolling = (ms: number, text: string) => {
    from = new Date(now.getTime() - ms);
    to = now;
    label = text;
  };

  switch (preset) {
    case '1h': rolling(3_600_000, 'Last hour'); break;
    case '24h': rolling(24 * 3_600_000, 'Last 24 hours'); break;
    case '7d': rolling(7 * 24 * 3_600_000, 'Last 7 days'); break;
    case '30d': rolling(30 * 24 * 3_600_000, 'Last 30 days'); break;
    case '90d': rolling(90 * 24 * 3_600_000, 'Last 90 days'); break;
    case '12m': {
      const p = tzParts(now);
      from = tzTime(p.year, p.month - 11, 1);
      to = now;
      label = 'Last 12 months';
      break;
    }
    case 'day': {
      const start = startOfTzDay(now, -back);
      from = start;
      to = new Date(Math.min(now.getTime(), startOfTzDay(now, -back + 1).getTime()));
      const p = tzParts(start);
      label = back === 0 ? 'Today' : back === 1 ? 'Yesterday'
        : `${MONTH_NAMES[p.month - 1]} ${p.day}, ${p.year}`;
      break;
    }
    case 'week': {
      // Weeks run Monday–Sunday.
      const today = tzParts(now);
      const mondayDelta = (today.weekday + 6) % 7;
      const start = startOfTzDay(now, -mondayDelta - back * 7);
      const end = startOfTzDay(now, -mondayDelta - back * 7 + 7);
      from = start;
      to = new Date(Math.min(now.getTime(), end.getTime()));
      const s = tzParts(start);
      const e = tzParts(new Date(end.getTime() - 1));
      label = back === 0 ? 'This week'
        : `${MONTH_NAMES[s.month - 1].slice(0, 3)} ${s.day} – ${MONTH_NAMES[e.month - 1].slice(0, 3)} ${e.day}, ${e.year}`;
      break;
    }
    case 'month': {
      const p = tzParts(now);
      const start = tzTime(p.year, p.month - back, 1);
      const end = tzTime(p.year, p.month - back + 1, 1);
      from = start;
      to = new Date(Math.min(now.getTime(), end.getTime()));
      const s = tzParts(start);
      label = back === 0 ? 'This month' : `${MONTH_NAMES[s.month - 1]} ${s.year}`;
      break;
    }
    case 'quarter': {
      const p = tzParts(now);
      const currentQuarterStartMonth = Math.floor((p.month - 1) / 3) * 3 + 1;
      const start = tzTime(p.year, currentQuarterStartMonth - back * 3, 1);
      const end = tzTime(p.year, currentQuarterStartMonth - back * 3 + 3, 1);
      from = start;
      to = new Date(Math.min(now.getTime(), end.getTime()));
      const s = tzParts(start);
      label = back === 0 ? 'This quarter' : `Q${Math.floor((s.month - 1) / 3) + 1} ${s.year}`;
      break;
    }
    case 'year': {
      const p = tzParts(now);
      const start = tzTime(p.year - back, 1, 1);
      const end = tzTime(p.year - back + 1, 1, 1);
      from = start;
      to = new Date(Math.min(now.getTime(), end.getTime()));
      label = back === 0 ? 'This year' : String(p.year - back);
      break;
    }
    case 'all':
    default:
      from = null;
      to = now;
      label = 'All time';
      break;
  }

  const start = from as Date | null;
  const spanMs = start ? to.getTime() - start.getTime() : 400 * 24 * 3_600_000;
  const bucket = bucketOverride || autoBucket(spanMs);

  // Compare against the equally-sized window immediately before this one.
  let comparison: ResolvedRange['comparison'] = null;
  if (start) {
    const prevTo = start;
    const prevFrom = new Date(start.getTime() - spanMs);
    comparison = { from: prevFrom, to: prevTo, label: 'previous period' };
  }

  return { preset, offset: back, from: start, to, bucket, label, comparison, navigable, atLatest: back === 0 };
}

// ---------------------------------------------------------------------------
// Log file reading
// ---------------------------------------------------------------------------

export function listLogDates(): string[] {
  if (!existsSync(VISITORS_DIR)) return [];
  try {
    return readdirSync(VISITORS_DIR)
      .filter((f) => f.endsWith('.jsonl'))
      .map((f) => f.replace('.jsonl', ''))
      .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
      .sort();
  } catch {
    return [];
  }
}

/**
 * Parsed-file cache, invalidated on mtime + size. Bounded so it can't grow
 * unbounded — sized to hold a couple of years of daily files, since an
 * all-time query touches every one of them and a cap below that thrashes.
 */
const fileCache = new Map<string, { mtimeMs: number; size: number; entries: RawEntry[] }>();
const FILE_CACHE_MAX = 800;

function readLogFile(dateKey: string): RawEntry[] {
  const filePath = join(VISITORS_DIR, `${dateKey}.jsonl`);
  if (!existsSync(filePath)) return [];

  let stat;
  try {
    stat = statSync(filePath);
  } catch {
    return [];
  }

  const cached = fileCache.get(dateKey);
  if (cached && cached.mtimeMs === stat.mtimeMs && cached.size === stat.size) {
    return cached.entries;
  }

  const entries: RawEntry[] = [];
  try {
    for (const line of readFileSync(filePath, 'utf-8').split('\n')) {
      if (!line) continue;
      try {
        const parsed = JSON.parse(line) as RawEntry;
        if (parsed && parsed.timestamp) entries.push(parsed);
      } catch {
        // A truncated final line is normal for an append-only log; skip it.
      }
    }
  } catch {
    return [];
  }

  if (fileCache.size >= FILE_CACHE_MAX) {
    // Drop the oldest insertion; day files age out naturally.
    const oldest = fileCache.keys().next().value;
    if (oldest !== undefined) fileCache.delete(oldest);
  }
  fileCache.set(dateKey, { mtimeMs: stat.mtimeMs, size: stat.size, entries });
  return entries;
}

/**
 * All entries whose timestamp falls in [from, to).
 * Only the day files that can overlap the window are opened.
 */
export function readEntriesInRange(from: Date | null, to: Date): RawEntry[] {
  const all = listLogDates();
  // Widen by a day on each side: an entry's UTC timestamp can land in a
  // neighbouring file when it straddles the REPORT_TZ day boundary.
  const fromKey = from ? tzDateKey(new Date(from.getTime() - 86_400_000)) : null;
  const toKey = tzDateKey(new Date(to.getTime() + 86_400_000));

  const dates = all.filter((d) => (!fromKey || d >= fromKey) && d <= toKey);

  const fromMs = from ? from.getTime() : -Infinity;
  const toMs = to.getTime();
  const out: RawEntry[] = [];

  for (const date of dates) {
    for (const entry of readLogFile(date)) {
      const ts = Date.parse(entry.timestamp);
      if (Number.isNaN(ts) || ts < fromMs || ts >= toMs) continue;
      out.push(entry);
    }
  }

  out.sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
  return out;
}

/**
 * First timestamp each IP was ever seen at, across the whole log history.
 *
 * Backs the new-vs-returning split. Memoised on a stat-based signature of the
 * log directory, so the usual case (only today's file changed) skips the full
 * history scan entirely. The signature deliberately does not read file
 * contents — stat-ing a few hundred files is cheap; parsing them is not.
 */
const firstSeenCache: { signature: string; index: Map<string, number> } = {
  signature: '',
  index: new Map(),
};

function logDirSignature(dates: string[]): string {
  const parts: string[] = [];
  for (const date of dates) {
    try {
      const stat = statSync(join(VISITORS_DIR, `${date}.jsonl`));
      parts.push(`${date}:${stat.mtimeMs}:${stat.size}`);
    } catch {
      parts.push(`${date}:missing`);
    }
  }
  return parts.join('|');
}

export function getFirstSeenIndex(): Map<string, number> {
  const dates = listLogDates();
  const signature = logDirSignature(dates);

  if (signature === firstSeenCache.signature) return firstSeenCache.index;

  const index = new Map<string, number>();
  for (const date of dates) {
    for (const entry of readLogFile(date)) {
      if (!entry.ip) continue;
      const ts = Date.parse(entry.timestamp);
      if (Number.isNaN(ts)) continue;
      const existing = index.get(entry.ip);
      if (existing === undefined || ts < existing) index.set(entry.ip, ts);
    }
  }

  firstSeenCache.signature = signature;
  firstSeenCache.index = index;
  return index;
}


// ---------------------------------------------------------------------------
// User-agent parsing
// ---------------------------------------------------------------------------

const BOT_RE = /bot|crawler|spider|crawling|slurp|bingpreview|facebookexternalhit|headlesschrome|phantomjs|curl\/|wget\/|python-requests|axios\/|go-http-client|semrush|ahrefs|dataprovider|monitoring|uptime|pingdom|lighthouse|gptbot|claudebot|ccbot|perplexity/i;

export function isBotUA(ua?: string): boolean {
  return !!ua && BOT_RE.test(ua);
}

export type DeviceType = 'Desktop' | 'Mobile' | 'Tablet' | 'Bot' | 'Unknown';

export function parseDevice(ua?: string): DeviceType {
  if (!ua) return 'Unknown';
  if (isBotUA(ua)) return 'Bot';
  if (/iPad|Tablet|Silk|Kindle|PlayBook/i.test(ua)) return 'Tablet';
  if (/Android(?!.*Mobile)/i.test(ua)) return 'Tablet';
  if (/Mobi|iPhone|iPod|Android|Windows Phone|IEMobile/i.test(ua)) return 'Mobile';
  return 'Desktop';
}

export function parseBrowser(ua?: string): string {
  if (!ua) return 'Unknown';
  if (isBotUA(ua)) return 'Bot';
  // Order matters: the Chromium forks all also claim "Chrome".
  if (/Edg\//i.test(ua)) return 'Edge';
  if (/OPR\/|Opera/i.test(ua)) return 'Opera';
  if (/SamsungBrowser/i.test(ua)) return 'Samsung Internet';
  if (/Brave\//i.test(ua)) return 'Brave';
  if (/CriOS/i.test(ua)) return 'Chrome (iOS)';
  if (/FxiOS/i.test(ua)) return 'Firefox (iOS)';
  if (/Firefox\//i.test(ua)) return 'Firefox';
  if (/Chrome\//i.test(ua)) return 'Chrome';
  if (/Safari\//i.test(ua) && /Version\//i.test(ua)) return 'Safari';
  return 'Other';
}

export function parseOS(ua?: string): string {
  if (!ua) return 'Unknown';
  if (isBotUA(ua)) return 'Bot';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
  if (/Android/i.test(ua)) return 'Android';
  if (/CrOS/i.test(ua)) return 'ChromeOS';
  if (/Mac OS X|Macintosh/i.test(ua)) return 'macOS';
  if (/Windows NT/i.test(ua)) return 'Windows';
  if (/Linux/i.test(ua)) return 'Linux';
  return 'Other';
}

/** Group a referer URL into a display source. Internal referers become "Direct". */
export function referrerSource(referer: string | null | undefined, selfHosts: string[]): string {
  if (!referer) return 'Direct';
  let host: string;
  try {
    host = new URL(referer).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return 'Direct';
  }
  if (!host) return 'Direct';
  if (selfHosts.some((h) => h && (host === h || host.endsWith(`.${h}`)))) return 'Direct';
  return host;
}

// ---------------------------------------------------------------------------
// Bucketing
// ---------------------------------------------------------------------------

/** Stable sort key + display label + bucket start instant for a timestamp. */
export function bucketOf(date: Date, bucket: Bucket): { key: string; start: number } {
  const p = tzParts(date);
  switch (bucket) {
    case 'tenmin': {
      const minute = Math.floor(p.minute / 10) * 10;
      return {
        key: `${tzDateKey(date)}T${String(p.hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
        start: tzTime(p.year, p.month, p.day, p.hour, minute).getTime(),
      };
    }
    case 'hour':
      return {
        key: `${tzDateKey(date)}T${String(p.hour).padStart(2, '0')}`,
        start: tzTime(p.year, p.month, p.day, p.hour).getTime(),
      };
    case 'week': {
      const mondayDelta = (p.weekday + 6) % 7;
      const start = tzTime(p.year, p.month, p.day - mondayDelta);
      return { key: `W${tzDateKey(start)}`, start: start.getTime() };
    }
    case 'month':
      return {
        key: `${p.year}-${String(p.month).padStart(2, '0')}`,
        start: tzTime(p.year, p.month, 1).getTime(),
      };
    case 'day':
    default:
      return { key: tzDateKey(date), start: tzTime(p.year, p.month, p.day).getTime() };
  }
}

/** Every bucket key in [from, to), so the series has no implicit gaps. */
function bucketSeries(from: Date, to: Date, bucket: Bucket): { key: string; start: number }[] {
  const out: { key: string; start: number }[] = [];
  const seen = new Set<string>();
  let cursor = bucketOf(from, bucket).start;
  const end = to.getTime();
  let guard = 0;

  while (cursor < end && guard++ < 5000) {
    const b = bucketOf(new Date(cursor), bucket);
    if (!seen.has(b.key)) {
      seen.add(b.key);
      out.push(b);
    }
    const p = tzParts(new Date(cursor));
    let next: number;
    switch (bucket) {
      case 'tenmin': next = cursor + 10 * 60_000; break;
      case 'hour': next = cursor + 3_600_000; break;
      case 'week': next = tzTime(p.year, p.month, p.day + 7).getTime(); break;
      case 'month': next = tzTime(p.year, p.month + 1, 1).getTime(); break;
      default: next = tzTime(p.year, p.month, p.day + 1).getTime(); break;
    }
    // Guard against a DST fold making no forward progress.
    cursor = next > cursor ? next : cursor + 3_600_000;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Aggregation
// ---------------------------------------------------------------------------

export interface SeriesPoint {
  key: string;
  start: number;
  views: number;
  visitors: number;
  sessions: number;
}

export interface Totals {
  views: number;
  visitors: number;
  sessions: number;
  /** Mean session length in seconds. */
  avgSessionSeconds: number;
  /** Mean time on a single page view, in seconds. */
  avgViewSeconds: number;
  /** Share of sessions with exactly one page view, 0–1. */
  bounceRate: number;
  viewsPerSession: number;
  /** Visitors not seen anywhere earlier in the log history. */
  newVisitors: number;
  returningVisitors: number;
  /** Page views attributed to bot user agents (excluded from the rest). */
  botViews: number;
}

export interface Breakdown {
  label: string;
  views: number;
  visitors: number;
  /** Mean time on page, in seconds. Only meaningful for the pages breakdown. */
  avgSeconds?: number;
  /** Extra display context, e.g. a country for a city. */
  sub?: string;
}

export interface LocationStat {
  lat: number;
  lng: number;
  city: string;
  region: string;
  country: string;
  countryCode: string;
  totalVisits: number;
  uniqueVisitors: number;
  /** Dense visitor indices, so the client can cluster without double-counting. */
  visitorIds: number[];
}

export interface Analytics {
  range: {
    preset: RangePreset;
    offset: number;
    from: string | null;
    to: string;
    bucket: Bucket;
    label: string;
    navigable: boolean;
    atLatest: boolean;
    timezone: string;
  };
  totals: Totals;
  /** Same totals for the preceding window of equal length, for deltas. */
  previous: Totals | null;
  series: SeriesPoint[];
  pages: Breakdown[];
  referrers: Breakdown[];
  countries: Breakdown[];
  cities: Breakdown[];
  devices: Breakdown[];
  browsers: Breakdown[];
  operatingSystems: Breakdown[];
  languages: Breakdown[];
  entryPages: Breakdown[];
  /** 7 × 24 grid of view counts, [weekday 0=Mon][hour]. */
  heatmap: number[][];
  locations: LocationStat[];
  /** IPs seen in range that the geo cache has no entry for. */
  ungeolocatedVisitors: number;
}

interface ViewRecord {
  ts: number;
  ip: string;
  path: string;
  ua?: string;
  referer?: string | null;
  language?: string;
  /** Time on page, once a matching 'duration' event is found. */
  seconds?: number;
}

/**
 * Pair each view with the 'duration' (page-leave) event that follows it for the
 * same IP + path, mirroring how the beacon emits them.
 */
function buildViews(entries: RawEntry[], includeBots: boolean): { views: ViewRecord[]; botViews: number } {
  const views: ViewRecord[] = [];
  const pending = new Map<string, ViewRecord[]>();
  let botViews = 0;

  for (const entry of entries) {
    const ts = Date.parse(entry.timestamp);
    if (Number.isNaN(ts)) continue;
    const ip = entry.ip || 'unknown';
    const key = `${ip}|${entry.path}`;

    if (!entry.type || entry.type === 'view') {
      if (isBotUA(entry.user_agent)) {
        botViews++;
        if (!includeBots) continue;
      }
      const record: ViewRecord = {
        ts, ip, path: entry.path || '/',
        ua: entry.user_agent, referer: entry.referer, language: entry.language,
      };
      views.push(record);
      const queue = pending.get(key);
      if (queue) queue.push(record); else pending.set(key, [record]);
    } else if (entry.type === 'duration') {
      const queue = pending.get(key);
      // Match the oldest unclosed view for this IP + path.
      const target = queue?.shift();
      if (target && typeof entry.duration_seconds === 'number' && entry.duration_seconds >= 0) {
        target.seconds = entry.duration_seconds;
      }
    }
  }

  return { views, botViews };
}

interface Session {
  ip: string;
  start: number;
  end: number;
  views: ViewRecord[];
  seconds: number;
}

/** Split each IP's views into sessions on a SESSION_GAP_MS gap. */
function buildSessions(views: ViewRecord[]): Session[] {
  const byIp = new Map<string, ViewRecord[]>();
  for (const v of views) {
    const list = byIp.get(v.ip);
    if (list) list.push(v); else byIp.set(v.ip, [v]);
  }

  const sessions: Session[] = [];
  for (const [ip, list] of byIp) {
    list.sort((a, b) => a.ts - b.ts);
    const ipSessions: Session[] = [];
    let current: Session | null = null;
    for (const v of list) {
      if (!current || v.ts - current.end > SESSION_GAP_MS) {
        current = { ip, start: v.ts, end: v.ts, views: [v], seconds: 0 };
        ipSessions.push(current);
      } else {
        current.views.push(v);
        current.end = v.ts;
      }
    }
    for (const s of ipSessions) {
      // Prefer measured time on page; fall back to the span between views.
      const measured = s.views.reduce((sum, v) => sum + (v.seconds ?? 0), 0);
      s.seconds = measured > 0 ? measured : Math.round((s.end - s.start) / 1000);
      sessions.push(s);
    }
  }
  return sessions;
}

function topBreakdown(
  counts: Map<string, { views: number; visitors: Set<string>; seconds: number; withSeconds: number; sub?: string }>,
  limit: number,
): Breakdown[] {
  return [...counts.entries()]
    .map(([label, v]) => ({
      label,
      views: v.views,
      visitors: v.visitors.size,
      avgSeconds: v.withSeconds > 0 ? Math.round(v.seconds / v.withSeconds) : 0,
      sub: v.sub,
    }))
    .sort((a, b) => b.views - a.views || a.label.localeCompare(b.label))
    .slice(0, limit);
}

function bump(
  map: Map<string, { views: number; visitors: Set<string>; seconds: number; withSeconds: number; sub?: string }>,
  label: string, ip: string, seconds: number | undefined, sub?: string,
) {
  let slot = map.get(label);
  if (!slot) {
    slot = { views: 0, visitors: new Set(), seconds: 0, withSeconds: 0, sub };
    map.set(label, slot);
  }
  slot.views++;
  slot.visitors.add(ip);
  if (typeof seconds === 'number') { slot.seconds += seconds; slot.withSeconds++; }
  if (sub && !slot.sub) slot.sub = sub;
}

function computeTotals(views: ViewRecord[], sessions: Session[], botViews: number, priorIps: Set<string>): Totals {
  const visitors = new Set(views.map((v) => v.ip));
  const withSeconds = views.filter((v) => typeof v.seconds === 'number');
  const sessionsWithTime = sessions.filter((s) => s.seconds > 0);

  let newVisitors = 0;
  for (const ip of visitors) if (!priorIps.has(ip)) newVisitors++;

  return {
    views: views.length,
    visitors: visitors.size,
    sessions: sessions.length,
    avgSessionSeconds: sessionsWithTime.length
      ? Math.round(sessionsWithTime.reduce((s, x) => s + x.seconds, 0) / sessionsWithTime.length)
      : 0,
    avgViewSeconds: withSeconds.length
      ? Math.round(withSeconds.reduce((s, v) => s + (v.seconds ?? 0), 0) / withSeconds.length)
      : 0,
    bounceRate: sessions.length
      ? sessions.filter((s) => s.views.length === 1).length / sessions.length
      : 0,
    viewsPerSession: sessions.length
      ? Math.round((views.length / sessions.length) * 100) / 100
      : 0,
    newVisitors,
    returningVisitors: visitors.size - newVisitors,
    botViews,
  };
}

export interface AggregateOptions {
  range: ResolvedRange;
  /** Views + duration events inside the range, ascending by timestamp. */
  entries: RawEntry[];
  /** IPs seen anywhere before `range.from`, for the new-vs-returning split. */
  priorIps?: Set<string>;
  /** Entries in the comparison window, for period-over-period deltas. */
  previousEntries?: RawEntry[];
  /** IPs seen before the comparison window started. */
  previousPriorIps?: Set<string>;
  geo: Record<string, GeoInfo>;
  /** Hostnames that count as internal, so self-referrals read as "Direct". */
  selfHosts?: string[];
  includeBots?: boolean;
  topLimit?: number;
}

/**
 * Pure aggregation over an already-read set of log entries.
 * `computeAnalytics` is the disk-backed wrapper around this.
 */
export function aggregate(opts: AggregateOptions): Analytics {
  const {
    range, entries, geo, selfHosts = [], includeBots = false, topLimit = 15,
    priorIps = new Set<string>(), previousEntries, previousPriorIps = new Set<string>(),
  } = opts;

  const { views, botViews } = buildViews(entries, includeBots);
  const sessions = buildSessions(views);
  const totals = computeTotals(views, sessions, botViews, priorIps);

  let previous: Totals | null = null;
  if (previousEntries) {
    const prev = buildViews(previousEntries, includeBots);
    previous = computeTotals(prev.views, buildSessions(prev.views), prev.botViews, previousPriorIps);
  }

  // --- time series ---
  const seriesFrom = range.from ?? new Date(views[0]?.ts ?? range.to.getTime());
  const buckets = bucketSeries(seriesFrom, range.to, range.bucket);
  const seriesIndex = new Map<string, { views: number; visitors: Set<string>; sessions: number }>();
  for (const b of buckets) seriesIndex.set(b.key, { views: 0, visitors: new Set(), sessions: 0 });

  for (const v of views) {
    const key = bucketOf(new Date(v.ts), range.bucket).key;
    let slot = seriesIndex.get(key);
    if (!slot) { slot = { views: 0, visitors: new Set(), sessions: 0 }; seriesIndex.set(key, slot); }
    slot.views++;
    slot.visitors.add(v.ip);
  }
  for (const s of sessions) {
    const key = bucketOf(new Date(s.start), range.bucket).key;
    const slot = seriesIndex.get(key);
    if (slot) slot.sessions++;
  }

  const bucketStarts = new Map(buckets.map((b) => [b.key, b.start]));
  const series: SeriesPoint[] = [...seriesIndex.entries()]
    .map(([key, v]) => ({
      key,
      start: bucketStarts.get(key) ?? 0,
      views: v.views,
      visitors: v.visitors.size,
      sessions: v.sessions,
    }))
    .filter((p) => p.start > 0)
    .sort((a, b) => a.start - b.start);

  // --- dimensional breakdowns ---
  type Slot = Map<string, { views: number; visitors: Set<string>; seconds: number; withSeconds: number; sub?: string }>;
  const pages: Slot = new Map();
  const referrers: Slot = new Map();
  const countries: Slot = new Map();
  const cities: Slot = new Map();
  const devices: Slot = new Map();
  const browsers: Slot = new Map();
  const oses: Slot = new Map();
  const languages: Slot = new Map();
  const heatmap: number[][] = Array.from({ length: 7 }, () => new Array(24).fill(0));

  const ungeolocated = new Set<string>();
  const visitorIndex = new Map<string, number>();
  const locationStats = new Map<string, LocationStat & { ids: Set<number> }>();

  for (const v of views) {
    bump(pages, v.path, v.ip, v.seconds);
    bump(referrers, referrerSource(v.referer, selfHosts), v.ip, undefined);
    bump(devices, parseDevice(v.ua), v.ip, undefined);
    bump(browsers, parseBrowser(v.ua), v.ip, undefined);
    bump(oses, parseOS(v.ua), v.ip, undefined);
    bump(languages, v.language || 'Unknown', v.ip, undefined);

    const p = tzParts(new Date(v.ts));
    // Monday-first rows, to match the week bucketing.
    heatmap[(p.weekday + 6) % 7][p.hour]++;

    const g = geo[v.ip];
    if (!g) {
      ungeolocated.add(v.ip);
      continue;
    }
    bump(countries, g.country_name || 'Unknown', v.ip, undefined, g.country_code);
    bump(cities, g.city || 'Unknown', v.ip, undefined, g.country_code);

    const hasCoords = typeof g.latitude === 'number' && typeof g.longitude === 'number'
      && !(g.latitude === 0 && g.longitude === 0);
    if (!hasCoords) continue;

    let id = visitorIndex.get(v.ip);
    if (id === undefined) { id = visitorIndex.size; visitorIndex.set(v.ip, id); }

    const locKey = `${g.latitude},${g.longitude}`;
    let loc = locationStats.get(locKey);
    if (!loc) {
      loc = {
        lat: g.latitude, lng: g.longitude,
        city: g.city || 'Unknown', region: g.region || '',
        country: g.country_name || 'Unknown', countryCode: g.country_code || '??',
        totalVisits: 0, uniqueVisitors: 0, visitorIds: [], ids: new Set(),
      };
      locationStats.set(locKey, loc);
    }
    loc.totalVisits++;
    loc.ids.add(id);
  }

  const locations: LocationStat[] = [...locationStats.values()]
    .map(({ ids, ...loc }) => ({ ...loc, uniqueVisitors: ids.size, visitorIds: [...ids] }))
    .sort((a, b) => b.totalVisits - a.totalVisits);

  // Entry pages come from sessions, not raw views.
  const entryPages: Slot = new Map();
  for (const s of sessions) bump(entryPages, s.views[0].path, s.ip, undefined);

  return {
    range: {
      preset: range.preset,
      offset: range.offset,
      from: range.from ? range.from.toISOString() : null,
      to: range.to.toISOString(),
      bucket: range.bucket,
      label: range.label,
      navigable: range.navigable,
      atLatest: range.atLatest,
      timezone: REPORT_TZ,
    },
    totals,
    previous,
    series,
    pages: topBreakdown(pages, topLimit),
    referrers: topBreakdown(referrers, topLimit),
    countries: topBreakdown(countries, topLimit),
    cities: topBreakdown(cities, topLimit),
    devices: topBreakdown(devices, 8),
    browsers: topBreakdown(browsers, 8),
    operatingSystems: topBreakdown(oses, 8),
    languages: topBreakdown(languages, 10),
    entryPages: topBreakdown(entryPages, topLimit),
    heatmap,
    locations,
    ungeolocatedVisitors: ungeolocated.size,
  };
}

export interface ComputeOptions {
  range: ResolvedRange;
  geo: Record<string, GeoInfo>;
  selfHosts?: string[];
  includeBots?: boolean;
  topLimit?: number;
}

/** Read the log files the range covers, then aggregate them. */
export function computeAnalytics(opts: ComputeOptions): Analytics {
  const { range } = opts;
  const entries = readEntriesInRange(range.from, range.to);

  // "New" means the IP appears nowhere earlier in the log history. Derived from
  // a memoised first-seen index rather than re-reading history per request.
  const firstSeen = getFirstSeenIndex();
  const priorIpsBefore = (cutoff: Date) => {
    const ips = new Set<string>();
    for (const [ip, ms] of firstSeen) if (ms < cutoff.getTime()) ips.add(ip);
    return ips;
  };

  const priorIps = range.from ? priorIpsBefore(range.from) : new Set<string>();

  let previousEntries: RawEntry[] | undefined;
  let previousPriorIps: Set<string> | undefined;
  if (range.comparison) {
    previousEntries = readEntriesInRange(range.comparison.from, range.comparison.to);
    previousPriorIps = priorIpsBefore(range.comparison.from);
  }

  return aggregate({ ...opts, entries, priorIps, previousEntries, previousPriorIps });
}
