import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';
import { sendAdminAlert } from '@/lib/notify';
import { validateCsrfToken } from '@/lib/csrf';
import { saveImage, MAX_IMAGE_BYTES, SafePathError } from '@/lib/projects-admin';
import { getIp, isAuthorized } from '../_auth';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const ip = getIp(request);
  const userAgent = request.headers.get('user-agent') || 'Unknown';

  if (!isAuthorized(request)) {
    const { limited } = rateLimit('admin-login', ip, 5, 60_000);
    if (limited) {
      return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
    }
    await sendAdminAlert({ ip, status: 'FAILED', userAgent, path: '/api/admin/projects/upload-image' });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!validateCsrfToken(request)) {
    return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const dirRaw = formData.get('dir');
  const file = formData.get('file');

  if (typeof dirRaw !== 'string') {
    return NextResponse.json({ error: 'Missing dir field' }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Missing file' }, { status: 400 });
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: 'Image exceeds size limit' }, { status: 413 });
  }

  let buffer: Buffer;
  try {
    buffer = Buffer.from(await file.arrayBuffer());
  } catch {
    return NextResponse.json({ error: 'Failed to read file' }, { status: 400 });
  }

  try {
    const result = saveImage({ dir: dirRaw, buffer });
    return NextResponse.json({ url: result.publicUrl });
  } catch (err) {
    if (err instanceof SafePathError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Upload failed' },
      { status: 500 },
    );
  }
}
