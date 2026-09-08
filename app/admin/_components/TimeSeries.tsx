'use client';

import React, { useMemo, useRef, useState } from 'react';
import { Group, Text } from '@mantine/core';
import { formatCount, formatExact, niceTicks } from './theme';
import { useChartTheme } from './useChartTheme';
import type { Bucket } from '@/lib/analytics';

export interface SeriesPoint {
  key: string;
  start: number;
  views: number;
  visitors: number;
  sessions: number;
}

interface TimeSeriesProps {
  points: SeriesPoint[];
  bucket: Bucket;
  timezone: string;
  /** Dim the plot while new data loads, instead of unmounting it. */
  stale?: boolean;
  height?: number;
}

const PAD = { top: 16, right: 16, bottom: 26, left: 44 };

/**
 * A column with its data-end rounded and its foot square on the baseline.
 * `rx` on a <rect> would round all four corners, detaching the bar from the axis.
 */
function columnPath(x: number, baseY: number, width: number, height: number, radius: number): string {
  const r = Math.min(radius, width / 2, height);
  const topY = baseY - height;
  return [
    `M${x},${baseY}`,
    `V${topY + r}`,
    r > 0 ? `A${r},${r} 0 0 1 ${x + r},${topY}` : '',
    `H${x + width - r}`,
    r > 0 ? `A${r},${r} 0 0 1 ${x + width},${topY + r}` : '',
    `V${baseY}`,
    'Z',
  ].filter(Boolean).join(' ');
}

/** Label for a bucket start, in the reporting timezone. */
function tickLabel(ms: number, bucket: Bucket, timezone: string): string {
  const d = new Date(ms);
  if (bucket === 'month') {
    // Apostrophe-year, so "Jan '25" can't be misread as a day-of-month.
    const parts = new Intl.DateTimeFormat('en-US', { month: 'short', year: '2-digit', timeZone: timezone })
      .formatToParts(d);
    const month = parts.find((p) => p.type === 'month')?.value ?? '';
    const year = parts.find((p) => p.type === 'year')?.value ?? '';
    return `${month} '${year}`;
  }
  const opts: Intl.DateTimeFormatOptions =
    bucket === 'tenmin' || bucket === 'hour'
      ? { hour: 'numeric', hour12: true }
      : { month: 'short', day: 'numeric' };
  return new Intl.DateTimeFormat('en-US', { ...opts, timeZone: timezone }).format(d);
}

