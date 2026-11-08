import * as THREE from 'three';
import { rng } from './materials.js';
import { X, Z } from './build.js';

// Every piece is built in its own frame: metres, origin at the centre of its
// footprint on the floor, FRONT facing +Z. `facing` in the plan turns the front
// toward a compass side of the sketch (N = up on the sketch).

const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...o });
const M = {
  fabric: std('#6E7F8C', { roughness: 1 }),
  fabricLight: std('#8696A2', { roughness: 1 }),
  accent: std('#C9824F', { roughness: 1 }),
  accent2: std('#D9C7A3', { roughness: 1 }),
  woodLight: std('#C8A27C', { roughness: 0.6 }),
  woodDark: std('#5C4433', { roughness: 0.6 }),
  white: std('#F2F0EB', { roughness: 0.5 }),
  black: std('#232528', { roughness: 0.4 }),
  metal: std('#A3A8AD', { roughness: 0.35, metalness: 0.6 }),
  ceramic: std('#FBFBF9', { roughness: 0.2 }),
  ceramicDark: std('#DCDFE0', { roughness: 0.2 }),
  linen: std('#EEEAE2', { roughness: 1 }),
  blanket: std('#7D8C6E', { roughness: 1 }),
  rug: std('#CDBFA8', { roughness: 1 }),
  rugInner: std('#B5A387', { roughness: 1 }),
  leaf: std('#5E8C5A', { flatShading: true, roughness: 0.9 }),
  leafDark: std('#466F44', { flatShading: true, roughness: 0.9 }),
  terracotta: std('#B86B4B'),
  concrete: std('#8F9294'),
  soil: std('#3D3026'),
  glass: new THREE.MeshStandardMaterial({ color: '#BFD9E6', transparent: true, opacity: 0.25, roughness: 0.05, depthWrite: false }),
  mirror: std('#CBD8DF', { roughness: 0.1, metalness: 0.2 }),
  shade: std('#F4E9D6', { emissive: '#F6D9A8', emissiveIntensity: 0.35, roughness: 1 }),
  screen: std('#101215', { roughness: 0.15 }),
  gap: std('#8E8A83'),
  canvas: std('#E9E2D3', { roughness: 1 }),
};
const BOOK_COLORS = ['#8C3B2E', '#2F4A5E', '#C9A24B', '#4F6B4A', '#D8D2C4', '#6B4E71', '#B5652F', '#3A3D40'];
const bookMats = BOOK_COLORS.map((c) => std(c, { roughness: 0.9 }));

// Primitive helpers — y is the BOTTOM of the shape.
function box(g, w, h, d, x, y, z, mat, shadow = true) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y + h / 2, z);
  m.castShadow = shadow;
  m.receiveShadow = true;
  g.add(m);
  return m;
}
function cyl(g, rTop, rBottom, h, x, y, z, mat, seg = 24) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBottom, h, seg), mat);
  m.position.set(x, y + h / 2, z);
  m.castShadow = m.receiveShadow = true;
  g.add(m);
  return m;
}
function legs(g, w, d, h, inset, mat, r = 0.02) {
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    box(g, r * 2, h, r * 2, sx * (w / 2 - inset), 0, sz * (d / 2 - inset), mat);
  }
}
function foliage(g, r, count, cx, cz, y0, y1, spread) {
  for (let i = 0; i < count; i++) {
    const s = spread * (0.45 + r() * 0.35);
    const a = r() * Math.PI * 2;
    const rad = r() * spread * 0.6;
    const leaf = new THREE.Mesh(new THREE.IcosahedronGeometry(s, 0), r() > 0.5 ? M.leaf : M.leafDark);
    leaf.position.set(cx + Math.cos(a) * rad, y0 + s + r() * Math.max(0, y1 - y0 - 2 * s), cz + Math.sin(a) * rad);
    leaf.rotation.set(r() * 3, r() * 3, r() * 3);
    leaf.castShadow = true;
    g.add(leaf);
  }
}
function lamp(g, x, y, z) {
  cyl(g, 0.06, 0.07, 0.03, x, y, z, M.black);
  cyl(g, 0.012, 0.012, 0.25, x, y + 0.03, z, M.metal, 8);
  cyl(g, 0.1, 0.14, 0.18, x, y + 0.24, z, M.shade);
}
function faucet(g, x, y, z) {
  cyl(g, 0.015, 0.015, 0.22, x, y, z, M.metal, 12);
  box(g, 0.025, 0.025, 0.14, x, y + 0.2, z + 0.07, M.metal);
}
// Thin vertical grooves across a front face, splitting it into n doors.
function doorGaps(g, w, h, d, n, y = 0) {
  for (let i = 1; i < n; i++) box(g, 0.006, h - 0.04, 0.004, -w / 2 + (w * i) / n, y + 0.02, d / 2 + 0.002, M.gap, false);
}

