/** The people: the lamplighter (the player), Kernel, and the three mentors. All built from primitives and animated by code. */
import { Color, CylinderGeometry, Group, MeshBasicMaterial, PointLight, SphereGeometry, Vector3 } from 'three';
import { ball, box, capsule, cone, cyl, mesh, ring } from './kit';
import type { Mats } from './mat';

const hdr = (v: number) => new MeshBasicMaterial({ color: new Color(v, v, v), toneMapped: false });

export interface Lamplighter {
  group: Group;
  light: PointLight;
  /** speed in m/s, grounded, t in seconds */
  update(dt: number, speed: number, grounded: boolean, t: number): void;
}

export function makeLamplighter(mats: Mats): Lamplighter {
  const g = new Group();
  const cloakM = mats.clothRed(2, 2);
  const body = new Group();
  g.add(body);
  const cloak = mesh(new CylinderGeometry(0.2, 0.56, 1.3, 20), cloakM, [0, 0.95, 0]);
  const shoulders = ball(0.31, cloakM, [0, 1.46, 0], 14);
  shoulders.scale.set(1.05, 0.7, 0.9);
  const hood = ball(0.27, mats.black, [0, 1.68, 0.02], 16);
  hood.scale.set(1, 1.08, 1.08);
  const face = ball(0.19, mats.black, [0, 1.66, 0.17], 12);
  face.scale.set(0.95, 1, 0.7);
  const eyeM = hdr(7);
  const eyeL = mesh(new SphereGeometry(0.032, 8, 6), eyeM, [-0.07, 1.68, 0.28], [0, 0, 0], false);
  const eyeR = mesh(new SphereGeometry(0.032, 8, 6), eyeM, [0.07, 1.68, 0.28], [0, 0, 0], false);
  const bag = box(0.3, 0.3, 0.14, mats.wood, [-0.3, 0.78, -0.12]);
  const strap = box(0.06, 0.8, 0.02, mats.black, [0.1, 0.95, 0.2], [0, 0, 0.5]);
  body.add(cloak, shoulders, hood, face, eyeL, eyeR, bag, strap);

  const legL = new Group();
  const legR = new Group();
  legL.position.set(-0.15, 0.62, 0);
  legR.position.set(0.15, 0.62, 0);
  legL.add(capsule(0.09, 0.42, mats.black, [0, -0.3, 0]), box(0.2, 0.14, 0.32, mats.darkWood, [0, -0.62, 0.05]));
  legR.add(capsule(0.09, 0.42, mats.black, [0, -0.3, 0]), box(0.2, 0.14, 0.32, mats.darkWood, [0, -0.62, 0.05]));
  g.add(legL, legR);

  const armL = new Group();
  armL.position.set(-0.4, 1.46, 0);
  armL.add(capsule(0.075, 0.5, cloakM, [0, -0.3, 0]));
  const armR = new Group();
  armR.position.set(0.4, 1.46, 0);
  armR.add(capsule(0.075, 0.5, cloakM, [0, -0.3, 0]));
  // the lantern, held out in the right hand
  const lantern = new Group();
  lantern.position.set(0.02, -0.66, 0.04);
  lantern.add(cyl(0.012, 0.012, 0.34, mats.iron, [0, 0.14, 0]));
  const cage = new Group();
  cage.position.y = -0.22;
  const core = mesh(new SphereGeometry(0.085, 12, 10), mats.bulbLit, [0, 0, 0], [0, 0, 0], false);
  cage.add(core, ring(0.11, 0.01, mats.iron, [0, 0.1, 0], [Math.PI / 2, 0, 0], 14), ring(0.11, 0.01, mats.iron, [0, -0.1, 0], [Math.PI / 2, 0, 0], 14));
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    cage.add(cyl(0.008, 0.008, 0.22, mats.iron, [Math.cos(a) * 0.11, -0.11, Math.sin(a) * 0.11], 6));
  }
  cage.add(cone(0.13, 0.1, mats.iron, [0, 0.1, 0], 12));
  lantern.add(cage);
  armR.add(lantern);
  const light = new PointLight(0xffffff, 26, 17, 1.7);
  light.position.set(0, -0.22, 0);
  lantern.add(light);
  g.add(armL, armR);

  let gait = 0;
  return {
    group: g,
    light,
    update(dt, speed, grounded, t) {
      const k = Math.min(1, speed / 4.2);
      gait += dt * (4 + speed * 1.15);
      const s = Math.sin(gait);
      const swing = grounded ? s * 0.75 * k : 0.5;
      legL.rotation.x = swing;
      legR.rotation.x = -swing;
      armL.rotation.x = -swing * 0.8;
      armR.rotation.x = swing * 0.35 - 0.35 * k;
      armR.rotation.z = 0.12 + (grounded ? 0 : 0.5);
      lantern.rotation.x = -swing * 0.3 + Math.sin(t * 1.3) * 0.04;
      lantern.rotation.z = Math.sin(t * 1.1) * 0.06 - 0.1 * k;
      const bobY = Math.abs(Math.cos(gait)) * 0.06 * k;
      body.position.y = bobY + Math.sin(t * 1.6) * 0.006;
      body.rotation.x = 0.12 * k;
      body.rotation.z = s * 0.025 * k;
      cloak.scale.set(1 + 0.05 * k * Math.abs(s), 1, 1 + 0.12 * k);
      light.intensity = 24 + Math.sin(t * 9.3) * 1.2 + Math.sin(t * 5.1) * 1.8;
    },
  };
}

