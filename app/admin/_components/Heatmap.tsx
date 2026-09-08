'use client';

import React, { useState } from 'react';
import { Paper, Text, Group } from '@mantine/core';
import { SURFACE, BORDER, INK, INK_MUTED, SEQUENTIAL, EMPTY_CELL, rampColor, formatExact } from './theme';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface HeatmapProps {
  /** [weekday 0=Mon][hour 0-23] view counts. */
  grid: number[][];
  timezone: string;
  stale?: boolean;
}

/** When traffic actually arrives: day of week × hour of day. */
export function Heatmap({ grid, timezone, stale }: HeatmapProps) {
  const [hover, setHover] = useState<{ d: number; h: number } | null>(null);

  const max = Math.max(0, ...grid.flat());
  const total = grid.flat().reduce((s, v) => s + v, 0);

  // Busiest cell, called out directly so the peak isn't hover-only.
  let peak = { d: 0, h: 0, v: 0 };
  grid.forEach((row, d) => row.forEach((v, h) => { if (v > peak.v) peak = { d, h, v }; }));

  const hourLabel = (h: number) => (h === 0 ? '12a' : h === 12 ? '12p' : h > 12 ? `${h - 12}p` : `${h}a`);
  const tz = timezone.split('/').pop()?.replace(/_/g, ' ') ?? timezone;

  return (
    <Paper p="md" radius="md" style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}`, height: '100%' }}>
      <Group justify="space-between" mb={2} wrap="nowrap">
        <Text fw={600} size="sm">When visitors arrive</Text>
        <Text size="10px" c="dimmed">{tz} time</Text>
      </Group>
      <Text size="xs" c="dimmed" mb="sm">
        {total > 0
          ? <>Busiest: <strong style={{ color: INK }}>{DAYS[peak.d]} {hourLabel(peak.h)}</strong> · {formatExact(peak.v)} views</>
          : 'No traffic in this period.'}
      </Text>

      <div style={{ opacity: stale ? 0.45 : 1, transition: 'opacity 120ms' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr', gap: 4 }}>
          <div />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(24, 1fr)', gap: 2 }}>
            {Array.from({ length: 24 }, (_, h) => (
              <Text key={h} size="9px" c="dimmed" ta="center" style={{ lineHeight: 1.4 }}>
                {h % 3 === 0 ? hourLabel(h) : ''}
              </Text>
            ))}
          </div>

          {grid.map((row, d) => (
            <React.Fragment key={d}>
              <Text size="10px" c="dimmed" style={{ lineHeight: '16px', alignSelf: 'center' }}>{DAYS[d]}</Text>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(24, 1fr)', gap: 2 }}>
                {row.map((v, h) => {
                  const isHovered = hover?.d === d && hover?.h === h;
                  const isPeak = peak.v > 0 && peak.d === d && peak.h === h;
                  return (
                    <div
                      key={h}
                      tabIndex={0}
                      role="img"
                      aria-label={`${DAYS[d]} ${hourLabel(h)}: ${formatExact(v)} ${v === 1 ? 'view' : 'views'}`}
                      onMouseEnter={() => setHover({ d, h })}
                      onFocus={() => setHover({ d, h })}
                      onMouseLeave={() => setHover(null)}
                      onBlur={() => setHover(null)}
                      style={{
                        height: 16,
                        borderRadius: 2,
                        backgroundColor: rampColor(v, max),
                        // The hovered cell lifts; the peak stays marked so the
                        // "busiest" callout is findable without hovering.
                        outline: isHovered
                          ? `1px solid ${INK}`
                          : isPeak ? `1px solid ${INK_MUTED}` : 'none',
                        outlineOffset: 1,
                        cursor: v > 0 ? 'help' : 'default',
                      }}
                    />
                  );
                })}
              </div>
            </React.Fragment>
          ))}
        </div>

        <Group justify="space-between" mt="md" wrap="nowrap" align="center">
          <Text size="10px" c="dimmed" style={{ minHeight: 14 }}>
            {hover
              ? `${DAYS[hover.d]} ${hourLabel(hover.h)}–${hourLabel((hover.h + 1) % 24)} · ${formatExact(grid[hover.d][hover.h])} views`
              : 'Hover a cell for its hourly count'}
          </Text>
          <Group gap={6} wrap="nowrap" align="center">
            <Group gap={3} wrap="nowrap" align="center">
              <span style={{ width: 11, height: 9, borderRadius: 2, backgroundColor: EMPTY_CELL, border: `1px solid ${BORDER}` }} />
              <Text size="9px" c="dimmed">none</Text>
            </Group>
            <Group gap={2} wrap="nowrap" align="center">
              <Text size="9px" c="dimmed">1</Text>
              {SEQUENTIAL.map((c) => (
                <span key={c} style={{ width: 11, height: 9, borderRadius: 2, backgroundColor: c }} />
              ))}
              <Text size="9px" style={{ color: INK_MUTED }}>{formatExact(max)}</Text>
            </Group>
          </Group>
        </Group>
      </div>
    </Paper>
  );
}
