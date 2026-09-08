import { describe, it, expect } from 'vitest';
import {
  resolveRange,
  autoBucket,
  bucketOf,
  tzDateKey,
  tzParts,
  tzTime,
  parseDevice,
  parseBrowser,
  parseOS,
  isBotUA,
  referrerSource,
  aggregate,
  type RawEntry,
  type GeoInfo,
} from './analytics';

// A fixed "now": Wed 2026-09-16 20:30 UTC = 13:30 America/Los_Angeles (PDT).
const NOW = new Date('2026-09-16T20:30:00.000Z');

describe('tz helpers', () => {
  it('reports the LA-local date, not the UTC date', () => {
    // 03:00 UTC on the 17th is still the 16th in Los Angeles.
    expect(tzDateKey(new Date('2026-09-17T03:00:00.000Z'))).toBe('2026-09-16');
    expect(tzDateKey(new Date('2026-09-17T08:00:00.000Z'))).toBe('2026-09-17');
  });

  it('tracks the DST fall-back boundary', () => {
    // Los Angeles leaves PDT at 2am local on 2026-11-01.
    expect(tzParts(new Date('2026-11-01T08:00:00.000Z')).hour).toBe(1);  // 01:00 PDT
    expect(tzParts(new Date('2026-11-01T09:30:00.000Z')).hour).toBe(1);  // 01:30 PST
    expect(tzParts(new Date('2026-11-01T10:00:00.000Z')).hour).toBe(2);  // 02:00 PST
    expect(tzDateKey(new Date('2026-11-01T08:00:00.000Z'))).toBe('2026-11-01');
  });

  it('tracks the DST spring-forward boundary', () => {
    // Los Angeles enters PDT at 2am local on 2026-03-08 — 2am does not exist.
    expect(tzParts(new Date('2026-03-08T09:59:00.000Z')).hour).toBe(1);  // 01:59 PST
    expect(tzParts(new Date('2026-03-08T10:00:00.000Z')).hour).toBe(3);  // 03:00 PDT
  });

  it('round-trips wall-clock times across a DST shift', () => {
    // Day starts are the boundaries every range depends on.
    expect(tzTime(2026, 11, 1).toISOString()).toBe('2026-11-01T07:00:00.000Z'); // PDT
    expect(tzTime(2026, 11, 2).toISOString()).toBe('2026-11-02T08:00:00.000Z'); // PST
    expect(tzTime(2026, 3, 8).toISOString()).toBe('2026-03-08T08:00:00.000Z');  // PST
    expect(tzTime(2026, 3, 9).toISOString()).toBe('2026-03-09T07:00:00.000Z');  // PDT
  });

  it('counts a DST fall-back day as 25 hours', () => {
    const hours = (tzTime(2026, 11, 2).getTime() - tzTime(2026, 11, 1).getTime()) / 3600_000;
    expect(hours).toBe(25);
  });

  it('derives weekday from the civil date', () => {
    expect(tzParts(NOW).weekday).toBe(3); // Wednesday
    expect(tzParts(new Date('2026-09-17T03:00:00.000Z')).weekday).toBe(3);
  });
});

