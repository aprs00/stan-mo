import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import * as P from './plan.js';

// Sketch units → world metres. World: +X east, +Z south, +Y up.
export const X = (x) => (x - P.ORIGIN[0]) / P.UNITS_PER_METER;
export const Z = (y) => (y - P.ORIGIN[1]) / P.UNITS_PER_METER;
const toWorld = ([x, y]) => [X(x), Z(y)];

const stairsDown = () => P.STAIRS.direction === 'down';

// Shapes live in the XY plane; rotating the mesh by -90° about X lays them on the
// floor with shape (x, y) → world (x, -y), so we feed in (wx, -wz).
function pathPoints(path, worldPts) {
  worldPts.forEach(([x, z], i) => (i ? path.lineTo(x, -z) : path.moveTo(x, -z)));
  path.closePath();
  return path;
}
const flat = (mesh) => {
  mesh.rotation.x = -Math.PI / 2;
  return mesh;
};

function signedArea(pts) {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x0, z0] = pts[i];
    const [x1, z1] = pts[(i + 1) % pts.length];
    a += x0 * z1 - x1 * z0;
  }
  return a / 2;
}

// Outward normal of every edge and convexity of every vertex of an axis-aligned polygon.
function polygonInfo(pts) {
  const s = Math.sign(signedArea(pts));
  const n = pts.length;
  const edges = pts.map((a, i) => {
    const b = pts[(i + 1) % n];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const d = [(b[0] - a[0]) / len, (b[1] - a[1]) / len];
    return { a, b, len, d, normal: [s * d[1], -s * d[0]] };
  });
  const convex = pts.map((_, i) => {
    const e1 = edges[(i - 1 + n) % n].d;
    const e2 = edges[i].d;
    return Math.sign(e1[0] * e2[1] - e1[1] * e2[0]) === s;
  });
  return { edges, convex };
}

function outset(pts, dist) {
  const { edges } = polygonInfo(pts);
  const n = pts.length;
  return pts.map(([x, z], i) => {
    const n1 = edges[(i - 1 + n) % n].normal;
    const n2 = edges[i].normal;
    return [x + dist * (n1[0] + n2[0]), z + dist * (n1[1] + n2[1])];
  });
}

const stairOutline = () => P.STAIRS.outline.map(toWorld);

// ---------------------------------------------------------------------------

export function buildGround(mats) {
  const size = 80;
  const shape = pathPoints(new THREE.Shape(), [[-size, -size], [size, -size], [size, size], [-size, size]]);
  if (stairsDown()) shape.holes.push(pathPoints(new THREE.Path(), outset(stairOutline(), 0.13)));
  const ground = flat(new THREE.Mesh(new THREE.ShapeGeometry(shape), mats.ground));
  ground.position.y = -P.SLAB - 0.006;
  ground.receiveShadow = true;
  return ground;
}

export function buildApartment(mats) {
  const root = new THREE.Group();

  root.add(buildSlab(mats));
  for (const room of P.ROOMS) root.add(buildFloor(room, mats));
  root.add(buildStairs(mats));
  for (const door of P.DOORS) root.add(buildDoor(door, mats));
  for (const seg of P.RAILINGS) root.add(buildRailing(seg, mats));
  for (const fx of P.FIXTURES) root.add(buildFixture(fx, mats));

  return { root, labels: buildLabels() };
}

function buildSlab(mats) {
  const o = P.THICKNESS.ext / 2;
  const [x0, y0, x1, y1] = P.PLAN_BOUNDS;
  const shape = pathPoints(new THREE.Shape(), [
    [X(x0) - o, Z(y0) - o], [X(x1) + o, Z(y0) - o], [X(x1) + o, Z(y1) + o], [X(x0) - o, Z(y1) + o],
  ]);
  if (stairsDown()) shape.holes.push(pathPoints(new THREE.Path(), stairOutline()));
  const geo = new THREE.ExtrudeGeometry(shape, { depth: P.SLAB, bevelEnabled: false });
  const slab = flat(new THREE.Mesh(geo, mats.slab));
  slab.position.y = -P.SLAB - 0.005; // top sits just under the floor finishes
  slab.receiveShadow = slab.castShadow = true;
  return slab;
}

