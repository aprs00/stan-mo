// Tlocrt stana — the apartment, traced from the hand-sketch canvas "Tlocrt stana".
//
// Every coordinate below is in the sketch's units (x → right/east, y → down/south).
// UNITS_PER_METER converts them to metres; it is chosen so the three 16 m² rooms
// come out close to 16 m². Proportions follow the sketch, so they are approximate.
// Edit this file to correct dimensions — the 3D model is generated from it.

export const UNITS_PER_METER = 165;
export const PLAN_BOUNDS = [0, 0, 1250, 1820]; // x0, y0, x1, y1 (balconies included)
export const ORIGIN = [625, 910]; // plan point placed at the world origin

export const WALL_HEIGHT = 2.6; // m
export const CUTAWAY_HEIGHT = 1.2; // m, the "presjek" (section) view
export const SLAB = 0.25; // m, floor slab thickness
export const THICKNESS = { ext: 0.25, int: 0.12 }; // m

// Heights in metres above the floor.
export const OPENING_DEFAULTS = {
  window: { sill: 0.9, head: 2.2 },
  door: { sill: 0, head: 2.1 },
  passage: { sill: 0, head: 2.1 },
};

const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];

// floor: a key of materials.floors
export const ROOMS = [
  {
    name: 'Dnevni boravak', area: '16 m²', floor: 'oak', label: [310, 380],
    poly: [[0, 0], [620, 0], [620, 740], [425, 740], [425, 755], [0, 755]],
  },
  { name: 'Kuhinja', area: '≈ 2,5 m²', floor: 'kitchenTile', label: [210, 800], poly: rect(0, 755, 425, 920) },
  { name: null, floor: 'hallTile', poly: rect(425, 740, 620, 920) }, // front part of the hallway
  { name: 'Hodnik', area: '≈ 5,5–6 m²', floor: 'hallTile', label: [528, 1240], poly: rect(435, 920, 620, 1630) },
  { name: 'Spavaća soba 1', area: '16 m²', floor: 'oakWarm', label: [935, 560], poly: rect(620, 230, 1250, 920) },
  { name: 'Spavaća soba 2', area: '16 m²', floor: 'oakWarm', label: [935, 1270], poly: rect(620, 920, 1250, 1630) },
  { name: 'WC', area: '5 m²', floor: 'bathTile', label: [295, 1340], poly: rect(155, 1090, 435, 1630) },
  { name: 'Balkon', area: '3,5 × 2 m (7 m²)', floor: 'deck', label: [935, 115], poly: rect(620, 0, 1250, 230) },
  { name: 'Balkon cijelom dužinom', area: 'širina 1,2 m · ≈ 8–9 m²', floor: 'deck', label: [625, 1725], poly: rect(0, 1630, 1250, 1820) },
];

// Walls are axis-aligned. Opening `from`/`to` are absolute sketch coordinates along the wall.
export const WALLS = [
  // exterior
  { a: [0, 0], b: [620, 0], kind: 'ext', openings: [{ type: 'window', from: 195, to: 425 }] },
  { a: [0, 0], b: [0, 1630], kind: 'ext', openings: [{ type: 'window', from: 760, to: 910 }] },
  { a: [1250, 230], b: [1250, 1630], kind: 'ext' },
  { a: [620, 230], b: [1250, 230], kind: 'ext', openings: [{ type: 'door', from: 630, to: 800 }] },
  {
    a: [0, 1630], b: [1250, 1630], kind: 'ext', openings: [
      { type: 'window', from: 25, to: 145 }, // stairwell
      { type: 'window', from: 205, to: 375, sill: 1.4 }, // WC
      { type: 'door', from: 440, to: 610 }, // hallway → balcony
      { type: 'window', from: 805, to: 1065 }, // bedroom 2
    ],
  },
  // interior
  {
    a: [620, 0], b: [620, 1630], kind: 'int', openings: [
      { type: 'door', from: 760, to: 910 }, // → bedroom 1
      { type: 'door', from: 930, to: 1080 }, // → bedroom 2
    ],
  },
  { a: [0, 920], b: [1250, 920], kind: 'int', openings: [{ type: 'passage', from: 440, to: 610, head: WALL_HEIGHT }] }, // hallway opening, no wall above it
  { a: [425, 740], b: [620, 740], kind: 'int', openings: [{ type: 'door', from: 445, to: 605 }] },
  { a: [425, 740], b: [425, 920], kind: 'int' },
  { a: [155, 1090], b: [155, 1630], kind: 'int' },
  { a: [155, 1090], b: [435, 1090], kind: 'int' },
  { a: [435, 1090], b: [435, 1630], kind: 'int', openings: [{ type: 'door', from: 1410, to: 1550 }] },
];

// Door leaves, drawn open as in the sketch: hinge point → free end of the leaf.
export const DOORS = [
  { hinge: [445, 740], leafEnd: [445, 580] }, // hallway → living room
  { hinge: [620, 760], leafEnd: [770, 760] }, // hallway → bedroom 1
  { hinge: [620, 930], leafEnd: [770, 930] }, // hallway → bedroom 2
  { hinge: [435, 1410], leafEnd: [295, 1410] }, // WC
  { hinge: [610, 1630], leafEnd: [610, 1460], glazed: true }, // hallway → long balcony
  { hinge: [630, 230], leafEnd: [630, 400], glazed: true }, // bedroom 1 → balcony
];