describe('resolveRange', () => {
  it('covers the current calendar day', () => {
    const r = resolveRange('day', 0, null, NOW);
    expect(r.from?.toISOString()).toBe('2026-09-16T07:00:00.000Z'); // LA midnight
    expect(r.to.toISOString()).toBe(NOW.toISOString());
    expect(r.label).toBe('Today');
    expect(r.bucket).toBe('hour');
  });

  it('walks back day by day', () => {
    expect(resolveRange('day', 1, null, NOW).label).toBe('Yesterday');
    const r = resolveRange('day', 3, null, NOW);
    expect(tzDateKey(r.from!)).toBe('2026-09-13');
    expect(r.label).toBe('September 13, 2026');
  });

  it('starts weeks on Monday', () => {
    const r = resolveRange('week', 0, null, NOW);
    expect(tzDateKey(r.from!)).toBe('2026-09-14'); // the Monday
    expect(r.label).toBe('This week');
    expect(r.bucket).toBe('day');
  });

  it('walks back a full week at a time', () => {
    const r = resolveRange('week', 1, null, NOW);
    expect(tzDateKey(r.from!)).toBe('2026-09-07');
    expect(tzDateKey(new Date(r.to.getTime() - 1))).toBe('2026-09-13');
  });

  it('covers the current calendar month', () => {
    const r = resolveRange('month', 0, null, NOW);
    expect(tzDateKey(r.from!)).toBe('2026-09-01');
    expect(r.label).toBe('This month');
  });

  it('walks back across a year boundary', () => {
    const r = resolveRange('month', 9, null, NOW);
    expect(tzDateKey(r.from!)).toBe('2025-12-01');
    expect(r.label).toBe('December 2025');
    expect(tzDateKey(new Date(r.to.getTime() - 1))).toBe('2025-12-31');
  });

  it('covers quarters', () => {
    const r = resolveRange('quarter', 0, null, NOW);
    expect(tzDateKey(r.from!)).toBe('2026-07-01'); // Q3
    const prev = resolveRange('quarter', 1, null, NOW);
    expect(tzDateKey(prev.from!)).toBe('2026-04-01');
    expect(prev.label).toBe('Q2 2026');
  });

  it('covers years', () => {
    const r = resolveRange('year', 0, null, NOW);
    expect(tzDateKey(r.from!)).toBe('2026-01-01');
    expect(r.bucket).toBe('month');
    const prev = resolveRange('year', 1, null, NOW);
    expect(tzDateKey(prev.from!)).toBe('2025-01-01');
    expect(tzDateKey(new Date(prev.to.getTime() - 1))).toBe('2025-12-31');
    expect(prev.label).toBe('2025');
    expect(prev.bucket).toBe('month');
  });

  it('leaves rolling windows un-navigable and ignores their offset', () => {
    const r = resolveRange('30d', 3, null, NOW);
    expect(r.navigable).toBe(false);
    expect(r.offset).toBe(0);
    expect(r.to.toISOString()).toBe(NOW.toISOString());
    expect(Math.round((r.to.getTime() - r.from!.getTime()) / 86400000)).toBe(30);
  });

  it('has no bounds or comparison for all time', () => {
    const r = resolveRange('all', 0, null, NOW);
    expect(r.from).toBeNull();
    expect(r.comparison).toBeNull();
    expect(r.bucket).toBe('month');
  });

  it('compares against the equally-sized preceding window', () => {
    const r = resolveRange('month', 0, null, NOW);
    const span = r.to.getTime() - r.from!.getTime();
    expect(r.comparison!.to.getTime()).toBe(r.from!.getTime());
    expect(r.comparison!.from.getTime()).toBe(r.from!.getTime() - span);
  });

  it('honours an explicit bucket override', () => {
    expect(resolveRange('year', 0, 'day', NOW).bucket).toBe('day');
  });

  it('falls back to all-time for an unknown preset', () => {
    const r = resolveRange('nonsense' as never, 0, null, NOW);
    expect(r.from).toBeNull();
    expect(r.label).toBe('All time');
  });
});

describe('autoBucket', () => {
  it('scales granularity with the span', () => {
    expect(autoBucket(3600_000)).toBe('tenmin');
    expect(autoBucket(24 * 3600_000)).toBe('hour');
    expect(autoBucket(30 * 24 * 3600_000)).toBe('day');
    expect(autoBucket(90 * 24 * 3600_000)).toBe('week');
    expect(autoBucket(3 * 365 * 24 * 3600_000)).toBe('month');
  });
});

