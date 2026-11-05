# Remodel: make the 3D scene look like the real Moshood Abiola National Stadium, Abuja

Read `PROJECT_BRIEF.md` and `SCENE_UPGRADE_BRIEF.md` first. This file **overrides the visual direction** in `SCENE_UPGRADE_BRIEF.md` (night scene, glowing roads, corner floodlight pylons). Everything else stays: `zones.js` as the source of truth, camera fly-to, seat selection, tour, audio, panel, OSM footprint data.

Reference images (attach all of them to the agent with this brief):

- **Ground and interior photos** of the real stadium: roof, facade, gates, seats, track, pitch.
- **Google Earth screenshots**: 2D site plan, tilted 3D views, and low-altitude drone views of the interior and surroundings (Feb 2022 imagery, dry-season haze).

## 1. What is wrong with the current build

From the latest screenshots:

- It reads as a dark navy disc with a red blob and a few coloured strips. There is **no roof, no raked seating bowl, no facade**, so it does not look like a stadium at all.
- Four corner floodlight pylons. The real stadium has **none**: its lights are mounted on the roof's inner ring.
- Glowing amber roads and a night sky. The real place, and the event, should read as **daytime Abuja**, hazy and warm, not a night map.
- The round building to the west is labelled a "velodrome / Expo pavilion". Do not label it until verified (see section 4).
- A stray teal arc and flat dark ground. Replace with real ground cover (section 5).

## 2. What the real stadium looks like (decisions from the references)

**Massing.** A very wide, low oval ring. Seen from the side, height to width is about 1:5. The OSM bowl outline (about 238 m by 288 m) is the outer edge of the structure, including roof overhang.

**Roof (the signature feature).**

- A continuous **white-cream tensile membrane ring** covering both seating tiers and overhanging the outer wall.
- It is made of **quilted, scalloped dome-shaped panels** separated by radial ribs. From above you see about 28 to 32 radial bays, each with 3 or 4 stacked soft bulges.
- The outer edge is **gently undulating** (scalloped), not a clean circle.
- The central opening is an **oval about half the outer width**. Its inner edge is a steel ring truss with a catwalk. Floodlights hang from this inner ring and from the roof edge.
- **Slim diagonal steel struts** run from the inner roof edge down and back over the upper tier, at regular spacing, plus thin cables. The roof looks light, with weathered cream-grey colour (not bright white).

**Outer facade.**

- A low grey **concrete arcade** under the roof: V-shaped or angled buttress piers with **red-brown accent faces**, spaced evenly around the ring, with **numbered gate portals** between them (numbers visible in the exterior photo, about 15 to 23 across the front).
- Under the arcade: grey service walls and a dark base. In front: a **wide paved apron** (dark grey concrete) running all the way round.

**Apron furniture.** A ring of small **white portacabins and flat-roofed canopies** (ticket and turnstile booths, about 3 to 8 m long) spaced around the apron, with **light poles** and white **turnstile canopies** on the entrance axes.

**Interior bowl.**

- **Two tiers** on the long sides, with a **horizontal band between them** containing small dark glazed boxes (hospitality/press) and stair towers.
- **Lower tier**: strongly mixed seat colours, clusters of orange, red-orange, yellow, magenta-pink, deep red and some purple. It reads as a warm mosaic.
- **Upper tier**: much darker (shaded by the roof), maroon, brick red and purple-brown seats.
- One long side has a **central block of pale cream/grey seats** in the lower tier, with a larger tunnel portal and a box band above. This is the **main stand / VIP side**.
- **Wide tunnel portals** (dark rectangular openings with a canopy lintel) cut through the lower tier at intervals, with **yellow aisle-end markers** along the low barrier.
- At one end the **upper tier breaks** and a large black **scoreboard screen** sits in the gap. The ends are lower than the long sides.

**Field.**

- A green football pitch with white lines and goals, inside a **terracotta athletics track** (many lanes, white lane lines, wide curved ends).
- A low barrier with a **thin yellow rail and yellow gates** between the stands and track.
- A white/cream advertising-board strip around the pitch edge.
- **Team bench shelters**: low canopies with benches, in pairs along one side of the track.

## 3. Cross-section to build (starting values, tune by eye against the photos)

Define a profile as `{ s, y }`: `s` is the scale from the centre of the OSM outline (1.0 is the outer wall), `y` is height in metres. Sweep it around the resampled OSM outline (helper in section 8).

| Part                                   | s (start to end)     | y (start to end) |
| -------------------------------------- | -------------------- | ---------------- |
| Track and pitch surface                | 0 to 0.46            | 0                |
| Lower tier (rakes up and outward)      | 0.50 to 0.64         | 2 to 14          |
| Box band between tiers                 | 0.64 to 0.68         | 14 to 20         |
| Upper tier (steeper rake)              | 0.68 to 0.84         | 20 to 33         |
| Outer wall                             | 1.00                 | 0 to 24          |
| Roof, underside to crest to outer edge | 0.56 to 0.86 to 1.04 | 34 to 41 to 30   |

