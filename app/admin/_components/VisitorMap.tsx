'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Paper, Text, Group, Stack, Button, ActionIcon, Tooltip, SegmentedControl } from '@mantine/core';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps';
import { IconPlus, IconMinus, IconFocus2, IconMapPin, IconWorld } from '@tabler/icons-react';
import type { LocationStat } from '@/lib/analytics';
import { REFERENCE_CITIES } from './map-cities';
import {
  SURFACE, BORDER, INK, INK_MUTED, MARKER_RAMP, SERIES,
  markerColor, formatExact, formatPercent,
} from './theme';

const WORLD_URL = '/countries-110m.json';
const US_STATES_URL = '/us-states-10m.json';

const MIN_ZOOM = 1;
/**
 * High enough to separate cities inside one metro. Boston and Cambridge sit
 * 0.22 projected units apart, so they only clear the cluster threshold past
 * zoom ~128 — a lower ceiling makes them permanently inseparable.
 */
export const MAX_ZOOM = 400;

/** Locations that would render closer together than this merge into one marker. */
export const CLUSTER_PX = 26;

/** Smallest marker radius in screen px, so a one-visit city stays visible. */
const MIN_MARKER_PX = 4;
const MAX_MARKER_PX = 16;

const LAND = '#1a1f2e';
const LAND_HOVER = '#232940';
const LAND_STROKE = '#2d3548';
const OCEAN = '#0d1117';

type Metric = 'visits' | 'visitors';

export interface Cluster {
  lat: number;
  lng: number;
  label: string;
  sub: string;
  /** Anchor city on its own, for the on-map label. */
  city: string;
  visits: number;
  visitors: number;
  /** Locations merged into this marker. */
  count: number;
  /**
   * Zoom at which this cluster's closest pair clears the threshold, so a click
   * can jump straight to where it comes apart. Null for a lone location.
   */
  splitZoom: number | null;
}

interface VisitorMapProps {
  locations: LocationStat[];
  /** Views with no geo record, surfaced so the map's total is honest. */
  ungeolocatedVisitors: number;
  totalViews: number;
  stale?: boolean;
}

/**
 * Mercator projection into SVG user units, matching what ComposableMap renders
 * with `projection="geoMercator"` at the same scale.
 */
function projectMercator(lng: number, lat: number, scale: number): [number, number] {
  // Clamp near the poles, where the mercator y term diverges.
  const lat_ = Math.max(-85, Math.min(85, lat));
  return [
    (scale * lng * Math.PI) / 180,
    -scale * Math.log(Math.tan(Math.PI / 4 + (lat_ * Math.PI) / 360)),
  ];
}

/**
 * Merge locations that would render closer together than CLUSTER_PX, greedily,
 * largest first — so the busiest location anchors each cluster and the marker
 * sits on a real place rather than a centroid out at sea.
 *
 * Distances are measured in projected space, which is what the reader actually
 * sees. A fixed degree grid (the previous approach) got this wrong twice over:
 * it merged far-apart points at high latitudes, and whether two neighbours
 * split depended on which side of a cell boundary they fell rather than on how
 * far apart they looked.
 */
