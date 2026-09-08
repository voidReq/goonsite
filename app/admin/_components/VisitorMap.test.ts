import { describe, it, expect } from 'vitest';
import { clusterLocations, CLUSTER_PX, MAX_ZOOM } from './VisitorMap';
import type { LocationStat } from '@/lib/analytics';

/** Projection scale the component uses for a 1536px-wide map. */
const SCALE = 1536 / 6.6;

const loc = (
  city: string, lat: number, lng: number, visits: number, visitorIds: number[],
): LocationStat => ({
  id: `${city}|${lat},${lng}|US`,
  lat, lng, city, region: '', country: 'United States', countryCode: 'US',
  totalVisits: visits, uniqueVisitors: visitorIds.length, visitorIds,
});

// Two cities inside one metro — 0.22 projected units apart.
const BOSTON = loc('Boston', 42.3601, -71.0589, 400, [1, 2, 3]);
const CAMBRIDGE = loc('Cambridge', 42.3736, -71.1097, 130, [3, 4]);
// Far away on every axis.
const LONDON = loc('London', 51.5074, -0.1278, 99, [5]);
const SYDNEY = loc('Sydney', -33.8688, 151.2093, 18, [6]);

describe('clusterLocations', () => {
  it('merges same-metro cities when zoomed out', () => {
    const clusters = clusterLocations([BOSTON, CAMBRIDGE], 1, SCALE);
    expect(clusters).toHaveLength(1);
    expect(clusters[0].count).toBe(2);
    expect(clusters[0].visits).toBe(530);
  });

  it('splits same-metro cities once they are far enough apart on screen', () => {
    // The regression: with a fixed degree grid these never separated at any
    // reachable zoom. They clear the 26px threshold past zoom ~128.
    expect(clusterLocations([BOSTON, CAMBRIDGE], 64, SCALE)).toHaveLength(1);
    expect(clusterLocations([BOSTON, CAMBRIDGE], 200, SCALE)).toHaveLength(2);
  });

  it('reaches the split zoom within the zoom ceiling', () => {
    // Guards against lowering MAX_ZOOM back below the point where a metro splits.
    const splitZoom = [...Array(400).keys()]
      .map((i) => i + 1)
      .find((z) => clusterLocations([BOSTON, CAMBRIDGE], z, SCALE).length === 2);
    expect(splitZoom).toBeDefined();
    expect(splitZoom!).toBeLessThan(MAX_ZOOM);
  });

  it('splits on projected distance, not on grid-cell boundaries', () => {
    // A degree grid split whichever pair straddled a boundary. Two pairs the
    // same distance apart must behave identically wherever they sit.
    const nudge = 0.0001;
    const a1 = loc('A1', 42.0, -71.0, 10, [1]);
    const a2 = loc('A2', 42.0, -71.0 - 0.05, 10, [2]);
    // Same separation, but positioned to straddle a 12/zoom cell edge.
    const b1 = loc('B1', 42.0, -72.0 + nudge, 10, [3]);
    const b2 = loc('B2', 42.0, -72.0 - 0.05 + nudge, 10, [4]);

    for (const zoom of [1, 8, 32, 64, 128, 256]) {
      const a = clusterLocations([a1, a2], zoom, SCALE).length;
      const b = clusterLocations([b1, b2], zoom, SCALE).length;
      expect(a, `zoom ${zoom}`).toBe(b);
    }
  });

  it('keeps distant cities separate at every zoom', () => {
    for (const zoom of [1, 4, 64, 400]) {
      expect(clusterLocations([BOSTON, LONDON, SYDNEY], zoom, SCALE)).toHaveLength(3);
    }
  });

  it('unions visitor ids rather than summing per-location uniques', () => {
    // Visitor 3 appears in both cities, so the cluster holds 4 people, not 5.
    const [cluster] = clusterLocations([BOSTON, CAMBRIDGE], 1, SCALE);
    expect(cluster.visitors).toBe(4);
    expect(BOSTON.uniqueVisitors + CAMBRIDGE.uniqueVisitors).toBe(5);
  });

  it('anchors the marker on the busiest city, not a centroid', () => {
    const [cluster] = clusterLocations([CAMBRIDGE, BOSTON], 1, SCALE);
    expect(cluster.city).toBe('Boston');
    expect(cluster.lat).toBe(BOSTON.lat);
    expect(cluster.lng).toBe(BOSTON.lng);
  });

  it('labels a cluster so it reads as splittable, and a lone city plainly', () => {
    const [merged] = clusterLocations([BOSTON, CAMBRIDGE], 1, SCALE);
    expect(merged.label).toBe('Boston + 1 more');
    expect(merged.sub).toContain('click to split');

    const [single] = clusterLocations([BOSTON], 1, SCALE);
    expect(single.label).toBe('Boston');
    expect(single.count).toBe(1);
    expect(single.sub).not.toContain('click to split');
  });

  it('paints larger markers last so they do not hide smaller ones', () => {
    const clusters = clusterLocations([BOSTON, LONDON, SYDNEY], 400, SCALE);
    const visits = clusters.map((c) => c.visits);
    expect(visits).toEqual([...visits].sort((a, b) => a - b));
  });

  it('reports the zoom at which a cluster actually comes apart', () => {
    const [cluster] = clusterLocations([BOSTON, CAMBRIDGE], 1, SCALE);
    expect(cluster.splitZoom).not.toBeNull();

    // Clicking jumps to splitZoom, so that one jump must be enough.
    const atSplit = clusterLocations([BOSTON, CAMBRIDGE], cluster.splitZoom!, SCALE);
    expect(atSplit).toHaveLength(2);
  });

  it('leaves splitZoom null for a lone location', () => {
    const [cluster] = clusterLocations([BOSTON], 1, SCALE);
    expect(cluster.splitZoom).toBeNull();
  });

  it('derives splitZoom from the closest pair, not the widest', () => {
    // Adding a far-flung third member must not delay the first split.
    const pair = clusterLocations([BOSTON, CAMBRIDGE], 1, SCALE)[0];
    const withDistant = clusterLocations(
      [BOSTON, CAMBRIDGE, loc('Providence', 41.824, -71.4128, 5, [9])], 1, SCALE,
    )[0];
    expect(withDistant.count).toBe(3);
    // Closest pair is still Boston/Cambridge, so the split zoom is unchanged.
    expect(withDistant.splitZoom).toBeCloseTo(pair.splitZoom!, 5);
    // And one click does separate something.
    expect(clusterLocations(
      [BOSTON, CAMBRIDGE, loc('Providence', 41.824, -71.4128, 5, [9])],
      withDistant.splitZoom!, SCALE,
    ).length).toBeGreaterThan(1);
  });

  it('caps splitZoom at the zoom ceiling for coincident locations', () => {
    // Two records on identical coordinates can never separate; splitZoom must
    // stay finite rather than becoming Infinity.
    const twin = loc('Twin', BOSTON.lat, BOSTON.lng, 5, [9]);
    const [cluster] = clusterLocations([BOSTON, twin], 1, SCALE);
    expect(cluster.count).toBe(2);
    expect(cluster.splitZoom).toBeNull();
  });

  it('identifies a cluster by its anchor id, not a rounded coordinate', () => {
    // Two distinct places can share a name and round to the same centroid;
    // keying display on coordinates produced duplicate React keys.
    const [cluster] = clusterLocations([BOSTON, CAMBRIDGE], 1, SCALE);
    expect(cluster.id).toBe(BOSTON.id);

    const ids = clusterLocations([BOSTON, CAMBRIDGE, LONDON, SYDNEY], 400, SCALE).map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('matches a brute-force pairwise clusterer on randomised input', () => {
    // The spatial grid is an optimisation, not a behaviour change: its output
    // must be identical to comparing every pair.
    let seed = 20260908;
    const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;

    const bruteForce = (locs: LocationStat[], zoom: number) => {
      const scale = SCALE;
      const threshold = CLUSTER_PX / zoom;
      const project = (lng: number, lat: number) => {
        const l = Math.max(-85, Math.min(85, lat));
        return [
          (scale * lng * Math.PI) / 180,
          -scale * Math.log(Math.tan(Math.PI / 4 + (l * Math.PI) / 360)),
        ] as const;
      };
      const pts = locs
        .map((loc) => { const [x, y] = project(loc.lng, loc.lat); return { loc, x, y }; })
        .sort((a, b) => b.loc.totalVisits - a.loc.totalVisits);
      const taken = new Array(pts.length).fill(false);
      const out: { id: string; count: number; visits: number }[] = [];
      for (let i = 0; i < pts.length; i++) {
        if (taken[i]) continue;
        taken[i] = true;
        const group = [pts[i]];
        for (let j = i + 1; j < pts.length; j++) {
          if (taken[j]) continue;
          if (Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y) <= threshold) {
            taken[j] = true;
            group.push(pts[j]);
          }
        }
        out.push({
          id: pts[i].loc.id,
          count: group.length,
          visits: group.reduce((sum, g) => sum + g.loc.totalVisits, 0),
        });
      }
      return out.sort((a, b) => a.id.localeCompare(b.id));
    };

    for (let trial = 0; trial < 12; trial++) {
      // Deliberately clumpy, so clusters actually form and straddle cells.
      const locs: LocationStat[] = [];
      for (let c = 0; c < 14; c++) {
        const baseLat = rnd() * 140 - 70;
        const baseLng = rnd() * 340 - 170;
        for (let k = 0; k < 1 + Math.floor(rnd() * 7); k++) {
          locs.push(loc(
            `c${c}k${k}`,
            baseLat + (rnd() - 0.5) * 2,
            baseLng + (rnd() - 0.5) * 2,
            1 + Math.floor(rnd() * 400),
            [locs.length],
          ));
        }
      }

      for (const zoom of [1, 3, 12, 60, 250]) {
        const fast = clusterLocations(locs, zoom, SCALE)
          .map((c) => ({ id: c.id, count: c.count, visits: c.visits }))
          .sort((a, b) => a.id.localeCompare(b.id));
        expect(fast, `trial ${trial} zoom ${zoom}`).toEqual(bruteForce(locs, zoom));
      }
    }
  });

  it('handles an empty list', () => {
    expect(clusterLocations([], 1, SCALE)).toEqual([]);
  });

  it('does not lose or duplicate any location', () => {
    const all = [BOSTON, CAMBRIDGE, LONDON, SYDNEY];
    for (const zoom of [1, 16, 128, 400]) {
      const clusters = clusterLocations(all, zoom, SCALE);
      expect(clusters.reduce((s, c) => s + c.count, 0)).toBe(all.length);
      expect(clusters.reduce((s, c) => s + c.visits, 0)).toBe(647);
    }
  });

  it('clusters by a screen-space threshold, so it holds across zoom', () => {
    // Points just inside / just outside the threshold at a given zoom.
    const zoom = 100;
    const unitsPerDeg = (SCALE * Math.PI) / 180;
    const inside = (CLUSTER_PX / zoom / unitsPerDeg) * 0.8;
    const outside = (CLUSTER_PX / zoom / unitsPerDeg) * 1.5;

    const base = loc('Base', 0, 0, 10, [1]);
    expect(clusterLocations([base, loc('Near', 0, inside, 5, [2])], zoom, SCALE)).toHaveLength(1);
    expect(clusterLocations([base, loc('Far', 0, outside, 5, [2])], zoom, SCALE)).toHaveLength(2);
  });

  it('does not merge distant points at high latitude', () => {
    // A fixed degree grid merged these; longitude degrees are narrow up north,
    // but the mercator projection stretches them back out on screen.
    const oslo = loc('Oslo', 59.91, 10.75, 10, [1]);
    const stockholm = loc('Stockholm', 59.33, 18.07, 10, [2]);
    expect(clusterLocations([oslo, stockholm], 4, SCALE)).toHaveLength(2);
  });
});