describe('bucketOf', () => {
  const t = new Date('2026-09-16T20:34:00.000Z'); // 13:34 LA, a Wednesday

  it('keys ten-minute buckets by their floor', () => {
    expect(bucketOf(t, 'tenmin').key).toBe('2026-09-16T13:30');
  });

  it('keys hours in local time', () => {
    expect(bucketOf(t, 'hour').key).toBe('2026-09-16T13');
  });

  it('keys weeks by their Monday', () => {
    expect(bucketOf(t, 'week').key).toBe('W2026-09-14');
    // Sunday belongs to the week that started the previous Monday.
    expect(bucketOf(new Date('2026-09-20T18:00:00.000Z'), 'week').key).toBe('W2026-09-14');
  });

  it('keys months', () => {
    expect(bucketOf(t, 'month').key).toBe('2026-09');
  });
});

describe('user agent parsing', () => {
  const UAS: [string, string, string, string][] = [
    // ua, device, browser, os
    ['Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', 'Desktop', 'Chrome', 'macOS'],
    ['Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.3 Safari/605.1.15', 'Desktop', 'Safari', 'macOS'],
    ['Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', 'Desktop', 'Edge', 'Windows'],
    ['Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:132.0) Gecko/20100101 Firefox/132.0', 'Desktop', 'Firefox', 'Linux'],
    ['Mozilla/5.0 (iPhone; CPU iPhone OS 18_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.3 Mobile/15E148 Safari/604.1', 'Mobile', 'Safari', 'iOS'],
    ['Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36', 'Mobile', 'Chrome', 'Android'],
    ['Mozilla/5.0 (iPad; CPU OS 18_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.3 Mobile/15E148 Safari/604.1', 'Tablet', 'Safari', 'iOS'],
    ['Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)', 'Bot', 'Bot', 'Bot'],
  ];

  it.each(UAS)('classifies %s', (ua, device, browser, os) => {
    expect(parseDevice(ua)).toBe(device);
    expect(parseBrowser(ua)).toBe(browser);
    expect(parseOS(ua)).toBe(os);
  });

  it('treats a tablet-shaped Android as a tablet', () => {
    expect(parseDevice('Mozilla/5.0 (Linux; Android 14; SM-X200) AppleWebKit/537.36 Chrome/140.0.0.0 Safari/537.36')).toBe('Tablet');
  });

  it('flags common crawlers and tooling', () => {
    expect(isBotUA('curl/8.6.0')).toBe(true);
    expect(isBotUA('ClaudeBot/1.0')).toBe(true);
    expect(isBotUA('Mozilla/5.0 (Windows NT 10.0) Chrome/140.0.0.0')).toBe(false);
    expect(isBotUA(undefined)).toBe(false);
  });

  it('handles a missing user agent', () => {
    expect(parseDevice(undefined)).toBe('Unknown');
    expect(parseBrowser(undefined)).toBe('Unknown');
    expect(parseOS(undefined)).toBe('Unknown');
  });
});

describe('referrerSource', () => {
  const self = ['goonsite.dev'];

  it('reports a missing referer as Direct', () => {
    expect(referrerSource(null, self)).toBe('Direct');
    expect(referrerSource(undefined, self)).toBe('Direct');
    expect(referrerSource('', self)).toBe('Direct');
  });

  it('strips www and keeps the host', () => {
    expect(referrerSource('https://www.google.com/search?q=x', self)).toBe('google.com');
  });

  it('folds self-referrals into Direct, including subdomains', () => {
    expect(referrerSource('https://goonsite.dev/projects', self)).toBe('Direct');
    expect(referrerSource('https://www.goonsite.dev/notes', self)).toBe('Direct');
    expect(referrerSource('https://staging.goonsite.dev/', self)).toBe('Direct');
  });

  it('does not treat a lookalike host as internal', () => {
    expect(referrerSource('https://notgoonsite.dev/', self)).toBe('notgoonsite.dev');
  });

  it('falls back to Direct on an unparseable referer', () => {
    expect(referrerSource('not a url', self)).toBe('Direct');
  });
});

// ---------------------------------------------------------------------------

