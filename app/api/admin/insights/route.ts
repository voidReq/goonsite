import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';
import { getGeoCache } from '@/lib/geo-cache';
import { sendAdminAlert } from '@/lib/notify';
import { getIp } from '@/lib/request';
import {
  computeAnalytics,
  resolveRange,
  CALENDAR_PRESETS,
  type Bucket,
  type RangePreset,
} from '@/lib/analytics';

const PRESETS: RangePreset[] = [
  '1h', '24h', '7d', '30d', '90d',
  'day', 'week', 'month', 'quarter', 'year',
  '12m', 'all',
];

const BUCKETS: Bucket[] = ['tenmin', 'hour', 'day', 'week', 'month'];

function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return false;
  const token = authHeader.slice(7);
  return token === process.env.ADMIN_PASSWORD;
}

/** Hostnames that count as "us", so self-referrals are reported as Direct. */
function selfHosts(request: NextRequest): string[] {
  const hosts = [
    request.headers.get('host'),
    request.headers.get('x-forwarded-host'),
    process.env.NEXT_PUBLIC_SITE_HOST,
    process.env.VERCEL_URL,
  ];
  return hosts
    .filter((h): h is string => !!h)
    .map((h) => h.replace(/^https?:\/\//, '').split(':')[0].toLowerCase().replace(/^www\./, ''));
}

export async function GET(request: NextRequest) {
  const ip = getIp(request);
  const userAgent = request.headers.get('user-agent') || 'Unknown';

  if (!isAuthorized(request)) {
    const { limited } = rateLimit('admin-insights', ip, 5, 60_000);
    if (limited) {
      return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
    }
    await sendAdminAlert({ ip, status: 'FAILED', userAgent, path: '/api/admin/insights' });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);

  // Only alert on the initial load, so browsing ranges doesn't spam notifications.
  if (searchParams.get('initial') === '1') {
    await sendAdminAlert({ ip, status: 'SUCCESS', userAgent, path: '/api/admin/insights' });
  }

  const rawPreset = searchParams.get('range') || '30d';
  const preset = (PRESETS as string[]).includes(rawPreset) ? (rawPreset as RangePreset) : '30d';

  const rawOffset = Number(searchParams.get('offset') || '0');
  const offset = CALENDAR_PRESETS.includes(preset) && Number.isFinite(rawOffset)
    ? Math.min(240, Math.max(0, Math.floor(rawOffset)))
    : 0;

  const rawBucket = searchParams.get('bucket');
  const bucket = rawBucket && (BUCKETS as string[]).includes(rawBucket) ? (rawBucket as Bucket) : null;

  const includeBots = searchParams.get('bots') === '1';

  try {
    const range = resolveRange(preset, offset, bucket);
    const analytics = computeAnalytics({
      range,
      geo: getGeoCache(),
      selfHosts: selfHosts(request),
      includeBots,
    });
    return NextResponse.json(analytics, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('[admin-insights] Failed to compute analytics:', error);
    return NextResponse.json({ error: 'Failed to compute analytics' }, { status: 500 });
  }
}
