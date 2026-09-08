'use client';

import React from 'react';
import { Group, Select, ActionIcon, Text, Tooltip, Switch, Paper } from '@mantine/core';
import { IconChevronLeft, IconChevronRight, IconRefresh, IconRobot } from '@tabler/icons-react';
import type { Bucket, RangePreset } from '@/lib/analytics';
import { SURFACE, BORDER } from './theme';

/** Grouped so the calendar periods the user asked for read as one set. */
export const RANGE_OPTIONS = [
  {
    group: 'Calendar period',
    items: [
      { value: 'day', label: 'Day' },
      { value: 'week', label: 'Week' },
      { value: 'month', label: 'Month' },
      { value: 'quarter', label: 'Quarter' },
      { value: 'year', label: 'Year' },
    ],
  },
  {
    group: 'Rolling window',
    items: [
      { value: '1h', label: 'Last hour' },
      { value: '24h', label: 'Last 24 hours' },
      { value: '7d', label: 'Last 7 days' },
      { value: '30d', label: 'Last 30 days' },
      { value: '90d', label: 'Last 90 days' },
      { value: '12m', label: 'Last 12 months' },
      { value: 'all', label: 'All time' },
    ],
  },
];

const BUCKET_OPTIONS = [
  { value: 'auto', label: 'Auto' },
  { value: 'tenmin', label: '10 min' },
  { value: 'hour', label: 'Hourly' },
  { value: 'day', label: 'Daily' },
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' },
];

interface RangePickerProps {
  preset: RangePreset;
  onPresetChange: (preset: RangePreset) => void;
  offset: number;
  onOffsetChange: (offset: number) => void;
  bucket: Bucket | 'auto';
  onBucketChange: (bucket: Bucket | 'auto') => void;
  includeBots: boolean;
  onIncludeBotsChange: (include: boolean) => void;
  /** Server-resolved label for the window actually being shown. */
  label: string;
  navigable: boolean;
  atLatest: boolean;
  /** The bucket the server chose, shown when the picker is on Auto. */
  resolvedBucket?: Bucket;
  onRefresh: () => void;
  loading?: boolean;
}

/** One filter row above the charts — it scopes everything below it. */
export function RangePicker({
  preset, onPresetChange, offset, onOffsetChange, bucket, onBucketChange,
  includeBots, onIncludeBotsChange, label, navigable, atLatest, resolvedBucket,
  onRefresh, loading,
}: RangePickerProps) {
  return (
    <Paper p="sm" radius="md" style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}` }}>
      <Group justify="space-between" gap="md" wrap="wrap">
        <Group gap="xs" wrap="nowrap">
          <Select
            data={RANGE_OPTIONS}
            value={preset}
            onChange={(v) => v && onPresetChange(v as RangePreset)}
            style={{ width: 152 }}
            size="xs"
            allowDeselect={false}
            comboboxProps={{ width: 190 }}
            aria-label="Time range"
          />

          <ActionIcon.Group>
            <Tooltip label={navigable ? `Previous ${preset}` : 'Rolling windows are always current'} withArrow>
              <ActionIcon
                variant="default" size="sm"
                disabled={!navigable}
                onClick={() => onOffsetChange(offset + 1)}
                aria-label="Previous period"
              >
                <IconChevronLeft size={14} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label={atLatest ? 'Already at the latest period' : `Next ${preset}`} withArrow>
              <ActionIcon
                variant="default" size="sm"
                disabled={!navigable || atLatest}
                onClick={() => onOffsetChange(Math.max(0, offset - 1))}
                aria-label="Next period"
              >
                <IconChevronRight size={14} />
              </ActionIcon>
            </Tooltip>
          </ActionIcon.Group>

          <Text size="sm" fw={600} style={{ minWidth: 120 }}>{label}</Text>
        </Group>

        <Group gap="md" wrap="nowrap">
          <Group gap={6} wrap="nowrap">
            <Text size="xs" c="dimmed">Buckets</Text>
            <Select
              data={BUCKET_OPTIONS}
              value={bucket}
              onChange={(v) => v && onBucketChange(v as Bucket | 'auto')}
              style={{ width: 96 }}
              size="xs"
              allowDeselect={false}
              aria-label="Bucket granularity"
            />
            {bucket === 'auto' && resolvedBucket && (
              <Text size="10px" c="dimmed">({resolvedBucket})</Text>
            )}
          </Group>

          <Tooltip label="Include crawlers and bots in every metric" withArrow>
            <Switch
              size="xs"
              color="violet"
              checked={includeBots}
              onChange={(e) => onIncludeBotsChange(e.currentTarget.checked)}
              label={<Group gap={4}><IconRobot size={13} /><Text size="xs">Bots</Text></Group>}
            />
          </Tooltip>

          <Tooltip label="Refresh" withArrow>
            <ActionIcon variant="default" size="sm" onClick={onRefresh} loading={loading} aria-label="Refresh">
              <IconRefresh size={14} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>
    </Paper>
  );
}
