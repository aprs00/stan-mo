# Tlocrt stana · 3D

A three.js model of the apartment, generated from the hand-sketch floor plan.

```sh
npm install
npm run dev      # http://localhost:5173
npm run build    # static site in dist/
```

## Controls

- Mouse: drag with the left button to rotate, the right button to move around, and the scroll wheel to zoom.
- Touch: drag with one finger to move around. With two fingers, pinch to zoom and drag sideways together to rotate.
- **Presjek zidova** cuts the walls at 1.2 m so you can see into the rooms.
- **Oznake prostorija** shows or hides the room names and areas (hidden at start).

## Layouts

Two layouts are shown side by side:

- **Trenutni raspored · 2 spavaće sobe**: the original sketch.
- **Varijanta · 3 spavaće sobe**: bedrooms 1 and 2 plus the east part of the long balcony become three bedrooms.

## Editing the plan

All geometry comes from `src/plan.js`, in the sketches' own units: 165 units = 1 m.
Parts both layouts share are defined once (`SHARED_ROOMS`, `SHARED_WALLS`, `SHARED_FURNITURE`, …).
Each entry of `VARIANTS` adds its own parts:

- `rooms`: floor polygons, floor material, label text and position
- `walls`: axis-aligned walls with windows, doors and passages (`from`/`to` along the wall, sill and head heights in metres)
- `doors`: door leaves, from the hinge to the free end of the leaf
- `railings`, `fixtures`: balcony railings, kitchen counter
- `furniture`: every piece of furniture, with its position, facing and optional size

`STAIRS` is shared. Its `direction` is `'down' | 'up'` because the sketch doesn't say which way the stairs go.
Add another object to `VARIANTS` to show a third layout next to the others.

Wall height, slab thickness and wall thicknesses are constants at the top of the file.

| File | Contents |
| --- | --- |
| `src/build.js` | turns the plan into meshes |
| `src/materials.js` | materials and procedural floor textures |
| `src/furniture.js` | furniture models (sofa, bed, wardrobe, …) |
| `src/main.js` | scene, lighting, orbit camera and UI |
