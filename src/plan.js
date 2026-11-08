// Tlocrt stana — the apartment, traced from the hand-sketch canvases.
//
// Every coordinate below is in the sketches' units (x → right/east, y → down/south).
// UNITS_PER_METER converts them to metres; it is chosen so the 16 m² rooms of the
// original plan come out close to 16 m². Proportions follow the sketches, so they
// are approximate. Edit this file to correct dimensions — the 3D model is
// generated from it.
//
// Two layouts are shown side by side (VARIANTS at the bottom). Everything that
// both share — living room, kitchen, hallway, WC, stairs — is defined once.

export const UNITS_PER_METER = 165;
export const PLAN_BOUNDS = [0, 0, 1250, 1820]; // x0, y0, x1, y1 (balconies included)
export const ORIGIN = [625, 910]; // plan point placed at the centre of each layout

export const WALL_HEIGHT = 2.6; // m
export const CUTAWAY_HEIGHT = 1.2; // m, the "presjek" (section) view
export const SLAB = 0.25; // m, floor slab thickness
export const THICKNESS = { ext: 0.25, int: 0.12 }; // m
export const VARIANT_GAP = 3; // m between the two layouts

// Heights in metres above the floor.
export const OPENING_DEFAULTS = {
  window: { sill: 0.9, head: 2.2 },
  door: { sill: 0, head: 2.1 },
  passage: { sill: 0, head: 2.1 },
};

const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];

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

// ===========================================================================
// Shared by both layouts
// ===========================================================================

// floor: a key of materials.floors
const SHARED_ROOMS = [
  {
    name: 'Dnevni boravak', area: '16 m²', floor: 'oak', label: [310, 380],
    poly: [[0, 0], [620, 0], [620, 740], [425, 740], [425, 755], [0, 755]],
  },
  { name: 'Kuhinja', area: '≈ 2,5 m²', floor: 'kitchenTile', label: [210, 800], poly: rect(0, 755, 425, 920) },
  { name: null, floor: 'hallTile', poly: rect(425, 740, 620, 920) }, // front part of the hallway
  { name: 'Hodnik', area: '≈ 5,5–6 m²', floor: 'hallTile', label: [528, 1240], poly: rect(435, 920, 620, 1630) },
  { name: 'WC', area: '5 m²', floor: 'bathTile', label: [295, 1340], poly: rect(155, 1090, 435, 1630) },
  { name: 'Balkon', area: '3,5 × 2 m (7 m²)', floor: 'deck', label: [935, 115], poly: rect(620, 0, 1250, 230) },
];

// Walls are axis-aligned. Opening `from`/`to` are absolute sketch coordinates along the wall.
const SHARED_WALLS = [
  { a: [0, 0], b: [620, 0], kind: 'ext', openings: [{ type: 'window', from: 195, to: 425 }] },
  { a: [0, 0], b: [0, 1630], kind: 'ext', openings: [{ type: 'window', from: 760, to: 910 }] },
  {
    a: [620, 230], b: [1250, 230], kind: 'ext', openings: [
      { type: 'door', from: 630, to: 800 }, // bedroom 1 → balcony
      { type: 'window', from: 905, to: 1155 }, // bedroom 1, onto the balcony
    ],
  },
  { a: [425, 740], b: [620, 740], kind: 'int', openings: [{ type: 'door', from: 445, to: 605 }] },
  { a: [425, 740], b: [425, 920], kind: 'int' },
  { a: [155, 1090], b: [155, 1630], kind: 'int' },
  { a: [155, 1090], b: [435, 1090], kind: 'int' },
  { a: [435, 1090], b: [435, 1630], kind: 'int', openings: [{ type: 'door', from: 1410, to: 1550 }] },
];

// South wall of the stairwell, WC and hallway (same in both layouts).
const SOUTH_OPENINGS = [
  { type: 'window', from: 25, to: 145 }, // stairwell
  { type: 'window', from: 205, to: 375, sill: 1.4 }, // WC
  { type: 'door', from: 440, to: 610 }, // hallway → long balcony
];

// The hallway opening toward the stairs, with no wall above it.
const HALL_PASSAGE = { type: 'passage', from: 440, to: 610, head: WALL_HEIGHT };

