'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  MantineProvider,
  Text,
  TextInput,
  Button,
  Table,
  Paper,
  Group,
  Stack,
  Badge,
  Title,
  Loader,
  Alert,
  Select,
  Container,
  Tooltip,
  ActionIcon,
} from '@mantine/core';
import { IconLock, IconAlertCircle, IconEye, IconUsers, IconRoute, IconClock, IconRefresh, IconCopy, IconMapPin } from '@tabler/icons-react';

interface VisitorEntry {
  type?: string;
  ip?: string;
  timestamp: string;
  path: string;
  user_agent?: string;
  referer?: string | null;
  duration_seconds?: number;
  screen?: string;
  language?: string;
}

const formatDuration = (seconds?: number) => {
  if (typeof seconds !== 'number' || isNaN(seconds)) return '—';
  if (seconds >= 180) return `${Math.round(seconds / 60)}m`;
  return `${seconds}s`;
};

export default function AdminVisitorsPage() {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState<VisitorEntry[]>([]);
  const [dates, setDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState<string>('50');
  const [geoCache, setGeoCache] = useState<Record<string, { city: string; region: string; country_name: string; country_code: string; org: string; asn?: string; timezone: string; latitude: number; longitude: number; zip?: string }>>({});
  const [geoErrors, setGeoErrors] = useState<Array<{ ip: string; status: number; reason: string; timestamp: string }>>([]);
  const [filterIp, setFilterIp] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterPath, setFilterPath] = useState('');
  const [filterReferrer, setFilterReferrer] = useState('');
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const fetchDates = async (pwd: string) => {
    const res = await fetch('/api/admin/visitors?dates=list', {
      headers: { Authorization: `Bearer ${pwd}` },
    });
    if (res.ok) {
      const data = await res.json();
      setDates(data.dates || []);
    }
    // Also refresh geo cache
    const geoRes = await fetch('/api/admin/visitors?geo=cache', {
      headers: { Authorization: `Bearer ${pwd}` },
    });
    if (geoRes.ok) {
      const geoData = await geoRes.json();
      setGeoCache(geoData.geo || {});
      setGeoErrors(geoData.errors || []);
    }
  };

  const fetchLogs = async (date: string, pwd?: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/visitors?date=${date}`, {
        headers: { Authorization: `Bearer ${pwd || password}` },
      });
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setAuthError('');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/visitors?dates=list', {
        headers: { Authorization: `Bearer ${password}` },
      });
      if (res.ok) {
        setAuthed(true);
        const data = await res.json();
        const availableDates = data.dates || [];
        setDates(availableDates);

        // Also fetch the geo cache on initial login
        const geoRes = await fetch('/api/admin/visitors?geo=cache', {
          headers: { Authorization: `Bearer ${password}` },
        });
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          setGeoCache(geoData.geo || {});
          setGeoErrors(geoData.errors || []);
        }

        if (availableDates.length > 0) {
          const latest = availableDates[0];
          setSelectedDate(latest);
          await fetchLogs(latest, password);
        }
      } else {
        setAuthError('Invalid password');
      }
    } catch {
      setAuthError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authed && selectedDate) {
      fetchLogs(selectedDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  // Split entries by type
  const pageViews = useMemo(() => entries.filter((e) => !e.type || e.type !== 'duration'), [entries]);
  const durations = useMemo(() => entries.filter((e) => e.type === 'duration'), [entries]);

  // Combine views and durations for a cleaner table UI
  const displayEntries = useMemo(() => {
    const sorted = [...entries].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const processed: VisitorEntry[] = [];
    const pendingViews = new Map<string, VisitorEntry>();

    for (const entry of sorted) {
      if (entry.type === 'view' || !entry.type) {
        const key = `${entry.ip}|${entry.path}`;
        if (pendingViews.has(key)) {
          processed.push(pendingViews.get(key)!);
        }
        pendingViews.set(key, { ...entry, type: 'view' });
      } else if (entry.type === 'duration') {
        const key = `${entry.ip}|${entry.path}`;
        if (pendingViews.has(key)) {
          const view = pendingViews.get(key)!;
          // Apply the duration to the matching view
          view.duration_seconds = entry.duration_seconds;
          processed.push(view);
          pendingViews.delete(key);
        }
        // If orphaned duration (view was likely yesterday), we just ignore it for cleanliness
      } else {
        processed.push(entry);
      }
    }

    // Add remaining views that haven't received a leave event yet
    for (const view of pendingViews.values()) {
      processed.push(view);
    }

    let result = processed.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (filterIp) {
      result = result.filter((e) => e.ip && e.ip.includes(filterIp));
    }
    if (filterPath) {
      result = result.filter((e) => e.path.toLowerCase().includes(filterPath.toLowerCase()));
    }
    if (filterReferrer) {
      result = result.filter((e) => e.referer && e.referer.toLowerCase().includes(filterReferrer.toLowerCase()));
    }
    if (filterLocation) {
      const locLower = filterLocation.toLowerCase();
      result = result.filter((e) => {
        if (!e.ip || !geoCache[e.ip]) return false;
        const geo = geoCache[e.ip];
        const matchStr = `${geo.city} ${geo.region} ${geo.country_name} ${geo.country_code}`.toLowerCase();
        return matchStr.includes(locLower);
      });
    }

    return result;
  }, [entries, filterIp, filterPath, filterLocation, filterReferrer, geoCache]);

  // Summary stats
  const stats = useMemo(() => {
    const uniqueIps = new Set(pageViews.filter((e) => e.ip).map((e) => e.ip)).size;
    const pathCounts: Record<string, number> = {};
    pageViews.forEach((e) => {
      pathCounts[e.path] = (pathCounts[e.path] || 0) + 1;
    });
    const topPaths = Object.entries(pathCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Avg duration from duration events
    const durEntries = durations.filter((e) => e.duration_seconds && e.duration_seconds > 0);
    const avgDuration = durEntries.length > 0
      ? Math.round(durEntries.reduce((sum, e) => sum + (e.duration_seconds || 0), 0) / durEntries.length)
      : 0;

    return { total: pageViews.length, uniqueIps, topPaths, avgDuration };
  }, [pageViews, durations]);

  // Login screen
  if (!authed) {
    return (
      <MantineProvider forceColorScheme="dark">
        <Container size="xs" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Paper
            p="xl"
            radius="md"
            style={{
              width: '100%',
              maxWidth: 400,
              backgroundColor: '#141414',
              border: '1px solid #2a2a2a',
            }}
          >
            <Stack gap="md" align="center">
              <IconLock size={48} style={{ color: '#7c3aed' }} />
              <Title order={3} style={{ color: '#ededed' }}>
                Visitor Logs
              </Title>
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

  // Dashboard
  return (
    <MantineProvider forceColorScheme="dark">
      <Container size="lg" py="xl" style={{ minHeight: '100vh', backgroundColor: '#0a0a0a' }}>
        <Stack gap="lg">
          <Group justify="space-between" align="center">
            <Group>
              <Title order={2} style={{ color: '#ededed' }}>
                Visitor Logs
              </Title>
              <Button ml="md" variant="light" color="violet" onClick={() => window.location.href = '/admin/insights'}>
                View Map Insights
              </Button>
            </Group>
            <Group gap="xs">
              <Select
                placeholder="Select date"
                data={dates.map((d) => ({ value: d, label: d }))}
                value={selectedDate}
                onChange={setSelectedDate}
                style={{ width: 200 }}
              />
              <Tooltip label="Refresh">
                <Button
                  variant="subtle"
                  color="gray"
                  size="sm"
                  onClick={() => { if (selectedDate) fetchLogs(selectedDate); fetchDates(password); }}
                  loading={loading}
                  style={{ padding: '6px' }}
                >
                  <IconRefresh size={18} />
                </Button>
              </Tooltip>
            </Group>
          </Group>

          {/* Geo Error Banner */}
          {geoErrors.length > 0 && (
            <Alert icon={<IconAlertCircle size={16} />} title="Geolocation API Error" color="red" variant="light">
              We encountered {geoErrors.length} recent error{geoErrors.length === 1 ? '' : 's'} reaching the ipapi.co geolocation service.
              {' '}Most recent error: <strong>{geoErrors[geoErrors.length - 1].reason}</strong> (IP: {geoErrors[geoErrors.length - 1].ip})
            </Alert>
          )}

          {/* Stats cards */}
          <Group gap="md">
            <Paper
              p="md"
              radius="md"
              style={{ backgroundColor: '#141414', border: '1px solid #2a2a2a', flex: 1 }}
            >
              <Group gap="xs">
                <IconEye size={20} style={{ color: '#7c3aed' }} />
                <Text size="sm" c="dimmed">Total Visits</Text>
              </Group>
              <Text size="xl" fw={700} mt={4}>{stats.total}</Text>
            </Paper>
            <Paper
              p="md"
              radius="md"
              style={{ backgroundColor: '#141414', border: '1px solid #2a2a2a', flex: 1 }}
            >
              <Group gap="xs">
                <IconUsers size={20} style={{ color: '#2563eb' }} />
                <Text size="sm" c="dimmed">Unique IPs</Text>
              </Group>
              <Text size="xl" fw={700} mt={4}>{stats.uniqueIps}</Text>
            </Paper>
            <Paper
              p="md"
              radius="md"
              style={{ backgroundColor: '#141414', border: '1px solid #2a2a2a', flex: 1 }}
            >
              <Group gap="xs">
                <IconRoute size={20} style={{ color: '#059669' }} />
                <Text size="sm" c="dimmed">Top Path</Text>
              </Group>
              <Text size="xl" fw={700} mt={4} truncate>
                {stats.topPaths[0]?.[0] || '—'}
              </Text>
            </Paper>
            <Paper
              p="md"
              radius="md"
              style={{ backgroundColor: '#141414', border: '1px solid #2a2a2a', flex: 1 }}
            >
              <Group gap="xs">
                <IconClock size={20} style={{ color: '#d97706' }} />
                <Text size="sm" c="dimmed">Avg Duration</Text>
              </Group>
              <Text size="xl" fw={700} mt={4}>{formatDuration(stats.avgDuration)}</Text>
            </Paper>
          </Group>

          {/* Top paths breakdown */}
          {stats.topPaths.length > 0 && (
            <Paper p="md" radius="md" style={{ backgroundColor: '#141414', border: '1px solid #2a2a2a' }}>
              <Text fw={600} mb="sm">Top Paths</Text>
              <Group gap="xs" wrap="wrap">
                {stats.topPaths.map(([path, count]) => (
                  <Badge key={path} variant="light" color="violet" size="lg">
                    {path} ({count})
                  </Badge>
                ))}
              </Group>
            </Paper>
          )}

          {/* Filters */}
          <Paper p="md" radius="md" style={{ backgroundColor: '#141414', border: '1px solid #2a2a2a' }}>
            <Group grow>
              <TextInput
                placeholder="Filter by IP..."
                value={filterIp}
                onChange={(e) => setFilterIp(e.currentTarget.value)}
              />
              <TextInput
                placeholder="Filter by Location..."
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.currentTarget.value)}
              />
              <TextInput
                placeholder="Filter by Path..."
                value={filterPath}
                onChange={(e) => setFilterPath(e.currentTarget.value)}
              />
              <TextInput
                placeholder="Filter by Referrer..."
                value={filterReferrer}
                onChange={(e) => setFilterReferrer(e.currentTarget.value)}
              />
            </Group>
          </Paper>

          {/* Log table */}
          <Paper p="md" radius="md" style={{ backgroundColor: '#141414', border: '1px solid #2a2a2a' }}>
            <Group justify="space-between" mb="sm">
              <Text size="sm" c="dimmed">
                {entries.length} entries total
              </Text>
              <Group gap="xs" align="center">
                <Text size="sm" c="dimmed">Show:</Text>
                <Select
                  data={[
                    { value: '10', label: '10' },
                    { value: '25', label: '25' },
                    { value: '50', label: '50' },
                    { value: '100', label: '100' },
                    { value: '500', label: '500' },
                    { value: 'all', label: 'All' },
                  ]}
                  value={pageSize}
                  onChange={(v) => setPageSize(v || '50')}
                  style={{ width: 80 }}
                  size="xs"
                />
              </Group>
            </Group>
            {loading ? (
              <Group justify="center" py="xl">
                <Loader color="violet" />
              </Group>
            ) : entries.length === 0 ? (
              <Text c="dimmed" ta="center" py="xl">No visitor data for this date.</Text>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th style={{ minWidth: 60 }}>Type</Table.Th>
                      <Table.Th>Time</Table.Th>
                      <Table.Th>IP</Table.Th>
                      <Table.Th>Location</Table.Th>
                      <Table.Th>Path</Table.Th>
                      <Table.Th>Duration</Table.Th>
                      <Table.Th style={{ width: 40 }}></Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {displayEntries
                      .slice(0, pageSize === 'all' ? undefined : parseInt(pageSize))
                      .map((entry, i) => (
                        <React.Fragment key={i}>
                          <Table.Tr onClick={() => setExpandedRow(expandedRow === i ? null : i)} style={{ cursor: 'pointer' }}>
                            <Table.Td style={{ minWidth: 80 }}>
                              <Badge size="sm" color={entry.type === 'duration' ? 'orange' : 'blue'} variant="light" w={65} style={{ textAlign: 'center' }}>
                                {entry.type === 'duration' ? 'LEAVE' : 'VIEW'}
                              </Badge>
                            </Table.Td>
                            <Table.Td style={{ whiteSpace: 'nowrap' }}>
                              {new Date(entry.timestamp).toLocaleTimeString()}
                            </Table.Td>
                            <Table.Td>
                              <code style={{ fontSize: '0.85em' }}>{entry.ip || '—'}</code>
                            </Table.Td>
                            <Table.Td>
                              {entry.ip && geoCache[entry.ip] ? (
                                <Tooltip label={`${geoCache[entry.ip].city}, ${geoCache[entry.ip].country_name} • ${geoCache[entry.ip].org}`}>
                                  <Group gap={4} style={{ cursor: 'help' }}>
                                    <IconMapPin size={12} style={{ color: '#059669' }} />
                                    <Text size="xs">{geoCache[entry.ip].city}, {geoCache[entry.ip].country_code}</Text>
                                  </Group>
                                </Tooltip>
                              ) : (
                                <Text size="xs" c="dimmed">—</Text>
                              )}
                            </Table.Td>
                            <Table.Td>
                              <Tooltip label={entry.path} multiline maw={400}>
                                <Text size="xs" lineClamp={1} style={{ maxWidth: 200 }}>{entry.path}</Text>
                              </Tooltip>
                            </Table.Td>
                            <Table.Td>
                              {formatDuration(entry.duration_seconds)}
                            </Table.Td>
                            <Table.Td>
                              <Tooltip label="Copy entry">
                                <ActionIcon
                                  variant="subtle"
                                  color="gray"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(JSON.stringify(entry, null, 2));
                                  }}
                                >
                                  <IconCopy size={14} />
                                </ActionIcon>
                              </Tooltip>
                            </Table.Td>
                          </Table.Tr>
                          {expandedRow === i && (
                            <Table.Tr style={{ backgroundColor: '#111111' }}>
                              <Table.Td colSpan={7} style={{ padding: 'xs' }}>
                                <Paper p="sm" radius="sm" style={{ backgroundColor: '#0a0a0a', border: '1px solid #2a2a2a' }}>
                                  <Group align="flex-start" gap="xl">
                                    <Stack gap="xs" style={{ minWidth: 300 }}>
                                      <Text size="sm" fw={600} c="dimmed">Device Information</Text>
                                      <Group gap="xs"><Text size="xs" c="dimmed" w={80}>Screen:</Text><Text size="xs">{entry.screen || '—'}</Text></Group>
                                      <Group gap="xs"><Text size="xs" c="dimmed" w={80}>Language:</Text><Text size="xs">{entry.language || '—'}</Text></Group>
                                      <Group gap="xs"><Text size="xs" c="dimmed" w={80}>Referer:</Text><Text size="xs" style={{ wordBreak: 'break-all' }}>{entry.referer || '—'}</Text></Group>
                                      <Group gap="xs"><Text size="xs" c="dimmed" w={80}>User Agent:</Text><Text size="xs" style={{ wordBreak: 'break-all' }}>{entry.user_agent || '—'}</Text></Group>
                                    </Stack>
                                    {entry.ip && geoCache[entry.ip] && (
                                      <Stack gap="xs" style={{ minWidth: 250 }}>
                                        <Text size="sm" fw={600} c="dimmed">Geolocation</Text>
                                        <Group gap="xs"><Text size="xs" c="dimmed" w={80}>Location:</Text><Text size="xs">{geoCache[entry.ip].city}, {geoCache[entry.ip].region}</Text></Group>
                                        <Group gap="xs"><Text size="xs" c="dimmed" w={80}>Country:</Text><Text size="xs">{geoCache[entry.ip].country_name}</Text></Group>
                                        {geoCache[entry.ip].zip && <Group gap="xs"><Text size="xs" c="dimmed" w={80}>Postal:</Text><Text size="xs">{geoCache[entry.ip].zip}</Text></Group>}
                                        <Group gap="xs"><Text size="xs" c="dimmed" w={80}>Coordinates:</Text><Text size="xs">{geoCache[entry.ip].latitude}, {geoCache[entry.ip].longitude}</Text></Group>
                                        <Group gap="xs"><Text size="xs" c="dimmed" w={80}>Timezone:</Text><Text size="xs">{geoCache[entry.ip].timezone}</Text></Group>
                                        <Group gap="xs"><Text size="xs" c="dimmed" w={80}>ISP/Org:</Text><Text size="xs">{geoCache[entry.ip].org}</Text></Group>
                                        {geoCache[entry.ip].asn && <Group gap="xs"><Text size="xs" c="dimmed" w={80}>ASN:</Text><Text size="xs">{geoCache[entry.ip].asn}</Text></Group>}
                                      </Stack>
                                    )}
                                  </Group>
                                </Paper>
                              </Table.Td>
                            </Table.Tr>
                          )}
                        </React.Fragment>
                      ))}
                  </Table.Tbody>
                </Table>
              </div>
            )}
          </Paper>
        </Stack>
      </Container>
    </MantineProvider>
  );
}
