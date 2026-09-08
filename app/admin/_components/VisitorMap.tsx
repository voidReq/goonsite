'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Paper, Text, Group, Stack, Button, ActionIcon, Tooltip, SegmentedControl } from '@mantine/core';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps';
import { IconPlus, IconMinus, IconFocus2, IconMapPin, IconWorld } from '@tabler/icons-react';
import type { LocationStat } from '@/lib/analytics';
import { REFERENCE_CITIES } from './map-cities';
import {
  SURFACE, BORDER, INK, INK_MUTED, SEQUENTIAL, SERIES,
  rampColor, formatExact, formatPercent,
} from './theme';

const WORLD_URL = '/countries-110m.json';
const US_STATES_URL = '/us-states-10m.json';

const MIN_ZOOM = 1;
const MAX_ZOOM = 64;

const LAND = '#1a1f2e';
const LAND_HOVER = '#232940';
const LAND_STROKE = '#2d3548';
const OCEAN = '#0d1117';

type Metric = 'visits' | 'visitors';

interface Cluster {
  lat: number;
  lng: number;
  label: string;
  sub: string;
  visits: number;
  visitors: number;
  /** Locations merged into this marker. */
  count: number;
}

interface VisitorMapProps {
  locations: LocationStat[];
  /** Views with no geo record, surfaced so the map's total is honest. */
  ungeolocatedVisitors: number;
  totalViews: number;
  stale?: boolean;
}

/**
 * Grid-cluster nearby locations at the current zoom, then merge each cell.
 * Visitor ids are unioned rather than summed, so a visitor who shows up in two
 * nearby cities is still counted once.
 */
function clusterLocations(locations: LocationStat[], zoom: number): Cluster[] {
  // Cell size shrinks as you zoom in, so markers separate rather than merge.
  const cell = 12 / zoom;
  const cells = new Map<string, LocationStat[]>();

  for (const loc of locations) {
    const key = `${Math.floor(loc.lat / cell)}:${Math.floor(loc.lng / cell)}`;
    const bucket = cells.get(key);
    if (bucket) bucket.push(loc); else cells.set(key, [loc]);
  }

  const clusters: Cluster[] = [];
  for (const members of cells.values()) {
    const visits = members.reduce((s, m) => s + m.totalVisits, 0);
    const ids = new Set<number>();
    for (const m of members) for (const id of m.visitorIds) ids.add(id);

    // Weight the marker position toward where the traffic actually is.
    const lat = members.reduce((s, m) => s + m.lat * m.totalVisits, 0) / visits;
    const lng = members.reduce((s, m) => s + m.lng * m.totalVisits, 0) / visits;

    const primary = [...members].sort((a, b) => b.totalVisits - a.totalVisits)[0];
    clusters.push({
      lat, lng,
      label: members.length === 1 ? primary.city : `${primary.city} + ${members.length - 1} more`,
      sub: members.length === 1
        ? [primary.region, primary.country].filter(Boolean).join(', ')
        : `${members.length} locations`,
      visits,
      visitors: ids.size,
      count: members.length,
    });
  }

  return clusters.sort((a, b) => a.visits - b.visits); // paint big markers last
}

