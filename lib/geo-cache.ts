/**
 * Persistent IP geolocation cache.
 * Each IP is looked up via ipapi.co exactly once, then cached to disk.
 * Tracks API errors to alert the admin if quota is running low.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const CACHE_DIR = join(process.cwd(), 'data', 'visitors');
const CACHE_FILE = join(CACHE_DIR, '_geo_cache.json');
const ERRORS_FILE = join(CACHE_DIR, '_geo_errors.json');

export interface GeoInfo {
  city: string;
  region: string;
  country_name: string;
  country_code: string;
  org: string;
  latitude: number;
  longitude: number;
  timezone: string;
  cached_at: string;
}

export interface GeoError {
  ip: string;
  status: number;
  reason: string;
  timestamp: string;
}

function loadCache(): Record<string, GeoInfo> {
  try {
    if (existsSync(CACHE_FILE)) {
      return JSON.parse(readFileSync(CACHE_FILE, 'utf-8'));
    }
  } catch {}
  return {};
}

function saveCache(cache: Record<string, GeoInfo>) {
  try {
    if (!existsSync(CACHE_DIR)) {
      mkdirSync(CACHE_DIR, { recursive: true });
    }
    writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
  } catch (error) {
    console.error('[geo-cache] Failed to save cache:', error);
  }
}

function loadErrors(): GeoError[] {
  try {
    if (existsSync(ERRORS_FILE)) {
      return JSON.parse(readFileSync(ERRORS_FILE, 'utf-8'));
    }
  } catch {}
  return [];
}

function logError(ip: string, status: number, reason: string) {
  const entry: GeoError = {
    ip,
    status,
    reason,
    timestamp: new Date().toISOString(),
  };
  let errorLog = loadErrors();
  errorLog.push(entry);
  // Keep last 100 errors
  if (errorLog.length > 100) {
    errorLog = errorLog.slice(-100);
  }
  try {
    if (!existsSync(CACHE_DIR)) {
      mkdirSync(CACHE_DIR, { recursive: true });
    }
    writeFileSync(ERRORS_FILE, JSON.stringify(errorLog, null, 2));
  } catch (error) {
    console.error('[geo-cache] Failed to save error log:', error);
  }
}

/**
 * Get geolocation for an IP. Returns cached result if available,
 * otherwise fetches from ipapi.co and caches the result.
 * Returns null for private/localhost IPs or on API failure.
 */
export async function getGeoForIp(ip: string): Promise<GeoInfo | null> {
  // Skip private/localhost IPs
  if (!ip || ip === 'unknown' || ip === '::1' || ip.startsWith('127.') ||
      ip.startsWith('10.') || ip.startsWith('192.168.') || ip.startsWith('172.')) {
    return null;
  }

  const cache = loadCache();

  // Return cached result
  if (cache[ip]) {
    return cache[ip];
  }

  // Fetch from ipapi.co
  try {
    const res = await fetch(`https://ipapi.co/${ip}/json/`, {
      headers: { 'User-Agent': 'goonsite-visitor-log/1.0' },
      cache: 'no-store',
    });

    if (!res.ok) {
      const reason = res.status === 429
        ? 'Rate limit exceeded — you may need to upgrade your ipapi.co plan'
        : `HTTP ${res.status}`;
      console.error(`[geo-cache] ipapi.co returned ${res.status} for ${ip}`);
      logError(ip, res.status, reason);
      return null;
    }

    const data = await res.json();

    // ipapi.co returns { error: true } on invalid IPs or rate limits
    if (data.error) {
      console.error(`[geo-cache] ipapi.co error for ${ip}:`, data.reason);
      logError(ip, 0, data.reason || 'Unknown API error');
      return null;
    }

    const geo: GeoInfo = {
      city: data.city || 'Unknown',
      region: data.region || 'Unknown',
      country_name: data.country_name || 'Unknown',
      country_code: data.country_code || '??',
      org: data.org || 'Unknown',
      latitude: data.latitude || 0,
      longitude: data.longitude || 0,
      timezone: data.timezone || 'Unknown',
      cached_at: new Date().toISOString(),
    };

    // Cache to disk
    cache[ip] = geo;
    saveCache(cache);

    return geo;
  } catch (error) {
    console.error(`[geo-cache] Failed to fetch geo for ${ip}:`, error);
    logError(ip, 0, String(error));
    return null;
  }
}

/**
 * Get the entire geo cache (for the admin dashboard).
 */
export function getGeoCache(): Record<string, GeoInfo> {
  return loadCache();
}

/**
 * Get recent geo lookup errors (for the admin dashboard alert).
 */
export function getGeoErrors(): GeoError[] {
  return loadErrors();
}
