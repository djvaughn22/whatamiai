"use client";

// The family journey on a map. Map shapes are public-domain Natural Earth and
// US Census data (world-atlas, us-atlas). Town points come from the Census
// Gazetteer. Nothing is fetched from a map service; no place names leave the
// browser.

import { useEffect, useMemo, useRef, useState } from "react";
import { geoAlbers, geoCentroid, geoCircle, geoNaturalEarth1, geoPath, type GeoProjection } from "d3-geo";
import { feature, mesh } from "topojson-client";
import type { Feature, FeatureCollection, Geometry, MultiLineString } from "geojson";
import { useFamily } from "../FamilyProvider";
import { generationLegs, legsFor, stopsFor, type Leg, type Stop } from "../../lib/family/journey";
import { resolvePlace, PRECISION_LABEL, type ResolvedPlace, type StateGaz } from "../../lib/family/places";
import { displayName } from "../../lib/family/names";
import { formatDate } from "../../lib/family/dates";
import type { Id } from "../../lib/family/types";

type Topo = Parameters<typeof feature>[0];
let worldP: Promise<FeatureCollection> | null = null;
let statesP: Promise<{ fc: FeatureCollection; borders: MultiLineString } | null> | null = null;
const gaz = new Map<string, Promise<StateGaz | null>>();

function loadWorld() {
  worldP ??= fetch("/geo/world-110m.json")
    .then((r) => r.json())
    .then((t: Topo & { objects: Record<string, unknown> }) => feature(t, t.objects.countries as never) as unknown as FeatureCollection);
  return worldP;
}
function loadStates() {
  statesP ??= fetch("/geo/us-states-10m.json")
    .then((r) => r.json())
    .then((t: Topo & { objects: Record<string, unknown> }) => ({
      fc: feature(t, t.objects.states as never) as unknown as FeatureCollection,
      borders: mesh(t, t.objects.states as never, (a: unknown, b: unknown) => a !== b) as MultiLineString,
    }))
    .catch(() => null);
  return statesP;
}
function loadState(abbr: string) {
  if (!/^[A-Z]{2}$/.test(abbr)) return Promise.resolve(null);
  if (!gaz.has(abbr)) gaz.set(abbr, fetch(`/geo/us/${abbr}.json`).then((r) => (r.ok ? r.json() : null)).catch(() => null));
  return gaz.get(abbr)!;
}

const RING_DEG: Record<string, number> = { town: 0, county: 0.35, region: 1.6, country: 4 };

export interface Placed {
  stop: Stop;
  at: ResolvedPlace | null;
}

