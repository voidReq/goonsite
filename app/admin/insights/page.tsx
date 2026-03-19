'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  MantineProvider,
  Text,
  TextInput,
  Button,
  Paper,
  Group,
  Stack,
  Title,
  Loader,
  Alert,
  Select,
  Container,
  Tooltip,
} from '@mantine/core';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps';
import { useRouter } from 'next/navigation';
import { IconLock, IconAlertCircle, IconMapPin, IconArrowLeft, IconPlus, IconMinus } from '@tabler/icons-react';

const geoUrl = "/countries-110m.json";
const usStatesUrl = "/us-states-10m.json";

// minZoom: the zoom level at which the city label appears
const CITIES = [
  // Tier 1 — always visible
  { name: "New York", lat: 40.71, lng: -74.01, minZoom: 1 },
  { name: "Los Angeles", lat: 34.05, lng: -118.24, minZoom: 1 },
  { name: "London", lat: 51.51, lng: -0.13, minZoom: 1 },
  { name: "Tokyo", lat: 35.68, lng: 139.69, minZoom: 1 },
  { name: "Paris", lat: 48.86, lng: 2.35, minZoom: 1 },
  { name: "Sydney", lat: -33.87, lng: 151.21, minZoom: 1 },
  { name: "São Paulo", lat: -23.55, lng: -46.63, minZoom: 1 },
  { name: "Beijing", lat: 39.90, lng: 116.40, minZoom: 1 },
  { name: "Mumbai", lat: 19.08, lng: 72.88, minZoom: 1 },
  { name: "Cairo", lat: 30.04, lng: 31.24, minZoom: 1 },
  // Tier 2 — zoom >= 2
  { name: "Chicago", lat: 41.88, lng: -87.63, minZoom: 2 },
  { name: "San Francisco", lat: 37.77, lng: -122.42, minZoom: 2 },
  { name: "Houston", lat: 29.76, lng: -95.37, minZoom: 2 },
  { name: "Seattle", lat: 47.61, lng: -122.33, minZoom: 2 },
  { name: "Miami", lat: 25.76, lng: -80.19, minZoom: 2 },
  { name: "Toronto", lat: 43.65, lng: -79.38, minZoom: 2 },
  { name: "Berlin", lat: 52.52, lng: 13.41, minZoom: 2 },
  { name: "Moscow", lat: 55.76, lng: 37.62, minZoom: 2 },
  { name: "Dubai", lat: 25.20, lng: 55.27, minZoom: 2 },
  { name: "Singapore", lat: 1.35, lng: 103.82, minZoom: 2 },
  { name: "Mexico City", lat: 19.43, lng: -99.13, minZoom: 2 },
  { name: "Lagos", lat: 6.52, lng: 3.38, minZoom: 2 },
  // Tier 3 — zoom >= 5
  { name: "Denver", lat: 39.74, lng: -104.99, minZoom: 5 },
  { name: "Atlanta", lat: 33.75, lng: -84.39, minZoom: 5 },
  { name: "Dallas", lat: 32.78, lng: -96.80, minZoom: 5 },
  { name: "Boston", lat: 42.36, lng: -71.06, minZoom: 5 },
  { name: "Phoenix", lat: 33.45, lng: -112.07, minZoom: 5 },
  { name: "Detroit", lat: 42.33, lng: -83.05, minZoom: 5 },
  { name: "Minneapolis", lat: 44.98, lng: -93.27, minZoom: 5 },
  { name: "Portland", lat: 45.52, lng: -122.68, minZoom: 5 },
  { name: "Amsterdam", lat: 52.37, lng: 4.90, minZoom: 5 },
  { name: "Madrid", lat: 40.42, lng: -3.70, minZoom: 5 },
  { name: "Rome", lat: 41.90, lng: 12.50, minZoom: 5 },
  { name: "Istanbul", lat: 41.01, lng: 28.98, minZoom: 5 },
  { name: "Seoul", lat: 37.57, lng: 126.98, minZoom: 5 },
  { name: "Bangkok", lat: 13.76, lng: 100.50, minZoom: 5 },
  { name: "Jakarta", lat: -6.21, lng: 106.85, minZoom: 5 },
  { name: "Nairobi", lat: -1.29, lng: 36.82, minZoom: 5 },
  { name: "Buenos Aires", lat: -34.60, lng: -58.38, minZoom: 5 },
  { name: "Shanghai", lat: 31.23, lng: 121.47, minZoom: 5 },
  // Tier 4 — zoom >= 15
  { name: "San Diego", lat: 32.72, lng: -117.16, minZoom: 15 },
  { name: "San Jose", lat: 37.34, lng: -121.89, minZoom: 15 },
  { name: "Austin", lat: 30.27, lng: -97.74, minZoom: 15 },
  { name: "Nashville", lat: 36.16, lng: -86.78, minZoom: 15 },
  { name: "Charlotte", lat: 35.23, lng: -80.84, minZoom: 15 },
  { name: "Las Vegas", lat: 36.17, lng: -115.14, minZoom: 15 },
  { name: "Salt Lake City", lat: 40.76, lng: -111.89, minZoom: 15 },
  { name: "Raleigh", lat: 35.78, lng: -78.64, minZoom: 15 },
  { name: "Pittsburgh", lat: 40.44, lng: -79.99, minZoom: 15 },
  { name: "Columbus", lat: 39.96, lng: -82.99, minZoom: 15 },
  { name: "Oakland", lat: 37.80, lng: -122.27, minZoom: 15 },
  { name: "Sacramento", lat: 38.58, lng: -121.49, minZoom: 15 },
  { name: "Tampa", lat: 27.95, lng: -82.46, minZoom: 15 },
  { name: "Orlando", lat: 28.54, lng: -81.38, minZoom: 15 },
  { name: "New Orleans", lat: 29.95, lng: -90.07, minZoom: 15 },
  { name: "Milwaukee", lat: 43.04, lng: -87.91, minZoom: 15 },
  { name: "Kansas City", lat: 39.10, lng: -94.58, minZoom: 15 },
  { name: "Indianapolis", lat: 39.77, lng: -86.16, minZoom: 15 },
  { name: "Manchester", lat: 53.48, lng: -2.24, minZoom: 15 },
  { name: "Lyon", lat: 45.76, lng: 4.84, minZoom: 15 },
  { name: "Munich", lat: 48.14, lng: 11.58, minZoom: 15 },
  { name: "Osaka", lat: 34.69, lng: 135.50, minZoom: 15 },
  { name: "Melbourne", lat: -37.81, lng: 144.96, minZoom: 15 },
  { name: "Vancouver", lat: 49.28, lng: -123.12, minZoom: 15 },
  { name: "Montreal", lat: 45.50, lng: -73.57, minZoom: 15 },
];

