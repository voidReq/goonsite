import { NextRequest, NextResponse } from 'next/server';
import { appendFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const VISITORS_DIR = join(process.cwd(), 'data', 'visitors');

export async function POST(request: NextRequest) {
  try {
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

    const today = new Date().toISOString().split('T')[0];

    if (!existsSync(VISITORS_DIR)) {
      mkdirSync(VISITORS_DIR, { recursive: true });
    }

    const filePath = join(VISITORS_DIR, `${today}.jsonl`);
    appendFileSync(filePath, JSON.stringify(entry) + '\n');

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[visitor-log] Failed to write log entry:', error);
    return NextResponse.json({ error: 'Failed to log' }, { status: 500 });
  }
}
