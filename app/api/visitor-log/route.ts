import { NextRequest, NextResponse } from "next/server";
import { appendFile, readFile } from "fs/promises";
import path from "path";

const LOG_FILE = path.join(process.cwd(), "visitor.log");

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-log-secret");
  if (secret !== process.env.LOGGING_SECRET) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { ip } = await req.json();
  const line = `${new Date().toISOString()} ${ip}\n`;
  await appendFile(LOG_FILE, line, { encoding: "utf8" });
  return new NextResponse("OK");
}

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-log-secret");
  if (secret !== process.env.LOGGING_SECRET) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const data = await readFile(LOG_FILE, "utf8");
    return new NextResponse(data, {
      status: 200,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  } catch {
    return new NextResponse("", {
      status: 200,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }
}