// Door leaves, drawn open as in the sketch: hinge point → free end of the leaf.
const SHARED_DOORS = [
  { hinge: [445, 740], leafEnd: [445, 580] }, // hallway → living room
  { hinge: [435, 1410], leafEnd: [295, 1410] }, // WC
  { hinge: [610, 1630], leafEnd: [610, 1460], glazed: true }, // hallway → long balcony
  { hinge: [630, 230], leafEnd: [630, 400], glazed: true }, // bedroom 1 → balcony
];

const SHARED_RAILINGS = [
  { a: [620, 0], b: [1250, 0] },
  { a: [1250, 0], b: [1250, 230] },
  { a: [0, 1630], b: [0, 1820] },
];

// Fixed furniture: rect in sketch units, height in metres.
const SHARED_FIXTURES = [
  { rect: [6, 836, 314, 914], height: 0.9 }, // kitchen counter (fridge sits to its right)
];

// Furniture: `at` = centre of the footprint (sketch units), `facing` = which side
// of the sketch its front points to (N = up), `size` = [width, depth, height] in m
// to override the type's default, `elev` = height above the floor in m.
// Types and default sizes live in src/furniture.js.
const SHARED_FURNITURE = [
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
  { type: 'shoeCabinet', at: [585, 1200], facing: 'W' },

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

  // Long balcony, west part (present in both)
  { type: 'planter', at: [200, 1790], facing: 'N' },
  { type: 'plant', at: [60, 1700] },
];

// ===========================================================================
// Layout 1 — current plan: 2 bedrooms, balcony along the whole south side
// ===========================================================================

const TWO_BEDROOMS = {
  title: 'Trenutni raspored · 2 spavaće sobe',
  rooms: [
    ...SHARED_ROOMS,
    { name: 'Spavaća soba 1', area: '16 m²', floor: 'oakWarm', label: [935, 560], poly: rect(620, 230, 1250, 920) },
    { name: 'Spavaća soba 2', area: '16 m²', floor: 'oakWarm', label: [935, 1270], poly: rect(620, 920, 1250, 1630) },
    { name: 'Balkon cijelom dužinom', area: 'širina 1,2 m · ≈ 8–9 m²', floor: 'deck', label: [625, 1725], poly: rect(0, 1630, 1250, 1820) },
  ],
  walls: [
    ...SHARED_WALLS,
    { a: [1250, 230], b: [1250, 1630], kind: 'ext' },
    {
      a: [0, 1630], b: [1250, 1630], kind: 'ext', openings: [
        ...SOUTH_OPENINGS,
        { type: 'window', from: 805, to: 1065 }, // bedroom 2
      ],
    },
    {
      a: [620, 0], b: [620, 1630], kind: 'int', openings: [
        { type: 'door', from: 760, to: 910 }, // → bedroom 1
        { type: 'door', from: 930, to: 1080 }, // → bedroom 2
      ],
    },
    { a: [0, 920], b: [1250, 920], kind: 'int', openings: [HALL_PASSAGE] },
  ],
  doors: [
    ...SHARED_DOORS,
    { hinge: [620, 760], leafEnd: [770, 760] }, // hallway → bedroom 1
    { hinge: [620, 930], leafEnd: [770, 930] }, // hallway → bedroom 2
  ],
  railings: [
    ...SHARED_RAILINGS,
    { a: [0, 1820], b: [1250, 1820] },
    { a: [1250, 1630], b: [1250, 1820] },
  ],
  fixtures: SHARED_FIXTURES,
  furniture: [
    ...SHARED_FURNITURE,

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

    // Balkon cijelom dužinom, east part
    { type: 'bistroTable', at: [950, 1735] },
    { type: 'chair', at: [880, 1735], facing: 'E' },
    { type: 'chair', at: [1020, 1735], facing: 'W' },
    { type: 'planter', at: [1180, 1790], facing: 'N' },
  ],
};

// ===========================================================================
// Layout 2 — "Varijanta: 3 spavaće sobe": bedrooms 1 and 2 plus the east part
// of the long balcony become three bedrooms, reached through a small vestibule.
// ===========================================================================

