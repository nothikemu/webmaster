/**
 * Materials and textures for the 3D world. Nothing is loaded: every texture is drawn on a canvas at start-up in gray.
 * The look comes from the stylising pass (docs/STYLE_GUIDE.md): materials only carry a light value and, for the few things that
 * matter, a red tint. Lambert (not PBR) materials: the picture is cut into flat bands anyway, so specular shading is wasted work.
 */
import {
  AdditiveBlending,
  CanvasTexture,
  Color,
  DoubleSide,
  LinearMipmapLinearFilter,
  MeshBasicMaterial,
  MeshLambertMaterial,
  RepeatWrapping,
  SRGBColorSpace,
  type Texture,
} from 'three';

const rnd = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
/** Texture detail is kept shallow so a surface stays inside one light band instead of breaking into noise. */
const gray = (v: number) => {
  const c = Math.max(0, Math.min(255, Math.round(128 + (v - 128) * 0.5)));
  return `rgb(${c},${c},${c})`;
};

function canvasTex(size: number, draw: (g: CanvasRenderingContext2D, s: number, r: () => number) => void, seed: number, repeat = 1): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d')!;
  draw(g, size, rnd(seed));
  const t = new CanvasTexture(c);
  t.wrapS = t.wrapT = RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 4;
  t.minFilter = LinearMipmapLinearFilter;
  t.generateMipmaps = true;
  return t;
}

const speckle = (g: CanvasRenderingContext2D, s: number, r: () => number, n: number, lo: number, hi: number) => {
  for (let i = 0; i < n; i++) {
    g.fillStyle = gray(lo + r() * (hi - lo));
    g.fillRect(r() * s, r() * s, 1 + r() * 2, 1 + r() * 2);
  }
};

function stone(): CanvasTexture {
  return canvasTex(512, (g, s, r) => {
    g.fillStyle = gray(150);
    g.fillRect(0, 0, s, s);
    const rows = 8;
    const h = s / rows;
    for (let y = 0; y < rows; y++) {
      let x = (y % 2) * (s / 8);
      while (x < s) {
        const w = s / 4 + r() * (s / 10);
        g.fillStyle = gray(120 + r() * 80);
        g.fillRect(x + 2, y * h + 2, w - 4, h - 4);
        x += w;
      }
    }
    g.strokeStyle = gray(60);
    g.lineWidth = 3;
    for (let y = 0; y <= rows; y++) {
      g.beginPath();
      g.moveTo(0, y * h);
      g.lineTo(s, y * h);
      g.stroke();
    }
    speckle(g, s, r, 3000, 70, 200);
  }, 11);
}

