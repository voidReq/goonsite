'use client';

import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import {
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
  ActionIcon,
  Container,
  Tooltip,
} from '@mantine/core';
import {
  IconAlertCircle, IconEye, IconUsers, IconRoute, IconClock, IconRefresh,
  IconCopy, IconMapPin, IconChevronLeft, IconChevronRight, IconDownload, IconChartHistogram,
} from '@tabler/icons-react';
import type { RangePreset } from '@/lib/analytics';
import { AdminLogin } from '../_components/AdminLogin';
import { CONTENT_MIN_HEIGHT, formatExact } from '../_components/theme';
import { useChartTheme } from '../_components/useChartTheme';

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

interface GeoRecord {
  city: string;
  region: string;
  country_name: string;
  country_code: string;
  org: string;
  asn?: string;
  timezone: string;
  latitude: number;
  longitude: number;
  zip?: string;
}

const PERIOD_OPTIONS = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'quarter', label: 'Quarter' },
  { value: 'year', label: 'Year' },
  { value: 'all', label: 'All time' },
];

const NAVIGABLE = new Set(['day', 'week', 'month', 'quarter', 'year']);

const formatDuration = (seconds?: number) => {
  if (typeof seconds !== 'number' || isNaN(seconds)) return '—';
  if (seconds >= 180) return `${Math.round(seconds / 60)}m`;
  return `${seconds}s`;
};