/** Full label for the tooltip — includes the bucket's width. */
function fullLabel(ms: number, bucket: Bucket, timezone: string): string {
  const d = new Date(ms);
  const fmt = (o: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat('en-US', { ...o, timeZone: timezone }).format(d);

  switch (bucket) {
    case 'tenmin':
      return fmt({ month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
    case 'hour':
      return fmt({ weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', hour12: true });
    case 'week': {
      const end = new Date(ms + 6 * 86_400_000);
      const endStr = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: timezone }).format(end);
      return `Week of ${fmt({ month: 'short', day: 'numeric', year: 'numeric' })} – ${endStr}`;
    }
    case 'month':
      return fmt({ month: 'long', year: 'numeric' });
    default:
      return fmt({ weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  }
}

export function TimeSeries({ points, bucket, timezone, stale, height = 260 }: TimeSeriesProps) {
  const t = useChartTheme();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(880);
  const [hover, setHover] = useState<number | null>(null);

  // Track the container width so the SVG uses real pixels (no viewBox scaling,
  // which would distort stroke widths and text).
  React.useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setWidth(Math.max(320, Math.floor(entry.contentRect.width)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const plotW = Math.max(40, width - PAD.left - PAD.right);
  const plotH = Math.max(40, height - PAD.top - PAD.bottom);

  const { ticks, bandWidth, barWidth, barRadius, xOf, yOf, tickIndices } = useMemo(() => {
    const maxValue = Math.max(1, ...points.map((p) => p.views));
    const tickValues = niceTicks(maxValue, 4);
    const axisMax = Math.max(maxValue, tickValues[tickValues.length - 1] || 1);
    const band = points.length > 0 ? plotW / points.length : plotW;
    // Cap bar thickness and always leave a 2px surface gap between neighbours.
    const bar = Math.max(1, Math.min(24, band - 2));

    // Thin out x labels so they never collide (~64px of breathing room each).
    const maxLabels = Math.max(2, Math.floor(plotW / 64));
    const stride = Math.max(1, Math.ceil(points.length / maxLabels));
    const indices = points.map((_, i) => i).filter((i) => i % stride === 0);
    if (indices.length && indices[indices.length - 1] !== points.length - 1 && points.length > 1) {
      // Keep the most recent bucket labelled — it's the one people look for.
      if (points.length - 1 - indices[indices.length - 1] >= stride / 2) indices.push(points.length - 1);
      else indices[indices.length - 1] = points.length - 1;
    }

    return {
      ticks: tickValues,
      bandWidth: band,
      barWidth: bar,
      barRadius: Math.min(4, bar / 2),
      xOf: (i: number) => PAD.left + i * band + band / 2,
      yOf: (v: number) => PAD.top + plotH - (v / axisMax) * plotH,
      tickIndices: indices,
    };
  }, [points, plotW, plotH]);

  const visitorLine = useMemo(
    () => points.map((p, i) => `${xOf(i).toFixed(2)},${yOf(p.visitors).toFixed(2)}`).join(' '),
    [points, xOf, yOf],
  );

  const hovered = hover !== null ? points[hover] : null;
  const totalViews = points.reduce((s, p) => s + p.views, 0);

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!points.length) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - PAD.left;
    // Snap to the nearest band, so the reader aims at a date not a 2px line.
    const i = Math.floor(x / bandWidth);
    setHover(i >= 0 && i < points.length ? i : null);
  };

  // Keep the tooltip inside the plot.
  const tipWidth = 168;
  const tipLeft = hover === null ? 0
    : Math.min(width - tipWidth - 4, Math.max(4, xOf(hover) - tipWidth / 2));

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%' }}>
      {points.length === 0 ? (
        <Group justify="center" align="center" style={{ height }}>
          <Text size="sm" c="dimmed">No traffic in this period.</Text>
        </Group>
      ) : (
        <>
          <Group gap="lg" mb={4} justify="space-between">
            {/* Legend is always present for two series — identity is never colour alone. */}
            <Group gap="md">
              <Group gap={6}>
                <span style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: t.series[0], display: 'inline-block' }} />
                <Text size="xs" c="dimmed">Page views</Text>
              </Group>
              <Group gap={6}>
                <span style={{ width: 12, height: 2, borderRadius: 1, backgroundColor: t.series[2], display: 'inline-block' }} />
                <Text size="xs" c="dimmed">Unique visitors</Text>
              </Group>
            </Group>
            <Text size="xs" c="dimmed">
              {formatExact(totalViews)} views over {points.length} {bucket === 'tenmin' ? '10-min' : bucket} buckets
            </Text>
          </Group>

          <svg
            width={width}
            height={height}
            style={{ display: 'block', opacity: stale ? 0.45 : 1, transition: 'opacity 120ms' }}
            onPointerMove={onMove}
            onPointerLeave={() => setHover(null)}
            role="img"
            aria-label={`Page views and unique visitors per ${bucket}`}
          >
            {/* Gridlines: hairline, solid, recessive. */}
            {ticks.map((tick) => (
              <g key={tick}>
                <line
                  x1={PAD.left} x2={PAD.left + plotW}
                  y1={yOf(tick)} y2={yOf(tick)}
                  stroke={tick === 0 ? t.axis : t.grid} strokeWidth={1}
                />
                <text
                  x={PAD.left - 8} y={yOf(tick) + 4}
                  textAnchor="end"
                  style={{ fontSize: 10, fill: t.inkMuted, fontVariantNumeric: 'tabular-nums' }}
                >
                  {formatCount(tick)}
                </text>
              </g>
            ))}

            {/* Crosshair sits under the marks. */}
            {hover !== null && (
              <line
                x1={xOf(hover)} x2={xOf(hover)}
                y1={PAD.top} y2={PAD.top + plotH}
                stroke={t.inkMuted} strokeWidth={1} opacity={0.5}
              />
            )}

            {points.map((p, i) => {
              const h = Math.max(p.views > 0 ? 2 : 0, PAD.top + plotH - yOf(p.views));
              if (h <= 0) return null;
              return (
                <path
                  key={p.key}
                  d={columnPath(xOf(i) - barWidth / 2, PAD.top + plotH, barWidth, h, barRadius)}
                  fill={t.series[0]}
                  fillOpacity={hover === null || hover === i ? 0.9 : 0.55}
                />
              );
            })}

            <polyline
              points={visitorLine}
              fill="none"
              stroke={t.series[2]}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {/* End-dot with a 2px surface ring, plus a direct label for the last value. */}
            {points.length > 0 && (
              <>
                <circle cx={xOf(points.length - 1)} cy={yOf(points[points.length - 1].visitors)} r={5} fill={t.surface} />
                <circle cx={xOf(points.length - 1)} cy={yOf(points[points.length - 1].visitors)} r={3} fill={t.series[2]} />
              </>
            )}

            {hover !== null && hovered && (
              <>
                <circle cx={xOf(hover)} cy={yOf(hovered.visitors)} r={5.5} fill={t.surface} />
                <circle cx={xOf(hover)} cy={yOf(hovered.visitors)} r={3.5} fill={t.series[2]} />
              </>
            )}

            <line
              x1={PAD.left} x2={PAD.left + plotW}
              y1={PAD.top + plotH} y2={PAD.top + plotH}
              stroke={t.axis} strokeWidth={1}
            />

            {tickIndices.map((i) => (
              <text
                key={i}
                x={xOf(i)} y={height - 8}
                textAnchor="middle"
                style={{ fontSize: 10, fill: t.inkMuted }}
              >
                {tickLabel(points[i].start, bucket, timezone)}
              </text>
            ))}
          </svg>

          {hovered && (
            <div
              style={{
                position: 'absolute',
                left: tipLeft,
                top: 24,
                width: tipWidth,
                pointerEvents: 'none',
                backgroundColor: t.tooltipSurface,
                border: `1px solid ${t.tooltipBorder}`,
                borderRadius: 6,
                padding: '8px 10px',
                boxShadow: '0 6px 18px rgba(0,0,0,0.55)',
                zIndex: 5,
              }}
            >
              <div style={{ fontSize: 11, color: t.inkMuted, marginBottom: 6 }}>
                {fullLabel(hovered.start, bucket, timezone)}
              </div>
              {/* Values lead, labels follow; series keyed by a short stroke. */}
              {([
                ['Views', hovered.views, t.series[0]],
                ['Visitors', hovered.visitors, t.series[2]],
                ['Sessions', hovered.sessions, t.inkMuted],
              ] as const).map(([label, value, color]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  <span style={{ width: 10, height: 2, backgroundColor: color, borderRadius: 1, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: t.ink, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                    {formatExact(value)}
                  </span>
                  <span style={{ fontSize: 11, color: t.inkMuted }}>{label}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
