import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-hub-signature-256') || '';

    const res = await fetch('http://127.0.0.1:9000/deploy', {
      method: 'POST',
      headers: {
        'content-type': request.headers.get('content-type') || 'application/json',
        'x-hub-signature-256': signature,
      },
      body,
    });

    const text = await res.text();
    return new NextResponse(text, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'webhook proxy failed' }, { status: 502 });
  }
}