const GEO: Record<string, GeoInfo> = {
  '1.1.1.1': {
    city: 'Boston', region: 'Massachusetts', country_name: 'United States',
    country_code: 'US', org: 'Comcast', latitude: 42.36, longitude: -71.06,
    timezone: 'America/New_York',
  },
  '2.2.2.2': {
    city: 'Boston', region: 'Massachusetts', country_name: 'United States',
    country_code: 'US', org: 'Verizon', latitude: 42.36, longitude: -71.06,
    timezone: 'America/New_York',
  },
  '3.3.3.3': {
    city: 'London', region: 'England', country_name: 'United Kingdom',
    country_code: 'GB', org: 'BT', latitude: 51.51, longitude: -0.13,
    timezone: 'Europe/London',
  },
};

const CHROME = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.3 Mobile/15E148 Safari/604.1';
const GOOGLEBOT = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';

const view = (ip: string, path: string, iso: string, extra: Partial<RawEntry> = {}): RawEntry => ({
  type: 'view', ip, path, timestamp: iso, user_agent: CHROME, referer: null, language: 'en-US', ...extra,
});
const leave = (ip: string, path: string, iso: string, seconds: number): RawEntry => ({
  type: 'duration', ip, path, timestamp: iso, duration_seconds: seconds,
});

