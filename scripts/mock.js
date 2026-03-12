const fs = require('fs');
const path = require('path');
const VISITORS_DIR = path.join(process.cwd(), 'data', 'visitors');
if (!fs.existsSync(VISITORS_DIR)) { fs.mkdirSync(VISITORS_DIR, { recursive: true }); }
const LOCATIONS = [
  { ip: '8.8.8.8', city: 'Mountain View', country_name: 'United States', lat: 37.386, lng: -122.0838 },
  { ip: '1.1.1.1', city: 'Brisbane', country_name: 'Australia', lat: -27.476, lng: 153.016 },
  { ip: '93.184.216.34', city: 'Norwell', country_name: 'United States', lat: 42.161, lng: -70.793 },
  { ip: '82.163.121.23', city: 'London', country_name: 'United Kingdom', lat: 51.5074, lng: -0.1278 },
  { ip: '172.217.14.238', city: 'Tokyo', country_name: 'Japan', lat: 35.6895, lng: 139.6917 },
  { ip: '103.21.244.1', city: 'Frankfurt', country_name: 'Germany', lat: 50.1109, lng: 8.6821 },
  { ip: '190.15.201.20', city: 'São Paulo', country_name: 'Brazil', lat: -23.5505, lng: -46.6333 },
  { ip: '196.25.1.1', city: 'Cape Town', country_name: 'South Africa', lat: -33.9249, lng: 18.4241 },
  { ip: '104.28.210.1', city: 'Singapore', country_name: 'Singapore', lat: 1.3521, lng: 103.8198 },
  { ip: '2.17.200.10', city: 'Paris', country_name: 'France', lat: 48.8566, lng: 2.3522 },
  { ip: '41.204.0.0', city: 'Lagos', country_name: 'Nigeria', lat: 6.5244, lng: 3.3792 },
  { ip: '202.131.255.1', city: 'Mumbai', country_name: 'India', lat: 19.0760, lng: 72.8777 },
  { ip: '211.233.1.1', city: 'Seoul', country_name: 'South Korea', lat: 37.5665, lng: 126.9780 },
  { ip: '201.231.0.1', city: 'Mexico City', country_name: 'Mexico', lat: 19.4326, lng: -99.1332 },
  { ip: '185.199.108.1', city: 'Amsterdam', country_name: 'Netherlands', lat: 52.3676, lng: 4.9041 },
  { ip: '31.13.72.1', city: 'Dublin', country_name: 'Ireland', lat: 53.3498, lng: -6.2603 },
  { ip: '200.1.1.1', city: 'Buenos Aires', country_name: 'Argentina', lat: -34.6037, lng: -58.3816 },
  { ip: '150.101.1.1', city: 'Sydney', country_name: 'Australia', lat: -33.8688, lng: 151.2093 },
  { ip: '62.213.1.1', city: 'Moscow', country_name: 'Russia', lat: 55.7558, lng: 37.6173 },
  { ip: '42.120.1.1', city: 'Beijing', country_name: 'China', lat: 39.9042, lng: 116.4074 },
];
const GEO_CACHE_FILE = path.join(VISITORS_DIR, '_geo_cache.json');
let geoCache = {};
if (fs.existsSync(GEO_CACHE_FILE)) { geoCache = JSON.parse(fs.readFileSync(GEO_CACHE_FILE, 'utf-8')); }
for (const loc of LOCATIONS) {
  if (!geoCache[loc.ip]) {
    geoCache[loc.ip] = {
      city: loc.city, region: loc.city, country_name: loc.country_name, country_code: 'XX', org: 'Mock Org', latitude: loc.lat, longitude: loc.lng, timezone: 'UTC', cached_at: new Date().toISOString()
    };
  }
}
fs.writeFileSync(GEO_CACHE_FILE, JSON.stringify(geoCache, null, 2));
const now = new Date();
for (let i = 0; i < 500; i++) {
  const randomMs = Math.floor(Math.random() * 35 * 24 * 60 * 60 * 1000);
  const eventTime = new Date(now.getTime() - randomMs);
  const dateStr = eventTime.toISOString().split('T')[0];
  const loc = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
  const entry = { type: 'view', ip: loc.ip, timestamp: eventTime.toISOString(), path: '/', user_agent: 'Mock', referer: null, screen: '1920x1080', language: 'en-US' };
  fs.appendFileSync(path.join(VISITORS_DIR, dateStr + '.jsonl'), JSON.stringify(entry) + '\n');
}
console.log('Mock data generated.');
