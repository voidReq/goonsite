import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Skip prefetch requests
  const purpose = request.headers.get('purpose') || request.headers.get('x-purpose');
  if (purpose === 'prefetch') {
    return response;
  }

  try {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';

    const entry = {
      ip,
      timestamp: new Date().toISOString(),
      path: request.nextUrl.pathname,
      user_agent: request.headers.get('user-agent') || 'unknown',
      referer: request.headers.get('referer') || null,
    };

    // Fire-and-forget: send log entry to internal API route
    const logUrl = new URL('/api/internal/log-visit', request.url);
    fetch(logUrl.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    }).catch(() => {
      // Silently ignore — logging should never break the site
    });
  } catch {
    // Silently fail
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt
     * - API routes (avoid logging API calls and infinite loops)
     * - Static file extensions
     */
    '/((?!_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|api/|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|eot|css|js|map)).*)',
  ],
};
