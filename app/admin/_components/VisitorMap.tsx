'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Paper, Text, Group, Stack, Button, ActionIcon, Tooltip, SegmentedControl, TextInput,
} from '@mantine/core';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps';
import { IconPlus, IconMinus, IconFocus2, IconMapPin, IconWorld, IconSearch } from '@tabler/icons-react';
import type { LocationStat } from '@/lib/analytics';
import { REFERENCE_CITIES } from './map-cities';
import type { ChartTheme } from './theme';
import { markerColor, formatExact, formatPercent } from './theme';
import { useChartTheme } from './useChartTheme';

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

type Metric = 'visits' | 'visitors';

export interface Cluster {
  lat: number;
  lng: number;
  label: string;
  sub: string;
  /** Anchor city on its own, for the on-map label. */
  city: string;
  /** Anchor location's stable id — used for React keys and selection. */
  id: string;
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
 * Zoom value the marker set is built at, snapped to 1/8-octave steps.
 *
 * A wheel gesture emits a continuous stream of zoom values; rebuilding clusters
 * for every one of them is wasted work, since the grouping only changes at
 * meaningful scale changes. The SVG transform still uses the exact zoom, so
 * motion stays smooth. Snapping can only round down by 2^(1/16) = 1.044, well
 * inside the 1.25 overshoot splitZoom carries, so click-to-split still lands.
 */
export function clusterZoomFor(zoom: number): number {
  return Math.pow(2, Math.round(Math.log2(zoom) * 8) / 8);
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

  // Spatial hash so each point only tests its own cell and the eight around it.
  // Cell size equals the threshold, so nothing within range can be further than
  // one cell away — same result as comparing every pair, without the O(n^2)
  // scan that made fast zooming stutter at ~1,700 locations.
  const grid = new Map<string, number[]>();
  const cellOf = (x: number, y: number) => `${Math.floor(x / threshold)}:${Math.floor(y / threshold)}`;
  points.forEach((p, i) => {
    const key = cellOf(p.x, p.y);
    const bucket = grid.get(key);
    if (bucket) bucket.push(i); else grid.set(key, [i]);
  });

  const taken = new Array(points.length).fill(false);
  const clusters: Cluster[] = [];

  for (let i = 0; i < points.length; i++) {
    if (taken[i]) continue;
    taken[i] = true;

    const anchor = points[i];
    const group = [anchor];

    const cx = Math.floor(anchor.x / threshold);
    const cy = Math.floor(anchor.y / threshold);
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const bucket = grid.get(`${cx + dx}:${cy + dy}`);
        if (!bucket) continue;
        for (const j of bucket) {
          if (taken[j]) continue;
          if (Math.hypot(anchor.x - points[j].x, anchor.y - points[j].y) <= threshold) {
            taken[j] = true;
            group.push(points[j]);
          }
        }
      }
    }

    const members = group.map((g) => g.loc);

    // Union visitor ids — summing per-location uniques would double-count
    // anyone who shows up in two nearby cities.
    const ids = new Set<number>();
    for (const m of members) for (const id of m.visitorIds) ids.add(id);

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