function cobble(): CanvasTexture {
  return canvasTex(512, (g, s, r) => {
    g.fillStyle = gray(70);
    g.fillRect(0, 0, s, s);
    for (let i = 0; i < 360; i++) {
      const x = r() * s;
      const y = r() * s;
      const rad = 14 + r() * 12;
      g.fillStyle = gray(105 + r() * 90);
      g.beginPath();
      g.ellipse(x, y, rad, rad * (0.7 + r() * 0.3), r() * 3, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = gray(45);
      g.lineWidth = 2;
      g.stroke();
    }
    speckle(g, s, r, 2000, 50, 200);
  }, 12);
}

function planks(): CanvasTexture {
  return canvasTex(512, (g, s, r) => {
    const n = 8;
    for (let i = 0; i < n; i++) {
      const w = s / n;
      g.fillStyle = gray(130 + r() * 60);
      g.fillRect(i * w, 0, w, s);
      for (let k = 0; k < 26; k++) {
        g.strokeStyle = gray(50 + r() * 50);
        g.lineWidth = 1 + r();
        g.beginPath();
        const x = i * w + r() * w;
        g.moveTo(x, 0);
        g.bezierCurveTo(x + (r() - 0.5) * 12, s * 0.3, x + (r() - 0.5) * 12, s * 0.6, x + (r() - 0.5) * 8, s);
        g.stroke();
      }
      g.fillStyle = gray(25);
      g.fillRect(i * w, 0, 3, s);
      g.fillRect(i * w, r() * s, w, 3);
    }
  }, 13);
}

function plaster(): CanvasTexture {
  return canvasTex(256, (g, s, r) => {
    g.fillStyle = gray(215);
    g.fillRect(0, 0, s, s);
    for (let i = 0; i < 60; i++) {
      g.fillStyle = `rgba(${90 + r() * 80},${90 + r() * 80},${90 + r() * 80},0.12)`;
      g.beginPath();
      g.ellipse(r() * s, r() * s, 20 + r() * 50, 12 + r() * 30, r() * 3, 0, Math.PI * 2);
      g.fill();
    }
    speckle(g, s, r, 1800, 130, 235);
  }, 14);
}

function tiles(): CanvasTexture {
  return canvasTex(512, (g, s, r) => {
    g.fillStyle = gray(60);
    g.fillRect(0, 0, s, s);
    const rows = 12;
    const h = s / rows;
    for (let y = 0; y < rows; y++) {
      const off = (y % 2) * (s / 16);
      for (let x = -1; x < 8; x++) {
        g.fillStyle = gray(60 + r() * 55);
        g.fillRect(x * (s / 8) + off + 2, y * h + 1, s / 8 - 4, h - 2);
        g.fillStyle = gray(30);
        g.fillRect(x * (s / 8) + off + 2, y * h + h - 5, s / 8 - 4, 4);
      }
    }
  }, 15);
}

function brick(): CanvasTexture {
  return canvasTex(512, (g, s, r) => {
    g.fillStyle = gray(50);
    g.fillRect(0, 0, s, s);
    const rows = 16;
    const h = s / rows;
    for (let y = 0; y < rows; y++) {
      const off = (y % 2) * (s / 10);
      for (let x = -1; x < 6; x++) {
        g.fillStyle = gray(90 + r() * 70);
        g.fillRect(x * (s / 5) + off + 2, y * h + 2, s / 5 - 4, h - 4);
      }
    }
    speckle(g, s, r, 2400, 40, 170);
  }, 16);
}

function marble(): CanvasTexture {
  return canvasTex(512, (g, s, r) => {
    g.fillStyle = gray(230);
    g.fillRect(0, 0, s, s);
    for (let i = 0; i < 14; i++) {
      g.strokeStyle = `rgba(80,80,80,${0.12 + r() * 0.2})`;
      g.lineWidth = 1 + r() * 2;
      g.beginPath();
      let x = r() * s;
      let y = 0;
      g.moveTo(x, y);
      while (y < s) {
        x += (r() - 0.5) * 40;
        y += 20 + r() * 30;
        g.lineTo(x, y);
      }
      g.stroke();
    }
  }, 17);
}

function cloth(): CanvasTexture {
  return canvasTex(256, (g, s, r) => {
    g.fillStyle = gray(170);
    g.fillRect(0, 0, s, s);
    for (let i = 0; i < s; i += 4) {
      g.fillStyle = gray(120 + r() * 70);
      g.fillRect(i, 0, 2, s);
      g.fillStyle = gray(100 + r() * 60);
      g.fillRect(0, i, s, 2);
    }
    g.fillStyle = gray(40);
    for (let y = 0; y < s; y += 64) for (let x = 0; x < s; x += 64) {
      g.beginPath();
      g.moveTo(x + 32, y + 8);
      g.lineTo(x + 56, y + 32);
      g.lineTo(x + 32, y + 56);
      g.lineTo(x + 8, y + 32);
      g.closePath();
      g.fill();
    }
  }, 18);
}

function paper(): CanvasTexture {
  return canvasTex(256, (g, s, r) => {
    g.fillStyle = gray(232);
    g.fillRect(0, 0, s, s);
    speckle(g, s, r, 800, 190, 245);
  }, 19);
}

const cache = new Map<string, Texture>();
function once(key: string, make: () => Texture, repeat?: [number, number]): Texture {
  let t = cache.get(key);
  if (!t) {
    t = make();
    cache.set(key, t);
  }
  const c = t.clone();
  c.needsUpdate = true;
  if (repeat) c.repeat.set(repeat[0], repeat[1]);
  return c;
}

const std = (map: Texture | null, _rough = 0.9, tint = 1, _metal = 0) => new MeshLambertMaterial({ map, color: new Color(tint, tint, tint) });
const tinted = (map: Texture | null, r: number, g: number, b: number) => new MeshLambertMaterial({ map, color: new Color(r, g, b) });

export interface Mats {
  stone(rx?: number, ry?: number): MeshLambertMaterial;
  cobble(rx?: number, ry?: number): MeshLambertMaterial;
  planks(rx?: number, ry?: number): MeshLambertMaterial;
  plaster(rx?: number, ry?: number): MeshLambertMaterial;
  tiles(rx?: number, ry?: number): MeshLambertMaterial;
  brick(rx?: number, ry?: number): MeshLambertMaterial;
  marble(rx?: number, ry?: number): MeshLambertMaterial;
  cloth(rx?: number, ry?: number): MeshLambertMaterial;
  /** Red: roofs, doors, banners, the things that matter. */
  tilesRed(rx?: number, ry?: number): MeshLambertMaterial;
  clothRed(rx?: number, ry?: number): MeshLambertMaterial;
  red: MeshLambertMaterial;
  redDeep: MeshLambertMaterial;
  paper: MeshLambertMaterial;
  wood: MeshLambertMaterial;
  darkWood: MeshLambertMaterial;
  iron: MeshLambertMaterial;
  brass: MeshLambertMaterial;
  black: MeshLambertMaterial;
  white: MeshLambertMaterial;
  rock: MeshLambertMaterial;
  glassWarm: MeshBasicMaterial;
  glassDark: MeshLambertMaterial;
  bulbLit: MeshBasicMaterial;
  bulbDark: MeshLambertMaterial;
  fire: MeshBasicMaterial;
  glowSoft: MeshBasicMaterial;
}

/** One set of shared materials. Textured ones come as factories because each surface wants its own repeat. */
export function makeMats(): Mats {
  const hdr = (v: number) => new Color(v, v, v);
  return {
    stone: (rx = 1, ry = 1) => std(once('stone', stone, [rx, ry]), 0.95, 1),
    cobble: (rx = 1, ry = 1) => std(once('cobble', cobble, [rx, ry]), 1, 1),
    planks: (rx = 1, ry = 1) => std(once('planks', planks, [rx, ry]), 0.85, 1),
    plaster: (rx = 1, ry = 1) => std(once('plaster', plaster, [rx, ry]), 1, 1),
    tiles: (rx = 1, ry = 1) => std(once('tiles', tiles, [rx, ry]), 0.8, 1),
    brick: (rx = 1, ry = 1) => std(once('brick', brick, [rx, ry]), 1, 1),
    marble: (rx = 1, ry = 1) => std(once('marble', marble, [rx, ry]), 0.5, 1),
    cloth: (rx = 1, ry = 1) => std(once('cloth', cloth, [rx, ry]), 1, 1),
    tilesRed: (rx = 1, ry = 1) => tinted(once('tiles', tiles, [rx, ry]), 2.6, 0.12, 0.2),
    clothRed: (rx = 1, ry = 1) => tinted(once('cloth', cloth, [rx, ry]), 1.6, 0.1, 0.16),
    red: tinted(null, 1.5, 0.1, 0.16),
    redDeep: tinted(null, 0.9, 0.06, 0.1),
    paper: std(once('paper', paper), 1, 1),
    wood: std(once('planks', planks, [1, 1]), 0.85, 0.8),
    darkWood: std(once('planks', planks, [1, 1]), 0.9, 0.38),
    iron: std(null, 0.45, 0.22, 0.7),
    brass: std(null, 0.35, 0.62, 0.8),
    black: std(null, 0.9, 0.05),
    white: std(null, 0.8, 0.9),
    rock: std(once('stone', stone, [3, 3]), 1, 0.55),
    glassWarm: new MeshBasicMaterial({ color: hdr(2.6), toneMapped: false }),
    glassDark: new MeshLambertMaterial({ color: new Color(0.04, 0.04, 0.045) }),
    bulbLit: new MeshBasicMaterial({ color: new Color(6, 0.4, 0.5), toneMapped: false }),
    bulbDark: new MeshLambertMaterial({ color: new Color(0.3, 0.3, 0.3) }),
    fire: new MeshBasicMaterial({ color: new Color(7, 0.8, 0.5), toneMapped: false }),
    glowSoft: new MeshBasicMaterial({ color: new Color(1.8, 0.25, 0.3), transparent: true, opacity: 0.35, blending: AdditiveBlending, depthWrite: false, side: DoubleSide, toneMapped: false }),
  };
}

/** A sign: a slanted-corner plate with heavy lettering. Light plates have a red edge; dark plates are ink with a red bar. */
export function labelTexture(text: string, w = 512, h = 128, dark = false): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d')!;
  g.fillStyle = dark ? '#0b0b0d' : '#f5f2ea';
  g.fillRect(0, 0, w, h);
  g.fillStyle = '#e3122a';
  if (dark) {
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(34, 0);
    g.lineTo(14, h);
    g.lineTo(0, h);
    g.closePath();
    g.fill();
  } else {
    g.fillRect(0, 0, w, 10);
    g.fillRect(0, h - 10, w, 10);
  }
  g.fillStyle = dark ? '#f5f2ea' : '#0b0b0d';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  let size = 80;
  const font = (n: number) => `800 ${n}px "Barlow Condensed", "Arial Narrow", sans-serif`;
  g.font = font(size);
  while (g.measureText(text).width > w - 70 && size > 20) {
    size -= 4;
    g.font = font(size);
  }
  g.save();
  g.translate(w / 2 + (dark ? 12 : 0), h / 2 + 4);
  g.transform(1, 0, -0.14, 1, 0, 0); // slanted lettering
  g.fillText(text, 0, 0);
  g.restore();
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** A soft round sprite, for motes, smoke and halos. */
export function dotTexture(soft = 0.5): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(soft, 'rgba(255,255,255,0.55)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 64, 64);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}