export default function JourneyMap({ people }: { people: Id[] }) {
  const { data } = useFamily();
  const [world, setWorld] = useState<FeatureCollection | null>(null);
  const [states, setStates] = useState<{ fc: FeatureCollection; borders: MultiLineString } | null>(null);
  const [placed, setPlaced] = useState<Map<string, ResolvedPlace | null>>(new Map());
  const [showGen, setShowGen] = useState(true);
  // The map is drawn at the size it's shown, so labels stay readable on phones.
  const box = useRef<HTMLDivElement>(null);
  const [{ W, H }, setSize] = useState({ W: 960, H: 560 });
  useEffect(() => {
    const el = box.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      const w = Math.max(280, Math.round(el.clientWidth));
      setSize({ W: w, H: Math.max(280, Math.round(w * (w < 600 ? 0.95 : 0.58))) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { stops, legs } = useMemo(() => {
    if (!data) return { stops: [] as Stop[], legs: [] as Leg[] };
    const all: Stop[] = [];
    const ls: Leg[] = [];
    for (const id of people) {
      const s = stopsFor(data, id);
      all.push(...s);
      ls.push(...legsFor(s));
    }
    if (showGen) ls.push(...generationLegs(data, people));
    return { stops: all, legs: ls };
  }, [data, people, showGen]);

  useEffect(() => {
    let alive = true;
    loadWorld().then((w) => alive && setWorld(w));
    loadStates().then((s) => alive && setStates(s));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!world) return;
    let alive = true;
    const center = (name: string): [number, number] | undefined => {
      const f = world.features.find((x) => (x.properties as { name?: string } | null)?.name === name);
      return f ? (geoCentroid(f) as [number, number]) : undefined;
    };
    const places = [...new Set(stops.map((s) => s.place))];
    Promise.all(places.map(async (p) => [p, await resolvePlace(p, { state: loadState, countryCenter: center })] as const)).then((rows) => {
      if (alive) setPlaced(new Map(rows));
    });
    return () => {
      alive = false;
    };
  }, [stops, world]);

  const view = useMemo(() => {
    const pts = [...placed.values()].filter((p): p is ResolvedPlace => !!p);
    if (!world) return null;
    const allUS = pts.length > 0 && pts.every((p) => p.country === "United States of America" && p.lon > -126 && p.lon < -66 && p.lat > 24 && p.lat < 50);
    let proj: GeoProjection;
    const lons = pts.map((p) => p.lon);
    const lats = pts.map((p) => p.lat);
    const pad = 3;
    const bbox: [[number, number], [number, number]] = pts.length
      ? [
          [Math.min(...lons) - pad, Math.min(...lats) - pad],
          [Math.max(...lons) + pad, Math.max(...lats) + pad],
        ]
      : [
          [-130, 15],
          [40, 65],
        ];
    // keep a sensible minimum area so one town doesn't fill the screen
    const minSpan = 10;
    const cx = (bbox[0][0] + bbox[1][0]) / 2;
    const cy = (bbox[0][1] + bbox[1][1]) / 2;
    const sx = Math.max(bbox[1][0] - bbox[0][0], minSpan);
    const sy = Math.max(bbox[1][1] - bbox[0][1], minSpan * 0.6);
    const box: Feature<Geometry> = {
      type: "Feature",
      properties: {},
      geometry: { type: "MultiPoint", coordinates: [[cx - sx / 2, cy - sy / 2], [cx + sx / 2, cy + sy / 2], [cx - sx / 2, cy + sy / 2], [cx + sx / 2, cy - sy / 2]] },
    };
    if (allUS) proj = geoAlbers().parallels([29.5, 45.5]).rotate([96, 0]).fitExtent([[24, 24], [W - 24, H - 24]], box);
    else proj = geoNaturalEarth1().fitExtent([[24, 24], [W - 24, H - 24]], box);
    return { proj, path: geoPath(proj), usView: allUS };
  }, [placed, world, W, H]);

  if (!data) return null;
  if (!stops.length) return <p className="w-muted w-small">Add places to facts (where someone was born, lived, married, died) to see the journey.</p>;
  const unplaced = [...placed.entries()].filter(([, v]) => !v).map(([k]) => k);
  const at = (s: Stop) => placed.get(s.place) ?? null;
  const labels = new Map<string, { x: number; y: number; text: string }>();

  return (
    <div className="w-stack" ref={box}>
      {!view ? (
        <div className="w-well w-small w-muted">Loading the map…</div>
      ) : (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-map" role="img" aria-label="Map of the places in this family's records">
          <title>Family journey map</title>
          {world?.features.map((f, i) => (
            <path key={i} d={view.path(f) ?? undefined} className="w-map-land" />
          ))}
          {states && (view.usView || [...placed.values()].some((p) => p?.country === "United States of America")) ? <path d={view.path(states.borders) ?? undefined} className="w-map-state" /> : null}
          {legs.map((l, i) => {
            const a = at(l.from);
            const b = at(l.to);
            if (!a || !b || (a.lat === b.lat && a.lon === b.lon)) return null;
            const d = view.path({ type: "LineString", coordinates: [[a.lon, a.lat], [b.lon, b.lat]] });
            return <path key={i} d={d ?? undefined} className={`w-map-leg${l.generational ? " w-map-leg-gen" : l.documented ? "" : " w-map-leg-inferred"}`} />;
          })}
          {[...placed.entries()].map(([name, p]) => {
            if (!p) return null;
            const xy = view.proj([p.lon, p.lat]);
            if (!xy) return null;
            const ring = RING_DEG[p.precision];
            if (!labels.has(p.label)) {
              // skip a label that would sit on top of one already placed
              const text = p.label.split(",")[0];
              const clash = [...labels.values()].some((l) => Math.abs(l.x - xy[0]) < 8 * Math.max(l.text.length, text.length) * 0.6 && Math.abs(l.y - xy[1]) < 16);
              if (!clash) labels.set(p.label, { x: xy[0], y: xy[1], text });
            }
            return (
              <g key={name}>
                {ring ? <path d={view.path(geoCircle().center([p.lon, p.lat]).radius(ring)()) ?? undefined} className="w-map-ring" /> : null}
                <circle cx={xy[0]} cy={xy[1]} r={4.5} className="w-map-pin">
                  <title>{`${name} — placed by ${PRECISION_LABEL[p.precision]}`}</title>
                </circle>
              </g>
            );
          })}
          {[...labels.values()].map((l, i) => (
            <text key={i} x={l.x + 7} y={l.y - 6} className="w-map-label">
              {l.text}
            </text>
          ))}
        </svg>
      )}
      <div className="w-row w-tiny w-muted" style={{ gap: 16 }}>
        <span className="w-row" style={{ gap: 6 }}>
          <svg width="34" height="10" aria-hidden="true"><line x1="2" y1="5" x2="32" y2="5" className="w-map-leg" /></svg> Documented move: records at both ends
        </span>
        <span className="w-row" style={{ gap: 6 }}>
          <svg width="34" height="10" aria-hidden="true"><line x1="2" y1="5" x2="32" y2="5" className="w-map-leg w-map-leg-inferred" /></svg> Inferred: at least one end isn&apos;t backed by a record
        </span>
        <span className="w-row" style={{ gap: 6 }}>
          <svg width="34" height="10" aria-hidden="true"><line x1="2" y1="5" x2="32" y2="5" className="w-map-leg w-map-leg-gen" /></svg> Between generations
        </span>
        <span className="w-row" style={{ gap: 6 }}>
          <svg width="16" height="16" aria-hidden="true"><circle cx="8" cy="8" r="6" className="w-map-ring" /></svg> Only the county, state or country is known
        </span>
      </div>
      <label className="w-row w-small">
        <input type="checkbox" checked={showGen} onChange={(e) => setShowGen(e.target.checked)} /> Show moves between parents and children
      </label>
      <details className="w-more" open>
        <summary>Every move ({legs.length})</summary>
        <ul className="w-list" style={{ marginTop: 8 }}>
          {legs.map((l, i) => (
            <li key={i} className="w-small">
              <strong>{displayName(data, l.personId)}</strong>: {l.from.place}
              {l.from.fact.date ? ` (${formatDate(l.from.fact.date)})` : ""} → {l.to.place}
              {l.to.fact.date ? ` (${formatDate(l.to.fact.date)})` : ""}{" "}
              <span className="w-tag">{l.generational ? "between generations" : l.documented ? "documented" : "inferred"}</span>
            </li>
          ))}
        </ul>
      </details>
      {unplaced.length ? (
        <p className="w-tiny w-muted">
          Not on the map yet: {unplaced.join("; ")}. The built-in place list covers U.S. towns and counties, countries, and the main regions of Italy, Germany, Canada, Britain, Ireland and Sweden.
        </p>
      ) : null}
    </div>
  );
}