export function VisitorMap({ locations, ungeolocatedVisitors, totalViews, stale }: VisitorMapProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 900, height: 480 });
  const [view, setView] = useState<{ coordinates: [number, number]; zoom: number }>({
    coordinates: [10, 22],
    zoom: 1,
  });
  const [metric, setMetric] = useState<Metric>('visits');
  const [hover, setHover] = useState<{ cluster: Cluster; x: number; y: number } | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const width = Math.max(320, Math.floor(entry.contentRect.width));
      setSize({ width, height: Math.round(Math.min(560, Math.max(340, width * 0.52))) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const clusters = useMemo(() => clusterLocations(locations, view.zoom), [locations, view.zoom]);
  const maxMetric = Math.max(1, ...clusters.map((c) => (metric === 'visits' ? c.visits : c.visitors)));
  const geoViews = locations.reduce((s, l) => s + l.totalVisits, 0);

  const zoomBy = (factor: number) =>
    setView((v) => ({ ...v, zoom: Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, v.zoom * factor)) }));

  const reset = () => setView({ coordinates: [10, 22], zoom: 1 });

  // Wheel and pinch zoom, bound to the container so the page doesn't scroll.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      // Trackpads send small deltas; scale the step by how hard the user scrolled.
      const intensity = Math.min(Math.abs(e.deltaY) / 50, 1);
      const base = 1 + 0.4 * Math.max(0.2, intensity);
      zoomBy(e.deltaY < 0 ? base : 1 / base);
    };

    let lastPinch = 0;
    const pinchDist = (t: TouchList) => {
      const dx = t[0].clientX - t[1].clientX;
      const dy = t[0].clientY - t[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) lastPinch = pinchDist(e.touches);
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 2) return;
      e.preventDefault();
      const dist = pinchDist(e.touches);
      if (lastPinch > 0) zoomBy(dist / lastPinch);
      lastPinch = dist;
    };
    const onTouchEnd = () => { lastPinch = 0; };

    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);
    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  const showTip = (cluster: Cluster, target: SVGGElement) => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    // Read the rendered position, so the tooltip tracks the pan/zoom transform.
    const markerBox = target.getBoundingClientRect();
    const wrapBox = wrap.getBoundingClientRect();
    setHover({
      cluster,
      x: markerBox.left - wrapBox.left + markerBox.width / 2,
      y: markerBox.top - wrapBox.top,
    });
  };

  const clusterKey = (c: Cluster) => `${c.lat.toFixed(3)},${c.lng.toFixed(3)}`;

  // Scale is tuned so the full world fills the container width at zoom 1.
  const projectionScale = size.width / 6.6;

  const tipWidth = 200;
  const tipLeft = hover ? Math.min(size.width - tipWidth - 8, Math.max(8, hover.x - tipWidth / 2)) : 0;
  const tipAbove = hover ? hover.y > 110 : true;

  return (
    <Paper
      p="md" radius="md"
      style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}`, height: '100%' }}
    >
      <Group justify="space-between" mb="sm" wrap="nowrap" align="center">
        <Group gap="xs" wrap="nowrap">
          <IconWorld size={16} style={{ color: SERIES[0] }} />
          <Text fw={600} size="sm">Where visitors are</Text>
        </Group>
        <Group gap="xs" wrap="nowrap">
          <SegmentedControl
            size="xs"
            value={metric}
            onChange={(v) => setMetric(v as Metric)}
            data={[
              { value: 'visits', label: 'Views' },
              { value: 'visitors', label: 'Visitors' },
            ]}
          />
          <Tooltip label="Zoom in" withArrow>
            <ActionIcon variant="default" size="sm" onClick={() => zoomBy(1.6)} aria-label="Zoom in">
              <IconPlus size={14} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Zoom out" withArrow>
            <ActionIcon variant="default" size="sm" onClick={() => zoomBy(1 / 1.6)} aria-label="Zoom out">
              <IconMinus size={14} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Reset view" withArrow>
            <ActionIcon variant="default" size="sm" onClick={reset} aria-label="Reset view">
              <IconFocus2 size={14} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>

      <div
        ref={wrapRef}
        style={{
          position: 'relative',
          width: '100%',
          borderRadius: 8,
          overflow: 'hidden',
          border: `1px solid ${BORDER}`,
          opacity: stale ? 0.5 : 1,
          transition: 'opacity 120ms',
          cursor: 'grab',
        }}
      >
        <ComposableMap
          width={size.width}
          height={size.height}
          projection="geoMercator"
          projectionConfig={{ scale: projectionScale, center: [0, 22] }}
          style={{ backgroundColor: OCEAN, display: 'block', width: '100%', height: 'auto' }}
        >
          <defs>
            <radialGradient id="markerGlow">
              <stop offset="0%" stopColor={SERIES[0]} stopOpacity={0.45} />
              <stop offset="100%" stopColor={SERIES[0]} stopOpacity={0} />
            </radialGradient>
          </defs>

          <ZoomableGroup
            zoom={view.zoom}
            center={view.coordinates}
            minZoom={MIN_ZOOM}
            maxZoom={MAX_ZOOM}
            onMoveEnd={(pos) => setView({ coordinates: pos.coordinates, zoom: pos.zoom })}
          >
            <Geographies geography={WORLD_URL}>
              {({ geographies }) =>
                geographies.map((geo) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={LAND}
                    stroke={LAND_STROKE}
                    strokeWidth={0.5 / view.zoom}
                    style={{
                      default: { outline: 'none' },
                      hover: { fill: LAND_HOVER, outline: 'none' },
                      pressed: { fill: LAND_HOVER, outline: 'none' },
                    }}
                  />
                ))
              }
            </Geographies>

            {/* US state outlines only earn their ink once you're zoomed in. */}
            {view.zoom >= 2 && (
              <Geographies geography={US_STATES_URL}>
                {({ geographies }) =>
                  geographies.map((geo) => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill="none"
                      stroke={LAND_STROKE}
                      strokeWidth={0.3 / view.zoom}
                      style={{ default: { outline: 'none' }, hover: { outline: 'none' }, pressed: { outline: 'none' } }}
                    />
                  ))
                }
              </Geographies>
            )}

            {REFERENCE_CITIES.filter((c) => view.zoom >= c.minZoom).map((city) => {
              // Counter the zoom transform so labels hold a steady visual size.
              const s = Math.pow(view.zoom, 0.78);
              return (
                <Marker key={city.name} coordinates={[city.lng, city.lat]}>
                  <circle r={1.1 / s} fill="#7d7d7d" />
                  <text
                    textAnchor="middle"
                    y={-3.6 / s}
                    style={{
                      fontSize: `${7.5 / s}px`,
                      fill: '#9a9a9a',
                      fontFamily: 'system-ui, sans-serif',
                      pointerEvents: 'none',
                      userSelect: 'none',
                      paintOrder: 'stroke',
                      stroke: OCEAN,
                      strokeWidth: 1.6 / s,
                      strokeLinejoin: 'round',
                    }}
                  >
                    {city.name}
                  </text>
                </Marker>
              );
            })}

            {clusters.map((c) => {
              const value = metric === 'visits' ? c.visits : c.visitors;
              // Area-proportional: radius by sqrt so a 4× value looks 4× as big.
              const r = (3 + Math.sqrt(value / maxMetric) * 11) / view.zoom;
              const key = clusterKey(c);
              const isActive = selected === key || hover?.cluster === c;
              return (
                <Marker key={key} coordinates={[c.lng, c.lat]}>
                  <g
                    tabIndex={0}
                    role="button"
                    aria-label={`${c.label}: ${formatExact(value)} ${
                      metric === 'visits'
                        ? value === 1 ? 'view' : 'views'
                        : value === 1 ? 'visitor' : 'visitors'
                    }`}
                    style={{ cursor: 'pointer', outline: 'none' }}
                    onMouseEnter={(e) => showTip(c, e.currentTarget)}
                    onFocus={(e) => showTip(c, e.currentTarget)}
                    onMouseLeave={() => setHover(null)}
                    onBlur={() => setHover(null)}
                    onClick={() => {
                      setSelected(key);
                      setView((v) => ({
                        coordinates: [c.lng, c.lat],
                        zoom: Math.min(MAX_ZOOM, Math.max(v.zoom * 2.5, 4)),
                      }));
                    }}
                  >
                    {/* Transparent hit area — the painted dot alone is too small to aim at. */}
                    <circle r={Math.max(r * 2.4, 14 / view.zoom)} fill="transparent" />
                    <circle r={r * 2.4} fill="url(#markerGlow)" />
                    <circle
                      r={r}
                      fill={rampColor(value, maxMetric)}
                      fillOpacity={0.92}
                      stroke={isActive ? INK : '#c084fc'}
                      strokeWidth={(isActive ? 1.6 : 0.6) / view.zoom}
                    />
                  </g>
                </Marker>
              );
            })}
          </ZoomableGroup>
        </ComposableMap>

        {hover && (
          <div
            style={{
              position: 'absolute',
              left: tipLeft,
              top: tipAbove ? hover.y - 96 : hover.y + 24,
              width: tipWidth,
              pointerEvents: 'none',
              backgroundColor: '#1c1c1c',
              border: '1px solid #383838',
              borderRadius: 6,
              padding: '8px 10px',
              boxShadow: '0 6px 18px rgba(0,0,0,0.55)',
              zIndex: 5,
            }}
          >
            <div style={{ fontSize: 12, color: INK, fontWeight: 600 }}>{hover.cluster.label}</div>
            {hover.cluster.sub && (
              <div style={{ fontSize: 10, color: INK_MUTED, marginBottom: 6 }}>{hover.cluster.sub}</div>
            )}
            {/* Values lead, labels follow. */}
            <div style={{ fontSize: 12, color: INK, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
              {formatExact(hover.cluster.visits)}{' '}
              <span style={{ color: INK_MUTED, fontWeight: 400 }}>views</span>
            </div>
            <div style={{ fontSize: 12, color: INK, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
              {formatExact(hover.cluster.visitors)}{' '}
              <span style={{ color: INK_MUTED, fontWeight: 400 }}>unique visitors</span>
            </div>
            {geoViews > 0 && (
              <div style={{ fontSize: 10, color: INK_MUTED, marginTop: 4 }}>
                {formatPercent(hover.cluster.visits / geoViews, 1)} of located traffic
              </div>
            )}
          </div>
        )}

        {locations.length === 0 && (
          <div
            style={{
              position: 'absolute', inset: 0, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              backgroundColor: 'rgba(10,10,10,0.55)',
            }}
          >
            <Text size="sm" c="dimmed">No geolocated visitors in this period.</Text>
          </div>
        )}
      </div>

      <Group justify="space-between" mt="sm" wrap="nowrap" align="center">
        <Group gap="xs" wrap="nowrap">
          <Text size="10px" c="dimmed">Fewer</Text>
          {SEQUENTIAL.map((c) => (
            <span key={c} style={{ width: 12, height: 8, borderRadius: 2, backgroundColor: c }} />
          ))}
          <Text size="10px" c="dimmed">More · marker area ∝ {metric === 'visits' ? 'views' : 'visitors'}</Text>
        </Group>
        <Text size="10px" c="dimmed">
          {formatExact(geoViews)} of {formatExact(totalViews)} views located
          {ungeolocatedVisitors > 0 && ` · ${formatExact(ungeolocatedVisitors)} visitor${ungeolocatedVisitors === 1 ? '' : 's'} not geolocated`}
        </Text>
      </Group>

      {/* Table view: every marker's value reachable without hovering. */}
      {locations.length > 0 && (
        <Stack gap={6} mt="sm" style={{ maxHeight: 148, overflowY: 'auto' }}>
          {locations.slice(0, 12).map((loc) => {
            const key = `${loc.lat.toFixed(3)},${loc.lng.toFixed(3)}`;
            return (
              <Group
                key={`${loc.city}-${key}`}
                justify="space-between" gap="xs" wrap="nowrap"
                onClick={() => {
                  setSelected(key);
                  setView({ coordinates: [loc.lng, loc.lat], zoom: 8 });
                }}
                style={{
                  cursor: 'pointer', padding: '3px 6px', borderRadius: 4,
                  backgroundColor: selected === key ? '#1f1b33' : 'transparent',
                }}
              >
                <Group gap={6} wrap="nowrap" style={{ minWidth: 0 }}>
                  <IconMapPin size={12} style={{ color: SERIES[0], flexShrink: 0 }} />
                  <Text size="xs" truncate>{loc.city}</Text>
                  <Text size="10px" c="dimmed" style={{ flexShrink: 0 }}>{loc.countryCode}</Text>
                </Group>
                <Group gap={8} wrap="nowrap" style={{ flexShrink: 0 }}>
                  <Text size="10px" c="dimmed" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {formatExact(loc.uniqueVisitors)}u
                  </Text>
                  <Text size="xs" fw={600} style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {formatExact(loc.totalVisits)}
                  </Text>
                </Group>
              </Group>
            );
          })}
        </Stack>
      )}

      {selected && (
        <Button
          variant="subtle" color="gray" size="compact-xs" mt={6}
          onClick={() => { setSelected(null); reset(); }}
        >
          Clear selection
        </Button>
      )}
    </Paper>
  );
}
