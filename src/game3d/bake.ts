/**
 * Draw-call diet. The world is built from hundreds of small primitives (a window is eight boxes), and every mesh is a draw call, a
 * shadow draw call, and some JavaScript. Once a place is built, `bakeWorld` finds everything that never moves and merges it, so
 * all the stone of one building is one mesh, all its dark wood another, and so on.
 *
 *  - What moves is found by running the place's own update twice and seeing which objects changed; anything the update cannot
 *    show (a material that is swapped when a lamp lights, a cloth whose vertices are rewritten) is marked with `live()`.
 *  - Texture repeat is baked into the UVs, so `stone(4, 1)` and `stone(30, 2)` can share one material and one draw call.
 */
import {
  type BufferGeometry,
  Float32BufferAttribute,
  Mesh,
  type Material,
  type MeshBasicMaterial,
  type MeshLambertMaterial,
  type Object3D,
  type Texture,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/** Mark an object (and everything under it) as one that changes after it is built, so baking leaves it alone. */
export function live<T extends Object3D>(o: T): T {
  o.userData.live = true;
  return o;
}

/** Mark a rig (a person whose parts are animated by hand) so baking leaves the whole thing, and everything in it, exactly as built. */
export function keep<T extends Object3D>(o: T): T {
  o.userData.keep = true;
  return o;
}

/** True if the object, or anything between it and `frame` (not counting the frame itself), moves. */
const isLive = (o: Object3D, frame: Object3D): boolean => {
  for (let p: Object3D | null = o; p && p !== frame; p = p.parent) if (p.userData.live || p.userData.keep) return true;
  if (frame.userData.keep) return true;
  return false;
};

/** Run `update` at two different times and flag every object whose position, rotation, scale or visibility changed. */
export function detectLive(root: Object3D, update: (dt: number, t: number) => void): void {
  const objs: Object3D[] = [];
  root.traverse((o) => objs.push(o));
  const snap = () => objs.map((o) => [o.position.x, o.position.y, o.position.z, o.rotation.x, o.rotation.y, o.rotation.z, o.scale.x, o.scale.y, o.scale.z, o.visible ? 1 : 0]);
  const differs = (a: number[], b: number[]) => a.some((v, i) => Math.abs(v - b[i]!) > 1e-6);
  const a = snap();
  update(0.31, 1.7);
  const b = snap();
  update(0.43, 4.1);
  const c = snap();
  objs.forEach((o, i) => {
    if (differs(a[i]!, b[i]!) || differs(b[i]!, c[i]!)) o.userData.live = true;
  });
}

type Simple = MeshLambertMaterial | MeshBasicMaterial;
const simple = (m: Material | Material[]): Simple | null => {
  if (Array.isArray(m)) return null;
  const t = (m as Simple).type;
  if (t !== 'MeshLambertMaterial' && t !== 'MeshBasicMaterial') return null;
  if (m.transparent || m.userData.keep || m.blending !== 1) return null;
  return m as Simple;
};

export interface BakeResult {
  /** Meshes that were merged away. */
  merged: number;
  /** Meshes that took their place. */
  made: number;
}

/** One cache per world, so equal materials and the unit-repeat textures are shared. */
class Baker {
  private mats = new Map<string, Simple>();
  private maps = new Map<string, Texture>();

  material(first: Simple, key: string): Simple {
    let m = this.mats.get(key);
    if (!m) {
      m = first.clone();
      if (m.map) {
        const src = m.map.source.uuid;
        let unit = this.maps.get(src);
        if (!unit) {
          unit = m.map.clone();
          unit.repeat.set(1, 1);
          unit.offset.set(0, 0);
          unit.needsUpdate = true;
          this.maps.set(src, unit);
        }
        m.map = unit;
      }
      this.mats.set(key, m);
    }
    return m;
  }

  bake(chunk: Object3D, shallow = false): BakeResult {
    chunk.updateWorldMatrix(true, true);
    const inv = chunk.matrixWorld.clone().invert();
    const groups = new Map<string, { first: Mesh; mat: Simple; geoms: BufferGeometry[]; meshes: Mesh[] }>();
    chunk.traverse((o) => {
      const me = o as Mesh;
      if (!me.isMesh || (o as { isInstancedMesh?: boolean }).isInstancedMesh || (o as { isSkinnedMesh?: boolean }).isSkinnedMesh) return;
      if (shallow && o.parent !== chunk) return;
      if (isLive(o, chunk)) return;
      const mat = simple(me.material);
      if (!mat || !me.geometry.getAttribute('position')) return;
      const c = (mat as MeshLambertMaterial).color;
      const key = [mat.type, c.r.toFixed(3), c.g.toFixed(3), c.b.toFixed(3), mat.map?.source.uuid ?? '-', mat.side, mat.fog ? 1 : 0, me.castShadow ? 1 : 0, me.receiveShadow ? 1 : 0, me.renderOrder].join('|');
      const rel = inv.clone().multiply(me.matrixWorld);
      const g = me.geometry.index ? me.geometry.toNonIndexed() : me.geometry.clone();
      for (const name of Object.keys(g.attributes)) if (name !== 'position' && name !== 'normal' && name !== 'uv') g.deleteAttribute(name);
      if (!g.getAttribute('normal')) g.computeVertexNormals();
      const n = g.getAttribute('position').count;
      if (!g.getAttribute('uv')) g.setAttribute('uv', new Float32BufferAttribute(new Float32Array(n * 2), 2));
      const map = mat.map;
      if (map && (map.repeat.x !== 1 || map.repeat.y !== 1)) {
        const uv = g.getAttribute('uv');
        for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * map.repeat.x, uv.getY(i) * map.repeat.y);
      }
      g.applyMatrix4(rel);
      let grp = groups.get(key);
      if (!grp) {
        grp = { first: me, mat, geoms: [], meshes: [] };
        groups.set(key, grp);
      }
      grp.geoms.push(g);
      grp.meshes.push(me);
    });
    let merged = 0;
    let made = 0;
    for (const [key, grp] of groups) {
      // a lone mesh is not worth the copy, unless its texture repeat would otherwise stay in the material
      const geom = grp.geoms.length === 1 ? grp.geoms[0]! : mergeGeometries(grp.geoms, false);
      if (!geom) continue;
      const out = new Mesh(geom, this.material(grp.mat, key));
      out.castShadow = grp.first.castShadow;
      out.receiveShadow = grp.first.receiveShadow;
      out.renderOrder = grp.first.renderOrder;
      out.name = 'baked';
      for (const me of grp.meshes) {
        me.removeFromParent();
        me.geometry.dispose();
      }
      for (const g of grp.geoms) if (g !== geom) g.dispose();
      chunk.add(out);
      merged += grp.meshes.length;
      made += 1;
    }
    return { merged, made };
  }
}