interface LocationStat {
  lat: number;
  lng: number;
  city: string;
  country: string;
  uniqueVisitors: number;
  totalVisits: number;
}

export default function AdminInsightsPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);

  const [timeRange, setTimeRange] = useState<string>('all');
  const [locations, setLocations] = useState<LocationStat[]>([]);
  const [position, setPosition] = useState({ coordinates: [0, 0], zoom: 1 });

  const MAX_ZOOM = 5000;

  const handleZoomIn = () => {
    if (position.zoom >= MAX_ZOOM) return;
    setPosition((pos) => ({ ...pos, zoom: pos.zoom * 1.5 }));
  };

  const handleZoomOut = () => {
    if (position.zoom <= 1) return;
    setPosition((pos) => ({ ...pos, zoom: pos.zoom / 1.5 }));
  };

  const handleMoveEnd = (newPosition: { coordinates: [number, number]; zoom: number }) => {
    setPosition(newPosition);
  };

  const fetchInsights = async (range: string, pwd?: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/insights?range=${range}`, {
        headers: { Authorization: `Bearer ${pwd || password}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLocations(data.locations || []);
        if (!authed) setAuthed(true);
      } else if (res.status === 401) {
        setAuthError('Invalid password');
        setAuthed(false);
      } else {
        setAuthError('Failed to load insights');
      }
    } catch {
      setAuthError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setAuthError('');
    await fetchInsights(timeRange, password);
  };

  useEffect(() => {
    if (authed) {
      fetchInsights(timeRange);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange]);

  // Calculate top locations for the sidebar
  const topLocations = useMemo(() => {
    return [...locations].sort((a, b) => b.totalVisits - a.totalVisits).slice(0, 10);
  }, [locations]);

  // Cluster nearby locations based on zoom level
  const clusteredLocations = useMemo(() => {
    // Distance threshold in degrees — shrinks as zoom increases
    const threshold = 15 / position.zoom;
    const used = new Array(locations.length).fill(false);
    const clusters: (LocationStat & { count: number })[] = [];

    for (let i = 0; i < locations.length; i++) {
      if (used[i]) continue;
      used[i] = true;

      const group = [locations[i]];
      for (let j = i + 1; j < locations.length; j++) {
        if (used[j]) continue;
        const dLat = locations[i].lat - locations[j].lat;
        const dLng = locations[i].lng - locations[j].lng;
        if (Math.sqrt(dLat * dLat + dLng * dLng) < threshold) {
          used[j] = true;
          group.push(locations[j]);
        }
      }

      // Merge group into a single cluster
      const totalVisits = group.reduce((s, l) => s + l.totalVisits, 0);
      const uniqueVisitors = group.reduce((s, l) => s + l.uniqueVisitors, 0);
      const avgLat = group.reduce((s, l) => s + l.lat, 0) / group.length;
      const avgLng = group.reduce((s, l) => s + l.lng, 0) / group.length;
      const label = group.length === 1
        ? `${group[0].city}, ${group[0].country}`
        : `${group.length} locations`;
      clusters.push({ lat: avgLat, lng: avgLng, city: label, country: '', totalVisits, uniqueVisitors, count: group.length });
    }
    return clusters;
  }, [locations, position.zoom]);

  const mapRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = mapRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setPosition((pos) => {
        const factor = e.deltaY < 0 ? 1.2 : 1 / 1.2;
        const newZoom = Math.min(MAX_ZOOM, Math.max(1, pos.zoom * factor));
        return { ...pos, zoom: newZoom };
      });
    };

    let lastPinchDist = 0;
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        lastPinchDist = Math.sqrt(dx * dx + dy * dy);
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (lastPinchDist > 0) {
          const scale = dist / lastPinchDist;
          setPosition((pos) => ({
            ...pos,
            zoom: Math.min(MAX_ZOOM, Math.max(1, pos.zoom * scale)),
          }));
        }
        lastPinchDist = dist;
      }
    };
    const onTouchEnd = () => { lastPinchDist = 0; };

    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);
    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  if (!authed) {
    return (
      <MantineProvider forceColorScheme="dark">
        <Container size="xs" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
          <Paper p="xl" radius="md" style={{ width: '100%', backgroundColor: '#141414', border: '1px solid #2a2a2a' }}>
            <Stack gap="md" align="center">
              <IconLock size={48} style={{ color: '#7c3aed' }} />
              <Title order={3} style={{ color: '#ededed' }}>Insights</Title>
              <TextInput
                placeholder="Admin password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.currentTarget.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                style={{ width: '100%' }}
              />
              {authError && (
                <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light" style={{ width: '100%' }}>
                  {authError}
                </Alert>
              )}
              <Button onClick={handleLogin} loading={loading} fullWidth color="violet">
                Authenticate
              </Button>
            </Stack>
          </Paper>
        </Container>
      </MantineProvider>
    );
  }

  return (
    <MantineProvider forceColorScheme="dark">
      <Container size="xl" py="xl" style={{ minHeight: '100vh', backgroundColor: '#0a0a0a' }}>
        <Stack gap="lg">
          <Group justify="space-between" align="center">
            <Group>
              <Button variant="subtle" color="gray" onClick={() => router.push('/admin/visitors')} leftSection={<IconArrowLeft size={16} />}>
                Logs
              </Button>
              <Title order={2} style={{ color: '#ededed' }}>Map Insights</Title>
            </Group>
            <Group gap="xs">
              <Text size="sm" c="dimmed">Time Range:</Text>
              <Select
                data={[
                  { value: '1h', label: 'Last 1 Hour' },
                  { value: '24h', label: 'Last 24 Hours' },
                  { value: '3d', label: 'Last 3 Days' },
                  { value: '7d', label: 'Last 7 Days' },
                  { value: '30d', label: 'Last 30 Days' },
                  { value: 'all', label: 'All Time' },
                ]}
                value={timeRange}
                onChange={(v) => setTimeRange(v || 'all')}
                style={{ width: 160 }}
              />
            </Group>
          </Group>

          <Group align="flex-start" style={{ display: 'flex' }}>
            {/* Map Container */}
            <Paper p="md" radius="md" style={{ backgroundColor: '#141414', border: '1px solid #2a2a2a', flex: 3, position: 'relative', overflow: 'hidden' }}>
              {loading && locations.length === 0 ? (
                <Group justify="center" align="center" style={{ minHeight: 400 }}>
                  <Loader color="violet" />
                </Group>
              ) : (
                <div ref={mapRef} style={{ width: '100%', minHeight: 400, position: 'relative' }}>
                  <Group style={{ position: 'absolute', top: 10, right: 10, zIndex: 10 }}>
                    <Button.Group orientation="vertical">
                      <Button variant="default" size="xs" p={4} onClick={handleZoomIn}><IconPlus size={16} /></Button>
                      <Button variant="default" size="xs" p={4} onClick={handleZoomOut}><IconMinus size={16} /></Button>
                    </Button.Group>
                  </Group>
                  <ComposableMap projection="geoMercator" projectionConfig={{ scale: 120 }} style={{ backgroundColor: '#0d1117' }}>
                    <defs>
                      <radialGradient id="dotGlow">
                        <stop offset="0%" stopColor="#a855f7" stopOpacity={0.6} />
                        <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
                      </radialGradient>
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="2" result="blur" />
                        <feMerge>
                          <feMergeNode in="blur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>
                    <ZoomableGroup
                      zoom={position.zoom}
                      center={position.coordinates as [number, number]}
                      onMoveEnd={handleMoveEnd}
                    >
                      <Geographies geography={geoUrl}>
                        {({ geographies }) =>
                          geographies.map((geo) => (
                            <Geography
                              key={geo.rsmKey}
                              geography={geo}
                              fill="#1a1f2e"
                              stroke="#2d3548"
                              strokeWidth={0.5 / position.zoom}
                              style={{
                                default: { outline: "none" },
                                hover: { fill: "#232940", outline: "none" },
                                pressed: { fill: "#2a3150", outline: "none" },
                              }}
                            />
                          ))
                        }
                      </Geographies>
                      <Geographies geography={usStatesUrl}>
                        {({ geographies }) =>
                          geographies.map((geo) => (
                            <Geography
                              key={geo.rsmKey}
                              geography={geo}
                              fill="none"
                              stroke="#2d3548"
                              strokeWidth={0.3 / position.zoom}
                              style={{
                                default: { outline: "none" },
                                hover: { outline: "none" },
                                pressed: { outline: "none" },
                              }}
                            />
                          ))
                        }
                      </Geographies>
                      {CITIES.filter((c) => position.zoom >= c.minZoom).map((city) => (
                        <Marker key={city.name} coordinates={[city.lng, city.lat]}>
                          <circle r={0.8 / position.zoom} fill="#999" />
                          <text
                            textAnchor="middle"
                            y={-2.5 / position.zoom}
                            style={{
                              fontSize: `${Math.max(1.5, 3.5 / position.zoom)}px`,
                              fill: '#aaa',
                              fontFamily: 'sans-serif',
                              pointerEvents: 'none',
                              userSelect: 'none',
                              textShadow: '0 0 3px #000, 0 0 6px #000',
                            }}
                          >
                            {city.name}
                          </text>
                        </Marker>
                      ))}
                      {clusteredLocations.map((loc, i) => {
                        // Scale radius by number of locations in cluster
                        const baseRadius = Math.max(3, Math.min(18, 3 + Math.sqrt(loc.count) * 3));
                        const radius = baseRadius / position.zoom;
                        const glowRadius = radius * 2.5;
                        const tooltipLabel = loc.country
                          ? `${loc.city}, ${loc.country} — ${loc.totalVisits} visits (${loc.uniqueVisitors} unique)`
                          : `${loc.city} — ${loc.totalVisits} visits (${loc.uniqueVisitors} unique)`;
                        return (
                          <Marker key={i} coordinates={[loc.lng, loc.lat]}>
                            <Tooltip label={tooltipLabel} withArrow position="top">
                              <g
                                style={{ cursor: 'pointer' }}
                                onClick={() => {
                                  setPosition((pos) => ({
                                    coordinates: [loc.lng, loc.lat],
                                    zoom: Math.min(MAX_ZOOM, pos.zoom * 3),
                                  }));
                                }}
                              >
                                <circle r={glowRadius} fill="url(#dotGlow)" />
                                <circle
                                  r={radius}
                                  fill="#a855f7"
                                  fillOpacity={0.85}
                                  stroke="#c084fc"
                                  strokeWidth={0.4 / position.zoom}
                                />
                              </g>
                            </Tooltip>
                          </Marker>
                        );
                      })}
                    </ZoomableGroup>
                  </ComposableMap>
                </div>
              )}
            </Paper>

            {/* Sidebar with top locations */}
            <Paper p="md" radius="md" style={{ backgroundColor: '#141414', border: '1px solid #2a2a2a', flex: 1, minHeight: 400 }}>
              <Title order={4} mb="md" style={{ color: '#ededed' }}>Most Visited</Title>
              {locations.length === 0 && !loading ? (
                <Text c="dimmed" size="sm">No data for this time period.</Text>
              ) : (
                <Stack gap="sm">
                  {topLocations.map((loc, i) => (
                    <Paper key={i} p="xs" radius="sm" style={{ backgroundColor: '#0a0a0a', border: '1px solid #2a2a2a' }}>
                      <Group justify="space-between" wrap="nowrap">
                        <Group gap="xs" wrap="nowrap" style={{ overflow: 'hidden' }}>
                          <IconMapPin size={16} style={{ color: '#7c3aed', flexShrink: 0 }} />
                          <Text size="sm" truncate title={`${loc.city}, ${loc.country}`}>
                            {loc.city}, {loc.country}
                          </Text>
                        </Group>
                        <Group gap="xs" wrap="nowrap">
                          <Text size="sm" fw={700} c="violet">{loc.totalVisits}</Text>
                        </Group>
                      </Group>
                    </Paper>
                  ))}
                </Stack>
              )}
            </Paper>
          </Group>
        </Stack>
      </Container>
    </MantineProvider>
  );
}
