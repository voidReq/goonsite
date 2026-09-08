import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';
import { getGeoCache, getGeoErrors } from '@/lib/geo-cache';
import { sendAdminAlert } from '@/lib/notify';
import { getIp } from '@/lib/request';
import {
  listLogDates,
  readEntriesInRange,
  resolveRange,
  tzDateKey,
  tzTime,
  CALENDAR_PRESETS,
  REPORT_TZ,
  type RangePreset,
} from '@/lib/analytics';

/** Hard ceiling on entries returned in one response, to keep payloads sane. */
const MAX_ENTRIES = 5000;

const PERIODS: RangePreset[] = ['day', 'week', 'month', 'quarter', 'year', 'all'];

function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return false;
  const token = authHeader.slice(7);
  return token === process.env.ADMIN_PASSWORD;
}

export async function GET(request: NextRequest) {
  // Rate limit: 5 requests per 60 seconds per IP (for unauthenticated attempts)
  const ip = getIp(request);
  const userAgent = request.headers.get('user-agent') || 'Unknown';

  if (!isAuthorized(request)) {
    const { limited } = rateLimit('admin-login', ip, 5, 60_000);
    if (limited) {
      return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
    }
    await sendAdminAlert({ ip, status: 'FAILED', userAgent, path: '/api/admin/visitors' });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);

  // If requesting dates list, treat as successful login attempt
  if (searchParams.get('dates') === 'list') {
    // We only alert on the initial login check to prevent spamming on subsequent data requests
    await sendAdminAlert({ ip, status: 'SUCCESS', userAgent, path: '/api/admin/visitors' });
    const dates = listLogDates().reverse();
    return NextResponse.json({ dates, timezone: REPORT_TZ });
  }

  // Return the geo cache and any recent API errors
  if (searchParams.get('geo') === 'cache') {
    return NextResponse.json({
      geo: getGeoCache(),
      errors: getGeoErrors()
    });
  }

  const period = searchParams.get('period');

  // Period mode: a calendar week/month/quarter/year (or all time) of raw logs.
  if (period && (PERIODS as string[]).includes(period)) {
    const preset = period as RangePreset;
    const rawOffset = Number(searchParams.get('offset') || '0');
    const offset = CALENDAR_PRESETS.includes(preset) && Number.isFinite(rawOffset)
      ? Math.min(240, Math.max(0, Math.floor(rawOffset)))
      : 0;

    try {
      const range = resolveRange(preset, offset);
      const all = readEntriesInRange(range.from, range.to);
      // Newest first, then trim — so a truncated response keeps the recent end.
      all.reverse();
      const entries = all.slice(0, MAX_ENTRIES);

      return NextResponse.json({
        period: preset,
        offset,
        label: range.label,
        from: range.from ? range.from.toISOString() : null,
        to: range.to.toISOString(),
        navigable: range.navigable,
        atLatest: range.atLatest,
        timezone: REPORT_TZ,
        entries,
        count: entries.length,
        totalCount: all.length,
        truncated: all.length > entries.length,
      });
    } catch (error) {
      console.error('[admin-visitors] Failed to read period logs:', error);
      return NextResponse.json({ error: 'Failed to read logs' }, { status: 500 });
    }
  }

  // Single-day mode (the original behaviour): ?date=YYYY-MM-DD, defaulting to today.
  const date = searchParams.get('date') || tzDateKey(new Date());

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Invalid date format. Use YYYY-MM-DD.' }, { status: 400 });
  }

  try {
    // Bound the read to that calendar day in the reporting timezone.
    const [y, m, d] = date.split('-').map(Number);
    const from = tzTime(y, m, d);
    const to = tzTime(y, m, d + 1);

    const all = readEntriesInRange(from, to);
    all.reverse();
    const entries = all.slice(0, MAX_ENTRIES);

    return NextResponse.json({
      date,
      timezone: REPORT_TZ,
      entries,
      count: entries.length,
      totalCount: all.length,
      truncated: all.length > entries.length,
    });
  } catch (error) {
    console.error('[admin-visitors] Failed to read logs:', error);
    return NextResponse.json({ error: 'Failed to read logs' }, { status: 500 });
  }
}