function buildFloor(room, mats) {
  const shape = pathPoints(new THREE.Shape(), room.poly.map(toWorld));
  const floor = flat(new THREE.Mesh(new THREE.ShapeGeometry(shape), mats.floors[room.floor]));
  floor.receiveShadow = true;
  return floor;
}

function buildStairs(mats) {
  const S = P.STAIRS;
  const group = new THREE.Group();
  const down = stairsDown();
  const rise = S.totalRise / S.treads.length;
  const bottom = down ? -S.totalRise - 0.1 : 0;

  S.treads.forEach((r, i) => {
    const [x0, z0] = toWorld([r[0], r[1]]);
    const [x1, z1] = toWorld([r[2], r[3]]);
    const top = (down ? -1 : 1) * (i + 1) * rise;
    const h = top - bottom;
    const step = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, h, z1 - z0), mats.stairs);
    step.position.set((x0 + x1) / 2, bottom + h / 2, (z0 + z1) / 2);
    step.castShadow = step.receiveShadow = true;
    group.add(step);
  });

  // Going down, line the shaft below the slab so it reads as a stairwell.
  if (down) {
    const T = 0.12;
    const GAP = 0.003; // keeps liner faces off the slab's hole faces
    const top = -0.01;
    const h = top - bottom;
    const { edges, convex } = polygonInfo(stairOutline());
    edges.forEach((e, i) => {
      const ext0 = convex[i] ? T + GAP : 0;
      const ext1 = convex[(i + 1) % edges.length] ? T + GAP : 0;
      const len = e.len + ext0 + ext1;
      const along = (e.len + ext1 - ext0) / 2;
      const off = GAP + T / 2;
      const cx = e.a[0] + e.d[0] * along + e.normal[0] * off;
      const cz = e.a[1] + e.d[1] * along + e.normal[1] * off;
      const horizontal = Math.abs(e.d[0]) > 0.5;
      const geo = horizontal ? new THREE.BoxGeometry(len, h, T) : new THREE.BoxGeometry(T, h, len);
      const liner = new THREE.Mesh(geo, mats.liner);
      liner.position.set(cx, bottom + h / 2, cz);
      liner.receiveShadow = true;
      group.add(liner);
    });
  }

  return group;
}

function buildDoor(door, mats) {
  const [hx, hz] = toWorld(door.hinge);
  const [ex, ez] = toWorld(door.leafEnd);
  const dx = ex - hx;
  const dz = ez - hz;
  const len = Math.hypot(dx, dz) - 0.02;
  const geo = new THREE.BoxGeometry(len, 2.04, 0.04);
  geo.translate(len / 2 + 0.01, 1.03, 0); // pivot at the hinge
  const leaf = new THREE.Mesh(geo, door.glazed ? mats.glass : mats.door);
  leaf.position.set(hx, 0, hz);
  leaf.rotation.y = Math.atan2(-dz, dx);
  if (door.glazed) {
    leaf.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: '#5E666C' })));
  } else {
    leaf.castShadow = true;
  }
  return leaf;
}

function buildRailing(seg, mats) {
  const [ax, az] = toWorld(seg.a);
  const [bx, bz] = toWorld(seg.b);
  const len = Math.hypot(bx - ax, bz - az);
  const g = new THREE.Group();
  g.position.set(ax, 0, az);
  g.rotation.y = Math.atan2(-(bz - az), bx - ax); // local +X runs along the railing

  const rail = (y, h, d) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(len + 0.05, h, d), mats.railing);
    m.position.set(len / 2, y, 0);
    m.castShadow = true;
    g.add(m);
  };
  rail(1.0, 0.05, 0.06);
  rail(0.1, 0.03, 0.03);

  const n = Math.max(1, Math.round(len / 0.12));
  const bars = new THREE.InstancedMesh(new THREE.BoxGeometry(0.018, 0.9, 0.018), mats.railing, n + 1);
  const m = new THREE.Matrix4();
  for (let i = 0; i <= n; i++) bars.setMatrixAt(i, m.makeTranslation((i * len) / n, 0.55, 0));
  bars.castShadow = true;
  g.add(bars);
  return g;
}

