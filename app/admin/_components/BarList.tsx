'use client';

import React, { useState } from 'react';
import { Paper, Text, Group, Stack, Tooltip, ActionIcon, Button } from '@mantine/core';
import { IconTable, IconChartBar } from '@tabler/icons-react';
import type { Breakdown } from '@/lib/analytics';
import { formatExact, formatDuration, formatPercent } from './theme';
import { useChartTheme } from './useChartTheme';

interface BarListProps {
  title: string;
  items: Breakdown[];
  /** Colour slot for the bars. */
  slot?: 0 | 1 | 2 | 3;
  /** Show mean time on page beside each row. */
  showDuration?: boolean;
  /** Show unique-visitor counts beside each row. */
  showVisitors?: boolean;
  /** Rows before "Show all". */
  initial?: number;
  emptyLabel?: string;
  /** Render `sub` as a country flag-ish prefix rather than trailing text. */
  subAsPrefix?: boolean;
  /** Right-hand column heading. */
  metricLabel?: string;
}

/**
 * A ranked breakdown. Each row carries its own bar (magnitude) plus a table
 * view, so every value is reachable without hovering.
 */
export function BarList({
  title, items, slot = 0, showDuration = false, showVisitors = true,
  initial = 8, emptyLabel = 'No data in this period.', subAsPrefix = false,
  metricLabel = 'Views',
}: BarListProps) {
  const t = useChartTheme();
  const [expanded, setExpanded] = useState(false);
  const [asTable, setAsTable] = useState(false);

  const max = Math.max(1, ...items.map((i) => i.views));
  const total = items.reduce((s, i) => s + i.views, 0);
  const shown = expanded ? items : items.slice(0, initial);
  const color = t.series[slot];

  return (
    <Paper p="md" radius="md" style={{ backgroundColor: t.surface, border: `1px solid ${t.border}`, height: '100%' }}>
      <Group justify="space-between" mb="sm" wrap="nowrap">
        <Text fw={600} size="sm">{title}</Text>
        <Tooltip label={asTable ? 'Show bars' : 'Show as table'} withArrow>
          <ActionIcon
            variant="subtle" color="gray" size="sm"
            onClick={() => setAsTable((v) => !v)}
            aria-label={asTable ? 'Show bars' : 'Show as table'}
          >
            {asTable ? <IconChartBar size={15} /> : <IconTable size={15} />}
          </ActionIcon>
        </Tooltip>
      </Group>

      {items.length === 0 ? (
        <Text size="sm" c="dimmed">{emptyLabel}</Text>
      ) : asTable ? (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                {['', metricLabel, showVisitors ? 'Visitors' : null, showDuration ? 'Avg time' : null, 'Share']
                  .filter(Boolean)
                  .map((h, i) => (
                    <th
                      key={i}
                      style={{
                        textAlign: i === 0 ? 'left' : 'right',
                        color: t.inkMuted, fontWeight: 500, padding: '4px 6px',
                        borderBottom: `1px solid ${t.border}`, whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.label}>
                  <td style={{ padding: '4px 6px', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.label}
                  </td>
                  <td style={{ padding: '4px 6px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    {formatExact(item.views)}
                  </td>
                  {showVisitors && (
                    <td style={{ padding: '4px 6px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {formatExact(item.visitors)}
                    </td>
                  )}
                  {showDuration && (
                    <td style={{ padding: '4px 6px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {formatDuration(item.avgSeconds)}
                    </td>
                  )}
                  <td style={{ padding: '4px 6px', textAlign: 'right', color: t.inkMuted, fontVariantNumeric: 'tabular-nums' }}>
                    {total > 0 ? formatPercent(item.views / total, 1) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Stack gap={10}>
          {shown.map((item) => (
            <div key={item.label}>
              <Group justify="space-between" gap="xs" wrap="nowrap" mb={3}>
                <Group gap={6} wrap="nowrap" style={{ minWidth: 0 }}>
                  {subAsPrefix && item.sub && (
                    <Text size="10px" c="dimmed" fw={700} style={{ flexShrink: 0, letterSpacing: '0.04em' }}>
                      {item.sub}
                    </Text>
                  )}
                  <Tooltip label={item.label} withArrow openDelay={400}>
                    <Text size="xs" truncate style={{ minWidth: 0 }}>{item.label}</Text>
                  </Tooltip>
                </Group>
                <Group gap={8} wrap="nowrap" style={{ flexShrink: 0 }}>
                  {showDuration && (
                    <Text size="10px" c="dimmed" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {formatDuration(item.avgSeconds)}
                    </Text>
                  )}
                  {showVisitors && (
                    <Tooltip label={`${formatExact(item.visitors)} unique visitors`} withArrow>
                      <Text size="10px" c="dimmed" style={{ fontVariantNumeric: 'tabular-nums', cursor: 'help' }}>
                        {formatExact(item.visitors)}u
                      </Text>
                    </Tooltip>
                  )}
                  <Text size="xs" fw={600} style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {formatExact(item.views)}
                  </Text>
                </Group>
              </Group>
              {/* 6px track, 4px rounded data-end. */}
              <div style={{ height: 6, borderRadius: 3, backgroundColor: t.track, overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${Math.max(1.5, (item.views / max) * 100)}%`,
                    backgroundColor: color,
                    borderRadius: 3,
                  }}
                />
              </div>
            </div>
          ))}

          {items.length > initial && (
            <Button
              variant="subtle" color="gray" size="compact-xs"
              onClick={() => setExpanded((v) => !v)}
              style={{ alignSelf: 'flex-start' }}
            >
              {expanded ? 'Show less' : `Show all ${items.length}`}
            </Button>
          )}
        </Stack>
      )}
    </Paper>
  );
}
