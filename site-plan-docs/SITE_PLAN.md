# Site plan: Moshood Abiola National Stadium, Abuja

Answers the agent's request for a site plan. Files in this folder:
- `site-plan.png` / `site-plan.svg`: the plan drawing (north up, 100 m scale bar).
- `site-plan.json`: the same features as data (centres, sizes, rotations, distance and bearing from the stadium centre, confidence).

## How it was made

Measured by eye from the Google Earth 2D screenshot, using its 200 m scale bar (289 px, about 1.445 px per metre), then cross-checked against the OSM stadium relation (13989805). The stadium measures about 246 x 284 m in the screenshot, which matches the OSM bowl (about 238 x 288 m), so the scale is sound.

**Accuracy:** `high` matches OSM. `medium` is about +/- 20 m. `low` is about +/- 40 m or shape only. Parking lots, roads and the smaller buildings are `low`.

## How the agent should use it

1. **Geometry comes from OSM, not from this plan.** The agent already has the OSM JSON (roads, buildings, parking polygons, bowl outline). Use those shapes. Use this plan to decide **what each thing is, where it sits relative to the stadium, and what it should look like.**
2. Where OSM and this plan disagree on position by more than about 40 m, trust OSM and flag it.
3. If OSM is missing a feature listed here (for example the round building, the tent arena, the helipad, the roundabout), add it from the plan's coordinates and mark it `// from site plan, approximate`.

## Conventions

- Metres. Origin is the stadium centre (about 9.0381 N, 7.4535 E).
- `+x` east, `+z` south, `+y` up. North is up in the drawing.
- `rotation_deg` is clockwise as seen from above with north up. The pitch and track long axis is about 16 degrees off north-south (top leans west), which matches the OSM pitch polygon.

## What is where

| Feature | Position from stadium centre | Notes |
|---|---|---|
| Stadium (roof outer edge) | centre | 238 x 288 m, long axis north-south |
| Paved apron | ring, about 155 x 188 m | Booths and portacabins on it |
| Ticket booths and portacabins | ring on the outer apron | About 44 small white boxes |
| South avenue and gate plaza | south, to about 350 m | Main arrival route, meets the south highway at a bridge or underpass |
| Turnstile canopies | south front, about 215 m south | Four white canopies |
| Round building (radial roof, open courtyard) | about 150 m west, slightly south | OSM way 1046913215, about 52 m across |
| Roundabout garden (star paths) | about 230 m west | Paths radiate from it |
| Helipad | about 300 m west | Round pad |
| Car park west | north-west of the stadium | Terraces with tree rows |
| Car park south-west | south-west | Terraces with tree rows |
| Car park east | east of the apron | Long paved lot |
| White tensile-roof arena (tall masts) | about 450 m east-north-east | About 125 m across |
| Training pitch and track | about 300 m north | Terracotta track around grass |
| Throwing and warm-up fields | north-north-west | Dry, sandy |
| Highways | west, south and east | Wide dual carriageways, palms on the medians |
| Orange-roofed housing | far north-east | Low houses |
| Gymnastics building and an unlabelled building | south-east | Check OSM tags before labelling |

Beyond the plan (from the drone photos, direction only): a rocky hill to the east/north-east, a pond to the north-west, and a faint Abuja skyline on the northern horizon.

## Mapping to the TM CON zones

- **Arrival and Directions**: the south avenue, from the south highway up to the turnstile canopies.
- **Car park**: the east and south-west terraced lots, with tree rows.
- **Vendor village**: on the apron and the nearest open ground, not on a car park, so the stalls can sit in front of the facade. The east edge of the apron next to the east car park is the most natural spot.
- **Stage and standing floor**: on the pitch, with the stage at the end opposite the scoreboard.
- **Restrooms and services**: use the apron booth ring and the round building area for signage, but do not claim a function for the round building until it is confirmed.

## To confirm with TM Global or on site

- Which car parks and gates will actually be open for TM CON.
- The function of the round building and the white tent arena (leave unlabelled until confirmed).
- Where the scoreboard end is, so the stage goes at the opposite end.
- Which stand is the main/VIP stand.

## Rights

The plan is original line work based on measurements. Do not embed or trace Google Earth imagery on the site. Keep the on-screen credit "Map data © OpenStreetMap contributors".
