import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { rateLimit } from '@/lib/rate-limit';
import { getGeoCache } from '@/lib/geo-cache';

const VISITORS_DIR = join(process.cwd(), 'data', 'visitors');

function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return false;
  const token = authHeader.slice(7);
  return token === process.env.ADMIN_PASSWORD;
}

export async function GET(request: NextRequest) {
  // Rate limit
  const ip = request.headers.get('cf-connecting-ip') ||
             request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
             request.headers.get('x-real-ip') || 'unknown';

  if (!isAuthorized(request)) {
    const { limited } = rateLimit('admin-insights', ip, 5, 60_000);
    if (limited) {
      return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
    }
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const range = searchParams.get('range') || 'all'; // 1h, 24h, 3d, 7d, 30d, all
  
  const now = new Date();
  let cutoff: Date | null = null;
  
  if (range === '1h') cutoff = new Date(now.getTime() - 60 * 60 * 1000);
  else if (range === '24h') cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  else if (range === '3d') cutoff = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  else if (range === '7d') cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  else if (range === '30d') cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // We can filter which log files to read based on the cutoff date.
  let filesToRead: string[] = [];
  if (existsSync(VISITORS_DIR)) {
    const files = readdirSync(VISITORS_DIR).filter(f => f.endsWith('.jsonl'));
    if (cutoff) {
      // Subtract 1 day to account for potential timezone differences
      const cutoffDateStr = new Date(cutoff.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      filesToRead = files.filter(f => {
        const fileDate = f.replace('.jsonl', '');
        return fileDate >= cutoffDateStr;
      });
    } else {
      filesToRead = files;
    }
  }

  const geoCache = getGeoCache();
  
  // Track stats per location
  // Key: "lat,lon"
  const locationStats: Record<string, {
    lat: number;
    lng: number;
    city: string;
    country: string;
    uniqueIps: Set<string>;
    totalVisits: number;
  }> = {};

  for (const file of filesToRead) {
    const filePath = join(VISITORS_DIR, file);
    if (!existsSync(filePath)) continue;
    
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.trim().split('\n');
    
    for (const line of lines) {
      if (!line) continue;
      try {
        const entry = JSON.parse(line);
        // We only care about views for locations
        if (entry.type && entry.type !== 'view') continue;
        
        const timestamp = new Date(entry.timestamp);
        if (cutoff && timestamp < cutoff) continue;
        
        const visitorIp = entry.ip;
        if (!visitorIp || !geoCache[visitorIp]) continue;
        
        const geo = geoCache[visitorIp];
        // Must have valid coordinates
        if (typeof geo.latitude !== 'number' || typeof geo.longitude !== 'number' ||
            (geo.latitude === 0 && geo.longitude === 0 && geo.city === 'Unknown')) {
          continue;
        }
        
        const locKey = `${geo.latitude},${geo.longitude}`;
        if (!locationStats[locKey]) {
          locationStats[locKey] = {
            lat: geo.latitude,
            lng: geo.longitude,
            city: geo.city,
            country: geo.country_name,
            uniqueIps: new Set(),
            totalVisits: 0
          };
        }
        
        locationStats[locKey].totalVisits++;
        locationStats[locKey].uniqueIps.add(visitorIp);
        
      } catch {
        // ignore JSON parse error for individual lines
      }
    }
  }

  // Format response
  const locations = Object.values(locationStats).map(loc => ({
    lat: loc.lat,
    lng: loc.lng,
    city: loc.city,
    country: loc.country,
    uniqueVisitors: loc.uniqueIps.size,
    totalVisits: loc.totalVisits
  })).sort((a, b) => b.totalVisits - a.totalVisits);

  return NextResponse.json({ locations });
}