describe('aggregate', () => {
  const range = resolveRange('day', 0, 'hour', NOW);

  it('counts views, visitors and sessions', () => {
    const a = aggregate({
      range,
      geo: GEO,
      entries: [
        view('1.1.1.1', '/', '2026-09-16T17:00:00Z'),
        leave('1.1.1.1', '/', '2026-09-16T17:00:30Z', 30),
        view('1.1.1.1', '/projects', '2026-09-16T17:01:00Z'),
        leave('1.1.1.1', '/projects', '2026-09-16T17:03:00Z', 120),
        view('2.2.2.2', '/', '2026-09-16T18:00:00Z'),
        leave('2.2.2.2', '/', '2026-09-16T18:00:10Z', 10),
      ],
    });

    expect(a.totals.views).toBe(3);
    expect(a.totals.visitors).toBe(2);
    expect(a.totals.sessions).toBe(2);
    expect(a.totals.viewsPerSession).toBe(1.5);
    // 1.1.1.1 read two pages; 2.2.2.2 read one and bounced.
    expect(a.totals.bounceRate).toBe(0.5);
  });

  it('pairs each view with the leave event that follows it', () => {
    const a = aggregate({
      range,
      geo: GEO,
      entries: [
        view('1.1.1.1', '/', '2026-09-16T17:00:00Z'),
        leave('1.1.1.1', '/', '2026-09-16T17:00:20Z', 20),
        view('1.1.1.1', '/', '2026-09-16T19:00:00Z'),
        leave('1.1.1.1', '/', '2026-09-16T19:01:00Z', 60),
      ],
    });
    // Mean time on page across the two views of "/".
    expect(a.pages[0].label).toBe('/');
    expect(a.pages[0].avgSeconds).toBe(40);
    expect(a.totals.avgViewSeconds).toBe(40);
  });

  it('ignores an orphaned leave event', () => {
    const a = aggregate({
      range,
      geo: GEO,
      entries: [leave('1.1.1.1', '/', '2026-09-16T17:00:20Z', 20)],
    });
    expect(a.totals.views).toBe(0);
    expect(a.totals.sessions).toBe(0);
    expect(a.totals.bounceRate).toBe(0);
  });

  it('splits an IP into separate sessions across a 30-minute gap', () => {
    const a = aggregate({
      range,
      geo: GEO,
      entries: [
        view('1.1.1.1', '/', '2026-09-16T17:00:00Z'),
        view('1.1.1.1', '/notes', '2026-09-16T17:20:00Z'),  // same session
        view('1.1.1.1', '/tools', '2026-09-16T18:30:00Z'),  // new session
      ],
    });
    expect(a.totals.visitors).toBe(1);
    expect(a.totals.sessions).toBe(2);
    expect(a.entryPages.map((p) => p.label).sort()).toEqual(['/', '/tools']);
  });

  it('excludes bot traffic by default but still reports it', () => {
    const entries = [
      view('1.1.1.1', '/', '2026-09-16T17:00:00Z'),
      view('3.3.3.3', '/', '2026-09-16T17:05:00Z', { user_agent: GOOGLEBOT }),
    ];
    const excluded = aggregate({ range, geo: GEO, entries });
    expect(excluded.totals.views).toBe(1);
    expect(excluded.totals.botViews).toBe(1);
    expect(excluded.devices.map((d) => d.label)).not.toContain('Bot');

    const included = aggregate({ range, geo: GEO, entries, includeBots: true });
    expect(included.totals.views).toBe(2);
    expect(included.devices.map((d) => d.label)).toContain('Bot');
  });

  it('splits new from returning visitors using earlier history', () => {
    const a = aggregate({
      range,
      geo: GEO,
      entries: [
        view('1.1.1.1', '/', '2026-09-16T17:00:00Z'),
        view('2.2.2.2', '/', '2026-09-16T17:05:00Z'),
      ],
      priorIps: new Set(['1.1.1.1']),
    });
    expect(a.totals.returningVisitors).toBe(1);
    expect(a.totals.newVisitors).toBe(1);
  });

  it('produces a gap-free series over the whole range', () => {
    const a = aggregate({
      range: resolveRange('day', 1, 'hour', NOW), // all of 2026-09-15, LA
      geo: GEO,
      entries: [view('1.1.1.1', '/', '2026-09-15T17:00:00Z')],
    });
    expect(a.series).toHaveLength(24);
    expect(a.series.map((p) => p.views).reduce((s, v) => s + v, 0)).toBe(1);
    // 17:00Z is 10:00 LA.
    expect(a.series.find((p) => p.views === 1)!.key).toBe('2026-09-15T10');
    // Ascending, with no repeats.
    expect(a.series.map((p) => p.start)).toEqual([...a.series.map((p) => p.start)].sort((x, y) => x - y));
  });

  it('counts a visitor once per location even across many visits', () => {
    const a = aggregate({
      range,
      geo: GEO,
      entries: [
        view('1.1.1.1', '/', '2026-09-16T17:00:00Z'),
        view('1.1.1.1', '/notes', '2026-09-16T17:01:00Z'),
        view('2.2.2.2', '/', '2026-09-16T17:02:00Z'),
        view('3.3.3.3', '/', '2026-09-16T17:03:00Z'),
      ],
    });
    const boston = a.locations.find((l) => l.city === 'Boston')!;
    expect(boston.totalVisits).toBe(3);
    expect(boston.uniqueVisitors).toBe(2);
    // Distinct ids, so the client can cluster without double-counting.
    expect(new Set(boston.visitorIds).size).toBe(2);
    expect(a.locations).toHaveLength(2);
  });

  it('assigns each visitor one id across every location', () => {
    const a = aggregate({
      range,
      geo: GEO,
      entries: [
        view('1.1.1.1', '/', '2026-09-16T17:00:00Z'),
        view('3.3.3.3', '/', '2026-09-16T17:01:00Z'),
      ],
    });
    const ids = a.locations.flatMap((l) => l.visitorIds);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('groups a city arriving on several coordinates into one map location', () => {
    // Real geo lookups hand back a per-subnet lat/lng, so one city shows up
    // spread over many points. Keying the map on coordinates split each city
    // into fragments that each looked like a quiet town.
    const spread: Record<string, GeoInfo> = {
      '10.0.0.1': { ...GEO['1.1.1.1'], city: 'Minneapolis', region: 'Minnesota', latitude: 44.9834, longitude: -93.2622 },
      '10.0.0.2': { ...GEO['1.1.1.1'], city: 'Minneapolis', region: 'Minnesota', latitude: 44.9764, longitude: -93.2240 },
      '10.0.0.3': { ...GEO['1.1.1.1'], city: 'Minneapolis', region: 'Minnesota', latitude: 44.9777, longitude: -93.2650 },
    };
    const a = aggregate({
      range,
      geo: spread,
      entries: [
        view('10.0.0.1', '/', '2026-09-16T17:00:00Z'),
        view('10.0.0.1', '/notes', '2026-09-16T17:01:00Z'),
        view('10.0.0.2', '/', '2026-09-16T17:02:00Z'),
        view('10.0.0.3', '/', '2026-09-16T17:03:00Z'),
      ],
    });

    expect(a.locations).toHaveLength(1);
    const mpls = a.locations[0];
    expect(mpls.city).toBe('Minneapolis');
    expect(mpls.totalVisits).toBe(4);
    expect(mpls.uniqueVisitors).toBe(3);
    // The map total now agrees with the city breakdown, which is qualified
    // by region so same-named places stay distinct.
    const breakdown = a.cities.find((c) => c.label === 'Minneapolis, Minnesota')!;
    expect(mpls.totalVisits).toBe(breakdown.views);
    expect(mpls.uniqueVisitors).toBe(breakdown.visitors);
    // Marker sits at the visit-weighted centroid of its coordinates.
    expect(mpls.lat).toBeCloseTo((44.9834 * 2 + 44.9764 + 44.9777) / 4, 6);
    expect(mpls.lng).toBeCloseTo((-93.2622 * 2 + -93.224 + -93.265) / 4, 6);
  });

  it('keeps same-named cities apart in the cities breakdown', () => {
    // Three real Rochesters — Minnesota, New York, England. Keying the
    // breakdown on the bare city name merged them into one row carrying
    // somebody else's traffic.
    const rochesters: Record<string, GeoInfo> = {
      '10.3.0.1': { ...GEO['1.1.1.1'], city: 'Rochester', region: 'Minnesota', country_name: 'United States', country_code: 'US', latitude: 44.02, longitude: -92.47 },
      '10.3.0.2': { ...GEO['1.1.1.1'], city: 'Rochester', region: 'New York', country_name: 'United States', country_code: 'US', latitude: 43.16, longitude: -77.61 },
      '10.3.0.3': { ...GEO['1.1.1.1'], city: 'Rochester', region: 'England', country_name: 'United Kingdom', country_code: 'GB', latitude: 51.39, longitude: 0.5 },
    };
    const a = aggregate({
      range,
      geo: rochesters,
      entries: [
        view('10.3.0.1', '/', '2026-09-16T17:00:00Z'),
        view('10.3.0.1', '/notes', '2026-09-16T17:01:00Z'),
        view('10.3.0.2', '/', '2026-09-16T17:02:00Z'),
        view('10.3.0.3', '/', '2026-09-16T17:03:00Z'),
      ],
    });

    const labels = a.cities.map((c) => c.label).sort();
    expect(labels).toEqual(['Rochester, England', 'Rochester, Minnesota', 'Rochester, New York']);
    expect(a.cities.find((c) => c.label === 'Rochester, Minnesota')!.views).toBe(2);
    expect(a.cities.find((c) => c.label === 'Rochester, New York')!.views).toBe(1);
    // And three separate map markers, each with its own region.
    expect(a.locations).toHaveLength(3);
    expect(a.locations.map((l) => l.region).sort()).toEqual(['England', 'Minnesota', 'New York']);
  });

  it('drops a region that just repeats the city name', () => {
    const a = aggregate({
      range,
      geo: { '10.4.0.1': { ...GEO['1.1.1.1'], city: 'Singapore', region: 'Singapore', country_name: 'Singapore', country_code: 'SG', latitude: 1.35, longitude: 103.82 } },
      entries: [view('10.4.0.1', '/', '2026-09-16T17:00:00Z')],
    });
    expect(a.cities[0].label).toBe('Singapore');
  });

  it('treats alternate spellings of a country as one place', () => {
    // The real provider returns both "Netherlands" and "The Netherlands";
    // keying on the name split one city into two markers.
    const a = aggregate({
      range,
      geo: {
        '10.5.0.1': { ...GEO['1.1.1.1'], city: 'Amsterdam', region: 'North Holland', country_name: 'Netherlands', country_code: 'NL', latitude: 52.37, longitude: 4.9 },
        '10.5.0.2': { ...GEO['1.1.1.1'], city: 'Amsterdam', region: 'North Holland', country_name: 'The Netherlands', country_code: 'NL', latitude: 52.38, longitude: 4.91 },
      },
      entries: [
        view('10.5.0.1', '/', '2026-09-16T17:00:00Z'),
        view('10.5.0.2', '/', '2026-09-16T17:01:00Z'),
      ],
    });
    expect(a.locations).toHaveLength(1);
    expect(a.locations[0].totalVisits).toBe(2);
  });

  it('keeps same-named cities in different regions apart', () => {
    const springfields: Record<string, GeoInfo> = {
      '10.1.0.1': { ...GEO['1.1.1.1'], city: 'Springfield', region: 'Illinois', latitude: 39.78, longitude: -89.65 },
      '10.1.0.2': { ...GEO['1.1.1.1'], city: 'Springfield', region: 'Missouri', latitude: 37.21, longitude: -93.29 },
    };
    const a = aggregate({
      range,
      geo: springfields,
      entries: [
        view('10.1.0.1', '/', '2026-09-16T17:00:00Z'),
        view('10.1.0.2', '/', '2026-09-16T17:01:00Z'),
      ],
    });
    expect(a.locations).toHaveLength(2);
    expect(a.locations.map((l) => l.region).sort()).toEqual(['Illinois', 'Missouri']);
  });

  it('does not merge unrelated visitors with no city name', () => {
    const unnamed: Record<string, GeoInfo> = {
      '10.2.0.1': { ...GEO['1.1.1.1'], city: '', region: '', latitude: 10, longitude: 20 },
      '10.2.0.2': { ...GEO['1.1.1.1'], city: '', region: '', latitude: -30, longitude: 140 },
    };
    const a = aggregate({
      range,
      geo: unnamed,
      entries: [
        view('10.2.0.1', '/', '2026-09-16T17:00:00Z'),
        view('10.2.0.2', '/', '2026-09-16T17:01:00Z'),
      ],
    });
    // Falls back to coordinates, so two unknown places stay two markers.
    expect(a.locations).toHaveLength(2);
  });

  it('reports visitors the geo cache has no entry for', () => {
    const a = aggregate({
      range,
      geo: GEO,
      entries: [
        view('1.1.1.1', '/', '2026-09-16T17:00:00Z'),
        view('9.9.9.9', '/', '2026-09-16T17:01:00Z'),
      ],
    });
    expect(a.ungeolocatedVisitors).toBe(1);
    expect(a.locations).toHaveLength(1);
  });

  it('skips a geo record with null-island coordinates', () => {
    const a = aggregate({
      range,
      geo: {
        '4.4.4.4': {
          city: 'Unknown', region: '', country_name: 'Unknown', country_code: '??',
          org: 'Unknown', latitude: 0, longitude: 0, timezone: 'Unknown',
        },
      },
      entries: [view('4.4.4.4', '/', '2026-09-16T17:00:00Z')],
    });
    expect(a.locations).toHaveLength(0);
    // Still counted in the country breakdown, just not placed on the map.
    expect(a.countries.map((c) => c.label)).toContain('Unknown');
  });

  it('groups referrers by host and folds self-referrals into Direct', () => {
    const a = aggregate({
      range,
      geo: GEO,
      selfHosts: ['goonsite.dev'],
      entries: [
        view('1.1.1.1', '/', '2026-09-16T17:00:00Z', { referer: 'https://news.ycombinator.com/' }),
        view('1.1.1.1', '/notes', '2026-09-16T17:01:00Z', { referer: 'https://goonsite.dev/' }),
        view('2.2.2.2', '/', '2026-09-16T17:02:00Z', { referer: null }),
        view('3.3.3.3', '/', '2026-09-16T17:03:00Z', { referer: 'https://news.ycombinator.com/item?id=1' }),
      ],
    });
    const byLabel = Object.fromEntries(a.referrers.map((r) => [r.label, r.views]));
    expect(byLabel['news.ycombinator.com']).toBe(2);
    expect(byLabel['Direct']).toBe(2);
  });

  it('builds a Monday-first 7 x 24 heatmap in local time', () => {
    const a = aggregate({
      range: resolveRange('week', 0, 'day', NOW),
      geo: GEO,
      // 17:00Z Wed = 10:00 LA Wed.
      entries: [view('1.1.1.1', '/', '2026-09-16T17:00:00Z')],
    });
    expect(a.heatmap).toHaveLength(7);
    expect(a.heatmap[0]).toHaveLength(24);
    expect(a.heatmap[2][10]).toBe(1); // row 2 = Wednesday
    expect(a.heatmap.flat().reduce((s, v) => s + v, 0)).toBe(1);
  });

  it('computes comparison totals when previous entries are supplied', () => {
    const a = aggregate({
      range,
      geo: GEO,
      entries: [view('1.1.1.1', '/', '2026-09-16T17:00:00Z')],
      previousEntries: [
        view('2.2.2.2', '/', '2026-09-15T17:00:00Z'),
        view('3.3.3.3', '/', '2026-09-15T18:00:00Z'),
      ],
    });
    expect(a.totals.views).toBe(1);
    expect(a.previous!.views).toBe(2);
  });

  it('leaves previous null when no comparison window is supplied', () => {
    const a = aggregate({ range, geo: GEO, entries: [] });
    expect(a.previous).toBeNull();
  });

  it('returns zeroed totals for an empty range', () => {
    const a = aggregate({ range, geo: GEO, entries: [] });
    expect(a.totals.views).toBe(0);
    expect(a.totals.visitors).toBe(0);
    expect(a.totals.bounceRate).toBe(0);
    expect(a.totals.viewsPerSession).toBe(0);
    expect(a.locations).toEqual([]);
    expect(a.pages).toEqual([]);
  });

  it('breaks down devices, browsers and languages', () => {
    const a = aggregate({
      range,
      geo: GEO,
      entries: [
        view('1.1.1.1', '/', '2026-09-16T17:00:00Z'),
        view('2.2.2.2', '/', '2026-09-16T17:01:00Z', { user_agent: IPHONE, language: 'en-GB' }),
        view('3.3.3.3', '/', '2026-09-16T17:02:00Z', { user_agent: IPHONE, language: 'en-GB' }),
      ],
    });
    expect(Object.fromEntries(a.devices.map((d) => [d.label, d.views]))).toEqual({ Mobile: 2, Desktop: 1 });
    expect(Object.fromEntries(a.operatingSystems.map((d) => [d.label, d.views]))).toEqual({ iOS: 2, Windows: 1 });
    expect(Object.fromEntries(a.languages.map((d) => [d.label, d.views]))).toEqual({ 'en-GB': 2, 'en-US': 1 });
  });

  it('ranks pages by views and caps the list at topLimit', () => {
    const entries: RawEntry[] = [];
    for (let i = 0; i < 6; i++) {
      for (let n = 0; n <= i; n++) {
        entries.push(view('1.1.1.1', `/p${i}`, `2026-09-16T17:${String(i * 10 + n).padStart(2, '0')}:00Z`));
      }
    }
    const a = aggregate({ range, geo: GEO, entries, topLimit: 3 });
    expect(a.pages.map((p) => p.label)).toEqual(['/p5', '/p4', '/p3']);
    expect(a.pages[0].views).toBe(6);
  });
});
