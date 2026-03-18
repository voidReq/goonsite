import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';
import { sendAdminAlert } from '@/lib/notify';
import {
  getPendingMessages,
  approveMessage,
  denyMessage,
} from '@/lib/messages';

function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return false;
  const token = authHeader.slice(7);
  return token === process.env.ADMIN_PASSWORD;
}

function getIp(request: NextRequest): string {
  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

/** GET /api/admin/messages — list pending messages (protected) */
export async function GET(request: NextRequest) {
  const ip = getIp(request);
  const userAgent = request.headers.get('user-agent') || 'Unknown';

  if (!isAuthorized(request)) {
    const { limited } = rateLimit('admin-login', ip, 5, 60_000);
    if (limited) {
      return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
    }
    await sendAdminAlert({ ip, status: 'FAILED', userAgent, path: '/api/admin/messages' });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const messages = getPendingMessages();
  return NextResponse.json({ messages });
}

/** PATCH /api/admin/messages — approve or deny a message (protected) */
export async function PATCH(request: NextRequest) {
  const ip = getIp(request);
  const userAgent = request.headers.get('user-agent') || 'Unknown';

  if (!isAuthorized(request)) {
    const { limited } = rateLimit('admin-login', ip, 5, 60_000);
    if (limited) {
      return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
    }
    await sendAdminAlert({ ip, status: 'FAILED', userAgent, path: '/api/admin/messages' });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const { id, action } = body as { id: unknown; action: unknown };

  if (typeof id !== 'string' || !id) {
    return NextResponse.json({ error: 'Missing or invalid message id.' }, { status: 400 });
  }

  if (action !== 'approve' && action !== 'deny') {
    return NextResponse.json({ error: 'Action must be "approve" or "deny".' }, { status: 400 });
  }

  const success = action === 'approve' ? approveMessage(id) : denyMessage(id);

  if (!success) {
    return NextResponse.json({ error: 'Message not found.' }, { status: 404 });
  }

  return NextResponse.json({ success: true, action });
}
