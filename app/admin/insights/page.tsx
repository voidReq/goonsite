'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  MantineProvider, Container, Stack, Group, Title, Text, Button, Paper,
  Loader, Alert, Divider,
} from '@mantine/core';
import { useRouter } from 'next/navigation';
import { IconAlertCircle, IconArrowLeft, IconRobot } from '@tabler/icons-react';
import type { Analytics, Bucket, RangePreset } from '@/lib/analytics';
import { AdminLogin } from '../_components/AdminLogin';
import { RangePicker } from '../_components/RangePicker';
import { StatTile } from '../_components/StatTile';
import { TimeSeries } from '../_components/TimeSeries';
import { BarList } from '../_components/BarList';
import { Heatmap } from '../_components/Heatmap';
import { VisitorMap } from '../_components/VisitorMap';
import {
  PAGE, SURFACE, BORDER, INK, CONTENT_MIN_HEIGHT,
  formatCount, formatExact, formatDuration, formatPercent,
} from '../_components/theme';

/** Compact date-time for the range bounds, in the reporting timezone. */
function rangeStamp(iso: string, timezone: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  }).format(new Date(iso));
}

/** Fractional change from `prev` to `now`, or null when there's no baseline. */
function delta(now: number, prev: number | undefined | null): number | null {
  if (typeof prev !== 'number' || prev === 0) return null;
  return (now - prev) / prev;
}

