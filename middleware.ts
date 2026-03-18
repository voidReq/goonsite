import { NextRequest, NextResponse } from 'next/server';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function middleware(request: NextRequest) {
  // Skip CSRF validation for safe (non-mutating) methods
  if (SAFE_METHODS.has(request.method)) {
    return NextResponse.next();
  }

  // For mutating requests (POST, PUT, PATCH, DELETE), validate Origin/Referer
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  // If neither Origin nor Referer is present, allow the request.
  // Non-browser clients (e.g., sendBeacon) may not always send these headers.
  if (!origin && !referer) {
    return NextResponse.next();
  }

  const host = request.headers.get('host');
  if (!host) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Check Origin header first (most reliable)
  if (origin) {
    try {
      const originHost = new URL(origin).host;
      if (originHost === host) {
        return NextResponse.next();
      }
    } catch {
      // Invalid Origin URL
    }
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Fall back to Referer header
  if (referer) {
    try {
      const refererHost = new URL(referer).host;
      if (refererHost === host) {
        return NextResponse.next();
      }
    } catch {
      // Invalid Referer URL
    }
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

export const config = {
  matcher: ['/api/:path*'],
};