// [w, d, h] defaults in metres; elev = height of the bottom above the floor.
const TYPES = {
  sofa: {
    size: [2.2, 0.9, 0.85],
    build(g, [w, d]) {
      const arm = 0.18;
      const n = w > 1.6 ? 3 : w > 1.1 ? 2 : 1;
      const cw = (w - 2 * arm) / n;
      legs(g, w, d, 0.08, 0.08, M.woodDark, 0.025);
      box(g, w, 0.3, d, 0, 0.08, 0, M.fabric);
      box(g, w, 0.45, 0.2, 0, 0.38, -d / 2 + 0.1, M.fabric);
      for (const s of [-1, 1]) box(g, arm, 0.3, d, s * (w / 2 - arm / 2), 0.38, 0, M.fabric);
      for (let i = 0; i < n; i++) {
        const x = -w / 2 + arm + cw * (i + 0.5);
        box(g, cw - 0.015, 0.14, d - 0.23, x, 0.38, 0.1, M.fabricLight);
        box(g, cw - 0.015, 0.36, 0.14, x, 0.52, -d / 2 + 0.27, M.fabricLight);
      }
      const p1 = box(g, 0.38, 0.32, 0.12, -w / 2 + arm + 0.25, 0.52, -d / 2 + 0.38, M.accent);
      p1.rotation.set(-0.25, 0.25, 0);
      const p2 = box(g, 0.38, 0.32, 0.12, w / 2 - arm - 0.25, 0.52, -d / 2 + 0.38, M.accent2);
      p2.rotation.set(-0.25, -0.25, 0);
    },
  },
  coffeeTable: {
    size: [1.0, 0.5, 0.42],
    build(g, [w, d, h]) {
      box(g, w, 0.04, d, 0, h - 0.04, 0, M.woodLight);
      legs(g, w, d, h - 0.04, 0.05, M.woodDark);
      box(g, 0.26, 0.03, 0.19, -w / 4, h, 0, bookMats[1]);
      box(g, 0.22, 0.025, 0.17, -w / 4, h + 0.03, 0.01, bookMats[2]);
      cyl(g, 0.05, 0.04, 0.16, w / 4, h, 0, M.ceramic);
    },
  },
  rug: {
    size: [1.6, 2.2, 0.012],
    build(g, [w, d]) {
      box(g, w, 0.008, d, 0, 0.001, 0, M.rug, false);
      box(g, w - 0.2, 0.009, d - 0.2, 0, 0.001, 0, M.rugInner, false);
    },
  },
  tvUnit: {
    size: [1.4, 0.4, 0.45],
    build(g, [w, d, h]) {
      box(g, w, h - 0.06, d, 0, 0.06, 0, M.white);
      legs(g, w, d, 0.06, 0.06, M.woodDark);
      doorGaps(g, w, h - 0.06, d, 3, 0.06);
      const tw = Math.min(1.2, w - 0.2);
      box(g, 0.28, 0.02, 0.18, 0, h, -0.04, M.black);
      box(g, 0.05, 0.08, 0.03, 0, h + 0.02, -0.06, M.black);
      box(g, tw, tw * 0.57, 0.04, 0, h + 0.08, -0.06, M.screen);
      cyl(g, 0.05, 0.07, 0.22, w / 2 - 0.12, h, 0.05, M.terracotta);
    },
  },
  diningTable: {
    size: [1.2, 0.8, 0.75],
    build(g, [w, d, h]) {
      box(g, w, 0.04, d, 0, h - 0.04, 0, M.woodLight);
      legs(g, w, d, h - 0.04, 0.06, M.woodDark, 0.025);
      cyl(g, 0.07, 0.05, 0.12, 0, h, 0, M.ceramicDark);
    },
  },
  chair: {
    size: [0.45, 0.5, 0.85],
    build(g, [w, d, h]) {
      box(g, w, 0.04, 0.45, 0, 0.43, 0.025, M.woodLight);
      legs(g, w, 0.45, 0.43, 0.03, M.woodDark, 0.015);
      box(g, 0.03, h - 0.43, 0.03, -w / 2 + 0.03, 0.43, -d / 2 + 0.045, M.woodDark);
      box(g, 0.03, h - 0.43, 0.03, w / 2 - 0.03, 0.43, -d / 2 + 0.045, M.woodDark);
      box(g, w, 0.18, 0.025, 0, h - 0.2, -d / 2 + 0.045, M.woodLight);
    },
  },
  stool: {
    size: [0.38, 0.38, 0.75],
    build(g, [w, , h]) {
      cyl(g, w / 2 * 0.9, w / 2, 0.015, 0, 0, 0, M.black);
      cyl(g, 0.022, 0.022, h - 0.05, 0, 0.015, 0, M.metal, 10);
      cyl(g, w / 2, w / 2 * 0.95, 0.05, 0, h - 0.05, 0, M.woodDark);
    },
  },
  // Kitchen island: cabinets on the back (kitchen) side, worktop overhanging the
  // front by 30 cm so stools fit underneath for eating.
  island: {
    size: [1.8, 0.9, 0.92],
    build(g, [w, d, h]) {
      const over = 0.3;
      const cd = d - over;
      const cz = -d / 2 + cd / 2;
      box(g, w - 0.04, 0.08, cd - 0.06, 0, 0, cz - 0.03, M.black);
      box(g, w, h - 0.12, cd, 0, 0.08, cz, M.white);
      // drawers and doors face the kitchen (-Z)
      const n = Math.max(2, Math.round(w / 0.6));
      for (let i = 1; i < n; i++) box(g, 0.006, h - 0.16, 0.004, -w / 2 + (w * i) / n, 0.1, cz - cd / 2 - 0.002, M.gap, false);
      for (let i = 0; i < n; i++) box(g, 0.14, 0.015, 0.02, -w / 2 + (w * (i + 0.5)) / n, h - 0.18, cz - cd / 2 - 0.01, M.metal);
      box(g, w + 0.04, 0.04, d, 0, h - 0.04, 0, M.woodLight);
      // a bit of life on top
      cyl(g, 0.14, 0.08, 0.07, w / 4, h, 0, M.ceramicDark);
      for (const [x, z, c] of [[w / 4 - 0.04, 0.02, M.accent], [w / 4 + 0.05, -0.03, M.leaf], [w / 4, -0.05, M.accent2]]) {
        const fruit = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 8), c);
        fruit.position.set(x, h + 0.08, z);
        fruit.castShadow = true;
        g.add(fruit);
      }
      box(g, 0.4, 0.02, 0.3, -w / 4, h, 0.05, M.woodDark);
    },
  },
  bed: {
    size: [1.6, 2.0, 1.05],
    build(g, [w, d, h]) {
      legs(g, w, d, 0.05, 0.08, M.woodDark, 0.03);
      box(g, w, 0.3, d, 0, 0.05, 0, M.woodLight);
      box(g, w - 0.06, 0.2, d - 0.08, 0, 0.35, 0.02, M.linen);
      const cover = d * 0.68;
      box(g, w - 0.02, 0.06, cover, 0, 0.52, d / 2 - cover / 2, M.blanket);
      box(g, w - 0.02, 0.07, 0.22, 0, 0.53, d / 2 - cover + 0.06, M.linen);
      const pillows = w >= 1.3 ? [-w / 4, w / 4] : [0];
      for (const x of pillows) {
        const p = box(g, w / pillows.length - 0.14, 0.13, 0.4, x, 0.55, -d / 2 + 0.32, M.linen);
        p.rotation.x = -0.12;
      }
      box(g, w + 0.06, h, 0.08, 0, 0, -d / 2 + 0.04, M.fabric);
    },
  },
  nightstand: {
    size: [0.45, 0.4, 0.5],
    build(g, [w, d, h]) {
      box(g, w, h, d, 0, 0, 0, M.white);
      box(g, w - 0.04, 0.006, 0.004, 0, h * 0.55, d / 2 + 0.002, M.gap, false);
      box(g, 0.12, 0.015, 0.02, 0, h * 0.75, d / 2 + 0.01, M.metal);
      lamp(g, 0, h, -0.03);
    },
  },
  wardrobe: {
    size: [2.0, 0.6, 2.2],
    build(g, [w, d, h]) {
      box(g, w, h, d, 0, 0, 0, M.white);
      const n = Math.max(2, Math.round(w / 0.5));
      doorGaps(g, w, h, d, n);
      for (let i = 0; i < n; i++) {
        const left = -w / 2 + (w * i) / n;
        const x = i % 2 === 0 ? left + w / n - 0.05 : left + 0.05;
        box(g, 0.015, 0.35, 0.025, x, 0.95, d / 2 + 0.012, M.metal);
      }
    },
  },
  desk: {
    size: [1.2, 0.6, 0.75],
    build(g, [w, d, h]) {
      box(g, w, 0.03, d, 0, h - 0.03, 0, M.woodLight);
      for (const s of [-1, 1]) box(g, 0.03, h - 0.03, d - 0.02, s * (w / 2 - 0.015), 0, 0, M.white);
      box(g, 0.32, 0.015, 0.22, -0.1, h, 0.05, M.metal);
      const screen = box(g, 0.32, 0.21, 0.01, -0.1, h + 0.012, -0.06, M.metal);
      screen.rotation.x = -0.25;
      lamp(g, w / 2 - 0.15, h, -d / 2 + 0.12);
    },
  },
  bookshelf: {
    size: [0.8, 0.3, 1.8],
    build(g, [w, d, h], r) {
      for (const s of [-1, 1]) box(g, 0.02, h, d, s * (w / 2 - 0.01), 0, 0, M.woodLight);
      box(g, w, h, 0.01, 0, 0, -d / 2 + 0.005, M.woodLight);
      const levels = 5;
      const step = (h - 0.02) / levels;
      for (let i = 0; i <= levels; i++) box(g, w - 0.04, 0.02, d - 0.01, 0, i * step, 0.005, M.woodLight);
      for (let i = 0; i < levels; i++) {
        let x = -w / 2 + 0.03;
        while (true) {
          const bw = 0.02 + r() * 0.03;
          if (x + bw > w / 2 - 0.03) break;
          if (r() < 0.08) { x += 0.06; continue; }
          const bh = Math.min(step - 0.05, 0.16 + r() * 0.12);
          box(g, bw, bh, 0.18 + r() * 0.04, x + bw / 2, i * step + 0.02, 0.01, bookMats[Math.floor(r() * bookMats.length)], false);
          x += bw + 0.003;
        }
      }
    },
  },
  floorLamp: {
    size: [0.36, 0.36, 1.65],
    build(g, [w, , h]) {
      cyl(g, w / 2 * 0.8, w / 2, 0.03, 0, 0, 0, M.black);
      cyl(g, 0.015, 0.015, h - 0.3, 0, 0.03, 0, M.metal, 10);
      cyl(g, 0.17, 0.22, 0.3, 0, h - 0.3, 0, M.shade);
    },
  },
  plant: {
    size: [0.4, 0.4, 1.1],
    build(g, [w, , h], r) {
      const pr = w / 2;
      cyl(g, pr, pr * 0.75, h * 0.32, 0, 0, 0, M.terracotta);
      cyl(g, pr * 0.92, pr * 0.92, 0.01, 0, h * 0.32 - 0.02, 0, M.soil);
      cyl(g, 0.02, 0.025, h * 0.35, 0, h * 0.3, 0, M.woodDark, 8);
      foliage(g, r, 10, 0, 0, h * 0.42, h, pr * 1.2);
    },
  },
  planter: {
    size: [0.8, 0.3, 0.6],
    build(g, [w, d], r) {
      box(g, w, 0.3, d, 0, 0, 0, M.concrete);
      box(g, w - 0.04, 0.01, d - 0.04, 0, 0.29, 0, M.soil, false);
      for (let i = 0; i < 4; i++) foliage(g, r, 3, -w / 2 + w * (i + 0.5) / 4, 0, 0.28, 0.6, 0.16);
    },
  },
  fridge: {
    size: [0.6, 0.65, 1.85],
    build(g, [w, d, h]) {
      box(g, w, h, d, 0, 0, 0, M.white);
      box(g, w - 0.02, 0.006, 0.004, 0, 1.2, d / 2 + 0.002, M.gap, false);
      box(g, 0.02, 0.35, 0.03, w / 2 - 0.06, 0.8, d / 2 + 0.015, M.metal);
      box(g, 0.02, 0.3, 0.03, w / 2 - 0.06, 1.3, d / 2 + 0.015, M.metal);
    },
  },
  upperCabinets: {
    size: [1.8, 0.35, 0.7],
    elev: 1.45,
    build(g, [w, d, h]) {
      box(g, w, h, d, 0, 0, 0, M.white);
      const n = Math.max(1, Math.round(w / 0.6));
      doorGaps(g, w, h, d, n);
      for (let i = 0; i < n; i++) box(g, 0.12, 0.015, 0.02, -w / 2 + (w * (i + 0.5)) / n, 0.04, d / 2 + 0.01, M.metal);
    },
  },
  sink: {
    size: [0.5, 0.42, 0.25],
    elev: 0.9,
    build(g, [w, d]) {
      box(g, w, 0.01, d, 0, 0, 0, M.metal, false);
      box(g, w - 0.08, 0.011, d - 0.1, 0, 0, 0.02, M.black, false);
      faucet(g, 0, 0.01, -d / 2 + 0.04);
    },
  },
  cooktop: {
    size: [0.6, 0.5, 0.02],
    elev: 0.9,
    build(g, [w, d]) {
      box(g, w, 0.01, d, 0, 0, 0, M.screen, false);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        cyl(g, 0.085, 0.085, 0.002, sx * w / 4, 0.01, sz * d / 4, M.black, 32);
      }
    },
  },
  toilet: {
    size: [0.4, 0.7, 0.8],
    build(g, [w, d, h]) {
      const bowl = cyl(g, 0.19, 0.15, 0.4, 0, 0, 0.08, M.ceramic);
      bowl.scale.z = 1.35;
      const seat = cyl(g, 0.2, 0.2, 0.03, 0, 0.4, 0.08, M.ceramic);
      seat.scale.z = 1.3;
      box(g, w - 0.02, h - 0.4, 0.18, 0, 0.4, -d / 2 + 0.09, M.ceramic);
      box(g, 0.08, 0.01, 0.05, 0, h, -d / 2 + 0.09, M.metal, false);
    },
  },
  shower: {
    size: [0.8, 0.8, 2.0],
    build(g, [w, d, h]) {
      box(g, w, 0.05, d, 0, 0, 0, M.ceramic);
      box(g, w, h - 0.1, 0.01, 0, 0.05, d / 2 - 0.005, M.glass, false);
      for (const s of [-1, 1]) box(g, 0.01, h - 0.1, d, s * (w / 2 - 0.005), 0.05, 0, M.glass, false);
      cyl(g, 0.012, 0.012, 1.0, 0, 1.0, -d / 2 + 0.04, M.metal, 8);
      box(g, 0.02, 0.02, 0.2, 0, h - 0.02, -d / 2 + 0.12, M.metal);
      cyl(g, 0.1, 0.1, 0.02, 0, h - 0.05, -d / 2 + 0.2, M.metal);
    },
  },
  vanity: {
    size: [0.6, 0.45, 0.86],
    build(g, [w, d, h]) {
      box(g, w, 0.5, d, 0, 0.3, 0, M.woodLight);
      box(g, w, 0.06, d, 0, h - 0.06, 0, M.ceramic);
      box(g, w - 0.16, 0.002, d - 0.16, 0, h, 0.02, M.ceramicDark, false);
      faucet(g, 0, h, -d / 2 + 0.05);
      box(g, w, 0.7, 0.02, 0, 1.15, -d / 2 + 0.01, M.mirror);
    },
  },
  washer: {
    size: [0.6, 0.6, 0.85],
    build(g, [w, d, h]) {
      box(g, w, h, d, 0, 0, 0, M.white);
      const door = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.02, 32), M.screen);
      door.rotation.x = Math.PI / 2;
      door.position.set(0, 0.42, d / 2 + 0.01);
      g.add(door);
      box(g, w - 0.04, 0.08, 0.005, 0, h - 0.12, d / 2 + 0.002, M.ceramicDark, false);
    },
  },
  shoeCabinet: {
    size: [1.0, 0.3, 0.9],
    build(g, [w, d, h]) {
      box(g, w, h, d, 0, 0, 0, M.woodLight);
      doorGaps(g, w, h, d, 2);
      box(g, 0.6, 0.9, 0.02, 0, h + 0.3, -d / 2 + 0.01, M.mirror);
      cyl(g, 0.1, 0.06, 0.06, w / 4, h, 0, M.ceramicDark);
    },
  },
  coatRack: {
    size: [0.8, 0.08, 0.25],
    elev: 1.55,
    build(g, [w, d]) {
      box(g, w, 0.1, 0.02, 0, 0.1, -d / 2 + 0.01, M.woodDark);
      for (let i = 0; i < 4; i++) box(g, 0.02, 0.02, 0.07, -w / 2 + (w * (i + 0.5)) / 4, 0.12, -d / 2 + 0.05, M.metal);
      box(g, 0.4, 0.7, 0.06, -w / 4, -0.55, -d / 2 + 0.06, M.blanket);
    },
  },
  picture: {
    size: [0.9, 0.04, 0.6],
    elev: 1.3,
    build(g, [w, d, h]) {
      box(g, w, h, d, 0, 0, 0, M.black);
      box(g, w - 0.06, h - 0.06, d + 0.002, 0, 0.03, 0, M.canvas, false);
      box(g, w * 0.35, h * 0.55, d + 0.004, -w * 0.15, h * 0.15, 0, M.accent, false);
      box(g, w * 0.25, h * 0.3, d + 0.006, w * 0.18, h * 0.45, 0, M.fabric, false);
    },
  },
  bistroTable: {
    size: [0.6, 0.6, 0.72],
    build(g, [w, , h]) {
      cyl(g, w / 2 * 0.6, w / 2 * 0.6, 0.02, 0, 0, 0, M.black);
      cyl(g, 0.025, 0.025, h - 0.05, 0, 0.02, 0, M.black, 10);
      cyl(g, w / 2, w / 2, 0.03, 0, h - 0.03, 0, M.woodLight, 32);
    },
  },
};

const FACING = { S: 0, E: Math.PI / 2, N: Math.PI, W: -Math.PI / 2 };

export function buildFurniture(list) {
  const group = new THREE.Group();
  for (const item of list) {
    const type = TYPES[item.type];
    if (!type) {
      console.warn(`Unknown furniture type "${item.type}"`);
      continue;
    }
    const size = type.size.map((v, i) => item.size?.[i] ?? v);
    const [x, y] = item.at;
    const piece = new THREE.Group();
    type.build(piece, size, rng(Math.round(x * 7919 + y * 104729)));
    piece.position.set(X(x), item.elev ?? type.elev ?? 0, Z(y));
    piece.rotation.y = FACING[item.facing ?? 'S'];
    piece.name = item.type;
    group.add(piece);
  }
  return group;
}
