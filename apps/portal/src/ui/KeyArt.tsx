import { useId, type CSSProperties, type ReactNode } from 'react';
import { MODULES, VULNERABILITIES, type ModuleId } from '../content';
import { t } from '../core/assets';
import { masteryRank } from '../core/schema';
import { LAYER_X, NODES_PER_LAYER } from '../modules/ModuleA/topology';
import { PARAM_KEYS, PRESETS } from '../modules/ModuleB/params';
import { rng } from './Ink';
import { useData, useOverall } from './hooks';

/**
 * Key art. Each module has one picture, built the way a technical render is built: a faceted surface graded to
 * the module's hue and lit from the upper right, atmosphere over it (light shafts, haze, vignette), a layer of
 * instrument detail (rulers, dials, graticules, readouts), and in the middle a subject made from the module's own data.
 *
 *  - Foundations: the swarm, projected in perspective from its real layer sizes and layer positions. The nodes
 *    you have reached (by the module's percentage, from the output layer back) are lit and joined by lit links.
 *  - Synthesis: a four-channel console. Each fader stands at the mean of the presets you have applied (halfway
 *    if none) and a lamp above its dial lights once its preset has been applied.
 *  - Ethics: a lens. A bracket at each corner is one vulnerability; an inspected one is lit and crossed.
 *
 * Everything is seeded, so the picture is identical on every load. It is drawn by this code, not by hand, and is
 * the only illustration on the site. Each carries a text label, because it is a picture of state.
 */

type RGB = [number, number, number];
const rgb = (h: string): RGB => [
  parseInt(h.slice(1, 3), 16),
  parseInt(h.slice(3, 5), 16),
  parseInt(h.slice(5, 7), 16),
];
const lerp = (a: RGB, b: RGB, k: number): RGB => [
  a[0] + (b[0] - a[0]) * k,
  a[1] + (b[1] - a[1]) * k,
  a[2] + (b[2] - a[2]) * k,
];
const css = (c: RGB): string => `rgb(${Math.round(c[0])} ${Math.round(c[1])} ${Math.round(c[2])})`;
const f1 = (n: number): string => n.toFixed(1);
const clamp = (n: number, a = 0, b = 1): number => Math.max(a, Math.min(b, n));

/** The surface ramp (deep to bright) and the accents for each module. Muted, so the picture reads as lit metal and glass. */
const RAMPS: Record<ModuleId, RGB[]> = {
  foundations: ['#02090c', '#06191d', '#0a3036', '#115a5c', '#2c9c96'].map(rgb) as RGB[],
  synthesis: ['#06061a', '#100f36', '#1e1b63', '#3b3498', '#7068d6'].map(rgb) as RGB[],
  ethics: ['#0d0408', '#26090f', '#4e1220', '#8a1f33', '#d34a5c'].map(rgb) as RGB[],
};
const ACC: Record<ModuleId, { hi: string; mid: string; lo: string; glow: string }> = {
  foundations: { hi: '#a9ece3', mid: '#3aa99f', lo: '#0b3d3d', glow: '#5fe0d0' },
  synthesis: { hi: '#d4cfff', mid: '#7e74d8', lo: '#201c58', glow: '#9a8cff' },
  ethics: { hi: '#ffb0b8', mid: '#d9424f', lo: '#4a0f1b', glow: '#ff5a6a' },
};
const PAPER = '#ece8e1';
const TXT: CSSProperties = {
  fontFamily: 'var(--font-hud)',
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
};

function sample(ramp: RGB[], k: number): RGB {
  const x = clamp(k) * (ramp.length - 1);
  const i = Math.min(ramp.length - 2, Math.floor(x));
  return lerp(ramp[i]!, ramp[i + 1]!, x - i);
}