export default function AdminInsightsPage() {
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [preset, setPreset] = useState<RangePreset>('30d');
  const [offset, setOffset] = useState(0);
  const [bucket, setBucket] = useState<Bucket | 'auto'>('auto');
  const [includeBots, setIncludeBots] = useState(false);
  const [data, setData] = useState<Analytics | null>(null);

  // Keep the password out of the fetch callback's dependency churn.
  const pwdRef = useRef('');
  const initialLoadDone = useRef(false);

  const fetchAnalytics = useCallback(async (pwd?: string) => {
    const token = pwd ?? pwdRef.current;
    if (!token) return false;

    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ range: preset, offset: String(offset), bots: includeBots ? '1' : '0' });
      if (bucket !== 'auto') params.set('bucket', bucket);
      if (!initialLoadDone.current) params.set('initial', '1');

      const res = await fetch(`/api/admin/insights?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        setAuthError('Invalid password');
        setAuthed(false);
        return false;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || `Failed to load insights (${res.status})`);
        return false;
      }

      initialLoadDone.current = true;
      pwdRef.current = token;
      setData(await res.json());
      setAuthed(true);
      return true;
    } catch {
      setError('Connection error — could not reach the server.');
      return false;
    } finally {
      setLoading(false);
    }
  }, [preset, offset, bucket, includeBots]);

  const handleLogin = async () => {
    setAuthError('');
    await fetchAnalytics(password);
  };

  useEffect(() => {
    if (authed) fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset, offset, bucket, includeBots, authed]);

  // Switching to a different period kind restarts at the most recent one.
  const changePreset = (next: RangePreset) => {
    setPreset(next);
    setOffset(0);
  };

  const totals = data?.totals;
  const previous = data?.previous;

  // Trailing sparkline for the headline tiles, from the same series.
  const spark = useMemo(() => {
    if (!data?.series?.length) return undefined;
    const tail = data.series.slice(-16);
    return {
      views: tail.map((p) => p.views),
      visitors: tail.map((p) => p.visitors),
      sessions: tail.map((p) => p.sessions),
    };
  }, [data]);

  if (!authed) {
    return (
      <AdminLogin
        title="Insights"
        password={password}
        onPasswordChange={setPassword}
        onSubmit={handleLogin}
        error={authError}
        loading={loading}
      />
    );
  }

  // Refetches hold the previous render at reduced opacity — no layout jump.
  const stale = loading && !!data;

  return (
    <MantineProvider forceColorScheme="dark">
      <Container size="xl" py="xl" style={{ minHeight: CONTENT_MIN_HEIGHT, backgroundColor: PAGE }}>
        <Stack gap="md">
          <Group justify="space-between" align="center" wrap="wrap">
            <Group gap="xs">
              <Button
                variant="subtle" color="gray" size="sm"
                onClick={() => router.push('/admin/visitors')}
                leftSection={<IconArrowLeft size={16} />}
              >
                Raw logs
              </Button>
              <Title order={2} style={{ color: INK }}>Insights</Title>
            </Group>
            {data && (
              // The window's own bounds, not a bare clock — for a past period a
              // lone timestamp reads like a stale "last updated".
              <Text size="xs" c="dimmed" ta="right">
                {data.range.from
                  ? `${rangeStamp(data.range.from, data.range.timezone)} → ${rangeStamp(data.range.to, data.range.timezone)}`
                  : `through ${rangeStamp(data.range.to, data.range.timezone)}`}
                <br />
                {data.range.timezone.replace(/_/g, ' ')}
              </Text>
            )}
          </Group>

          <RangePicker
            preset={preset}
            onPresetChange={changePreset}
            offset={offset}
            onOffsetChange={setOffset}
            bucket={bucket}
            onBucketChange={setBucket}
            includeBots={includeBots}
            onIncludeBotsChange={setIncludeBots}
            label={data?.range.label ?? '—'}
            navigable={data?.range.navigable ?? false}
            atLatest={data?.range.atLatest ?? true}
            resolvedBucket={data?.range.bucket}
            onRefresh={() => fetchAnalytics()}
            loading={loading}
          />

          {error && (
            <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
              {error}
            </Alert>
          )}

          {!data ? (
            <Group justify="center" py="xl"><Loader color="violet" /></Group>
          ) : (
            <>
              {/* Headline tiles. */}
              <Group gap="md" align="stretch" wrap="wrap">
                <StatTile
                  label="Page views"
                  value={formatCount(totals!.views)}
                  exact={formatExact(totals!.views)}
                  delta={delta(totals!.views, previous?.views)}
                  spark={spark?.views}
                />
                <StatTile
                  label="Unique visitors"
                  value={formatCount(totals!.visitors)}
                  exact={formatExact(totals!.visitors)}
                  delta={delta(totals!.visitors, previous?.visitors)}
                  hint="Distinct IP addresses seen in this period."
                  spark={spark?.visitors}
                />
                <StatTile
                  label="Sessions"
                  value={formatCount(totals!.sessions)}
                  exact={formatExact(totals!.sessions)}
                  delta={delta(totals!.sessions, previous?.sessions)}
                  hint="A visit ends after 30 minutes of inactivity from the same IP."
                  spark={spark?.sessions}
                />
                <StatTile
                  label="Avg session"
                  value={formatDuration(totals!.avgSessionSeconds)}
                  delta={delta(totals!.avgSessionSeconds, previous?.avgSessionSeconds)}
                  hint="Mean total time across the pages read in one session."
                />
                <StatTile
                  label="Bounce rate"
                  value={formatPercent(totals!.bounceRate, 1)}
                  delta={delta(totals!.bounceRate, previous?.bounceRate)}
                  higherIsBetter={false}
                  hint="Share of sessions that read exactly one page."
                />
                <StatTile
                  label="Views / session"
                  value={totals!.viewsPerSession.toFixed(2)}
                  delta={delta(totals!.viewsPerSession, previous?.viewsPerSession)}
                />
              </Group>

              <Group gap="md" align="stretch" wrap="wrap">
                <StatTile
                  label="New visitors"
                  value={formatCount(totals!.newVisitors)}
                  exact={formatExact(totals!.newVisitors)}
                  delta={delta(totals!.newVisitors, previous?.newVisitors)}
                  hint="IPs that appear nowhere earlier in the log history."
                />
                <StatTile
                  label="Returning visitors"
                  value={formatCount(totals!.returningVisitors)}
                  exact={formatExact(totals!.returningVisitors)}
                  delta={delta(totals!.returningVisitors, previous?.returningVisitors)}
                />
                <StatTile
                  label="Avg time on page"
                  value={formatDuration(totals!.avgViewSeconds)}
                  delta={delta(totals!.avgViewSeconds, previous?.avgViewSeconds)}
                  hint="Measured from the page-leave beacon, so pages closed abruptly are excluded."
                />
                <StatTile
                  label="Countries"
                  value={formatExact(data.countries.length)}
                  hint="Distinct countries among geolocated visitors."
                />
                <StatTile
                  label={includeBots ? 'Bot views (included)' : 'Bot views (excluded)'}
                  value={formatCount(totals!.botViews)}
                  exact={formatExact(totals!.botViews)}
                  higherIsBetter={false}
                  hint="Requests from crawlers, monitors and CLI tools, matched on user agent."
                />
              </Group>

              {includeBots && (
                <Alert icon={<IconRobot size={16} />} color="yellow" variant="light">
                  Bot traffic is included in every metric on this page. Turn the Bots switch off for
                  human-only numbers.
                </Alert>
              )}

              {/* Traffic over time. */}
              <Paper p="md" radius="md" style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}` }}>
                <Group justify="space-between" mb="xs" wrap="nowrap">
                  <Text fw={600} size="sm">Traffic over time</Text>
                  <Text size="xs" c="dimmed">{data.range.label}</Text>
                </Group>
                <TimeSeries
                  points={data.series}
                  bucket={data.range.bucket}
                  timezone={data.range.timezone}
                  stale={stale}
                />
              </Paper>

              {/* Map + arrival pattern. */}
              <Group gap="md" align="stretch" wrap="wrap">
                <div style={{ flex: '3 1 560px', minWidth: 340 }}>
                  <VisitorMap
                    locations={data.locations}
                    ungeolocatedVisitors={data.ungeolocatedVisitors}
                    totalViews={totals!.views}
                    stale={stale}
                  />
                </div>
                <div style={{ flex: '2 1 380px', minWidth: 320 }}>
                  <Stack gap="md" style={{ height: '100%' }}>
                    <Heatmap grid={data.heatmap} timezone={data.range.timezone} stale={stale} />
                    <BarList
                      title="Top countries"
                      items={data.countries}
                      slot={2}
                      subAsPrefix
                      initial={6}
                    />
                  </Stack>
                </div>
              </Group>

              <Divider label="Content" labelPosition="left" />

              <Group gap="md" align="stretch" wrap="wrap" grow>
                <div style={{ flex: '1 1 320px', minWidth: 300 }}>
                  <BarList
                    title="Top pages"
                    items={data.pages}
                    slot={0}
                    showDuration
                    metricLabel="Views"
                  />
                </div>
                <div style={{ flex: '1 1 320px', minWidth: 300 }}>
                  <BarList
                    title="Entry pages"
                    items={data.entryPages}
                    slot={0}
                    metricLabel="Sessions"
                    emptyLabel="No sessions in this period."
                  />
                </div>
                <div style={{ flex: '1 1 320px', minWidth: 300 }}>
                  <BarList
                    title="Referrers"
                    items={data.referrers}
                    slot={1}
                    metricLabel="Views"
                  />
                </div>
              </Group>

              <Divider label="Audience" labelPosition="left" />

              <Group gap="md" align="stretch" wrap="wrap" grow>
                <div style={{ flex: '1 1 240px', minWidth: 230 }}>
                  <BarList title="Devices" items={data.devices} slot={2} initial={5} />
                </div>
                <div style={{ flex: '1 1 240px', minWidth: 230 }}>
                  <BarList title="Browsers" items={data.browsers} slot={2} initial={5} />
                </div>
                <div style={{ flex: '1 1 240px', minWidth: 230 }}>
                  <BarList title="Operating systems" items={data.operatingSystems} slot={2} initial={5} />
                </div>
                <div style={{ flex: '1 1 240px', minWidth: 230 }}>
                  <BarList title="Languages" items={data.languages} slot={3} initial={5} />
                </div>
              </Group>

              <Group gap="md" align="stretch" wrap="wrap" grow>
                <div style={{ flex: '1 1 340px', minWidth: 300 }}>
                  <BarList title="Top cities" items={data.cities} slot={0} subAsPrefix initial={10} />
                </div>
              </Group>
            </>
          )}
        </Stack>
      </Container>
    </MantineProvider>
  );
}