const THREE_BEDROOMS = {
  title: 'Varijanta · 3 spavaće sobe',
  rooms: [
    ...SHARED_ROOMS,
    { name: null, floor: 'hallTile', poly: rect(620, 760, 800, 920) }, // vestibule to bedrooms 1 and 2
    { name: 'Spavaća soba 1', area: '≈ 11,5 m²', floor: 'oakWarm', label: [935, 480], poly: rect(620, 230, 1250, 760) },
    {
      name: 'Spavaća soba 2', area: '≈ 10,5 m²', floor: 'oakWarm', label: [1000, 1040],
      poly: [[800, 760], [1250, 760], [1250, 1290], [620, 1290], [620, 920], [800, 920]],
    },
    { name: 'Spavaća soba 3', area: '≈ 11,5 m²', floor: 'oakWarm', label: [935, 1560], poly: rect(620, 1290, 1250, 1820) },
    { name: 'Balkon', area: '1,2 × ≈ 3,7 m · ≈ 4,5 m²', floor: 'deck', label: [310, 1725], poly: rect(0, 1630, 620, 1820) },
  ],
  walls: [
    ...SHARED_WALLS,
    { a: [1250, 230], b: [1250, 1820], kind: 'ext', openings: [{ type: 'window', from: 950, to: 1150 }] }, // bedroom 2
    { a: [0, 1630], b: [620, 1630], kind: 'ext', openings: SOUTH_OPENINGS },
    { a: [620, 1820], b: [1250, 1820], kind: 'ext', openings: [{ type: 'window', from: 810, to: 1060 }] }, // bedroom 3
    { a: [620, 1630], b: [620, 1820], kind: 'ext' }, // end of the balcony
    {
      a: [620, 0], b: [620, 1630], kind: 'int', openings: [
        { type: 'passage', from: 760, to: 910 }, // → vestibule
        { type: 'door', from: 930, to: 1080 }, // → bedroom 2
        { type: 'door', from: 1310, to: 1450 }, // → bedroom 3
      ],
    },
    { a: [0, 920], b: [800, 920], kind: 'int', openings: [HALL_PASSAGE] },
    { a: [620, 760], b: [1250, 760], kind: 'int', openings: [{ type: 'door', from: 635, to: 785 }] },
    { a: [800, 760], b: [800, 920], kind: 'int' },
    { a: [620, 1290], b: [1250, 1290], kind: 'int' },
  ],
  doors: [
    ...SHARED_DOORS,
    { hinge: [635, 760], leafEnd: [635, 610] }, // vestibule → bedroom 1
    { hinge: [620, 930], leafEnd: [770, 930] }, // hallway → bedroom 2
    { hinge: [620, 1310], leafEnd: [760, 1310] }, // hallway → bedroom 3
  ],
  railings: [
    ...SHARED_RAILINGS,
    { a: [0, 1820], b: [620, 1820] },
  ],
  fixtures: SHARED_FIXTURES,
  furniture: [
    ...SHARED_FURNITURE,

    // Spavaća soba 1 — wardrobe between the two door swings
    { type: 'bed', at: [1064, 500], facing: 'W' },
    { type: 'nightstand', at: [1196, 331], facing: 'W' },
    { type: 'nightstand', at: [1196, 669], facing: 'W' },
    { type: 'wardrobe', at: [680, 505], facing: 'E', size: [1.15, 0.6, 2.2] },
    { type: 'rug', at: [815, 500], size: [1.0, 1.6] },
    { type: 'plant', at: [850, 285] },

    // Spavaća soba 2 — bed in the north part of the L, wardrobe below the door
    { type: 'bed', at: [1020, 935], facing: 'S' },
    { type: 'nightstand', at: [851, 803], facing: 'S' },
    { type: 'nightstand', at: [1189, 803], facing: 'S' },
    { type: 'wardrobe', at: [680, 1185], facing: 'E', size: [1.15, 0.6, 2.2] },
    { type: 'plant', at: [1195, 1240] },

    // Spavaća soba 3
    { type: 'bed', at: [1064, 1520], facing: 'W' },
    { type: 'nightstand', at: [1196, 1351], facing: 'W' },
    { type: 'nightstand', at: [1196, 1689], facing: 'W' },
    { type: 'wardrobe', at: [690, 1625], facing: 'E' },
    { type: 'rug', at: [815, 1520], size: [0.9, 1.6] },
    { type: 'plant', at: [800, 1770], size: [0.32, 0.32, 0.9] },

    // Shorter balcony
    { type: 'bistroTable', at: [480, 1735] },
    { type: 'chair', at: [410, 1735], facing: 'E' },
    { type: 'chair', at: [550, 1735], facing: 'W' },
  ],
};

export const VARIANTS = [TWO_BEDROOMS, THREE_BEDROOMS];