    clusters.push({
      id: anchor.loc.id,
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
  const t = useChartTheme();
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

  const clusterZoom = clusterZoomFor(view.zoom);
  const clusters = useMemo(
    () => clusterLocations(locations, clusterZoom, projectionScale),
    [locations, clusterZoom, projectionScale],
  );
  const maxMetric = Math.max(1, ...clusters.map((c) => (metric === 'visits' ? c.visits : c.visitors)));

  /**
   * Only the markers actually on screen.
   *
   * ZoomableGroup renders whatever it is handed, so at deep zoom every one of
   * ~1,700 markers stayed mounted while a handful were visible — roughly 8,000
   * SVG nodes for a view containing five.
   *
   * The kept region is twice the viewport in each direction. ZoomableGroup only
   * reports a new centre on move *end*, so during a drag this centre is stale;
   * a tight margin would leave the area you pan into blank until you let go.
   * One viewport of slack in every direction covers any realistic drag while
   * still discarding the vast majority of markers when zoomed in.
   */
  const visibleClusters = useMemo(() => {
    const [cx, cy] = projectMercator(view.coordinates[0], view.coordinates[1], projectionScale);
    const halfW = size.width / view.zoom;
    const halfH = size.height / view.zoom;
    return clusters.filter((c) => {
      const [x, y] = projectMercator(c.lng, c.lat, projectionScale);
      return Math.abs(x - cx) <= halfW && Math.abs(y - cy) <= halfH;
    });
  }, [clusters, view.coordinates, view.zoom, projectionScale, size.width, size.height]);

  /**
   * Reference labels that no data marker is already speaking for.
   *
   * The busiest cities are exactly where markers land, so the two label sets
   * compete for the same pixels — "London" was rendering straight through its
   * own marker's count. The data marker wins; its neighbour's label is dropped.
   */
  const referenceCities = useMemo(() => {
    const markers = visibleClusters.map((c) => projectMercator(c.lng, c.lat, projectionScale));
    const minGap = 44 / view.zoom;
    return REFERENCE_CITIES.filter((city) => {
      if (view.zoom < city.minZoom) return false;
      const [cx, cy] = projectMercator(city.lng, city.lat, projectionScale);
      return !markers.some(([x, y]) => Math.hypot(cx - x, cy - y) < minGap);
    });
  }, [visibleClusters, view.zoom, projectionScale]);
  const geoViews = locations.reduce((s, l) => s + l.totalVisits, 0);

  const zoomBy = (factor: number) =>
    setView((v) => ({ ...v, zoom: Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, v.zoom * factor)) }));

  // The wheel listener is bound once, so it reads the live zoom from a ref.
  const zoomRef = useRef(view.zoom);
  zoomRef.current = view.zoom;

  const reset = () => setView({ coordinates: [10, 22], zoom: 1 });

  // Stable identity, so LocationList's memo survives the parent re-rendering
  // on every zoom change. Reads the live zoom through the state updater rather
  // than closing over it.
  const selectLocation = useCallback((loc: LocationStat) => {
    setSelected(loc.id);
    setView((v) => ({ coordinates: [loc.lng, loc.lat], zoom: Math.max(8, v.zoom) }));
  }, []);

