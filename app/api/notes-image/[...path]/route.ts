import fs from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';

const NOTES_DIR = path.join(process.cwd(), 'data', 'notes');

const MIME_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.bmp': 'image/bmp',
  '.ico': 'image/x-icon',
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathParts } = await params;

  // Resolve the full path and ensure it stays within NOTES_DIR (prevent traversal)
  const filePath = path.resolve(NOTES_DIR, pathParts.join('/'));
  if (!filePath.startsWith(NOTES_DIR + path.sep) && filePath !== NOTES_DIR) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  if (!fs.existsSync(filePath)) {
    return new NextResponse('Not Found', { status: 404 });
  }

  const ext = path.extname(filePath).toLowerCase();
  const mimeType = MIME_TYPES[ext];
  if (!mimeType) {
    return new NextResponse('Unsupported file type', { status: 415 });
  }

  const fileBuffer = fs.readFileSync(filePath);

  return new NextResponse(fileBuffer, {
    headers: {
      'Content-Type': mimeType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
