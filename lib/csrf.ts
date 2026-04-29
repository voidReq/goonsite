import { NextRequest, NextResponse } from 'next/server';
import { randomBytes, timingSafeEqual } from 'crypto';

export const CSRF_COOKIE_NAME = 'csrf_token';
export const CSRF_HEADER_NAME = 'x-csrf-token';

const TOKEN_BYTES = 32;
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 8;

export function generateCsrfToken(): string {
  return randomBytes(TOKEN_BYTES).toString('hex');
}

export function attachCsrfCookie(response: NextResponse, token: string): NextResponse {
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/admin',
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });
  return response;
}

export function validateCsrfToken(request: NextRequest): boolean {
  const headerToken = request.headers.get(CSRF_HEADER_NAME);
  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  if (!headerToken || !cookieToken) return false;
  if (headerToken.length !== cookieToken.length) return false;
  try {
    const a = new Uint8Array(Buffer.from(headerToken));
    const b = new Uint8Array(Buffer.from(cookieToken));
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