  // Wheel and pinch zoom, bound to the container so the page doesn't scroll.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    // Wheel events outrun the display, so accumulate them and commit once per
    // frame. Without this, a fast scroll queued a re-render per event and the
    // map visibly stuttered.
    let queued: number | null = null;
    let frame: number | null = null;
    const commit = () => {
      frame = null;
      const next = queued;
      queued = null;
      if (next != null) setView((v) => ({ ...v, zoom: next }));
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      // Trackpads send small deltas; scale the step by how hard the user scrolled.
      const intensity = Math.min(Math.abs(e.deltaY) / 50, 1);
      const base = 1 + 0.4 * Math.max(0.2, intensity);
      const factor = e.deltaY < 0 ? base : 1 / base;
      const from = queued ?? zoomRef.current;
      queued = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, from * factor));
      if (frame == null) frame = requestAnimationFrame(commit);
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
      if (lastPinch > 0) {
        const from = queued ?? zoomRef.current;
        queued = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, from * (dist / lastPinch)));
        if (frame == null) frame = requestAnimationFrame(commit);
      }
      lastPinch = dist;
    };
    const onTouchEnd = () => { lastPinch = 0; };

    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);
    return () => {
      if (frame != null) cancelAnimationFrame(frame);
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

  const tipWidth = 200;
  const tipLeft = hover ? Math.min(size.width - tipWidth - 8, Math.max(8, hover.x - tipWidth / 2)) : 0;
  const tipAbove = hover ? hover.y > 110 : true;

  return (
    <Paper
      p="md" radius="md"
      style={{ backgroundColor: t.surface, border: `1px solid ${t.border}`, height: '100%' }}
    >
      <Group justify="space-between" mb="sm" wrap="nowrap" align="center">
        <Group gap="xs" wrap="nowrap">
          <IconWorld size={16} style={{ color: t.series[0] }} />
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
          border: `1px solid ${t.border}`,
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
          style={{ backgroundColor: t.map.ocean, display: 'block', width: '100%', height: 'auto' }}
        >
          <defs>
            <radialGradient id="markerGlow">
              <stop offset="0%" stopColor={t.series[0]} stopOpacity={0.45} />
              <stop offset="100%" stopColor={t.series[0]} stopOpacity={0} />
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
                    fill={t.map.land}
                    stroke={t.map.landStroke}
                    strokeWidth={0.5 / view.zoom}
                    style={{
                      default: { outline: 'none' },
                      hover: { fill: t.map.landHover, outline: 'none' },
                      pressed: { fill: t.map.landHover, outline: 'none' },
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
                      stroke={t.map.landStroke}
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
                  <circle r={1.5 / s} fill={t.map.cityDot} />
                  <text
                    textAnchor="middle"
                    y={-4.5 / s}
                    style={{
                      fontSize: `${9 / s}px`,
                      fill: t.map.cityLabel,
                      fontFamily: 'system-ui, sans-serif',
                      pointerEvents: 'none',
                      userSelect: 'none',
                      paintOrder: 'stroke',
                      stroke: t.map.ocean,
                      strokeWidth: 3 / s,
                      strokeLinejoin: 'round',
                    }}
                  >
                    {city.name}
                  </text>
                </Marker>
              );
            })}

            {visibleClusters.map((c) => {
              const value = metric === 'visits' ? c.visits : c.visitors;
              // Radius by sqrt of the value, floored so the quietest city is
              // still findable and clickable rather than a sub-pixel speck.
              const rPx = MIN_MARKER_PX + Math.sqrt(value / maxMetric) * (MAX_MARKER_PX - MIN_MARKER_PX);
              const r = rPx / view.zoom;
              const key = c.id;
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
                      fill={markerColor(t, value, maxMetric)}
                      fillOpacity={0.92}
                      stroke={isActive ? t.ink : t.markerRamp[t.markerRamp.length - 1]}
                      strokeWidth={(isActive ? 1.6 : 0.6) / view.zoom}
                    />
                    {/* A second ring reads as "there is more inside this one". */}
                    {c.count > 1 && (
                      <circle
                        r={r * 1.5}
                        fill="none"
                        stroke={markerColor(t, value, maxMetric)}
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
                          fill: t.ink,
                          fontFamily: 'system-ui, sans-serif',
                          fontWeight: 600,
                          pointerEvents: 'none',
                          userSelect: 'none',
                          paintOrder: 'stroke',
                          stroke: t.map.ocean,
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
              backgroundColor: t.tooltipSurface,
              border: `1px solid ${t.tooltipBorder}`,
              borderRadius: 6,
              padding: '8px 10px',
              boxShadow: '0 6px 18px rgba(0,0,0,0.55)',
              zIndex: 5,
            }}
          >
            <div style={{ fontSize: 12, color: t.ink, fontWeight: 600 }}>{hover.cluster.label}</div>
            {hover.cluster.sub && (
              <div style={{ fontSize: 10, color: t.inkMuted, marginBottom: 6 }}>{hover.cluster.sub}</div>
            )}
            {/* Values lead, labels follow. */}
            <div style={{ fontSize: 12, color: t.ink, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
              {formatExact(hover.cluster.visits)}{' '}
              <span style={{ color: t.inkMuted, fontWeight: 400 }}>views</span>
            </div>
            <div style={{ fontSize: 12, color: t.ink, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
              {formatExact(hover.cluster.visitors)}{' '}
              <span style={{ color: t.inkMuted, fontWeight: 400 }}>unique visitors</span>
            </div>
            {geoViews > 0 && (
              <div style={{ fontSize: 10, color: t.inkMuted, marginTop: 4 }}>
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
              backgroundColor: t.mode === 'light' ? 'rgba(245,245,247,0.7)' : 'rgba(10,10,10,0.55)',
            }}
          >
            <Text size="sm" c="dimmed">No geolocated visitors in this period.</Text>
          </div>
        )}
      </div>

      <Group justify="space-between" mt="sm" wrap="nowrap" align="center">
        <Group gap="xs" wrap="nowrap">
          <Text size="10px" c="dimmed">Fewer</Text>
          {t.markerRamp.map((c) => (
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
      <LocationList
        locations={locations}
        selectedId={selected}
        onSelect={selectLocation}
      />

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


interface LocationListProps {
  locations: LocationStat[];
  selectedId: string | null;
  onSelect: (loc: LocationStat) => void;
}

/**
 * The map's table view: every place reachable without hovering a marker.
 *
 * Owns its own filter state so typing re-renders only this list. Held in the
 * parent, each keystroke re-rendered the whole marker layer — which is what
 * made the search box feel sluggish on a real dataset of ~1,700 places.
 *
 * Rows are uncapped and scrollable; a fixed top-N hid the long tail, which is
 * exactly where you look when hunting one specific city.
 */
/**
 * Rows rendered at once. The scroll area shows about five, so mounting all
 * ~1,700 places just to keep them scrollable cost ~37ms per keystroke. The
 * filter still runs over every place; only the rendering is bounded.
 */
const LIST_RENDER_LIMIT = 60;

const LocationList = React.memo(function LocationList({
  locations, selectedId, onSelect,
}: LocationListProps) {
  const t = useChartTheme();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return locations;
    return locations.filter((l) =>
      `${l.city} ${l.region} ${l.country} ${l.countryCode}`.toLowerCase().includes(q));
  }, [locations, query]);

  const visible = useMemo(() => filtered.slice(0, LIST_RENDER_LIMIT), [filtered]);

  if (locations.length === 0) return null;

  return (
    <>
      <Group justify="space-between" mt="sm" mb={6} wrap="nowrap" gap="xs">
        <TextInput
          size="xs"
          placeholder="Find a city…"
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
          leftSection={<IconSearch size={13} />}
          style={{ flex: 1 }}
          aria-label="Filter locations"
        />
        <Text size="10px" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
          {filtered.length === locations.length
            ? `${formatExact(locations.length)} places`
            : `${formatExact(filtered.length)} of ${formatExact(locations.length)}`}
        </Text>
      </Group>

      <Stack gap={6} style={{ maxHeight: 148, overflowY: 'auto' }}>
        {filtered.length === 0 && (
          <Text size="xs" c="dimmed">No place matches “{query}” in this period.</Text>
        )}
        {visible.map((loc) => (
          <Group
            key={loc.id}
            justify="space-between" gap="xs" wrap="nowrap"
            onClick={() => onSelect(loc)}
            style={{
              cursor: 'pointer', padding: '3px 6px', borderRadius: 4,
              backgroundColor: selectedId === loc.id ? t.selectedRow : 'transparent',
            }}
          >
            <Group gap={6} wrap="nowrap" style={{ minWidth: 0 }}>
              <IconMapPin size={12} style={{ color: t.series[0], flexShrink: 0 }} />
              <Text size="xs" truncate>{loc.city}</Text>
              {/* Region disambiguates same-named places — three Rochesters,
                  three Portlands — which read identically without it. */}
              {loc.region && loc.region !== loc.city && (
                <Text size="10px" c="dimmed" truncate style={{ minWidth: 0 }}>{loc.region}</Text>
              )}
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
        ))}
        {filtered.length > visible.length && (
          <Text size="10px" c="dimmed" ta="center" py={2}>
            Showing the top {LIST_RENDER_LIMIT} of {formatExact(filtered.length)} — search to narrow it down.
          </Text>
        )}
      </Stack>
    </>
  );
});
