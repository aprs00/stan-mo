import * as THREE from 'three';

// Small seeded PRNG so procedural textures look the same on every load.
export function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const shade = (hex, amount) => '#' + new THREE.Color(hex).offsetHSL(0, 0, amount).getHexString();

// Floor UVs are in metres, so `metersPerTile` is the real-world size of one texture repeat.
function canvasTexture(draw, metersPerTile, size = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  draw(canvas.getContext('2d'), size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1 / metersPerTile, 1 / metersPerTile);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function planks({ base, count, seed }) {
  return (g, size) => {
    const r = rng(seed);
    const h = size / count;
    for (let i = 0; i < count; i++) {
      const y = i * h;
      let x = -r() * size * 0.5;
      while (x < size) {
        const len = size * (0.35 + r() * 0.45);
        g.fillStyle = shade(base, (r() - 0.5) * 0.08);
        g.fillRect(x, y, len, h);
        g.strokeStyle = 'rgba(70,40,20,0.10)';
        g.lineWidth = 1;
        for (let k = 0; k < 5; k++) {
          const gy = y + 3 + r() * (h - 6);
          g.beginPath();
          g.moveTo(x, gy);
          for (let s = x; s < x + len; s += 16) g.lineTo(s, gy + Math.sin(s * 0.03 + k * 2) * 1.5);
          g.stroke();
        }
        g.fillStyle = 'rgba(50,30,15,0.35)';
        g.fillRect(x, y, 2, h);
        x += len;
      }
      g.fillStyle = 'rgba(50,30,15,0.35)';
      g.fillRect(0, y, size, 2);
    }
  };
}

function tiles({ base, grout, count, seed, vary = 0.05 }) {
  return (g, size) => {
    const r = rng(seed);
    const s = size / count;
    const gw = Math.max(2, size / 200);
    g.fillStyle = grout;
    g.fillRect(0, 0, size, size);
    for (let i = 0; i < count; i++) {
      for (let j = 0; j < count; j++) {
        g.fillStyle = shade(base, (r() - 0.5) * vary);
        g.fillRect(i * s + gw / 2, j * s + gw / 2, s - gw, s - gw);
      }
    }
  };
}

export function makeMaterials() {
  const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.85, ...o });
  // BoxGeometry face order: +x, -x, +y (top), -y, +z, -z
  const topped = (side, top) => [side, side, top, side, side, side];

  const wallSide = std({ color: '#F1EFEA', roughness: 0.95 });
  const wallTop = std({ color: '#4A4F55', roughness: 0.9 });
  const stairSide = std({ color: '#CFC9BE' });
  const stairTop = std({ color: '#E2DDD3', roughness: 0.6 });
  const counterSide = std({ color: '#E9E6DF', roughness: 0.6 });
  const counterTop = std({ color: '#5B5F63', roughness: 0.4 });

  return {
    floors: {
      oak: std({ map: canvasTexture(planks({ base: '#C9A27A', count: 8, seed: 3 }), 1.6), roughness: 0.7 }),
      oakWarm: std({ map: canvasTexture(planks({ base: '#B98B62', count: 8, seed: 7 }), 1.6), roughness: 0.7 }),
      kitchenTile: std({ map: canvasTexture(tiles({ base: '#D9D4CA', grout: '#A9A398', count: 4, seed: 2 }), 1.2), roughness: 0.5 }),
      hallTile: std({ map: canvasTexture(tiles({ base: '#E3DED4', grout: '#B4AEA3', count: 2, seed: 5 }), 1.2), roughness: 0.55 }),
      bathTile: std({ map: canvasTexture(tiles({ base: '#C7D3D8', grout: '#93A1A7', count: 6, seed: 9 }), 1.2), roughness: 0.4 }),
      deck: std({ map: canvasTexture(planks({ base: '#9C9488', count: 10, seed: 11 }), 1.5), roughness: 0.9 }),
    },
    wall: topped(wallSide, wallTop),
    stairs: topped(stairSide, stairTop),
    counter: topped(counterSide, counterTop),
    liner: std({ color: '#D8D4CC' }),
    slab: std({ color: '#B9B4AA' }),
    ground: std({ color: '#C9D2BE', roughness: 1 }),
    door: std({ color: '#E8E2D6', roughness: 0.6 }),
    glass: new THREE.MeshStandardMaterial({
      color: '#9EC3DA', transparent: true, opacity: 0.28, roughness: 0.05, metalness: 0.1, depthWrite: false,
    }),
    frame: std({ color: '#FAFAF8', roughness: 0.5 }),
    railing: std({ color: '#3F4A44', roughness: 0.5, metalness: 0.4 }),
  };
}