/**
 * Merge the still parts of a built place into one mesh per material. `update` is the place's own animation step, used to find what
 * moves; moving groups keep moving as one thing and have their own fixed parts merged inside them.
 */
export function bakeWorld(root: Object3D, update?: (dt: number, t: number) => void): BakeResult {
  if (update) detectLive(root, update);
  const baker = new Baker();
  const total: BakeResult = { merged: 0, made: 0 };
  const add = (r: BakeResult) => {
    total.merged += r.merged;
    total.made += r.made;
  };
  // a still chunk is baked in its own frame; a moving group is baked in its own frame too, so what is fixed inside it (a boat's
  // hull and mast) still merges and the group keeps moving as one thing
  const frames: Object3D[] = [];
  root.traverse((o) => {
    if (o === root || o.type !== 'Group') return;
    if ((o.parent === root || o.userData.live) && !o.userData.keep) frames.push(o);
  });
  for (const f of frames) add(baker.bake(f));

  // finally merge across the still chunks too: one mesh per material for the whole place
  add(baker.bake(root));
  return total;
}

/**
 * Point lights make every surface in the scene pay for them. The look is made of flat bands, so the places use directional light
 * plus emissive shapes instead; this removes any point light a set piece added (the player's own lantern is added elsewhere).
 */
export function stripLights(root: Object3D): void {
  const lights: Object3D[] = [];
  root.traverse((o) => {
    if ((o as { isPointLight?: boolean }).isPointLight || (o as { isSpotLight?: boolean }).isSpotLight) lights.push(o);
  });
  for (const l of lights) l.removeFromParent();
}
