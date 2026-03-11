import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

const VISITORS_DIR = join(process.cwd(), 'data', 'visitors');

function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return false;
  const token = authHeader.slice(7);
  return token === process.env.ADMIN_PASSWORD;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);

  // List available log dates
  if (searchParams.get('dates') === 'list') {
    try {
      if (!existsSync(VISITORS_DIR)) {
        return NextResponse.json({ dates: [] });
      }
      const files = readdirSync(VISITORS_DIR)
        .filter((f) => f.endsWith('.jsonl'))
        .map((f) => f.replace('.jsonl', ''))
        .sort()
        .reverse();
      return NextResponse.json({ dates: files });
    } catch {
      return NextResponse.json({ dates: [] });
    }
  }

  // Get logs for a specific date (default: today)
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Invalid date format. Use YYYY-MM-DD.' }, { status: 400 });
  }

  const filePath = join(VISITORS_DIR, `${date}.jsonl`);

  if (!existsSync(filePath)) {
    return NextResponse.json({ date, entries: [], count: 0 });
  }

  try {
    const content = readFileSync(filePath, 'utf-8');
    const entries = content
      .trim()
      .split('\n')
      .filter((line) => line.length > 0)
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    return NextResponse.json({
      date,
      entries,
      count: entries.length,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to read logs' }, { status: 500 });
  }
}