Keep the roof opening about 0.55 of the outer scale. Because the footprint is an oval, constant-width bands are easier with a polygon offset (for example `clipper-lib`) than with scaling from the centre; use scaling first, then switch only if bands look uneven.

## 4. Site plan around the stadium (from Google Earth and the photos)

Use OSM for positions and verify against the Google Earth screenshots.

- **Apron ring** all round the stadium, then **terraced car parks** with **tree rows** between the terraces: large on the north, west and south sides. The south approach is a wide paved avenue with a gate plaza.
- **Round building** touching the stadium on the west/north-west: low, flat, with a **radial spoke roof and an open circular courtyard** (OSM way 1046913215). Do not call it a velodrome or an expo pavilion unless OSM tags or TM Global confirm it. Treat it as a plain landmark building.
- Further out west: a **circular roundabout garden with paths radiating in a star**, a **round helipad** on a path from it, and flagpoles.
- **White tensile-roof arena** with tall masts, on the avenue to the north-east. Faceted white fabric roof.
- **Training pitch with a terracotta track** to the north-east, and **sandy/dry throwing and warm-up fields** beside it.
- **Highways** loop around the site on the west, north and east, wide dual carriageways with palms and medians.
- **Terrain**: flat dry savanna, with a **rocky hill** visible to the east/north-east and a **pond** to the north-west in the distance. A faint **Abuja skyline** (tall buildings) on the horizon to the north.
- Orange-roofed housing (doctors' quarters) in the far north-east.

## 5. Ground, roads and surroundings

- **Roads**: dark grey asphalt (`#5d5f63`) as flat ribbons with subtle lane markings and lighter kerbs. **No glow, no emissive.** Use OSM `highway` ways, width by road class.
- **Ground**: mix of dry-grass tan (`#b59a63`), olive green (`#6f8f4a`) and red earth (`#a0522d`) patches, painted as a large low-resolution ground texture or vertex colours. Concrete grey (`#8d8d8a`) for parking terraces and apron.
- **Trees**: instanced low-poly trees (round crowns, dark green `#3f6b3a`, some tan-green), placed in rows along parking aisles and avenues and in clumps near the hill and roundabout. A few palms along the highways.
- **Buildings** from OSM: light concrete and white tones, daytime materials, no emissive windows.
- **Hill and skyline**: one low-poly displaced hill to the east/north-east and a ring of faded box skyline on the horizon, fully hazed.
- **Cars**: a few instanced cars on parking terraces and highways, for scale.

## 6. Lighting and atmosphere (daytime, hazy)

- Default scene is **late-morning or afternoon Abuja**, warm sun, long soft shadows. Optional "Evening show" toggle later; not the default.
- Sky: pale warm grey-blue gradient (`#c9cfd2` to `#d9d2c2`), **harmattan-style haze** with fog colour `#bdb5a6`, near `120`, far `900`.
- Lights: warm directional sun (`#fff1d6`, intensity about 2.2) from the south-west, a hemisphere light for fill, **soft shadows on the stadium area only** (shadow map, PCF soft, tight frustum). The roof must cast a shadow onto the upper tier so the dark-top, bright-bottom look from the references appears.
- Tone mapping ACES filmic. Optional mild bloom on the stage LED wall only. No heavy bloom, no vignette needed.

## 7. Seats, sections and selection

- **Look**: lower tier uses the warm mosaic palette, upper tier the dark maroon palette, VIP block the cream palette (functions in section 8).
- **Performance**: do **not** render tens of thousands of instanced seats at overview. Paint the tiers with a **generated canvas texture** (seat mosaic, aisles, gaps) on the raked surfaces. **Swap to instanced seats only in the section the camera has zoomed into** (LOD), so seat selection still works.
- **Section mapping to the real bowl** (adjust after inspecting the OSM data and photos):
  - **VIP Executive**: the main-stand side, cream seat block plus the box band above it.
  - **Premium**: lower tier along the long sides, outside the VIP block.
  - **General**: upper tier and the two end stands.
- **Selection feedback on a mosaic**: free seats keep their real colours. Taken seats go desaturated grey. The hovered or active section gets a subtle brightening and a coloured edge banner or label. The selected seat turns white with a small marker. Do not recolour whole sections to bright flat colours.

## 8. Code helpers

```js
// src/lib/stadiumGeometry.js
import * as THREE from "three";

// Evenly resample a closed polygon [[x,z],...] to n points by arc length.
export function resample(points, n) {
  const pts = [...points, points[0]];
  const seg = [];
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const d = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
    seg.push(d);
    total += d;
  }
  const out = [];
  let i = 0;
  let acc = 0;
  for (let k = 0; k < n; k++) {
    const target = (k / n) * total;
    while (acc + seg[i] < target) {
      acc += seg[i];
      i++;
    }
    const t = (target - acc) / seg[i];
    out.push([
      pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t,
      pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t,
    ]);
  }
  return out;
}

// Sweep a cross-section profile around an outline.
// profile: [{ s, y }]  s = scale from centre (1 = outer edge), y = height.
// yMod(i, j, y) lets you add per-vertex height (roof scallops).
export function sweepProfile(outline, center, profile, yMod = (i, j, y) => y) {
  const n = outline.length;
  const m = profile.length;
  const pos = [];
  const idx = [];
  for (let j = 0; j < m; j++) {
    for (let i = 0; i < n; i++) {
      const [x, z] = outline[i];
      pos.push(
        center[0] + (x - center[0]) * profile[j].s,
        yMod(i, j, profile[j].y),
        center[1] + (z - center[1]) * profile[j].s,
      );
    }
  }
  for (let j = 0; j < m - 1; j++) {
    for (let i = 0; i < n; i++) {
      const a = j * n + i;
      const b = j * n + ((i + 1) % n);
      const c = (j + 1) * n + i;
      const d = (j + 1) * n + ((i + 1) % n);
      idx.push(a, c, b, b, c, d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g; // use side: THREE.DoubleSide, or flip the winding if faces look inside out
}

// Roof scallops: P radial bays, soft bulges, stronger toward the middle of the roof band.
export function roofScallop(n, P, amp, roofRows) {
  return (i, j, y) => {
    if (!roofRows.includes(j)) return y;
    const bay = Math.abs(Math.sin((Math.PI * i * P) / n)); // 0..1 per bay
    return y + amp * Math.pow(bay, 0.7);
  };
}

// Seat colours: clustered mosaic like the real stands.
const LOWER = [
  "#e5482b",
  "#f06a24",
  "#f59b25",
  "#f7c63b",
  "#d63b55",
  "#b0283c",
  "#e0709b",
  "#7a2a5a",
];
const UPPER = ["#8e2a2a", "#a33a2e", "#7a2a3a", "#6d2b4a", "#b4472f"];
const VIP = ["#d9d0bd", "#cfc6b3", "#e2dac8"];

function hash2(a, b) {
  let h = (Math.imul(a, 374761393) + Math.imul(b, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967295;
}

export function seatColor(tier, r, c, seed = 1) {
  const palette = tier === "vip" ? VIP : tier === "upper" ? UPPER : LOWER;
  const cluster = hash2(Math.floor(r / 2) + seed * 17, Math.floor(c / 5));
  const jitter = hash2(r * 7 + seed, c * 13);
  const k =
    Math.floor((cluster * 0.7 + jitter * 0.3) * palette.length) %
    palette.length;
  return palette[k];
}
```

Notes for the agent:

- Resample the OSM bowl outline to a fixed `n` (for example 96 or 128) so roof bays align with facade piers and gate numbers. Use `P` of about 28 to 32 bays.
- Use instanced meshes for facade piers (extruded angled shape, about 40 to 48 around the ring), roof struts (thin cylinders), apron portacabins, light poles, trees and cars.
- Roof membrane: translucent-looking cream, slightly rough, `side: DoubleSide`, with a subtle quilt normal map or baked ambient occlusion in the bays.

## 9. Camera shots (re-author in `zones.js`)

- **Overview**: tilted aerial from the south, about 45 degrees down, framing the whole stadium plus the apron and car parks, like the tilted Google Earth view.
- **Main stage**: low and close to the stage from the standing floor, looking at the stage and up at the roof.
- **Seating sections**: from the pitch edge looking up into each section, and a higher view showing both tiers and the roof underside.
- **Standing floor**: elevated view over the pitch toward the stage.
- **Vendors**: aerial over the apron or the nearest parking terrace, with stalls laid out in the real open ground.
- **Car park and arrival**: aerial from the south showing parking terraces, tree rows and the entrance avenue.
- **Directions**: high pull-back showing the highways around the site and the skyline.
- Never clip through the roof, struts or stands. Test every shot.

Place the **stage** at the end of the pitch opposite the scoreboard, so the LED wall does not block it.

## 10. Acceptance criteria

Compare your render side by side with the reference images from these five views:

1. Exterior from the south at ground level (apron, piers, gates, roof edge).
2. Tilted aerial of the whole stadium and surroundings.
3. Inside, looking across the pitch at the long-side stands (two tiers, box band, tunnel portals, mixed seat colours).
4. Inside, looking along the track at the curved end (yellow gates, terracotta track).
5. Roof from above, showing scalloped quilted bays and the oval opening.

It passes when each of the five reads as the same stadium, the roof casts believable shadows on the upper tier, there are no corner pylons, no glowing roads, and the scene reads as a hazy daytime Abuja.

Also:

- Zone fly-tos, seat selection, tour and audio still work.
- Mobile stays smooth with the lighter settings (texture-painted tiers, fewer trees and cars, no shadows beyond the stadium).
- OSM credit visible.

## 11. Do not

- Do not embed the reference photos or Google Earth screenshots on the site, and do not trace or reuse their textures. They are third-party content (Google imagery and others). Use them only as visual reference for shapes, proportions and colours.
- Do not label the round building or the white tent arena with a function until OSM tags or TM Global confirm it.
- Do not use emissive roads, night skies, corner pylons or flat neon section colours.
- Do not create one mesh per seat. Use a texture at overview and instancing in the active section.