// ---------------------------------------------------------------------------------------------- Kernel
export interface Kernel3 {
  group: Group;
  update(dt: number, t: number, target: Vector3, look: Vector3, waving: boolean): void;
}

export function makeKernel(mats: Mats): Kernel3 {
  const g = new Group();
  const shell = mats.white.clone();
  const body = ball(0.21, shell, [0, 0, 0], 20);
  body.scale.set(1, 0.95, 1);
  const dome = ball(0.17, mats.glassDark, [0, 0.22, 0.02], 18);
  const eyeM = hdr(8);
  const eL = mesh(new SphereGeometry(0.035, 8, 6), eyeM, [-0.06, 0.24, 0.15], [0, 0, 0], false);
  const eR = mesh(new SphereGeometry(0.035, 8, 6), eyeM, [0.06, 0.24, 0.15], [0, 0, 0], false);
  const brim = cyl(0.22, 0.22, 0.025, mats.wood, [0, 0.36, 0], 20);
  const hat = cone(0.15, 0.17, mats.wood, [0, 0.38, 0], 20);
  const armL = capsule(0.04, 0.12, shell, [-0.27, -0.02, 0], [0, 0, 0.7]);
  const armR = new Group();
  armR.position.set(0.24, 0.02, 0);
  armR.add(capsule(0.04, 0.12, shell, [0.05, 0.05, 0], [0, 0, -0.7]));
  const mini = mesh(new SphereGeometry(0.05, 8, 6), mats.bulbLit, [0.12, 0.14, 0], [0, 0, 0], false);
  armR.add(mini);
  const ringM = ring(0.25, 0.012, mats.red, [0, -0.06, 0], [Math.PI / 2, 0, 0], 24);
  g.add(body, dome, eL, eR, brim, hat, armL, armR, ringM);
  const v = new Vector3();
  return {
    group: g,
    update(dt, t, target, look, waving) {
      v.copy(target).sub(g.position);
      const d = v.length();
      g.position.addScaledVector(v, Math.min(1, dt * (d > 6 ? 8 : 3.2)));
      g.position.y += Math.sin(t * 2.3) * dt * 0.28;
      const yaw = Math.atan2(look.x - g.position.x, look.z - g.position.z);
      let dy = yaw - g.rotation.y;
      dy = Math.atan2(Math.sin(dy), Math.cos(dy));
      g.rotation.y += dy * Math.min(1, dt * 6);
      g.rotation.z = Math.sin(t * 1.7) * 0.05;
      armR.rotation.z = waving ? Math.sin(t * 9) * 0.5 - 0.3 : Math.sin(t * 2) * 0.1;
      ringM.rotation.z = t * 1.4;
    },
  };
}

// ---------------------------------------------------------------------------------------------- the mentors
export interface Npc {
  group: Group;
  update(dt: number, t: number, near: boolean, player: Vector3): void;
}