/** Shared definitions: glow, spheres, light shafts, vignette. Ids carry a per-picture prefix. */
function Defs({ u, id }: { u: string; id: ModuleId }): ReactNode {
  const a = ACC[id];
  return (
    <defs>
      <radialGradient id={`${u}-on`} cx="34%" cy="30%" r="78%">
        <stop offset="0" stopColor="#ffffff" />
        <stop offset="0.3" stopColor={a.hi} />
        <stop offset="1" stopColor={a.mid} />
      </radialGradient>
      <radialGradient id={`${u}-off`} cx="34%" cy="30%" r="78%">
        <stop offset="0" stopColor={a.mid} stopOpacity="0.55" />
        <stop offset="0.5" stopColor={a.lo} />
        <stop offset="1" stopColor="#02060a" />
      </radialGradient>
      <linearGradient id={`${u}-beam`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ffffff" stopOpacity="0.5" />
        <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
      </linearGradient>
      <linearGradient id={`${u}-bar`} x1="0" y1="1" x2="0" y2="0">
        <stop offset="0" stopColor={a.mid} stopOpacity="0.05" />
        <stop offset="1" stopColor={a.hi} stopOpacity="0.55" />
      </linearGradient>
      <linearGradient id={`${u}-fill`} x1="0" y1="1" x2="0" y2="0">
        <stop offset="0" stopColor={a.lo} />
        <stop offset="0.5" stopColor={a.mid} />
        <stop offset="1" stopColor={a.hi} />
      </linearGradient>
      <linearGradient id={`${u}-cap`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#f4f1ea" />
        <stop offset="0.45" stopColor="#b9b5ac" />
        <stop offset="0.5" stopColor="#6c6a66" />
        <stop offset="1" stopColor="#2d2e30" />
      </linearGradient>
      <radialGradient id={`${u}-vig`} cx="50%" cy="46%" r="78%">
        <stop offset="0.45" stopColor="#000" stopOpacity="0" />
        <stop offset="1" stopColor="#000" stopOpacity="0.7" />
      </radialGradient>
      <linearGradient id={`${u}-foot`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0.7" stopColor="#000" stopOpacity="0" />
        <stop offset="1" stopColor="#000" stopOpacity="0.55" />
      </linearGradient>
      <radialGradient id={`${u}-halo`} cx="50%" cy="50%" r="50%">
        <stop offset="0" stopColor={a.glow} stopOpacity="0.5" />
        <stop offset="1" stopColor={a.glow} stopOpacity="0" />
      </radialGradient>
      <radialGradient id={`${u}-pupil`} cx="40%" cy="36%" r="70%">
        <stop offset="0" stopColor="#2b0d14" />
        <stop offset="1" stopColor="#030102" />
      </radialGradient>
      <linearGradient id={`${u}-sweep`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor={a.glow} stopOpacity="0" />
        <stop offset="1" stopColor={a.glow} stopOpacity="0.38" />
      </linearGradient>
      <pattern id={`${u}-scan`} width="4" height="4" patternUnits="userSpaceOnUse">
        <rect y="3" width="4" height="1" fill="#000" opacity="0.28" />
      </pattern>
      <pattern
        id={`${u}-hex`}
        width="34"
        height="29.4"
        patternUnits="userSpaceOnUse"
        patternTransform="scale(1.4)"
      >
        <path
          d="M8.5 0L25.5 0L34 14.7L25.5 29.4L8.5 29.4L0 14.7Z"
          fill="none"
          stroke={a.hi}
          strokeOpacity="0.16"
        />
      </pattern>
      <pattern id={`${u}-dots`} width="22" height="22" patternUnits="userSpaceOnUse">
        <circle cx="1.5" cy="1.5" r="1.1" fill={a.hi} opacity="0.4" />
      </pattern>
    </defs>
  );
}

/** A jittered grid cut into triangles. Neighbouring facets differ a little, so the surface reads as lit glass. */
function Surface({
  id,
  w,
  h,
  seed,
}: {
  id: ModuleId;
  w: number;
  h: number;
  seed: number;
}): ReactNode {
  const r = rng(seed);
  const cell = Math.max(46, Math.min(w, h) / 9);
  const cols = Math.max(7, Math.round(w / cell));
  const rows = Math.max(5, Math.round(h / cell));
  const pts: Array<Array<[number, number]>> = [];
  for (let j = 0; j <= rows; j++) {
    const row: Array<[number, number]> = [];
    for (let i = 0; i <= cols; i++) {
      const eX = i === 0 || i === cols;
      const eY = j === 0 || j === rows;
      row.push([
        (i / cols) * w + (eX ? 0 : (r() - 0.5) * (w / cols) * 0.7),
        (j / rows) * h + (eY ? 0 : (r() - 0.5) * (h / rows) * 0.7),
      ]);
    }
    pts.push(row);
  }
  const lx = w * 0.84;
  const ly = h * -0.12;
  const diag = Math.hypot(w, h);
  const ramp = RAMPS[id];
  const tris: ReactNode[] = [];
  const add = (
    p: [number, number],
    q: [number, number],
    s: [number, number],
    key: string,
  ): void => {
    const cx = (p[0] + q[0] + s[0]) / 3;
    const cy = (p[1] + q[1] + s[1]) / 3;
    const d = Math.hypot(cx - lx, cy - ly) / diag;
    const low = 0.1 * Math.sin(cx / (w * 0.19) + seed) * Math.cos(cy / (h * 0.27) - seed);
    const k = (1 - Math.min(1, d * 1.2)) * 0.72 + low + (r() - 0.5) * 0.17 - 0.1;
    tris.push(
      <path
        key={key}
        d={`M${f1(p[0])} ${f1(p[1])}L${f1(q[0])} ${f1(q[1])}L${f1(s[0])} ${f1(s[1])}Z`}
        fill={css(sample(ramp, k))}
        stroke="#ffffff"
        strokeOpacity="0.05"
        strokeWidth="1"
      />,
    );
  };
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const a = pts[j]![i]!;
      const b = pts[j]![i + 1]!;
      const c = pts[j + 1]![i]!;
      const d = pts[j + 1]![i + 1]!;
      if ((i + j) % 2 === 0) {
        add(a, b, d, `${i}-${j}-a`);
        add(a, d, c, `${i}-${j}-b`);
      } else {
        add(a, b, c, `${i}-${j}-a`);
        add(b, d, c, `${i}-${j}-b`);
      }
    }
  }
  return <g>{tris}</g>;
}

/** Atmosphere: slanted light shafts, haze, and a vignette. */
function Atmosphere({
  u,
  w,
  h,
  seed,
}: {
  u: string;
  w: number;
  h: number;
  seed: number;
}): ReactNode {
  const r = rng(seed);
  const shafts = Array.from({ length: 6 }, (_, i) => {
    const x = w * (0.35 + r() * 0.62);
    const wd = w * (0.015 + r() * 0.05);
    const lean = h * (0.35 + r() * 0.3);
    return (
      <path
        key={i}
        d={`M${f1(x)} 0L${f1(x + wd)} 0L${f1(x + wd - lean)} ${f1(h)}L${f1(x - lean)} ${f1(h)}Z`}
        fill={`url(#${u}-beam)`}
        opacity={0.05 + r() * 0.09}
      />
    );
  });
  const haze = [0.62, 0.78].map((y, i) => (
    <rect key={i} x="0" y={h * y} width={w} height={h * 0.09} fill="#ffffff" opacity="0.025" />
  ));
  return (
    <g>
      {shafts}
      {haze}
      <rect width={w} height={h} fill={`url(#${u}-vig)`} />
      <rect width={w} height={h} fill={`url(#${u}-foot)`} />
    </g>
  );
}

/** The instrument layer: dotted graticule, rulers with numbered ticks, corner brackets, registration marks. */
function Instrumentation({
  u,
  id,
  w,
  h,
}: {
  u: string;
  id: ModuleId;
  w: number;
  h: number;
}): ReactNode {
  const a = ACC[id];
  const step = Math.max(8, w / 120);
  const ticks: ReactNode[] = [];
  const nTop = Math.floor(w / step);
  for (let i = 0; i <= nTop; i++) {
    const long = i % 10 === 0;
    const mid = i % 5 === 0;
    const x = i * step;
    ticks.push(
      <path
        key={`t${i}`}
        d={`M${f1(x)} 0v${long ? 15 : mid ? 10 : 5}`}
        stroke={a.hi}
        strokeWidth="1.2"
        opacity={long ? 0.7 : 0.4}
      />,
    );
    if (long && w > 700 && i > 0) {
      ticks.push(
        <text
          key={`n${i}`}
          x={f1(x + 4)}
          y="26"
          fontSize="10"
          fill={a.hi}
          opacity="0.55"
          style={TXT}
        >
          {String(i * 10).padStart(3, '0')}
        </text>,
      );
    }
  }
  const nSide = Math.floor(h / step);
  for (let j = 0; j <= nSide; j++) {
    const long = j % 10 === 0;
    const mid = j % 5 === 0;
    ticks.push(
      <path
        key={`s${j}`}
        d={`M${f1(w)} ${f1(j * step)}h${long ? -15 : mid ? -10 : -5}`}
        stroke={a.hi}
        strokeWidth="1.2"
        opacity={long ? 0.7 : 0.4}
      />,
    );
  }
  const m = Math.min(w, h) * 0.045;
  const arm = Math.min(w, h) * 0.07;
  const corner = (x: number, y: number, dx: number, dy: number, k: string): ReactNode => (
    <g key={k} fill="none" stroke={a.hi} strokeWidth="2.2" opacity="0.7">
      <path d={`M${f1(x)} ${f1(y + dy * arm)}V${f1(y)}H${f1(x + dx * arm)}`} />
      <circle
        cx={f1(x + dx * arm * 1.5)}
        cy={f1(y + dy * arm * 1.5)}
        r="3"
        fill={a.hi}
        stroke="none"
      />
    </g>
  );
  const rd = rng(w + h);
  const column = (x: number, anchor: 'start' | 'end', k: string): ReactNode => (
    <g key={k} opacity="0.4">
      {Array.from({ length: 22 }, (_, i) => (
        <text
          key={i}
          x={f1(x)}
          y={f1(h * 0.16 + i * 13)}
          fontSize="9"
          fill={a.hi}
          textAnchor={anchor}
          style={{ ...TXT, letterSpacing: '0.08em' }}
        >
          {`${Math.floor(rd() * 65535)
            .toString(16)
            .toUpperCase()
            .padStart(4, '0')} ${(rd() * 9.99).toFixed(2)}`}
        </text>
      ))}
    </g>
  );
  const hazard = Array.from({ length: 14 }, (_, i) => (
    <path
      key={i}
      d={`M${f1(m + 6 + i * 11)} ${f1(h - m - 4)}l7 -12h5l-7 12z`}
      fill={a.hi}
      opacity={0.35 + (i % 3) * 0.12}
    />
  ));
  return (
    <g>
      <rect width={w} height={h} fill={`url(#${u}-dots)`} opacity="0.35" />
      <rect width={w} height={h} fill={`url(#${u}-scan)`} />
      {w > 700 && column(m + 10, 'start', 'dc1')}
      {w > 700 && column(w - m - 10, 'end', 'dc2')}
      <g>{hazard}</g>
      <g>{ticks}</g>
      {corner(m, m + 34, 1, 1, 'c1')}
      {corner(w - m, m + 34, -1, 1, 'c2')}
      {corner(m, h - m, 1, -1, 'c3')}
      {corner(w - m, h - m, -1, -1, 'c4')}
      <text
        x={f1(m + 6)}
        y={f1(h - m - arm - 10)}
        fontSize="11"
        fill={a.hi}
        opacity="0.6"
        style={TXT}
      >
        {id === 'foundations'
          ? 'LATTICE / L0-L4'
          : id === 'synthesis'
            ? 'CONSOLE / 4 CH'
            : 'LENS / 4 VECTORS'}
      </text>
    </g>
  );
}

/* ---- Foundations: the swarm, projected ------------------------------------------------------------------ */

interface Node3 {
  l: number;
  i: number;
  x: number;
  y: number;
  z: number;
}

function Lattice({ u, w, h, lit }: { u: string; w: number; h: number; lit: number }): ReactNode {
  const a = ACC.foundations;
  const L = NODES_PER_LAYER.length;
  const r = rng(11);
  const yaw = -0.52;
  const camZ = 5.4;
  const f = Math.min(w, h) * 0.95;
  const cx = w * 0.5;
  const cy = h * 0.47;
  /** Perspective: s is the number of pixels in one world unit at this depth. */
  const proj = (
    x: number,
    y: number,
    z: number,
  ): { x: number; y: number; s: number; z: number } => {
    const xr = x * Math.cos(yaw) + z * Math.sin(yaw);
    const zr = -x * Math.sin(yaw) + z * Math.cos(yaw) + camZ;
    const s = f / zr;
    return { x: cx + xr * s, y: cy + y * s, s, z: zr };
  };
  const layers: Node3[][] = NODES_PER_LAYER.map((m, l) =>
    Array.from({ length: m }, (_, i) => ({
      l,
      i,
      x: LAYER_X[l]!,
      y: -1.3 + (2.6 * i) / (m - 1),
      z: (r() - 0.5) * 1.1,
    })),
  );
  const rank = new Map<string, number>();
  let n = 0;
  for (let l = L - 1; l >= 0; l--)
    for (let i = 0; i < NODES_PER_LAYER[l]!; i++) rank.set(`${l}-${i}`, n++);
  const isLit = (nd: Node3): boolean => (rank.get(`${nd.l}-${nd.i}`) ?? 99) < lit;

  // the floor: a perspective grid, and a faint reflection of the lattice on it
  const floorY = 1.85;
  const floor: ReactNode[] = [];
  for (let k = -7; k <= 7; k++) {
    const x = k * 0.5;
    const p0 = proj(x, floorY, -1.6);
    const p1 = proj(x, floorY, 1.6);
    floor.push(
      <line
        key={`fx${k}`}
        x1={f1(p0.x)}
        y1={f1(p0.y)}
        x2={f1(p1.x)}
        y2={f1(p1.y)}
        stroke={a.hi}
        strokeOpacity={0.16}
      />,
    );
  }
  for (let k = -4; k <= 4; k++) {
    const z = k * 0.4;
    const p0 = proj(-3.6, floorY, z);
    const p1 = proj(3.6, floorY, z);
    floor.push(
      <line
        key={`fz${k}`}
        x1={f1(p0.x)}
        y1={f1(p0.y)}
        x2={f1(p1.x)}
        y2={f1(p1.y)}
        stroke={a.hi}
        strokeOpacity={0.16}
      />,
    );
  }

  // layer planes, far to near
  const planes = LAYER_X.map((x, l) => {
    const c = [
      proj(x, -1.65, -0.85),
      proj(x, -1.65, 0.85),
      proj(x, 1.65, 0.85),
      proj(x, 1.65, -0.85),
    ];
    const grid = [-0.5, 0, 0.5].map((y) => {
      const p0 = proj(x, y * 3.3, -0.85);
      const p1 = proj(x, y * 3.3, 0.85);
      return (
        <line
          key={y}
          x1={f1(p0.x)}
          y1={f1(p0.y)}
          x2={f1(p1.x)}
          y2={f1(p1.y)}
          stroke={a.hi}
          strokeOpacity="0.14"
        />
      );
    });
    const label = proj(x, -1.95, 0);
    return {
      z: proj(x, 0, 0).z,
      el: (
        <g key={`pl${l}`}>
          <path
            d={`M${c.map((p) => `${f1(p.x)} ${f1(p.y)}`).join('L')}Z`}
            fill={a.mid}
            fillOpacity="0.07"
            stroke={a.hi}
            strokeOpacity="0.4"
            strokeWidth="1.4"
          />
          {grid}
          <text
            x={f1(label.x)}
            y={f1(label.y)}
            fontSize={f1(Math.max(9, f * 0.025))}
            fill={a.hi}
            textAnchor="middle"
            opacity="0.8"
            style={TXT}
          >
            {l === 0 ? 'IN' : l === L - 1 ? 'OUT' : `H${l}`} {NODES_PER_LAYER[l]}
          </text>
        </g>
      ),
    };
  }).sort((p, q) => q.z - p.z);

  // links: each node reaches its nearest neighbours in the next layer
  const links: ReactNode[] = [];
  const pulses: ReactNode[] = [];
  for (let l = 0; l < L - 1; l++) {
    const fan = l < 3 ? 3 : 2;
    for (const nd of layers[l]!) {
      const near = [...layers[l + 1]!]
        .sort((p, q) => Math.abs(p.y - nd.y) - Math.abs(q.y - nd.y))
        .slice(0, fan);
      for (const to of near) {
        const p = proj(nd.x, nd.y, nd.z);
        const q = proj(to.x, to.y, to.z);
        const on = isLit(nd) && isLit(to);
        links.push(
          <line
            key={`${nd.l}-${nd.i}-${to.i}`}
            x1={f1(p.x)}
            y1={f1(p.y)}
            x2={f1(q.x)}
            y2={f1(q.y)}
            stroke={on ? a.glow : a.mid}
            strokeOpacity={on ? 0.9 : 0.32}
            strokeWidth={on ? 2.2 : 1.2}
          />,
        );
        if (r() < 0.3) {
          const k = 0.25 + r() * 0.5;
          pulses.push(
            <circle
              key={`pu${nd.l}-${nd.i}-${to.i}`}
              cx={f1(p.x + (q.x - p.x) * k)}
              cy={f1(p.y + (q.y - p.y) * k)}
              r={f1(1.5 + p.s * 0.03)}
              fill={on ? '#ffffff' : a.hi}
              opacity={on ? 0.95 : 0.5}
            />,
          );
        }
      }
    }
  }

  const all = layers
    .flat()
    .map((nd) => ({ nd, p: proj(nd.x, nd.y, nd.z) }))
    .sort((p, q) => q.p.z - p.p.z);
  const reflect = all.map(({ nd, p }) => {
    const rf = proj(nd.x, 2 * floorY - nd.y, nd.z);
    return (
      <circle
        key={`rf${nd.l}-${nd.i}`}
        cx={f1(rf.x)}
        cy={f1(rf.y)}
        r={f1(p.s * 0.1)}
        fill={a.mid}
        opacity={isLit(nd) ? 0.22 : 0.08}
      />
    );
  });
  const dust = Array.from({ length: 70 }, (_, k) => (
    <circle
      key={`du${k}`}
      cx={f1(r() * w)}
      cy={f1(r() * h)}
      r={f1(0.8 + r() * 2.2)}
      fill={a.hi}
      opacity={0.1 + r() * 0.35}
    />
  ));
  const litNodes = all.filter(({ nd }) => isLit(nd));
  // a second, larger lattice far behind, out of focus, for depth
  const back = layers.flat().map((nd) => {
    const p = proj(nd.x * 1.5 - 0.4, nd.y * 1.4, nd.z - 2.4);
    return (
      <circle
        key={`bk${nd.l}-${nd.i}`}
        cx={f1(p.x)}
        cy={f1(p.y)}
        r={f1(p.s * 0.12)}
        fill={a.mid}
        opacity="0.18"
      />
    );
  });
  const arcs = Array.from({ length: 14 }, (_, k) => {
    const l = k % (L - 1);
    const from = layers[l]![k % layers[l]!.length]!;
    const to = layers[l + 1]![(k * 3) % layers[l + 1]!.length]!;
    const p = proj(from.x, from.y, from.z);
    const q = proj(to.x, to.y, to.z);
    const lift = (22 + r() * 30) * (k % 2 ? 1 : -1);
    return (
      <path
        key={`arc${k}`}
        d={`M${f1(p.x)} ${f1(p.y)}Q${f1((p.x + q.x) / 2)} ${f1((p.y + q.y) / 2 + lift)} ${f1(q.x)} ${f1(q.y)}`}
        fill="none"
        stroke={a.hi}
        strokeOpacity="0.16"
        strokeDasharray="2 5"
      />
    );
  });
  const readout = Array.from({ length: 12 }, (_, k) => {
    const bw = 4 + ((k * 7) % 5) * 5 + r() * 8;
    return (
      <g key={`ro${k}`}>
        <rect
          x={f1(w * 0.07)}
          y={f1(h * 0.66 + k * 9)}
          width={f1(bw * 4)}
          height="3"
          fill={a.hi}
          opacity="0.3"
        />
        <rect
          x={f1(w * 0.07)}
          y={f1(h * 0.66 + k * 9)}
          width={f1(bw * 4 * (lit / 37))}
          height="3"
          fill={a.glow}
          opacity="0.85"
        />
      </g>
    );
  });

  return (
    <g>
      <g>{back}</g>
      <g>{arcs}</g>
      <g>{readout}</g>
      {dust}
      <g>{floor}</g>
      <g>{reflect}</g>
      {planes.map((p) => p.el)}
      <g>{links}</g>
      <g>
        {litNodes.map(({ nd, p }) => (
          <circle
            key={`h${nd.l}-${nd.i}`}
            cx={f1(p.x)}
            cy={f1(p.y)}
            r={f1(p.s * 0.34)}
            fill={`url(#${u}-halo)`}
          />
        ))}
      </g>
      <g>{pulses}</g>
      {all.map(({ nd, p }) => {
        const on = isLit(nd);
        const rr = p.s * 0.105;
        return (
          <g key={`n${nd.l}-${nd.i}`}>
            {on && (
              <circle
                cx={f1(p.x)}
                cy={f1(p.y)}
                r={f1(rr * 1.9)}
                fill="none"
                stroke={a.hi}
                strokeOpacity="0.55"
                strokeWidth="1.2"
                strokeDasharray="3 4"
              />
            )}
            <circle
              cx={f1(p.x)}
              cy={f1(p.y)}
              r={f1(rr)}
              fill={`url(#${u}-${on ? 'on' : 'off'})`}
              stroke={on ? '#ffffff' : a.mid}
              strokeOpacity={on ? 0.9 : 0.5}
              strokeWidth="1.2"
            />
          </g>
        );
      })}
    </g>
  );
}

/* ---- Synthesis: a four-channel console ----------------------------------------------------------------- */

function Console({ u, w, h }: { u: string; w: number; h: number }): ReactNode {
  const a = ACC.synthesis;
  const d = useData().modules.synthesis;
  const applied = PRESETS.filter((p) => d.actions[p.action] === true);
  const mean = (k: (typeof PARAM_KEYS)[number]): number =>
    applied.length ? applied.reduce((s, p) => s + p.values[k], 0) / applied.length : 50;
  const r = rng(23);
  const stripW = Math.min(w * 0.17, h * 0.24);
  const top = h * 0.34;
  const bottom = h * 0.8;
  const span = bottom - top;

  const bars = Array.from({ length: Math.round(w / 13) }, (_, i) => {
    const amp =
      (Math.sin(i * 0.29) + Math.sin(i * 0.11 + 1.3) * 0.8 + Math.sin(i * 0.47 + 0.4) * 0.4 + 2.2) /
      4.4;
    const bh = h * (0.05 + amp * 0.3 * (0.6 + r() * 0.6));
    return (
      <rect
        key={i}
        x={f1(i * 13 + 2)}
        y={f1(h * 0.93 - bh)}
        width="8"
        height={f1(bh)}
        fill={`url(#${u}-bar)`}
      />
    );
  });
  const scope = [0, 1, 2].map((i) => {
    const amp = h * (0.018 + 0.022 * (mean('temperature') / 100)) * (1 + i * 0.5);
    const pts: string[] = [];
    for (let x = 0; x <= w; x += w / 90)
      pts.push(
        `${f1(x)} ${f1(h * (0.17 + i * 0.035) + Math.sin(x / (w / (6 + i * 3)) + i * 1.9) * amp)}`,
      );
    return (
      <g key={i}>
        <path
          d={`M${pts.join('L')}`}
          fill="none"
          stroke={a.glow}
          strokeWidth={i === 0 ? 9 : 5}
          opacity="0.12"
        />
        <path
          d={`M${pts.join('L')}`}
          fill="none"
          stroke={a.glow}
          strokeWidth={i === 0 ? 2.2 : 1.2}
          opacity={i === 0 ? 0.8 : 0.4}
        />
      </g>
    );
  });
  const tokens = Array.from({ length: 3 }, (_, row) => {
    let x = w * 0.08;
    const els: ReactNode[] = [];
    let k = 0;
    while (x < w * 0.92) {
      const wd = 10 + r() * 46;
      els.push(
        <rect
          key={k++}
          x={f1(x)}
          y={f1(h * 0.9 + row * 9)}
          width={f1(wd)}
          height="4"
          fill={a.hi}
          opacity={0.12 + r() * 0.22}
        />,
      );
      x += wd + 7;
    }
    return <g key={row}>{els}</g>;
  });

  const strips = PARAM_KEYS.map((key, i) => {
    const cx = w * (0.2 + i * 0.2);
    const v = mean(key) / 100;
    const ky = bottom - v * span;
    const on = PRESETS[i] ? d.actions[PRESETS[i]!.action] === true : false;
    const c = stripW * 0.12;
    const body = `M${f1(cx - stripW / 2 + c)} ${f1(top - stripW * 0.95)}H${f1(cx + stripW / 2)}V${f1(bottom + stripW * 0.62 - c)}L${f1(cx + stripW / 2 - c)} ${f1(bottom + stripW * 0.62)}H${f1(cx - stripW / 2)}V${f1(top - stripW * 0.95 + c)}Z`;
    const ticks = Array.from({ length: 51 }, (_, k) => {
      const y = bottom - (k / 50) * span;
      const len = k % 5 === 0 ? stripW * 0.16 : stripW * 0.08;
      return (
        <g key={k}>
          <line
            x1={f1(cx - stripW * 0.2 - len)}
            y1={f1(y)}
            x2={f1(cx - stripW * 0.2)}
            y2={f1(y)}
            stroke={a.hi}
            strokeOpacity={k % 5 === 0 ? 0.75 : 0.4}
          />
          <line
            x1={f1(cx + stripW * 0.2)}
            y1={f1(y)}
            x2={f1(cx + stripW * 0.2 + len)}
            y2={f1(y)}
            stroke={a.hi}
            strokeOpacity={k % 5 === 0 ? 0.75 : 0.4}
          />
          {k % 10 === 0 && (
            <text
              x={f1(cx - stripW * 0.2 - len - 5)}
              y={f1(y + 3.5)}
              fontSize="10"
              fill={a.hi}
              textAnchor="end"
              opacity="0.7"
              style={TXT}
            >
              {k * 2}
            </text>
          )}
        </g>
      );
    });
    const kr = stripW * 0.27;
    const ky0 = top - stripW * 0.5;
    const ang = (-135 + v * 270) * (Math.PI / 180);
    const dial = Array.from({ length: 37 }, (_, k) => {
      const an = ((-135 + (k / 36) * 270) * Math.PI) / 180;
      const r0 = kr * 1.18;
      const r1 = kr * (k % 6 === 0 ? 1.5 : 1.35);
      return (
        <line
          key={k}
          x1={f1(cx + Math.sin(an) * r0)}
          y1={f1(ky0 - Math.cos(an) * r0)}
          x2={f1(cx + Math.sin(an) * r1)}
          y2={f1(ky0 - Math.cos(an) * r1)}
          stroke={a.hi}
          strokeOpacity={k % 6 === 0 ? 0.8 : 0.45}
          strokeWidth={k % 6 === 0 ? 1.6 : 1}
        />
      );
    });
    const capW = stripW * 0.64;
    return (
      <g key={key}>
        <path
          d={body}
          fill="#070717"
          fillOpacity="0.78"
          stroke={a.hi}
          strokeOpacity="0.4"
          strokeWidth="1.4"
        />
        {ticks}
        <rect
          x={f1(cx - 4)}
          y={f1(top)}
          width="8"
          height={f1(span)}
          fill="#02020c"
          stroke={a.mid}
          strokeOpacity="0.7"
        />
        <rect
          x={f1(cx - 3)}
          y={f1(ky)}
          width="6"
          height={f1(bottom - ky)}
          fill={`url(#${u}-fill)`}
        />
        <g>
          <circle
            cx={f1(cx)}
            cy={f1(ky0)}
            r={f1(kr)}
            fill="#0d0c29"
            stroke={a.hi}
            strokeOpacity="0.8"
            strokeWidth="1.6"
          />
          <circle
            cx={f1(cx)}
            cy={f1(ky0)}
            r={f1(kr * 0.74)}
            fill="#17154a"
            stroke={a.mid}
            strokeOpacity="0.8"
          />
          {dial}
          <line
            x1={f1(cx)}
            y1={f1(ky0)}
            x2={f1(cx + Math.sin(ang) * kr * 0.9)}
            y2={f1(ky0 - Math.cos(ang) * kr * 0.9)}
            stroke="#ffffff"
            strokeWidth="2.6"
          />
          <circle cx={f1(cx)} cy={f1(ky0)} r="3.2" fill="#ffffff" />
        </g>
        <path
          d={`M${f1(cx)} ${f1(top - stripW * 0.86)}l${f1(stripW * 0.07)} ${f1(stripW * 0.07)}l${f1(-stripW * 0.07)} ${f1(stripW * 0.07)}l${f1(-stripW * 0.07)} ${f1(-stripW * 0.07)}Z`}
          fill={on ? a.hi : 'none'}
          stroke={a.hi}
          strokeWidth="1.4"
        />
        <g>
          <rect
            x={f1(cx - capW / 2)}
            y={f1(ky - 17)}
            width={f1(capW)}
            height="34"
            fill={`url(#${u}-cap)`}
            stroke="#111"
            strokeWidth="1.4"
          />
          {[-8, -3, 2, 7].map((o) => (
            <line
              key={o}
              x1={f1(cx - capW / 2 + 5)}
              y1={f1(ky + o)}
              x2={f1(cx + capW / 2 - 5)}
              y2={f1(ky + o)}
              stroke="#111"
              strokeOpacity="0.55"
            />
          ))}
          <rect
            x={f1(cx - capW / 2 + 2)}
            y={f1(ky - 15)}
            width={f1(capW - 4)}
            height="3"
            fill={on ? a.glow : '#2a2a3a'}
          />
        </g>
        <text
          x={f1(cx)}
          y={f1(bottom + stripW * 0.4)}
          fontSize={f1(stripW * 0.24)}
          fill="#ffffff"
          textAnchor="middle"
          style={{ ...TXT, letterSpacing: '0.04em' }}
        >
          {Math.round(v * 100)}
        </text>
        <text
          x={f1(cx)}
          y={f1(bottom + stripW * 0.56)}
          fontSize="10"
          fill={a.hi}
          textAnchor="middle"
          opacity="0.8"
          style={TXT}
        >
          {key.slice(0, 4)}
        </text>
      </g>
    );
  });

  const vus = PARAM_KEYS.flatMap((key, i) => {
    const cx = w * (0.2 + i * 0.2) + stripW * 0.4;
    const lvl = Math.round((mean(key) / 100) * 14);
    return Array.from({ length: 14 }, (_, k) => (
      <rect
        key={`vu${i}-${k}`}
        x={f1(cx)}
        y={f1(bottom - k * (span / 14) - 5)}
        width="5"
        height={f1(span / 14 - 3)}
        fill={k >= 11 ? '#ff6b7a' : k >= 8 ? '#ffd27a' : a.glow}
        opacity={k < lvl ? 0.95 : 0.14}
      />
    ));
  });
  const rivets = PARAM_KEYS.flatMap((_, i) => {
    const cx = w * (0.2 + i * 0.2);
    return [
      [cx - stripW * 0.44, top - stripW * 0.88],
      [cx + stripW * 0.44, top - stripW * 0.88],
      [cx - stripW * 0.44, bottom + stripW * 0.56],
      [cx + stripW * 0.44, bottom + stripW * 0.56],
    ].map(([x, y], k) => (
      <g key={`rv${i}-${k}`}>
        <circle cx={f1(x!)} cy={f1(y!)} r="3.2" fill="#0d0c29" stroke={a.hi} strokeOpacity="0.6" />
        <path d={`M${f1(x! - 2)} ${f1(y!)}h4`} stroke={a.hi} strokeOpacity="0.6" />
      </g>
    ));
  });
  const patch = Array.from({ length: 10 }, (_, k) => {
    const x = w * (0.12 + k * 0.083);
    const y = h * 0.965;
    return (
      <g key={`pj${k}`}>
        <circle cx={f1(x)} cy={f1(y)} r="6" fill="#05050f" stroke={a.hi} strokeOpacity="0.7" />
        <circle cx={f1(x)} cy={f1(y)} r="2.4" fill={k % 3 === 0 ? a.glow : '#1a1850'} />
        {k % 2 === 0 && (
          <path
            d={`M${f1(x)} ${f1(y)}q${f1(w * 0.04)} ${f1(h * 0.05)} ${f1(w * 0.083)} 0`}
            fill="none"
            stroke={a.glow}
            strokeOpacity="0.5"
            strokeWidth="1.6"
          />
        )}
      </g>
    );
  });

  return (
    <g>
      <g>{bars}</g>
      <g>{scope}</g>
      <g>{tokens}</g>
      {strips}
      <g>{vus}</g>
      <g>{rivets}</g>
      <g>{patch}</g>
    </g>
  );
}

/* ---- Ethics: a lens ----------------------------------------------------------------------------------- */

function Lens({ u, w, h, done }: { u: string; w: number; h: number; done: boolean[] }): ReactNode {
  const a = ACC.ethics;
  const r = rng(37);
  const cx = w * 0.5;
  const cy = h * 0.5;
  const R = Math.min(w * 0.62, h * 0.9) * 0.36;
  const pol = (rr: number, deg: number): [number, number] => [
    cx + Math.cos((deg * Math.PI) / 180) * rr,
    cy + Math.sin((deg * Math.PI) / 180) * rr,
  ];
  const pt = (p: [number, number]): string => `${f1(p[0])} ${f1(p[1])}`;
  const arc = (rr: number, a0: number, a1: number): string =>
    `M${pt(pol(rr, a0))}A${f1(rr)} ${f1(rr)} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${pt(pol(rr, a1))}`;

  const globe = [
    ...Array.from({ length: 6 }, (_, k) => (
      <ellipse
        key={`m${k}`}
        cx={f1(cx)}
        cy={f1(cy)}
        rx={f1(R * 2.1 * Math.abs(Math.cos((k / 6) * Math.PI)))}
        ry={f1(R * 2.1)}
        fill="none"
        stroke={a.hi}
        strokeOpacity="0.14"
      />
    )),
    ...Array.from({ length: 5 }, (_, k) => {
      const yy = -0.8 + (k * 1.6) / 4;
      return (
        <ellipse
          key={`p${k}`}
          cx={f1(cx)}
          cy={f1(cy + yy * R * 2.1)}
          rx={f1(R * 2.1 * Math.sqrt(1 - yy * yy))}
          ry={f1(R * 0.28 * Math.sqrt(1 - yy * yy))}
          fill="none"
          stroke={a.hi}
          strokeOpacity="0.14"
        />
      );
    }),
  ];
  const dial = Array.from({ length: 72 }, (_, k) => {
    const long = k % 6 === 0;
    const p0 = pol(R * 1.58, k * 5);
    const p1 = pol(R * (long ? 1.72 : 1.65), k * 5);
    return (
      <line
        key={k}
        x1={f1(p0[0])}
        y1={f1(p0[1])}
        x2={f1(p1[0])}
        y2={f1(p1[1])}
        stroke={a.hi}
        strokeOpacity={long ? 0.8 : 0.45}
        strokeWidth={long ? 1.8 : 1}
      />
    );
  });
  const dialNums = Array.from({ length: 12 }, (_, k) => {
    const p = pol(R * 1.84, k * 30 - 90);
    return (
      <text
        key={k}
        x={f1(p[0])}
        y={f1(p[1] + 4)}
        fontSize="11"
        fill={a.hi}
        textAnchor="middle"
        opacity="0.7"
        style={TXT}
      >
        {String(k * 30).padStart(3, '0')}
      </text>
    );
  });
  const fibres = Array.from({ length: 110 }, (_, k) => {
    const deg = (k / 110) * 360 + r() * 2;
    const r0 = R * (0.3 + r() * 0.04);
    const r1 = R * (0.62 + r() * 0.26);
    const p0 = pol(r0, deg);
    const p1 = pol(r1, deg + (r() - 0.5) * 3);
    const pick = r();
    return (
      <line
        key={k}
        x1={f1(p0[0])}
        y1={f1(p0[1])}
        x2={f1(p1[0])}
        y2={f1(p1[1])}
        stroke={pick < 0.4 ? '#ff7a88' : pick < 0.75 ? '#d9424f' : '#8a1f33'}
        strokeWidth={f1(1 + r() * 2.2)}
        strokeOpacity={0.55 + r() * 0.4}
      />
    );
  });
  const oct = (rr: number, rot: number): string =>
    `M${Array.from({ length: 8 }, (_, k) => pt(pol(rr, (k / 8) * 360 + rot))).join('L')}Z`;

  const corners: Array<[number, number, number, number]> = [
    [cx - R * 2.0, cy - R * 1.2, 1, 1],
    [cx + R * 2.0, cy - R * 1.2, -1, 1],
    [cx - R * 2.0, cy + R * 1.2, 1, -1],
    [cx + R * 2.0, cy + R * 1.2, -1, -1],
  ];
  const s = R * 0.34;
  const glitch = [0.22, 0.41, 0.63, 0.8].map((y, i) => (
    <rect
      key={i}
      x={f1(w * (0.1 + r() * 0.5))}
      y={f1(h * y)}
      width={f1(w * (0.1 + r() * 0.3))}
      height={f1(2 + r() * 3)}
      fill={a.hi}
      opacity="0.22"
    />
  ));

  const wave = [0, 1].map((i) => {
    const pts: string[] = [];
    for (let x = w * 0.12; x <= w * 0.88; x += w / 120) {
      const k = (x - w * 0.12) / (w * 0.76);
      pts.push(
        `${f1(x)} ${f1(h * (0.9 + i * 0.03) - Math.exp(-Math.pow((k - 0.5) * 7, 2)) * h * 0.06 * (1 + i * 0.4) * (0.6 + 0.4 * Math.sin(k * 40)))}`,
      );
    }
    return (
      <path
        key={i}
        d={`M${pts.join('L')}`}
        fill="none"
        stroke={a.hi}
        strokeOpacity={0.5 - i * 0.2}
        strokeWidth="1.4"
      />
    );
  });
  const cross = (
    <g stroke={a.hi} strokeOpacity="0.3" strokeWidth="1">
      <line x1="0" y1={f1(cy)} x2={f1(cx - R * 2.2)} y2={f1(cy)} />
      <line x1={f1(cx + R * 2.2)} y1={f1(cy)} x2={f1(w)} y2={f1(cy)} />
      <line x1={f1(cx)} y1="0" x2={f1(cx)} y2={f1(cy - R * 2.1)} />
      <line x1={f1(cx)} y1={f1(cy + R * 2.1)} x2={f1(cx)} y2={f1(h)} />
    </g>
  );

  return (
    <g>
      <rect width={w} height={h} fill={`url(#${u}-hex)`} opacity="0.8" />
      {cross}
      <g>{wave}</g>
      <g>{globe}</g>
      <circle cx={f1(cx)} cy={f1(cy)} r={f1(R * 2.4)} fill={`url(#${u}-halo)`} opacity="0.55" />
      <path
        d={`M${pt([cx, cy])}L${pt(pol(R * 1.55, -50))}A${f1(R * 1.55)} ${f1(R * 1.55)} 0 0 1 ${pt(pol(R * 1.55, -8))}Z`}
        fill={`url(#${u}-sweep)`}
      />
      <g>{dial}</g>
      <g>{dialNums}</g>
      <g fill="none" stroke={a.hi} strokeWidth="8" strokeOpacity="0.5">
        <path d={arc(R * 1.42, 200, 285)} />
        <path d={arc(R * 1.42, 300, 345)} />
        <path d={arc(R * 1.42, 20, 120)} strokeOpacity="0.3" />
      </g>
      <path
        d={oct(R * 1.22, 22.5)}
        fill="none"
        stroke={a.hi}
        strokeOpacity="0.55"
        strokeWidth="1.6"
        strokeDasharray="10 6"
      />
      <path
        d={oct(R * 1.04, 22.5)}
        fill="#12050a"
        stroke={a.hi}
        strokeOpacity="0.9"
        strokeWidth="2.2"
      />
      <circle
        cx={f1(cx)}
        cy={f1(cy)}
        r={f1(R * 0.92)}
        fill="#2a0a12"
        stroke="#ff7a88"
        strokeOpacity="0.5"
        strokeWidth="1.4"
      />
      <g>{fibres}</g>
      <circle
        cx={f1(cx)}
        cy={f1(cy)}
        r={f1(R * 0.6)}
        fill="none"
        stroke="#ffd1d5"
        strokeOpacity="0.4"
        strokeWidth="1.2"
      />
      <circle
        cx={f1(cx)}
        cy={f1(cy)}
        r={f1(R * 0.3)}
        fill={`url(#${u}-pupil)`}
        stroke="#ffd1d5"
        strokeOpacity="0.6"
        strokeWidth="1.6"
      />
      <path
        d={`M${pt(pol(R * 0.2, 200))}A${f1(R * 0.2)} ${f1(R * 0.2)} 0 0 1 ${pt(pol(R * 0.2, 285))}`}
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.9"
        strokeWidth="3"
      />
      <g>{glitch}</g>
      {corners.map(([x, y, dx, dy], i) => {
        const on = done[i] === true;
        const v = VULNERABILITIES[i];
        return (
          <g key={i}>
            <path
              d={`M${f1(x)} ${f1(y + dy * s)}V${f1(y)}H${f1(x + dx * s)}`}
              fill="none"
              stroke={a.hi}
              strokeWidth="3"
            />
            <path
              d={`M${f1(x + dx * s * 0.25)} ${f1(y + dy * s * 0.25)}h${f1(dx * s * 0.5)}`}
              stroke={on ? '#ff4655' : a.hi}
              strokeWidth="2"
            />
            <path
              d={`M${f1(x + dx * s * 0.95)} ${f1(y + dy * s * 0.95)}l${f1(dx * s * 0.26)} ${f1(dy * s * 0.26)}l${f1(-dx * s * 0.26)} ${f1(dy * s * 0.26)}l${f1(-dx * s * 0.26)} ${f1(-dy * s * 0.26)}Z`}
              fill={on ? '#ff4655' : 'none'}
              stroke={a.hi}
              strokeWidth="1.6"
            />
            {on && (
              <path
                d={`M${f1(x + dx * s * 0.4)} ${f1(y + dy * s * 0.4)}L${f1(x + dx * s * 1.7)} ${f1(y + dy * s * 1.7)}M${f1(x + dx * s * 1.7)} ${f1(y + dy * s * 0.4)}L${f1(x + dx * s * 0.4)} ${f1(y + dy * s * 1.7)}`}
                stroke={PAPER}
                strokeWidth="1.8"
              />
            )}
            <text
              x={f1(x + dx * s * 1.25)}
              y={f1(y + dy * s * 0.18 + (dy > 0 ? 12 : -4))}
              fontSize="11"
              fill={a.hi}
              textAnchor={dx > 0 ? 'start' : 'end'}
              style={TXT}
            >
              {`V-0${i + 1}`}
            </text>
            {v && (
              <text
                x={f1(x + dx * s * 1.25)}
                y={f1(y + dy * s * 0.18 + (dy > 0 ? 26 : -18))}
                fontSize="9"
                fill={a.hi}
                opacity="0.6"
                textAnchor={dx > 0 ? 'start' : 'end'}
                style={TXT}
              >
                {on ? 'INSPECTED' : 'OPEN'}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}

function Motif({ u, id, w, h }: { u: string; id: ModuleId; w: number; h: number }): ReactNode {
  const data = useData().modules;
  if (id === 'foundations') {
    const total = NODES_PER_LAYER.reduce((a, b) => a + b, 0);
    return (
      <Lattice u={u} w={w} h={h} lit={Math.round((data.foundations.progress / 100) * total)} />
    );
  }
  if (id === 'synthesis') return <Console u={u} w={w} h={h} />;
  return (
    <Lens u={u} w={w} h={h} done={VULNERABILITIES.map((v) => data.ethics.actions[v.id] === true)} />
  );
}

/** The text a screen reader gets for one module's picture. */
export function useArtLabel(id: ModuleId): string {
  const data = useData().modules;
  if (id === 'foundations')
    return t('art.topology', {
      layers: NODES_PER_LAYER.length,
      nodes: NODES_PER_LAYER.reduce((x, y) => x + y, 0),
    });
  if (id === 'synthesis') return t('art.presets');
  return t('art.wire', {
    n: VULNERABILITIES.filter((v) => data.ethics.actions[v.id]).length,
    total: VULNERABILITIES.length,
  });
}

/** One picture's layers, for a box of w by h. */
function Scene({
  u,
  id,
  w,
  h,
  seed,
  lift = 0,
  shift = 0,
  scale = 1,
}: {
  u: string;
  id: ModuleId;
  w: number;
  h: number;
  seed: number;
  lift?: number;
  shift?: number;
  scale?: number;
}): ReactNode {
  return (
    <g>
      <Surface id={id} w={w} h={h} seed={seed} />
      <Atmosphere u={u} w={w} h={h} seed={seed + 1} />
      <Instrumentation u={u} id={id} w={w} h={h} />
      <g
        transform={`translate(${f1(w / 2 + shift * w)} ${f1(h / 2)}) scale(${scale}) translate(${f1(-w / 2)} ${f1(-h / 2 - lift * h)})`}
      >
        <Motif u={u} id={id} w={w} h={h} />
      </g>
    </g>
  );
}

/** One module's key art, filling whatever box it is put in (the picture is cropped, never stretched). */
export function KeyArt({
  id,
  w = 1200,
  h = 800,
  lift = 0,
  shift = 0,
  scale = 1,
  className,
}: {
  id: ModuleId;
  w?: number;
  h?: number;
  /** Move the subject up by this fraction of the height, so copy can sit under it. */
  lift?: number;
  /** Move the subject right by this fraction of the width. */
  shift?: number;
  /** Scale the subject about the centre of the picture. */
  scale?: number;
  className?: string;
}): ReactNode {
  const label = useArtLabel(id);
  const u = `ka${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <svg
      className={`key-art ${className ?? ''}`}
      data-module={id}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={label}
      focusable="false"
    >
      <Defs u={u} id={id} />
      <Scene
        u={u}
        id={id}
        w={w}
        h={h}
        seed={id.length * 131 + w}
        lift={lift}
        shift={shift}
        scale={scale}
      />
    </svg>
  );
}

/** Home: the three screens side by side, cut by slanted joins, like the three frames of a title card. */
export function HeroArt(): ReactNode {
  const data = useData();
  const overall = useOverall();
  const lessons = MODULES.flatMap((m) =>
    m.lessons.map((l) => masteryRank(data.modules[m.id].lessons[l.id] ?? 'unseen')),
  );
  const opened = lessons.filter((r) => r >= 1).length;
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const W = 1600;
  const H = 900;
  const cut = 150;
  const panels: Array<{ id: ModuleId; x0: number; x1: number }> = [
    { id: 'foundations', x0: W * 0.37, x1: W * 0.63 + cut / 2 },
    { id: 'synthesis', x0: W * 0.63 - cut / 2, x1: W * 0.83 + cut / 2 },
    { id: 'ethics', x0: W * 0.83 - cut / 2, x1: W },
  ];
  return (
    <svg
      className="key-art hero-key"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={t('art.hero', { opened, total: lessons.length, p: overall })}
      focusable="false"
    >
      <defs>
        {panels.map((p) => (
          <clipPath key={p.id} id={`hc-${uid}-${p.id}`}>
            <path d={`M${p.x0 + cut} 0H${p.x1}L${p.x1 - (p.x1 === W ? 0 : cut)} ${H}H${p.x0}Z`} />
          </clipPath>
        ))}
      </defs>
      {panels.map((p) => {
        const wd = p.x1 - p.x0;
        const u = `h${uid}${p.id}`;
        return (
          <g key={p.id} clipPath={`url(#hc-${uid}-${p.id})`}>
            <svg
              x={p.x0}
              y={0}
              width={wd}
              height={H}
              viewBox={`0 0 ${wd} ${H}`}
              preserveAspectRatio="xMidYMid slice"
            >
              <Defs u={u} id={p.id} />
              <Scene
                u={u}
                id={p.id}
                w={wd}
                h={H}
                seed={p.id.length * 131 + 3}
                scale={p.id === 'foundations' ? 1.08 : 1}
              />
            </svg>
          </g>
        );
      })}
      {[W * 0.37, W * 0.63, W * 0.83].map((x) => (
        <path key={x} d={`M${x + cut} 0L${x} ${H}`} stroke={PAPER} strokeWidth="2" opacity="0.6" />
      ))}
      <path
        d={`M${W * 0.37 + cut + 20} 0L${W * 0.37 + 20} ${H}`}
        stroke="#ff4655"
        strokeWidth="5"
      />
    </svg>
  );
}
