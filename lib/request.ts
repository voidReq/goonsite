import { NextRequest } from 'next/server';

/**
 * Extract the client IP address from a Next.js request.
 * Checks common proxy headers in order of priority.
 */
export function getIp(request: NextRequest): string {
  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}
