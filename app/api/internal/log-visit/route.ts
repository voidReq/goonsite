import { NextRequest, NextResponse } from 'next/server';
import { appendFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { rateLimit } from '@/lib/rate-limit';
import { getGeoForIp } from '@/lib/geo-cache';

const VISITORS_DIR = join(process.cwd(), 'data', 'visitors');

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 30 requests per 10 seconds per IP
    const ip = request.headers.get('cf-connecting-ip') ||
               request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
               request.headers.get('x-real-ip') ||
               'unknown';
    const { limited } = rateLimit('log-visit', ip, 30, 10_000);
    if (limited) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    // sendBeacon sends as text/plain, regular fetch sends as application/json
    const contentType = request.headers.get('content-type') || '';
    let entry: Record<string, unknown>;

    if (contentType.includes('text/plain')) {
      const text = await request.text();
      entry = JSON.parse(text);
    } else {
      entry = await request.json();
    }

    // Basic validation
    if (!entry || !entry.path) {
      return NextResponse.json({ error: 'Invalid entry' }, { status: 400 });
    }

    // Ensure timestamp exists
    if (!entry.timestamp) {
      entry.timestamp = new Date().toISOString();
    }

    // Attach real IP from server-side headers (client can't know its own public IP)
    entry.ip = ip;

    const today = new Date().toISOString().split('T')[0];

    if (!existsSync(VISITORS_DIR)) {
      mkdirSync(VISITORS_DIR, { recursive: true });
    }

    const filePath = join(VISITORS_DIR, `${today}.jsonl`);
    appendFileSync(filePath, JSON.stringify(entry) + '\n');

    // Fire-and-forget geo lookup on view events (caches automatically)
    if (entry.type === 'view' && ip !== 'unknown') {
      getGeoForIp(ip).catch(() => {});
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[visitor-log] Failed to write log entry:', error);
    return NextResponse.json({ error: 'Failed to log' }, { status: 500 });
  }
}
