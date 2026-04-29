import { NextRequest, NextResponse } from 'next/server';
import { buildProjectTree } from '@/lib/projects';
import { rateLimit } from '@/lib/rate-limit';
import { sendAdminAlert } from '@/lib/notify';
import { getIp, isAuthorized } from '../_auth';

export async function GET(request: NextRequest) {
  const ip = getIp(request);
  const userAgent = request.headers.get('user-agent') || 'Unknown';

  if (!isAuthorized(request)) {
    const { limited } = rateLimit('admin-login', ip, 5, 60_000);
    if (limited) {
      return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
    }
    await sendAdminAlert({ ip, status: 'FAILED', userAgent, path: '/api/admin/projects/tree' });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const tree = buildProjectTree();
    return NextResponse.json({ tree });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to read tree' },
      { status: 500 },
    );
  }
}
