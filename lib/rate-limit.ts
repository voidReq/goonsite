/**
 * Simple in-memory rate limiter using a sliding window.
 * No external dependencies — state resets on server restart.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const stores = new Map<string, Map<string, RateLimitEntry>>();

/**
 * Check if a request should be rate-limited.
 * @param storeName - Namespace for the rate limiter (e.g. 'log-visit', 'admin-login')
 * @param key - Identifier to rate limit by (typically IP)
 * @param maxRequests - Max requests allowed in the window
 * @param windowMs - Time window in milliseconds
 * @returns { limited: boolean, remaining: number } 
 */
export function rateLimit(
  storeName: string,
  key: string,
  maxRequests: number,
  windowMs: number,
): { limited: boolean; remaining: number } {
  if (!stores.has(storeName)) {
    stores.set(storeName, new Map());
  }
  const store = stores.get(storeName)!;
  const now = Date.now();

  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { limited: false, remaining: maxRequests - 1 };
  }

  entry.count++;

  if (entry.count > maxRequests) {
    return { limited: true, remaining: 0 };
  }

  return { limited: false, remaining: maxRequests - entry.count };
}

// Periodic cleanup of expired entries (every 5 minutes)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const store of stores.values()) {
      for (const [key, entry] of store) {
        if (now > entry.resetAt) {
          store.delete(key);
        }
      }
    }
  }, 5 * 60 * 1000);
}