export const RAILINGS = [
  { a: [620, 0], b: [1250, 0] },
  { a: [1250, 0], b: [1250, 230] },
  { a: [0, 1630], b: [0, 1820] },
  { a: [0, 1820], b: [1250, 1820] },
  { a: [1250, 1630], b: [1250, 1820] },
];

// Fixed furniture: rect in sketch units, height in metres.
export const FIXTURES = [
  { rect: [6, 836, 314, 914], height: 0.9 }, // kitchen counter (fridge sits to its right)
];

// L-shaped staircase: 7 steps west from the hallway, a landing, 13 steps south.
// The sketch doesn't say which way it goes. It is the only way into the flat, so
// it is modelled going DOWN (to the entrance); set direction to 'up' to flip it.
const treads = [];
for (let i = 0; i < 7; i++) treads.push([435 - 40 * (i + 1), 920, 435 - 40 * i, 1090]);
treads.push([0, 920, 155, 1090]); // landing
for (let j = 0; j < 13; j++) treads.push([0, 1090 + 40 * j, 155, j === 12 ? 1630 : 1090 + 40 * (j + 1)]);

export const STAIRS = {
  direction: 'down', // 'down' | 'up'
  totalRise: WALL_HEIGHT + SLAB, // floor to floor, m
  outline: [[0, 920], [435, 920], [435, 1090], [155, 1090], [155, 1630], [0, 1630]],
  treads, // ordered from the hallway outward
  label: [78, 1275],
};

// Furniture: `at` = centre of the footprint (sketch units), `facing` = which side
// of the sketch its front points to (N = up), `size` = [width, depth, height] in m
// to override the type's default, `elev` = height above the floor in m.
// Types and default sizes live in src/furniture.js.
export const FURNITURE = [
  // Dnevni boravak — seating in the window corner, island toward the kitchen
  { type: 'rug', at: [300, 210], size: [1.6, 2.2] },
  { type: 'sofa', at: [97, 203], facing: 'E' },
  { type: 'picture', at: [23, 203], facing: 'E', size: [1.1, 0.04, 0.7] },
  { type: 'coffeeTable', at: [290, 203], facing: 'E' },
  { type: 'tvUnit', at: [577, 203], facing: 'W' },
  { type: 'floorLamp', at: [55, 415] },
  { type: 'plant', at: [583, 395] },
  { type: 'island', at: [250, 600], facing: 'N' }, // eating side faces the living room
  { type: 'stool', at: [160, 515], size: [0.38, 0.38, 0.65] },
  { type: 'stool', at: [250, 515], size: [0.38, 0.38, 0.65] },
  { type: 'stool', at: [340, 515], size: [0.38, 0.38, 0.65] },

  // Kuhinja
  { type: 'fridge', at: [366, 857], facing: 'N' },
  { type: 'upperCabinets', at: [167, 881], facing: 'N' },
  { type: 'sink', at: [100, 875], facing: 'N' },
  { type: 'cooktop', at: [235, 875], facing: 'N' },

  // Hodnik
  { type: 'coatRack', at: [442, 830], facing: 'E' },
  { type: 'shoeCabinet', at: [585, 1232], facing: 'W' },

  // Spavaća soba 1
  { type: 'bed', at: [1064, 575], facing: 'W' },
  { type: 'nightstand', at: [1196, 400], facing: 'W' },
  { type: 'nightstand', at: [1196, 750], facing: 'W' },
  { type: 'rug', at: [800, 575], size: [1.6, 1.2] },
  { type: 'wardrobe', at: [985, 861], facing: 'N' },
  { type: 'desk', at: [1040, 300], facing: 'S' },
  { type: 'chair', at: [1040, 385], facing: 'N' },
  { type: 'plant', at: [1195, 285] },

  // Spavaća soba 2
  { type: 'bed', at: [1064, 1260], facing: 'W' },
  { type: 'nightstand', at: [1196, 1085], facing: 'W' },
  { type: 'nightstand', at: [1196, 1435], facing: 'W' },
  { type: 'wardrobe', at: [680, 1315], facing: 'E' },
  { type: 'bookshelf', at: [1060, 955], facing: 'S' },
  { type: 'desk', at: [935, 1559], facing: 'N' },
  { type: 'chair', at: [935, 1470], facing: 'S' },
  { type: 'plant', at: [790, 1585], size: [0.32, 0.32, 0.9] },

  // WC
  { type: 'toilet', at: [223, 1200], facing: 'E' },
  { type: 'vanity', at: [345, 1137], facing: 'S' },
  { type: 'shower', at: [231, 1543], facing: 'N' },
  { type: 'washer', at: [376, 1560], facing: 'N' },

  // Balkon (uz spavaću sobu 1)
  { type: 'bistroTable', at: [1000, 110] },
  { type: 'chair', at: [925, 110], facing: 'E' },
  { type: 'chair', at: [1075, 110], facing: 'W' },
  { type: 'planter', at: [780, 33] },

  // Balkon cijelom dužinom
  { type: 'bistroTable', at: [950, 1735] },
  { type: 'chair', at: [880, 1735], facing: 'E' },
  { type: 'chair', at: [1020, 1735], facing: 'W' },
  { type: 'planter', at: [200, 1790], facing: 'N' },
  { type: 'planter', at: [1180, 1790], facing: 'N' },
  { type: 'plant', at: [60, 1700] },
];
