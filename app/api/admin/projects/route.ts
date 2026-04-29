import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { rateLimit } from '@/lib/rate-limit';
import { sendAdminAlert } from '@/lib/notify';
import { validateCsrfToken } from '@/lib/csrf';
import { writeWriteup, SafePathError } from '@/lib/projects-admin';
import { getIp, isAuthorized } from './_auth';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const ip = getIp(request);
  const userAgent = request.headers.get('user-agent') || 'Unknown';

  if (!isAuthorized(request)) {
    const { limited } = rateLimit('admin-login', ip, 5, 60_000);
    if (limited) {
      return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
    }
    await sendAdminAlert({ ip, status: 'FAILED', userAgent, path: '/api/admin/projects' });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!validateCsrfToken(request)) {
    return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const { dir, filename, title, description, body: content, overwrite } = body as {
    dir?: unknown;
    filename?: unknown;
    title?: unknown;
    description?: unknown;
    body?: unknown;
    overwrite?: unknown;
  };

  if (typeof dir !== 'string' || typeof filename !== 'string' || typeof content !== 'string') {
    return NextResponse.json({ error: 'dir, filename, and body are required strings' }, { status: 400 });
  }
  if (content.length > 500_000) {
    return NextResponse.json({ error: 'Body too large' }, { status: 413 });
  }
  if (title !== undefined && typeof title !== 'string') {
    return NextResponse.json({ error: 'title must be a string' }, { status: 400 });
  }
  if (description !== undefined && typeof description !== 'string') {
    return NextResponse.json({ error: 'description must be a string' }, { status: 400 });
  }

  try {
    const result = writeWriteup({
      dir,
      filename,
      title: typeof title === 'string' ? title : undefined,
      description: typeof description === 'string' ? description : undefined,
      body: content,
      overwrite: overwrite === true,
    });
    revalidatePath('/projects');
    revalidatePath(`/projects/${result.slug.join('/')}`);
    return NextResponse.json({
      slug: result.slug,
      url: `/projects/${result.slug.join('/')}`,
    });
  } catch (err) {
    if (err instanceof SafePathError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    if (err instanceof Error && (err as Error & { code?: string }).code === 'EEXIST') {
      return NextResponse.json({ error: 'File already exists' }, { status: 409 });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Save failed' },
      { status: 500 },
    );
  }
}
