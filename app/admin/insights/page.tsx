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

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

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

  const handleZoomIn = () => {
    if (position.zoom >= 100) return;
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

  // Find max visits for circle scaling
  const maxVisits = useMemo(() => {
    return Math.max(...locations.map(l => l.totalVisits), 1);
  }, [locations]);

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
                <div style={{ width: '100%', minHeight: 400, position: 'relative' }}>
                  <Group style={{ position: 'absolute', top: 10, right: 10, zIndex: 10 }}>
                    <Button.Group orientation="vertical">
                      <Button variant="default" size="xs" p={4} onClick={handleZoomIn}><IconPlus size={16} /></Button>
                      <Button variant="default" size="xs" p={4} onClick={handleZoomOut}><IconMinus size={16} /></Button>
                    </Button.Group>
                  </Group>
                  <ComposableMap projection="geoMercator" projectionConfig={{ scale: 120 }}>
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
                              fill="#2a2a2a"
                              stroke="#141414"
                              strokeWidth={0.5 / position.zoom} // Keep borders thin on zoom
                              style={{
                                default: { outline: "none" },
                                hover: { fill: "#3a3a3a", outline: "none" },
                                pressed: { fill: "#4a4a4a", outline: "none" },
                              }}
                            />
                          ))
                        }
                      </Geographies>
                      {locations.map((loc, i) => {
                        const baseRadius = Math.max(4, Math.min(20, (loc.totalVisits / maxVisits) * 20));
                        // scale down the dot as user zooms in to make overlapping dots clearer
                        const radius = baseRadius / (position.zoom * 0.7);
                        return (
                          <Marker key={i} coordinates={[loc.lng, loc.lat]}>
                            <Tooltip label={`${loc.city}, ${loc.country} - ${loc.totalVisits} visits (${loc.uniqueVisitors} unique)`} withArrow position="top">
                              <circle r={radius} fill="#7c3aed" fillOpacity={0.7} stroke="#fff" strokeWidth={1 / position.zoom} style={{ cursor: 'pointer', transition: 'all 0.3s ease' }} />
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