export default function AdminVisitorsPage() {
  const t = useChartTheme();
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [entries, setEntries] = useState<VisitorEntry[]>([]);
  const [meta, setMeta] = useState<{ label: string; totalCount: number; truncated: boolean; atLatest: boolean; timezone: string } | null>(null);
  const [dates, setDates] = useState<string[]>([]);

  const [period, setPeriod] = useState<RangePreset>('day');
  const [offset, setOffset] = useState(0);
  const [pageSize, setPageSize] = useState<string>('50');

  const [geoCache, setGeoCache] = useState<Record<string, GeoRecord>>({});
  const [geoErrors, setGeoErrors] = useState<Array<{ ip: string; status: number; reason: string; timestamp: string }>>([]);

  const [filterIp, setFilterIp] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterPath, setFilterPath] = useState('');
  const [filterReferrer, setFilterReferrer] = useState('');
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const pwdRef = useRef('');

  const fetchGeo = useCallback(async (pwd: string) => {
    const res = await fetch('/api/admin/visitors?geo=cache', { headers: { Authorization: `Bearer ${pwd}` } });
    if (!res.ok) return;
    const data = await res.json();
    setGeoCache(data.geo || {});
    setGeoErrors(data.errors || []);
  }, []);

  const fetchLogs = useCallback(async (pwd?: string) => {
    const token = pwd ?? pwdRef.current;
    if (!token) return false;

    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ period, offset: String(offset) });
      const res = await fetch(`/api/admin/visitors?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        setAuthError('Invalid password');
        setAuthed(false);
        return false;
      }
      if (!res.ok) {
        setError(`Failed to load logs (${res.status})`);
        return false;
      }

      const data = await res.json();
      pwdRef.current = token;
      setEntries(data.entries || []);
      setMeta({
        label: data.label ?? 'All time',
        totalCount: data.totalCount ?? data.count ?? 0,
        truncated: !!data.truncated,
        atLatest: data.atLatest ?? true,
        timezone: data.timezone ?? 'UTC',
      });
      setExpandedRow(null);
      return true;
    } catch {
      setError('Connection error — could not reach the server.');
      return false;
    } finally {
      setLoading(false);
    }
  }, [period, offset]);

  const handleLogin = async () => {
    setAuthError('');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/visitors?dates=list', {
        headers: { Authorization: `Bearer ${password}` },
      });
      if (!res.ok) {
        setAuthError(res.status === 429 ? 'Too many attempts. Try again shortly.' : 'Invalid password');
        return;
      }
      const data = await res.json();
      setDates(data.dates || []);
      pwdRef.current = password;
      setAuthed(true);
      await Promise.all([fetchGeo(password), fetchLogs(password)]);
    } catch {
      setAuthError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authed) fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, offset, authed]);

  const changePeriod = (next: RangePreset) => {
    setPeriod(next);
    setOffset(0);
  };

  /** Jump straight to a specific log date via the day-offset. */
  const jumpToDate = (date: string | null) => {
    if (!date) return;
    const today = new Date();
    const todayKey = new Intl.DateTimeFormat('en-CA', {
      timeZone: meta?.timezone || 'America/Los_Angeles',
      year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(today);
    const days = Math.round(
      (Date.parse(`${todayKey}T00:00:00Z`) - Date.parse(`${date}T00:00:00Z`)) / 86_400_000,
    );
    setPeriod('day');
    setOffset(Math.max(0, days));
  };

  // Split entries by type
  const pageViews = useMemo(() => entries.filter((e) => !e.type || e.type !== 'duration'), [entries]);
  const durations = useMemo(() => entries.filter((e) => e.type === 'duration'), [entries]);

  /** True once the window spans more than one calendar day. */
  const multiDay = period !== 'day';

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

  /** Export the currently filtered rows, so a CSV matches what's on screen. */
  const exportCsv = () => {
    const header = ['timestamp', 'type', 'ip', 'city', 'region', 'country', 'path', 'duration_seconds', 'referer', 'screen', 'language', 'user_agent'];
    const escape = (v: unknown) => {
      const s = v === null || v === undefined ? '' : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const rows = displayEntries.map((e) => {
      const geo = e.ip ? geoCache[e.ip] : undefined;
      return [
        e.timestamp, e.type ?? 'view', e.ip ?? '',
        geo?.city ?? '', geo?.region ?? '', geo?.country_name ?? '',
        e.path, e.duration_seconds ?? '', e.referer ?? '', e.screen ?? '', e.language ?? '', e.user_agent ?? '',
      ].map(escape).join(',');
    });

    const blob = new Blob([[header.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `visitors-${period}-${offset}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!authed) {
    return (
      <AdminLogin
        title="Visitor Logs"
        password={password}
        onPasswordChange={setPassword}
        onSubmit={handleLogin}
        error={authError}
        loading={loading}
      />
    );
  }

  const navigable = NAVIGABLE.has(period);

  return (
    <Container size="lg" py="xl" style={{ minHeight: CONTENT_MIN_HEIGHT, backgroundColor: t.page }}>
        <Stack gap="lg">
          <Group justify="space-between" align="center" wrap="wrap">
            <Group>
              <Title order={2} style={{ color: t.ink }}>Visitor Logs</Title>
              <Button
                variant="light" color="violet" size="sm"
                leftSection={<IconChartHistogram size={16} />}
                onClick={() => { window.location.href = '/admin/insights'; }}
              >
                Insights
              </Button>
            </Group>
            <Group gap="xs" wrap="nowrap">
              <Select
                data={PERIOD_OPTIONS}
                value={period}
                onChange={(v) => v && changePeriod(v as RangePreset)}
                style={{ width: 116 }}
                size="xs"
                allowDeselect={false}
                aria-label="Period"
              />
              <ActionIcon.Group>
                <Tooltip label={navigable ? `Previous ${period}` : 'Not navigable'} withArrow>
                  <ActionIcon
                    variant="default" size="sm" disabled={!navigable}
                    onClick={() => setOffset(offset + 1)} aria-label="Previous period"
                  >
                    <IconChevronLeft size={14} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label={meta?.atLatest ? 'Already at the latest period' : `Next ${period}`} withArrow>
                  <ActionIcon
                    variant="default" size="sm" disabled={!navigable || (meta?.atLatest ?? true)}
                    onClick={() => setOffset(Math.max(0, offset - 1))} aria-label="Next period"
                  >
                    <IconChevronRight size={14} />
                  </ActionIcon>
                </Tooltip>
              </ActionIcon.Group>
              <Text size="sm" fw={600} style={{ minWidth: 118 }}>{meta?.label ?? '—'}</Text>
              <Select
                placeholder="Jump to date"
                data={dates.map((d) => ({ value: d, label: d }))}
                value={null}
                onChange={jumpToDate}
                style={{ width: 148 }}
                size="xs"
                searchable
                clearable
                aria-label="Jump to a specific date"
              />
              <Tooltip label="Refresh">
                <ActionIcon
                  variant="default" size="sm" loading={loading}
                  onClick={() => { fetchLogs(); fetchGeo(pwdRef.current); }}
                  aria-label="Refresh"
                >
                  <IconRefresh size={14} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Group>

          {error && (
            <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">{error}</Alert>
          )}

          {/* Geo Error Banner */}
          {geoErrors.length > 0 && (
            <Alert icon={<IconAlertCircle size={16} />} title="Geolocation API Error" color="red" variant="light">
              We encountered {geoErrors.length} recent error{geoErrors.length === 1 ? '' : 's'} reaching the geolocation service.
              {' '}Most recent error: <strong>{geoErrors[geoErrors.length - 1].reason}</strong> (IP: {geoErrors[geoErrors.length - 1].ip})
            </Alert>
          )}

          {meta?.truncated && (
            <Alert icon={<IconAlertCircle size={16} />} color="yellow" variant="light">
              This period has {formatExact(meta.totalCount)} log entries; only the {formatExact(entries.length)} most
              recent are loaded. Narrow the period, or use Insights for aggregated numbers over the full range.
            </Alert>
          )}

          {/* Stats cards */}
          <Group gap="md">
            {([
              ['Total Visits', stats.total.toLocaleString('en-US'), IconEye, t.series[0]],
              ['Unique IPs', stats.uniqueIps.toLocaleString('en-US'), IconUsers, t.series[2]],
              ['Top Path', stats.topPaths[0]?.[0] || '—', IconRoute, t.series[3]],
              ['Avg Duration', formatDuration(stats.avgDuration), IconClock, t.series[1]],
            ] as const).map(([label, value, Icon, color]) => (
              <Paper
                key={label}
                p="md" radius="md"
                style={{ backgroundColor: t.surface, border: `1px solid ${t.border}`, flex: 1, minWidth: 150 }}
              >
                <Group gap="xs">
                  <Icon size={20} style={{ color }} />
                  <Text size="sm" c="dimmed">{label}</Text>
                </Group>
                <Text size="xl" fw={700} mt={4} truncate>{value}</Text>
              </Paper>
            ))}
          </Group>

          {/* Top paths breakdown */}
          {stats.topPaths.length > 0 && (
            <Paper p="md" radius="md" style={{ backgroundColor: t.surface, border: `1px solid ${t.border}` }}>
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
          <Paper p="md" radius="md" style={{ backgroundColor: t.surface, border: `1px solid ${t.border}` }}>
            <Group grow>
              <TextInput placeholder="Filter by IP..." value={filterIp} onChange={(e) => setFilterIp(e.currentTarget.value)} />
              <TextInput placeholder="Filter by Location..." value={filterLocation} onChange={(e) => setFilterLocation(e.currentTarget.value)} />
              <TextInput placeholder="Filter by Path..." value={filterPath} onChange={(e) => setFilterPath(e.currentTarget.value)} />
              <TextInput placeholder="Filter by Referrer..." value={filterReferrer} onChange={(e) => setFilterReferrer(e.currentTarget.value)} />
            </Group>
          </Paper>

          {/* Log table */}
          <Paper p="md" radius="md" style={{ backgroundColor: t.surface, border: `1px solid ${t.border}` }}>
            <Group justify="space-between" mb="sm" wrap="wrap">
              <Text size="sm" c="dimmed">
                {formatExact(displayEntries.length)} row{displayEntries.length === 1 ? '' : 's'}
                {' · '}{formatExact(entries.length)} raw entries loaded
                {meta && meta.totalCount > entries.length && ` of ${formatExact(meta.totalCount)}`}
              </Text>
              <Group gap="xs" align="center">
                <Tooltip label="Download the filtered rows as CSV">
                  <Button
                    variant="default" size="compact-xs"
                    leftSection={<IconDownload size={13} />}
                    onClick={exportCsv}
                    disabled={displayEntries.length === 0}
                  >
                    CSV
                  </Button>
                </Tooltip>
                <Text size="sm" c="dimmed">Show:</Text>
                <Select
                  data={['10', '25', '50', '100', '500', 'all'].map((v) => ({ value: v, label: v === 'all' ? 'All' : v }))}
                  value={pageSize}
                  onChange={(v) => setPageSize(v || '50')}
                  style={{ width: 80 }}
                  size="xs"
                  allowDeselect={false}
                />
              </Group>
            </Group>
            {loading ? (
              <Group justify="center" py="xl">
                <Loader color="violet" />
              </Group>
            ) : entries.length === 0 ? (
              <Text c="dimmed" ta="center" py="xl">No visitor data for this period.</Text>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th style={{ minWidth: 60 }}>Type</Table.Th>
                      <Table.Th>{multiDay ? 'When' : 'Time'}</Table.Th>
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
                              {/* Over a multi-day window the date matters as much as the clock. */}
                              {multiDay
                                ? new Date(entry.timestamp).toLocaleString(undefined, {
                                    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                                  })
                                : new Date(entry.timestamp).toLocaleTimeString()}
                            </Table.Td>
                            <Table.Td>
                              <code style={{ fontSize: '0.85em' }}>{entry.ip || '—'}</code>
                            </Table.Td>
                            <Table.Td>
                              {entry.ip && geoCache[entry.ip] ? (
                                <Tooltip label={`${geoCache[entry.ip].city}, ${geoCache[entry.ip].country_name} • ${geoCache[entry.ip].org}`}>
                                  <Group gap={4} style={{ cursor: 'help' }}>
                                    <IconMapPin size={12} style={{ color: t.series[3] }} />
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
                            <Table.Tr style={{ backgroundColor: t.surfaceSunken }}>
                              <Table.Td colSpan={7}>
                                <Paper p="sm" radius="sm" style={{ backgroundColor: t.surface, border: `1px solid ${t.border}` }}>
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
  );
}
