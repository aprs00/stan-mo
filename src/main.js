import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { makeMaterials } from './materials.js';
import { buildApartment, buildGround, buildWalls } from './build.js';
import { buildFurniture } from './furniture.js';
import { WALL_HEIGHT, CUTAWAY_HEIGHT, FURNITURE } from './plan.js';

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
camera.position.set(7, 12, 11);

scene.add(new THREE.HemisphereLight('#ffffff', '#8d8a80', 1.6));
const sun = new THREE.DirectionalLight('#fff3e2', 2.4);
sun.position.set(6, 12, 4);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 40 });
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.02;
scene.add(sun);

// --- apartment ----------------------------------------------------------------
const mats = makeMaterials();
scene.add(buildGround(mats));
const apt = buildApartment(mats);
scene.add(apt.root, apt.labels, buildFurniture(FURNITURE));

let walls = null;
function setWallHeight(h) {
  if (walls) {
    scene.remove(walls.group);
    walls.group.traverse((o) => o.geometry?.dispose());
  }
  walls = buildWalls(h, mats);
  scene.add(walls.group);
}
setWallHeight(WALL_HEIGHT);

// --- orbit view ---------------------------------------------------------------
const orbit = new OrbitControls(camera, renderer.domElement);
orbit.enableDamping = true;
orbit.maxPolarAngle = Math.PI * 0.47;
orbit.minDistance = 2;
orbit.maxDistance = 40;

// --- UI -----------------------------------------------------------------------
const btnCut = document.getElementById('btn-cut');
let cutaway = false;
btnCut.addEventListener('click', () => {
  cutaway = !cutaway;
  btnCut.setAttribute('aria-pressed', String(cutaway));
  setWallHeight(cutaway ? CUTAWAY_HEIGHT : WALL_HEIGHT);
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
