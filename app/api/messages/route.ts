import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { rateLimit } from '@/lib/rate-limit';
import { sendMessageAlert } from '@/lib/notify';
import {
  getApprovedMessages,
  addPendingMessage,
  sanitizeText,
  validateMessage,
  validateAuthor,
} from '@/lib/messages';

function getIp(request: NextRequest): string {
  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

/** GET /api/messages — return all approved messages (public) */
export async function GET() {
  const messages = getApprovedMessages();
  return NextResponse.json({ messages });
}

/** POST /api/messages — submit a new message (public, rate limited) */
export async function POST(request: NextRequest) {
  const ip = getIp(request);

  // Rate limit: 3 submissions per 5 minutes per IP
  const { limited } = rateLimit('message-submit', ip, 3, 5 * 60_000);
  if (limited) {
    return NextResponse.json(
      { error: 'Too many submissions. Please wait a few minutes.' },
      { status: 429 }
    );
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

  const { text, author } = body as { text: unknown; author: unknown };

  const textValidation = validateMessage(text);
  if (!textValidation.valid) {
    return NextResponse.json({ error: textValidation.error }, { status: 400 });
  }

  const authorValidation = validateAuthor(author);
  if (!authorValidation.valid) {
    return NextResponse.json({ error: authorValidation.error }, { status: 400 });
  }

  const sanitizedText = sanitizeText(text as string);
  const sanitizedAuthor = sanitizeText(author as string);

  if (sanitizedText.length === 0) {
    return NextResponse.json({ error: 'Message cannot be empty after sanitization.' }, { status: 400 });
  }

  const id = randomUUID();

  addPendingMessage({
    id,
    text: sanitizedText,
    author: sanitizedAuthor,
    timestamp: new Date().toISOString(),
    ip,
  });

  // Fire-and-forget Discord notification with one-click approve/deny links
  sendMessageAlert({ id, text: sanitizedText, author: sanitizedAuthor, ip }).catch(() => {});

  return NextResponse.json({ success: true, message: 'Message submitted for review!' }, { status: 201 });
}
