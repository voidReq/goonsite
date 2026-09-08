'use client';

import React from 'react';
import { Paper, Text, Group, Tooltip } from '@mantine/core';
import { IconArrowUpRight, IconArrowDownRight, IconMinus, IconInfoCircle } from '@tabler/icons-react';
import { SURFACE, BORDER, INK_MUTED, STATUS, SERIES } from './theme';

interface StatTileProps {
  label: string;
  value: string;
  /** Full-precision value, shown on hover when `value` is abbreviated. */
  exact?: string;
  /** Change vs the comparison period, as a fraction. */
  delta?: number | null;
  /** Whether an increase is a good thing (drives the delta colour). */
  higherIsBetter?: boolean;
  comparisonLabel?: string;
  hint?: string;
  /** Sparkline values, oldest first. */
  spark?: number[];
}

/** Sparkline: de-emphasised line with the latest point picked out in the accent. */
function Sparkline({ values }: { values: number[] }) {
  const w = 88;
  const h = 26;
  if (values.length < 2) return null;

  const max = Math.max(...values, 1);
  const step = w / (values.length - 1);
  const y = (v: number) => h - 2 - (v / max) * (h - 4);
  const points = values.map((v, i) => `${(i * step).toFixed(2)},${y(v).toFixed(2)}`);
  const last = values[values.length - 1];

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="presentation" style={{ display: 'block' }}>
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={INK_MUTED}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity={0.7}
      />
      {/* 2px surface ring keeps the end-dot legible where it crosses the line. */}
      <circle cx={w} cy={y(last)} r={4} fill={SURFACE} />
      <circle cx={w} cy={y(last)} r={2.5} fill={SERIES[0]} />
    </svg>
  );
}

export function StatTile({
  label, value, exact, delta, higherIsBetter = true, comparisonLabel = 'previous period', hint, spark,
}: StatTileProps) {
  const hasDelta = typeof delta === 'number' && Number.isFinite(delta);
  const flat = hasDelta && Math.abs(delta as number) < 0.005;
  const up = hasDelta && (delta as number) > 0;
  const good = up === higherIsBetter;

  const deltaColor = !hasDelta || flat ? INK_MUTED : good ? STATUS.good : STATUS.critical;
  const DeltaIcon = flat ? IconMinus : up ? IconArrowUpRight : IconArrowDownRight;

  return (
    <Paper
      p="md"
      radius="md"
      style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}`, flex: '1 1 160px', minWidth: 160 }}
    >
      <Group justify="space-between" align="flex-start" gap="xs" wrap="nowrap">
        <Group gap={6} wrap="nowrap">
          <Text size="sm" c="dimmed">{label}</Text>
          {hint && (
            <Tooltip label={hint} multiline maw={280} withArrow>
              <IconInfoCircle size={13} style={{ color: INK_MUTED, cursor: 'help', flexShrink: 0 }} />
            </Tooltip>
          )}
        </Group>
        {spark && spark.length > 1 && <Sparkline values={spark} />}
      </Group>

      <Tooltip label={exact ?? value} disabled={!exact || exact === value} withArrow>
        {/* Proportional figures: a standalone display number reads loose with tabular-nums. */}
        <Text size="28px" fw={600} mt={6} lh={1.1} style={{ letterSpacing: '-0.02em' }}>
          {value}
        </Text>
      </Tooltip>

      {hasDelta && (
        <Group gap={4} mt={6} wrap="nowrap">
          <DeltaIcon size={14} style={{ color: deltaColor, flexShrink: 0 }} />
          <Text size="xs" style={{ color: deltaColor }} fw={600}>
            {flat ? 'flat' : `${Math.abs((delta as number) * 100).toFixed(Math.abs(delta as number) < 0.1 ? 1 : 0)}%`}
          </Text>
          <Text size="xs" c="dimmed" truncate>vs {comparisonLabel}</Text>
        </Group>
      )}
    </Paper>
  );
}