export function makeNpc(kind: 'wren' | 'brannock' | 'sedge', mats: Mats): Npc {
  const g = new Group();
  const cloth = mats.cloth(2, 2);
  const head = new Group();
  const bodyG = new Group();
  g.add(bodyG, head);
  const skin = mats.white.clone();
  skin.color = new Color(0.55, 0.55, 0.55);
  const arm = new Group();

  if (kind === 'wren') {
    cloth.color = new Color(1.5, 0.1, 0.16);
    bodyG.add(ball(0.52, cloth, [0, 0.62, 0], 20), box(0.5, 0.45, 0.05, mats.paper, [0, 0.4, 0.5]));
    head.position.set(0, 1.35, 0);
    head.add(ball(0.24, skin, [0, 0, 0], 16), cyl(0.7, 0.7, 0.05, mats.wood, [0, 0.18, 0], 28), cone(0.3, 0.3, mats.wood, [0, 0.2, 0], 20));
    head.add(mesh(new SphereGeometry(0.03, 6, 6), mats.black, [-0.08, 0.02, 0.22], [0, 0, 0], false), mesh(new SphereGeometry(0.03, 6, 6), mats.black, [0.08, 0.02, 0.22], [0, 0, 0], false));
    arm.position.set(0.45, 0.95, 0.1);
    arm.add(capsule(0.07, 0.4, cloth, [0.04, -0.2, 0.1], [0.6, 0, 0]), box(0.5, 0.08, 0.1, mats.wood, [0.05, -0.55, 0.45]));
    bodyG.add(arm);
  } else if (kind === 'brannock') {
    cloth.color = new Color(0.42, 0.4, 0.38);
    bodyG.add(capsule(0.45, 0.7, cloth, [0, 0.95, 0]), box(0.7, 0.9, 0.06, mats.darkWood, [0, 0.55, 0.42]), cyl(0.6, 0.6, 0.12, mats.black, [0, 0.82, 0], 18));
    head.position.set(0, 1.78, 0);
    head.add(ball(0.26, skin, [0, 0, 0], 16), cone(0.22, 0.55, mats.paper, [0, -0.42, 0.14], 12, [Math.PI, 0, 0]));
    head.add(ring(0.12, 0.03, mats.brass, [-0.11, 0.22, 0.18], [0, 0, 0], 12), ring(0.12, 0.03, mats.brass, [0.11, 0.22, 0.18], [0, 0, 0], 12), box(0.5, 0.05, 0.05, mats.darkWood, [0, 0.2, 0.2]));
    arm.position.set(0.55, 1.45, 0);
    arm.add(capsule(0.1, 0.5, cloth, [0.05, -0.28, 0]), cyl(0.04, 0.04, 0.7, mats.wood, [0.1, -0.78, 0.2]), box(0.32, 0.18, 0.18, mats.iron, [0.1, -0.1, 0.2]));
    bodyG.add(arm);
  } else {
    cloth.color = new Color(0.22, 0.22, 0.24);
    bodyG.add(cone(0.55, 1.9, cloth, [0, 0, 0], 20));
    head.position.set(0, 1.9, 0);
    head.add(ball(0.24, cloth, [0, 0, 0], 16), ball(0.16, mats.black, [0, -0.02, 0.15], 12), mesh(new SphereGeometry(0.03, 6, 6), hdr(6), [-0.06, 0, 0.26], [0, 0, 0], false), mesh(new SphereGeometry(0.03, 6, 6), hdr(6), [0.06, 0, 0.26], [0, 0, 0], false));
    arm.position.set(0.5, 1.5, 0.1);
    arm.add(capsule(0.07, 0.5, cloth, [0.05, -0.28, 0.12], [0.5, 0, 0]));
    const staff = new Group();
    staff.position.set(0.15, -0.6, 0.35);
    staff.add(cyl(0.03, 0.03, 2.3, mats.darkWood, [0, -0.8, 0]), mesh(new SphereGeometry(0.11, 10, 8), mats.bulbLit, [0, 1.5, 0], [0, 0, 0], false), ring(0.14, 0.015, mats.iron, [0, 1.5, 0], [Math.PI / 2, 0, 0], 12));
    arm.add(staff);
    bodyG.add(arm);
    const lamp = new PointLight(0xffffff, 12, 9, 1.8);
    lamp.position.set(0.65, 2.45, 0.5);
    g.add(lamp);
  }
  return {
    group: g,
    update(_dt, t, near, player) {
      bodyG.scale.y = 1 + Math.sin(t * 1.5) * 0.008;
      arm.rotation.x = Math.sin(t * 1.2 + 1) * 0.04 + (near ? Math.sin(t * 3) * 0.12 : 0);
      if (near) {
        const yaw = Math.atan2(player.x - g.position.x, player.z - g.position.z) - g.rotation.y;
        const dy = Math.atan2(Math.sin(yaw), Math.cos(yaw));
        head.rotation.y += (Math.max(-1, Math.min(1, dy)) - head.rotation.y) * 0.1;
        g.rotation.y += dy * 0.02;
      } else head.rotation.y *= 0.95;
    },
  };
}

