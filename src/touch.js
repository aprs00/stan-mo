import * as THREE from 'three';

// Map-style touch navigation (like phone map apps):
//   one finger            → move around (the spot under the finger stays under it)
//   two fingers           → twist to rotate, pinch to zoom, drag to move
//   two fingers up/down   → tilt
// Mouse input is left to OrbitControls; this only handles touch.

const UP = new THREE.Vector3(0, 1, 0);
const GROUND = new THREE.Plane(UP, 0); // floor level, y = 0

const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
const dist = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);
const angle = (a, b) => Math.atan2(b.y - a.y, b.x - a.x);
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a)); // to (-π, π]
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// Decide what a two-finger gesture is once the fingers have moved a little.
// start/curr: [finger1, finger2] in screen pixels. Returns null (undecided yet),
// 'tilt' (both fingers slide vertically together) or 'transform'.
export function classifyGesture(start, curr, threshold = 10) {
  const d1 = { x: curr[0].x - start[0].x, y: curr[0].y - start[0].y };
  const d2 = { x: curr[1].x - start[1].x, y: curr[1].y - start[1].y };
  if (Math.max(Math.hypot(d1.x, d1.y), Math.hypot(d2.x, d2.y)) < threshold) return null;
  const vertical = (d) => Math.abs(d.y) > 2 * Math.abs(d.x);
  const together = Math.sign(d1.y) === Math.sign(d2.y);
  const pinch = Math.abs(dist(curr[0], curr[1]) - dist(start[0], start[1]));
  const slide = Math.min(Math.abs(d1.y), Math.abs(d2.y));
  if (vertical(d1) && vertical(d2) && together && pinch < slide * 0.5) return 'tilt';
  return 'transform';
}

export class TouchNavigator {
  // target: the orbit target (a point on the floor) — moved together with the camera.
  constructor(camera, target, { rect, minDistance = 2, maxDistance = 60, minPolar = 0.05, maxPolar = Math.PI * 0.47, bounds = 30 } = {}) {
    this.camera = camera;
    this.target = target;
    this.rect = rect; // () => { left, top, width, height }
    Object.assign(this, { minDistance, maxDistance, minPolar, maxPolar, bounds });
    this._ray = new THREE.Raycaster();
    this._ndc = new THREE.Vector2();
  }

  // Floor point under a screen position, or null if that pixel shows sky.
  groundAt(p) {
    const r = this.rect();
    this._ndc.set(((p.x - r.left) / r.width) * 2 - 1, -((p.y - r.top) / r.height) * 2 + 1);
    this.camera.updateMatrixWorld();
    this._ray.setFromCamera(this._ndc, this.camera);
    return this._ray.ray.intersectPlane(GROUND, new THREE.Vector3());
  }

  _sync() {
    this.camera.lookAt(this.target);
    this.camera.updateMatrixWorld();
  }

  // One finger moved from prev to curr.
  pan(prev, curr) {
    const a = this.groundAt(prev);
    const b = this.groundAt(curr);
    if (!a || !b) return;
    const d = a.sub(b);
    // keep the view near the apartment
    d.x = clamp(this.target.x + d.x, -this.bounds, this.bounds) - this.target.x;
    d.z = clamp(this.target.z + d.z, -this.bounds, this.bounds) - this.target.z;
    this.target.add(d);
    this.camera.position.add(d);
    this._sync();
  }

  // Two fingers moved from prev [p1, p2] to curr [c1, c2]: move, twist, pinch —
  // all around the floor point between the fingers, so it stays under them.
  transform(prev, curr) {
    this.pan(mid(prev[0], prev[1]), mid(curr[0], curr[1]));
    const pivot = this.groundAt(mid(curr[0], curr[1]));
    if (!pivot) return;

    const turn = wrap(angle(curr[0], curr[1]) - angle(prev[0], prev[1]));
    for (const v of [this.camera.position, this.target]) v.sub(pivot).applyAxisAngle(UP, turn).add(pivot);

    const d0 = dist(prev[0], prev[1]);
    const d1 = dist(curr[0], curr[1]);
    if (d0 > 0 && d1 > 0) {
      const current = this.camera.position.distanceTo(this.target);
      const wanted = clamp(current * (d0 / d1), this.minDistance, this.maxDistance);
      const s = wanted / current;
      for (const v of [this.camera.position, this.target]) v.sub(pivot).multiplyScalar(s).add(pivot);
    }
    this._sync();
  }

  // Both fingers slid vertically by dy pixels: up = look more from the side.
  tilt(dy) {
    const offset = this.camera.position.clone().sub(this.target);
    const s = new THREE.Spherical().setFromVector3(offset);
    s.phi = clamp(s.phi - (dy / this.rect().height) * Math.PI, this.minPolar, this.maxPolar);
    this.camera.position.copy(this.target).add(offset.setFromSpherical(s));
    this._sync();
  }
}

// Wire touch events on the canvas to a TouchNavigator. Touch events are stopped
// before OrbitControls sees them; mouse and pen still go to OrbitControls.
export function attachTouchNavigation(canvas, camera, orbit) {
  const nav = new TouchNavigator(camera, orbit.target, {
    rect: () => canvas.getBoundingClientRect(),
    minDistance: orbit.minDistance,
    maxDistance: orbit.maxDistance,
    maxPolar: orbit.maxPolarAngle,
  });
  const host = canvas.parentElement;
  const fingers = new Map(); // pointerId → {x, y}
  let prev = null;
  let start = null;
  let mode = null;

  const points = () => [...fingers.values()].slice(0, 2).map((p) => ({ ...p }));
  const restart = () => {
    prev = points();
    start = points();
    mode = null;
  };
  const isTouch = (e) => e.pointerType === 'touch';

  host.addEventListener('pointerdown', (e) => {
    if (!isTouch(e)) return;
    e.stopPropagation();
    canvas.setPointerCapture?.(e.pointerId);
    fingers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    restart();
  }, true);

  host.addEventListener('pointermove', (e) => {
    if (!isTouch(e) || !fingers.has(e.pointerId)) return;
    e.stopPropagation();
    fingers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const curr = points();
    if (curr.length === 1) {
      nav.pan(prev[0], curr[0]);
    } else {
      mode ??= classifyGesture(start, curr);
      if (mode === 'tilt') nav.tilt(mid(curr[0], curr[1]).y - mid(prev[0], prev[1]).y);
      else if (mode === 'transform') nav.transform(prev, curr);
      else return; // undecided: wait, keep prev at the gesture start
    }
    prev = curr;
  }, true);

  const lift = (e) => {
    if (!isTouch(e) || !fingers.has(e.pointerId)) return;
    e.stopPropagation();
    fingers.delete(e.pointerId);
    restart();
  };
  host.addEventListener('pointerup', lift, true);
  host.addEventListener('pointercancel', lift, true);

  return nav;
}
