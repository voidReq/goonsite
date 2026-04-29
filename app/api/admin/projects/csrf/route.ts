import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';
import { sendAdminAlert } from '@/lib/notify';
import { attachCsrfCookie, generateCsrfToken } from '@/lib/csrf';
import { getIp, isAuthorized } from '../_auth';

export async function GET(request: NextRequest) {
  const ip = getIp(request);
  const userAgent = request.headers.get('user-agent') || 'Unknown';

  if (!isAuthorized(request)) {
    const { limited } = rateLimit('admin-login', ip, 5, 60_000);
    if (limited) {
      return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
    }
    await sendAdminAlert({ ip, status: 'FAILED', userAgent, path: '/api/admin/projects/csrf' });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = generateCsrfToken();
  const response = NextResponse.json({ csrfToken: token });
  return attachCsrfCookie(response, token);
}
