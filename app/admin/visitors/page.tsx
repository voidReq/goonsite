'use client';

import { useState, useEffect, useMemo } from 'react';
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
} from '@mantine/core';
import { IconLock, IconAlertCircle, IconEye, IconUsers, IconRoute, IconClock } from '@tabler/icons-react';

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

export default function AdminVisitorsPage() {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState<VisitorEntry[]>([]);
  const [dates, setDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const fetchDates = async (pwd: string) => {
    const res = await fetch('/api/admin/visitors?dates=list', {
      headers: { Authorization: `Bearer ${pwd}` },
    });
    if (res.ok) {
      const data = await res.json();
      setDates(data.dates || []);
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
        <Container size="xs" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
          <Paper
            p="xl"
            radius="md"
            style={{
              width: '100%',
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
            <Title order={2} style={{ color: '#ededed' }}>
              📊 Visitor Logs
            </Title>
            <Select
              placeholder="Select date"
              data={dates.map((d) => ({ value: d, label: d }))}
              value={selectedDate}
              onChange={setSelectedDate}
              style={{ width: 200 }}
            />
          </Group>

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
              <Text size="xl" fw={700} mt={4}>{stats.avgDuration}s</Text>
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

          {/* Log table */}
          <Paper p="md" radius="md" style={{ backgroundColor: '#141414', border: '1px solid #2a2a2a' }}>
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
                      <Table.Th>Type</Table.Th>
                      <Table.Th>Time</Table.Th>
                      <Table.Th>IP</Table.Th>
                      <Table.Th>Path</Table.Th>
                      <Table.Th>Duration</Table.Th>
                      <Table.Th>Screen</Table.Th>
                      <Table.Th>User Agent</Table.Th>
                      <Table.Th>Referer</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {entries.map((entry, i) => (
                      <Table.Tr key={i}>
                        <Table.Td>
                          <Badge size="xs" color={entry.type === 'duration' ? 'orange' : 'blue'} variant="light">
                            {entry.type === 'duration' ? 'leave' : 'view'}
                          </Badge>
                        </Table.Td>
                        <Table.Td style={{ whiteSpace: 'nowrap' }}>
                          {new Date(entry.timestamp).toLocaleTimeString()}
                        </Table.Td>
                        <Table.Td>
                          <code style={{ fontSize: '0.85em' }}>{entry.ip || '—'}</code>
                        </Table.Td>
                        <Table.Td>{entry.path}</Table.Td>
                        <Table.Td>
                          {entry.duration_seconds ? `${entry.duration_seconds}s` : '—'}
                        </Table.Td>
                        <Table.Td>
                          <Text size="xs">{entry.screen || '—'}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="xs" lineClamp={1} style={{ maxWidth: 250 }}>
                            {entry.user_agent || '—'}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="xs" c="dimmed" lineClamp={1} style={{ maxWidth: 180 }}>
                            {entry.referer || '—'}
                          </Text>
                        </Table.Td>
                      </Table.Tr>
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