export function clusterLocations(locations: LocationStat[], zoom: number, scale: number): Cluster[] {
  const threshold = CLUSTER_PX / zoom;

  const points = locations
    .map((loc) => {
      const [x, y] = projectMercator(loc.lng, loc.lat, scale);
      return { loc, x, y };
    })
    .sort((a, b) => b.loc.totalVisits - a.loc.totalVisits);

  const taken = new Array(points.length).fill(false);
  const clusters: Cluster[] = [];

  for (let i = 0; i < points.length; i++) {
    if (taken[i]) continue;
    taken[i] = true;

    const anchor = points[i];
    const group = [anchor];
    for (let j = i + 1; j < points.length; j++) {
      if (taken[j]) continue;
      if (Math.hypot(anchor.x - points[j].x, anchor.y - points[j].y) <= threshold) {
        taken[j] = true;
        group.push(points[j]);
      }
    }
    const members = group.map((g) => g.loc);

    // The closest pair decides when the cluster visibly comes apart.
    let splitZoom: number | null = null;
    if (group.length > 1) {
      let closest = Infinity;
      for (let a = 0; a < group.length; a++) {
        for (let b = a + 1; b < group.length; b++) {
          closest = Math.min(closest, Math.hypot(group[a].x - group[b].x, group[a].y - group[b].y));
        }
      }
      // Overshoot the threshold slightly so the split is unambiguous on screen.
      if (closest > 0 && Number.isFinite(closest)) {
        splitZoom = Math.min(MAX_ZOOM, (CLUSTER_PX / closest) * 1.25);
      }
    }

    // Union visitor ids — summing per-location uniques would double-count
    // anyone who shows up in two nearby cities.
    const ids = new Set<number>();
    for (const m of members) for (const id of m.visitorIds) ids.add(id);

    clusters.push({
      lat: anchor.loc.lat,
      lng: anchor.loc.lng,
      label: members.length === 1
        ? anchor.loc.city
        : `${anchor.loc.city} + ${members.length - 1} more`,
      sub: members.length === 1
        ? [anchor.loc.region, anchor.loc.country].filter(Boolean).join(', ')
        : `${members.length} locations · click to split`,
      city: anchor.loc.city,
      visits: members.reduce((sum, m) => sum + m.totalVisits, 0),
      visitors: ids.size,
      count: members.length,
      splitZoom,
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

  // Scale is tuned so the full world fills the container width at zoom 1.
  const projectionScale = size.width / 6.6;

  const clusters = useMemo(
    () => clusterLocations(locations, view.zoom, projectionScale),
    [locations, view.zoom, projectionScale],
  );
  const maxMetric = Math.max(1, ...clusters.map((c) => (metric === 'visits' ? c.visits : c.visitors)));

  /**
   * Reference labels that no data marker is already speaking for.
   *
   * The busiest cities are exactly where markers land, so the two label sets
   * compete for the same pixels — "London" was rendering straight through its
   * own marker's count. The data marker wins; its neighbour's label is dropped.
   */
  const referenceCities = useMemo(() => {
    const markers = clusters.map((c) => projectMercator(c.lng, c.lat, projectionScale));
    const minGap = 44 / view.zoom;
    return REFERENCE_CITIES.filter((city) => {
      if (view.zoom < city.minZoom) return false;
      const [cx, cy] = projectMercator(city.lng, city.lat, projectionScale);
      return !markers.some(([x, y]) => Math.hypot(cx - x, cy - y) < minGap);
    });
  }, [clusters, view.zoom, projectionScale]);
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

            {referenceCities.map((city) => {
              // Counter the zoom transform exactly, so labels hold a constant
              // screen size at any zoom rather than ballooning when zoomed in.
              const s = view.zoom;
              return (
                <Marker key={city.name} coordinates={[city.lng, city.lat]}>
                  <circle r={1.5 / s} fill="#7d7d7d" />
                  <text
                    textAnchor="middle"
                    y={-4.5 / s}
                    style={{
                      fontSize: `${9 / s}px`,
                      fill: '#9a9a9a',
                      fontFamily: 'system-ui, sans-serif',
                      pointerEvents: 'none',
                      userSelect: 'none',
                      paintOrder: 'stroke',
                      stroke: OCEAN,
                      strokeWidth: 3 / s,
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
              // Radius by sqrt of the value, floored so the quietest city is
              // still findable and clickable rather than a sub-pixel speck.
              const rPx = MIN_MARKER_PX + Math.sqrt(value / maxMetric) * (MAX_MARKER_PX - MIN_MARKER_PX);
              const r = rPx / view.zoom;
              const key = clusterKey(c);
              const isActive = selected === key || hover?.cluster === c;
              // Counter the zoom transform so labels hold a steady screen size.
              const labelPx = 9 / view.zoom;
              // Zoomed all the way out, 19 place names is mush, so markers show
              // only a count of what they hide. Past that they name themselves —
              // the reference-city list can't do it, since the cities with
              // traffic are the same ones it would have labelled.
              const label = view.zoom >= 2
                ? (c.count > 1 ? `${c.city} +${c.count - 1}` : c.city)
                : (c.count > 1 ? `+${c.count - 1}` : null);
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
                        // Jump straight to where this cluster comes apart —
                        // stepping by a fixed factor took many clicks to get
                        // two same-metro cities to separate.
                        zoom: c.splitZoom != null
                          ? Math.max(c.splitZoom, v.zoom)
                          : Math.min(MAX_ZOOM, Math.max(v.zoom * 2.5, 4)),
                      }));
                    }}
                  >
                    {/* Transparent hit area — the painted dot alone is too small to aim at. */}
                    <circle r={Math.max(r * 2.4, 14 / view.zoom)} fill="transparent" />
                    <circle r={r * 2.4} fill="url(#markerGlow)" />
                    <circle
                      r={r}
                      fill={markerColor(value, maxMetric)}
                      fillOpacity={0.92}
                      stroke={isActive ? INK : '#c084fc'}
                      strokeWidth={(isActive ? 1.6 : 0.6) / view.zoom}
                    />
                    {/* A second ring reads as "there is more inside this one". */}
                    {c.count > 1 && (
                      <circle
                        r={r * 1.5}
                        fill="none"
                        stroke={markerColor(value, maxMetric)}
                        strokeOpacity={0.55}
                        strokeWidth={0.8 / view.zoom}
                      />
                    )}
                    {label && (
                      <text
                        textAnchor="middle"
                        y={r * 1.5 + labelPx * 1.5}
                        style={{
                          fontSize: `${labelPx}px`,
                          fill: INK,
                          fontFamily: 'system-ui, sans-serif',
                          fontWeight: 600,
                          pointerEvents: 'none',
                          userSelect: 'none',
                          paintOrder: 'stroke',
                          stroke: OCEAN,
                          strokeWidth: labelPx * 0.4,
                          strokeLinejoin: 'round',
                        }}
                      >
                        {label}
                      </text>
                    )}
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
          {MARKER_RAMP.map((c) => (
            <span key={c} style={{ width: 12, height: 8, borderRadius: 2, backgroundColor: c }} />
          ))}
          <Text size="10px" c="dimmed">
            More · bigger = more {metric === 'visits' ? 'views' : 'visitors'} · ⊚ = several cities, click to split
          </Text>
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
