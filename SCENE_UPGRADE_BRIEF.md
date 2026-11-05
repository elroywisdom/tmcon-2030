# Scene Upgrade: Abuja National Stadium from OpenStreetMap

Read `PROJECT_BRIEF.md` first. This file replaces the procedural "toy" stadium with a realistic, map-driven night scene of the real venue. Everything else in the project (zones data, camera fly-to, seat selection, tour, audio, panel) stays.

## 1. Venue correction (do this first)

The venue for TM CON is the **National Stadium, Abuja (Moshood Abiola National Stadium)**. Earlier content said "Landmark Centre, Victoria Island, Lagos". That is wrong. Update every place it appears (top bar, panel, directions, copy, metadata).

Also verify before launch, with the TM Global team, and mark unconfirmed items clearly in code as `// TODO confirm`:

- Dates (currently "November 14-16, 2026").
- Every named speaker, company and sponsor in `zones.js`. Do not present real people or brands as confirmed unless TM Global has confirmed them. Use neutral placeholders until then.
- Parking capacity, gate names and drop-off points. Use real, verifiable information only.

## 2. Approach

No Blender and no downloaded model. Build the scene in R3F from real map data plus procedural construction:

1. **Real footprint and surroundings** from OpenStreetMap (OSM).
2. **Procedural stadium shell** built from that footprint.
3. **Night-time look**: dark palette, warm emissive edges, bloom, fog, floodlights, crowd.

OSM relation for the stadium: `13989805` (tags: `leisure=stadium`, name "Moshood Abiola National Stadium", `start_date=2003`). It has three outer ways. The data also shows the pitch, a running track, and a small circular structure just west of the main bowl. Inspect the data and decide whether to include the circular structure.

## 3. Data pipeline

Fetch once with Overpass, save as static JSON in the repo (for example `src/data/osm/abuja-stadium.json`), and load it at build or runtime. **Never call Overpass from the live site** (slow, rate-limited).

Starting query (validate and tune at overpass-turbo.eu, endpoint `https://overpass-api.de/api/interpreter`):

```
[out:json][timeout:90];
rel(13989805)->.stadium;
(
  way(around.stadium:1500)["highway"];
  way(around.stadium:1500)["building"];
  way(around.stadium:1200)["amenity"="parking"];
  way(around.stadium:600)["leisure"~"pitch|track|stadium"];
);
out geom;
.stadium out geom;
```

Processing:

- Convert lat/lon to local metres around the stadium centroid (Web Mercator offset, or `d3-geo`). Keep +y up, and document the axis convention in `zones.js`.
- Simplify polygons (Douglas-Peucker) so geometry stays light.
- Real `amenity=parking` polygons become the **car park zone**. Real roads become the access routes shown in Directions.

## 4. Scene construction

- **Roads**: thin ribbon meshes (or instanced segments), warm amber emissive, lower at distance. Label major roads with small HTML pins.
- **Buildings**: extrude footprints, height from `building:levels` or a seeded random range, dark material with sparse emissive window texture or points. Use instancing or merged geometry.
- **Stadium shell**: generate from the OSM footprint. Scale the outline inward in rings to create seating tiers (raked), an outer facade with vertical ribs, a roof canopy with arched ribs, a glowing rim light along the top edge, and floodlight masts with light cones.
- **Pitch and track**: pitch plane inside the real pitch polygon, running track ring around it with lane-line texture.
- **Stage and floor**: stage with truss, light bars and an LED wall (use `VideoTexture` for a looped TM CON promo, with a static image fallback) at one end of the pitch. Standing floor on the pitch in front of the stage.
- **Seating**: keep instanced seats and seat selection logic. Map seat blocks onto the generated tiers. Free seats use the section colour, taken seats grey, selected seat white.
- **Crowd**: instanced low-poly people (or billboards) in stands and on the floor. Cap the count for mobile.
- **Vendors**: stalls in the real parking or open ground near the stadium, instanced.

## 5. Zone mapping for this venue

Keep `zones.js` as the single source of truth, and re-derive each zone's `cam`, `target` and `pin` from the new geometry:

- Main stage, standing floor, seating sections (use the real stand layout; inspect which stands are covered and name them accordingly), vendor village, car park (real parking polygons), restrooms, and an arrival/Directions view that pulls back to show roads.
- Camera shots must never clip through the stadium shell. Test each one.

## 6. Visual direction

- Night scene, near-black background, warm amber and gold emissive accents, deep blue shadows.
- Post-processing on desktop only: bloom, subtle vignette, tone mapping. Fog to hide the edge of the city data.
- Keep TM CON's own branding. Use the amber/dark direction as a starting point, but confirm brand colours and fonts with the TM Global design team.

## 7. Performance

- 60 fps target on a mid-range phone, 30 fps minimum. Under 200 draw calls, under 400k triangles on mobile.
- Instancing for seats, crowd, buildings, vendors.
- Provide a "Simple view" fallback (lighter scene, no crowd or post-processing) for low-end devices and when WebGL is unavailable.

## 8. Attribution (required)

Show "Map data © OpenStreetMap contributors" visibly on screen. OSM data is under the ODbL license.

## 9. Acceptance criteria

- The stadium outline matches the real Abuja footprint. Roads and parking match the map.
- All Lagos references are gone. Unconfirmed event details are flagged.
- Every zone still flies the camera in under 1.5s without clipping. Seat selection still works.
- Mobile runs smoothly with the lighter settings. No console errors.
- OSM credit is visible.

## 10. Do not

- Do not call Overpass at runtime.
- Do not copy another event's branding or assets. Use the technique, not their look.
- Do not present unconfirmed speakers, sponsors, dates or capacities as fact.
- Do not create one mesh per seat, person or building.
