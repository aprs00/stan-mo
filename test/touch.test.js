import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { TouchNavigator, classifyGesture } from '../src/touch.js';

const W = 1000;
const H = 800;
const rect = () => ({ left: 0, top: 0, width: W, height: H });

function setup(position) {
  const camera = new THREE.PerspectiveCamera(50, W / H, 0.05, 200);
  camera.position.set(...position);
  const target = new THREE.Vector3(0, 0, 0);
  camera.lookAt(target);
  camera.updateMatrixWorld();
  const nav = new TouchNavigator(camera, target, { rect });
  return { camera, target, nav };
}

function toScreen(camera, v) {
  camera.updateMatrixWorld();
  const p = v.clone().project(camera);
  return { x: ((p.x + 1) / 2) * W, y: ((1 - p.y) / 2) * H };
}

const px = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const angle = (a, b) => Math.atan2(b.y - a.y, b.x - a.x);
const rotateAbout = (p, c, a) => ({
  x: c.x + (p.x - c.x) * Math.cos(a) - (p.y - c.y) * Math.sin(a),
  y: c.y + (p.x - c.x) * Math.sin(a) + (p.y - c.y) * Math.cos(a),
});

// Feed a gesture in small steps, the way touchmove events arrive.
function drive(nav, from, to, steps = 30) {
  let prev = from;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const curr = from.map((f, k) => ({ x: f.x + (to[k].x - f.x) * t, y: f.y + (to[k].y - f.y) * t }));
    if (curr.length === 1) nav.pan(prev[0], curr[0]);
    else nav.transform(prev, curr);
    prev = curr;
  }
}

const VIEWS = {
  'top-down': [0, 20, 2],
  'default (tilted)': [0, 17, 19],
};

for (const [name, pos] of Object.entries(VIEWS)) {
  test(`one finger: the floor point under the finger follows it (${name})`, () => {
    const { camera, nav } = setup(pos);
    const from = { x: 420, y: 520 };
    const to = { x: 600, y: 430 };
    const grabbed = nav.groundAt(from);
    drive(nav, [from], [to]);
    assert.ok(px(toScreen(camera, grabbed), to) < 0.5);
  });

  test(`two fingers twist: the view turns the same way as the fingers (${name})`, () => {
    const { camera, nav } = setup(pos);
    const c = { x: 500, y: 450 };
    const p1 = { x: 400, y: 450 };
    const p2 = { x: 600, y: 450 };
    const g1 = nav.groundAt(p1);
    const g2 = nav.groundAt(p2);
    const twist = (25 * Math.PI) / 180; // clockwise on screen
    // twist in small steps
    let prev = [p1, p2];
    for (let i = 1; i <= 25; i++) {
      const a = (twist * i) / 25;
      const curr = [rotateAbout(p1, c, a), rotateAbout(p2, c, a)];
      nav.transform(prev, curr);
      prev = curr;
    }
    const s1 = toScreen(camera, g1);
    const s2 = toScreen(camera, g2);
    const turned = angle(s1, s2) - angle(p1, p2);
    assert.ok(Math.sign(turned) === Math.sign(twist), 'turns the same direction as the fingers');
    if (name === 'top-down') {
      // seen from above, the floor sticks to the fingers
      assert.ok(px(s1, prev[0]) < 3, `finger 1 off by ${px(s1, prev[0]).toFixed(2)} px`);
      assert.ok(px(s2, prev[1]) < 3, `finger 2 off by ${px(s2, prev[1]).toFixed(2)} px`);
    } else {
      assert.ok(Math.abs(turned) > twist * 0.5, 'turns a comparable amount');
    }
  });

  test(`two fingers pinch apart: zooms in around the point between them (${name})`, () => {
    const { camera, target, nav } = setup(pos);
    const m = { x: 560, y: 430 };
    const anchor = nav.groundAt(m);
    const before = camera.position.distanceTo(target);
    drive(nav, [{ x: 460, y: 430 }, { x: 660, y: 430 }], [{ x: 410, y: 430 }, { x: 710, y: 430 }]);
    const after = camera.position.distanceTo(target);
    assert.ok(Math.abs(after / before - 2 / 3) < 0.01, `distance ratio ${(after / before).toFixed(3)}`);
    assert.ok(px(toScreen(camera, anchor), m) < 1, 'the point between the fingers stays put');
    assert.ok(Math.abs(target.y) < 1e-9, 'target stays on the floor');
  });
}

test('pinch zoom stops at the distance limits', () => {
  const { camera, target, nav } = setup(VIEWS['default (tilted)']);
  drive(nav, [{ x: 495, y: 400 }, { x: 505, y: 400 }], [{ x: 100, y: 400 }, { x: 900, y: 400 }]);
  assert.ok(camera.position.distanceTo(target) >= nav.minDistance - 1e-6);
  drive(nav, [{ x: 100, y: 400 }, { x: 900, y: 400 }], [{ x: 499, y: 400 }, { x: 501, y: 400 }]);
  assert.ok(camera.position.distanceTo(target) <= nav.maxDistance + 1e-6);
});

test('two fingers sliding up tilts toward a side view, within limits', () => {
  const { camera, target, nav } = setup(VIEWS['top-down']);
  const phi = () => new THREE.Spherical().setFromVector3(camera.position.clone().sub(target)).phi;
  const before = phi();
  const dist = camera.position.distanceTo(target);
  nav.tilt(-100);
  assert.ok(phi() > before, 'more oblique after sliding up');
  assert.ok(Math.abs(camera.position.distanceTo(target) - dist) < 1e-6, 'tilting does not zoom');
  for (let i = 0; i < 50; i++) nav.tilt(-100);
  assert.ok(phi() <= nav.maxPolar + 1e-6, 'never tilts below the horizon limit');
  for (let i = 0; i < 50; i++) nav.tilt(100);
  assert.ok(phi() >= nav.minPolar - 1e-6);
});

test('gesture classification', () => {
  const start = [{ x: 400, y: 500 }, { x: 600, y: 500 }];
  const moved = (d1, d2) => [
    { x: start[0].x + d1[0], y: start[0].y + d1[1] },
    { x: start[1].x + d2[0], y: start[1].y + d2[1] },
  ];
  assert.equal(classifyGesture(start, moved([2, 3], [1, -2])), null, 'tiny movement: undecided');
  assert.equal(classifyGesture(start, moved([3, -40], [-2, -38])), 'tilt', 'both up together');
  assert.equal(classifyGesture(start, moved([0, 35], [1, 33])), 'tilt', 'both down together');
  assert.equal(classifyGesture(start, moved([-30, 0], [30, 0])), 'transform', 'pinch');
  assert.equal(classifyGesture(start, moved([0, -25], [0, 25])), 'transform', 'twist');
  assert.equal(classifyGesture(start, moved([30, 20], [30, 20])), 'transform', 'two-finger drag');
});