function buildFixture(fx, mats) {
  const [x0, z0] = toWorld([fx.rect[0], fx.rect[1]]);
  const [x1, z1] = toWorld([fx.rect[2], fx.rect[3]]);
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, fx.height, z1 - z0), mats.counter);
  mesh.position.set((x0 + x1) / 2, fx.height / 2, (z0 + z1) / 2);
  mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}

function makeLabel(name, area, at, y = 0.05) {
  const div = document.createElement('div');
  div.className = 'room-label';
  const strong = document.createElement('strong');
  strong.textContent = name;
  div.append(strong);
  if (area) {
    const span = document.createElement('span');
    span.textContent = area;
    div.append(span);
  }
  const obj = new CSS2DObject(div);
  const [x, z] = toWorld(at);
  obj.position.set(x, y, z);
  return obj;
}

function buildLabels() {
  const group = new THREE.Group();
  for (const r of P.ROOMS) if (r.name) group.add(makeLabel(r.name, r.area, r.label));
  group.add(makeLabel('Stubište', stairsDown() ? 'prema dolje' : 'prema gore', P.STAIRS.label));
  return group;
}

// ---------------------------------------------------------------------------
// Walls are rebuilt when the wall height changes (full / cutaway view).

export function buildWalls(height, mats) {
  const group = new THREE.Group();
  for (const wall of P.WALLS) addWall(wall, height, mats, group);
  return { group };
}

function addWall(wall, height, mats, group) {
  const horizontal = wall.a[1] === wall.b[1];
  const t = P.THICKNESS[wall.kind];
  const along = horizontal ? X : Z;
  const fixed = horizontal ? Z(wall.a[1]) : X(wall.a[0]);
  const axis = horizontal ? 0 : 1;
  const lo = Math.min(wall.a[axis], wall.b[axis]);
  const hi = Math.max(wall.a[axis], wall.b[axis]);

  const box = (a0, a1, y0, y1, material, depth = t) => {
    if (a1 - a0 < 1e-3 || y1 - y0 < 1e-3) return null;
    const len = a1 - a0;
    const h = y1 - y0;
    const mid = (a0 + a1) / 2;
    const geo = horizontal ? new THREE.BoxGeometry(len, h, depth) : new THREE.BoxGeometry(depth, h, len);
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.set(horizontal ? mid : fixed, y0 + h / 2, horizontal ? fixed : mid);
    group.add(mesh);
    return mesh;
  };

  const solid = (a0, a1, y0, y1) => {
    const mesh = box(a0, a1, y0, y1, mats.wall);
    if (!mesh) return;
    mesh.castShadow = mesh.receiveShadow = true;
  };

  const addWindow = (a0, a1, y0, y1, cut) => {
    const f = 0.05;
    const d = 0.07;
    box(a0, a1, y0, y1, mats.glass, 0.015);
    box(a0, a0 + f, y0, y1, mats.frame, d);
    box(a1 - f, a1, y0, y1, mats.frame, d);
    box(a0, a1, y0, y0 + f, mats.frame, d);
    if (!cut) box(a0, a1, y1 - f, y1, mats.frame, d);
    if (a1 - a0 > 1.3) box((a0 + a1) / 2 - f / 2, (a0 + a1) / 2 + f / 2, y0, y1, mats.frame, d);
  };

  // Ends extend by half the thickness so corners close (like a square line cap).
  let cursor = along(lo) - t / 2;
  const openings = (wall.openings ?? [])
    .map((o) => ({ ...P.OPENING_DEFAULTS[o.type], ...o }))
    .sort((p, q) => p.from - q.from);
  for (const o of openings) {
    const o0 = along(o.from);
    const o1 = along(o.to);
    solid(cursor, o0, 0, height);
    solid(o0, o1, 0, Math.min(o.sill, height));
    solid(o0, o1, o.head, height);
    if (o.type === 'window' && o.sill < height) addWindow(o0, o1, o.sill, Math.min(o.head, height), o.head > height);
    cursor = o1;
  }
  solid(cursor, along(hi) + t / 2, 0, height);
}
