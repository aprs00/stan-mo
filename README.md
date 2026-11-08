# Tlocrt stana · 3D

A three.js model of the apartment, generated from the hand-sketch floor plan.

```sh
npm install
npm run dev      # http://localhost:5173
npm run build    # static site in dist/
```

## Controls

Drag with the left mouse button to rotate, the right button to pan, and the scroll wheel to zoom.
**Presjek zidova** cuts the walls at 1.2 m so you can see into the rooms.

## Editing the plan

All geometry comes from `src/plan.js`, in the sketch's own units: 165 units = 1 m.

- `ROOMS`: floor polygons, floor material, label text and position
- `WALLS`: axis-aligned walls with windows, doors and passages (`from`/`to` along the wall, sill and head heights in metres)
- `DOORS`: door leaves, from the hinge to the free end of the leaf
- `RAILINGS`, `FIXTURES`: balcony railings, kitchen counter and divider
- `FURNITURE`: every piece of furniture, with its position, facing and optional size
- `STAIRS`: `direction: 'down' | 'up'`. The sketch doesn't say which way the stairs go.

Wall height, slab thickness and wall thicknesses are constants at the top of the file.

| File | Contents |
| --- | --- |
| `src/build.js` | turns the plan into meshes |
| `src/materials.js` | materials and procedural floor textures |
| `src/furniture.js` | furniture models (sofa, bed, wardrobe, …) |
| `src/main.js` | scene, lighting, orbit camera and UI |
