import type { NextRequest } from "next/server";

const BOT_UA_PATTERN = /bot|crawler|spider|crawling/i;

/**
 * Logs the visitor's IP address unless the request appears to come from a bot.
 */
export async function logVisitor(req: NextRequest): Promise<void> {
  const ua = req.headers.get("user-agent") || "";
  if (BOT_UA_PATTERN.test(ua)) {
    return;
  }

  const ip =
    req.ip ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";

  try {
    const url = new URL("/api/visitor-log", req.nextUrl.origin);
    await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-log-secret": process.env.LOGGING_SECRET ?? "",
      },
      body: JSON.stringify({ ip }),
    });
  } catch {
    // fail silently
  }
}
