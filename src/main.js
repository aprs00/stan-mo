import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { makeMaterials } from './materials.js';
import { buildApartment, buildGround, buildWalls } from './build.js';
import { buildFurniture } from './furniture.js';
import { WALL_HEIGHT, CUTAWAY_HEIGHT, VARIANTS, VARIANT_GAP, PLAN_BOUNDS, UNITS_PER_METER, THICKNESS } from './plan.js';

// --- renderer, scene, camera ------------------------------------------------
const app = document.getElementById('app');

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
app.appendChild(renderer.domElement);

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(innerWidth, innerHeight);
labelRenderer.domElement.className = 'labels';
app.appendChild(labelRenderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color('#E7EBEE');

const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.05, 200);
camera.position.set(0, 17, 19);

scene.add(new THREE.HemisphereLight('#ffffff', '#8d8a80', 1.6));
const sun = new THREE.DirectionalLight('#fff3e2', 2.4);
sun.position.set(6, 12, 4);
sun.castShadow = true;
sun.shadow.mapSize.set(4096, 4096);
Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 12, bottom: -12, near: 1, far: 50 });
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.02;
scene.add(sun);

// --- layouts, side by side ------------------------------------------------------
const mats = makeMaterials();
const planWidth = (PLAN_BOUNDS[2] - PLAN_BOUNDS[0]) / UNITS_PER_METER + THICKNESS.ext;
const step = planWidth + VARIANT_GAP;
const offsets = VARIANTS.map((_, i) => (i - (VARIANTS.length - 1) / 2) * step);

scene.add(buildGround(mats, offsets));
const layouts = VARIANTS.map((layout, i) => {
  const group = new THREE.Group();
  group.position.x = offsets[i];
  const apt = buildApartment(mats, layout);
  apt.labels.visible = false; // room labels start hidden; toggled by "Oznake prostorija"
  group.add(apt.root, apt.labels, buildFurniture(layout.furniture));
  scene.add(group);
  return { layout, group, labels: apt.labels, walls: null };
});

function setWallHeight(h) {
  for (const l of layouts) {
    if (l.walls) {
      l.group.remove(l.walls);
      l.walls.traverse((o) => o.geometry?.dispose());
    }
    l.walls = buildWalls(h, mats, l.layout).group;
    l.group.add(l.walls);
  }
}
setWallHeight(WALL_HEIGHT);

// --- orbit view ---------------------------------------------------------------
const orbit = new OrbitControls(camera, renderer.domElement);
orbit.enableDamping = true;
orbit.maxPolarAngle = Math.PI * 0.47;
orbit.minDistance = 2;
orbit.maxDistance = 60;
orbit.screenSpacePanning = false; // panning slides across the floor, like a map
// Touch: one finger moves around, two fingers pinch to zoom and drag to rotate.
orbit.touches = { ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_ROTATE };

// --- UI -----------------------------------------------------------------------
const btnCut = document.getElementById('btn-cut');
let cutaway = false;
btnCut.addEventListener('click', () => {
  cutaway = !cutaway;
  btnCut.setAttribute('aria-pressed', String(cutaway));
  setWallHeight(cutaway ? CUTAWAY_HEIGHT : WALL_HEIGHT);
});

const btnLabels = document.getElementById('btn-labels');
let showLabels = false;
btnLabels.addEventListener('click', () => {
  showLabels = !showLabels;
  btnLabels.setAttribute('aria-pressed', String(showLabels));
  for (const l of layouts) l.labels.visible = showLabels;
});

// --- loop -----------------------------------------------------------------------
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  labelRenderer.setSize(innerWidth, innerHeight);
});

renderer.setAnimationLoop(() => {
  orbit.update();
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
});
