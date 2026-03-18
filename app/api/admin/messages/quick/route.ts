import { NextRequest, NextResponse } from 'next/server';
import { verifyAction } from '@/lib/notify';
import { approveMessage, denyMessage } from '@/lib/messages';

/**
 * GET /api/admin/messages/quick?id=xxx&action=approve|deny&token=xxx
 * One-click approve/deny from Discord webhook links.
 * Auth is via HMAC-signed token, not Bearer — so it works as a clickable link.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const action = searchParams.get('action');
  const token = searchParams.get('token');

  if (!id || !action || !token) {
    return new NextResponse(html('Missing parameters.', false), {
      status: 400,
      headers: { 'Content-Type': 'text/html' },
    });
  }

  if (action !== 'approve' && action !== 'deny') {
    return new NextResponse(html('Invalid action.', false), {
      status: 400,
      headers: { 'Content-Type': 'text/html' },
    });
  }

  if (!verifyAction(id, action, token)) {
    return new NextResponse(html('Invalid or expired token.', false), {
      status: 403,
      headers: { 'Content-Type': 'text/html' },
    });
  }

  const success = action === 'approve' ? approveMessage(id) : denyMessage(id);

  if (!success) {
    return new NextResponse(html('Message not found (already actioned?).', false), {
      status: 404,
      headers: { 'Content-Type': 'text/html' },
    });
  }

  const verb = action === 'approve' ? 'approved' : 'denied';
  return new NextResponse(html(`Message ${verb} successfully.`, true), {
    status: 200,
    headers: { 'Content-Type': 'text/html' },
  });
}

/** Return a minimal styled HTML page so clicking the link in Discord feels nice. */
function html(message: string, success: boolean): string {
  const color = success ? '#4ade80' : '#f87171';
  const emoji = success ? '&#10003;' : '&#10007;';
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Message Action</title>
<style>
  body { background: #0a0a0a; color: #e2e8f0; font-family: system-ui, sans-serif;
         display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
  .card { text-align: center; padding: 40px; border-radius: 12px;
          background: rgba(20,20,30,0.8); border: 1px solid ${color}33; }
  .icon { font-size: 48px; color: ${color}; margin-bottom: 16px; }
  .msg { font-size: 18px; color: ${color}; font-weight: 600; }
</style></head>
<body><div class="card"><div class="icon">${emoji}</div><div class="msg">${message}</div></div></body></html>`;
}
