# Phase 4 review and fix list

Reviewed from the 17 screenshots and the step reports for steps 3 to 7. I have not run the site, so anything below is what the screenshots show. Where a fix is listed, the agent should confirm the cause first, then re-capture the same screenshot and send it back as before/after.

## What is working well

- The design system is clearly applied: pills, black outlines, hard offset shadows, cream cards, and the zone chips with colour dots.
- The stage LED panel (now playing, previous/next, pause, fullscreen, live show) and the "view from seat" bar read well.
- Camera presets, the day/night toggle, the crowd-density control and the live-show toggle are all in the top bar and easy to find.
- Placeholders are honest: "Dates to be confirmed", "Speaker to be confirmed".
- The night city has the right feel: lit windows, street lamps, traffic dots.
- The seat crowd follows the taken seats, and free seats stay empty.

## P0: fix before anyone outside the team sees it

1. **Landmarks float in a black void; the ground ends mid-air** (`step4_city_night_lights`, `step4_cbd_landmarks`, `step5_intro_flight_corridor`, `step5_intro_flight_asorock`).
   - The terrain slab does not cover the landmark area. Aso Rock, the mosque, the CBN tower and the National Assembly hang in black space, and the slab's straight edges are visible.
   - There is also no sky or horizon.
   - Fix: extend the ground over the whole flight corridor and the landmark area (a coarse, low-resolution layer is fine), fade its far edge into fog, add a sky dome (a dusk-to-night gradient, a glowing horizon, faint stars), and make sure the CBD has roads and light points under the landmarks, not just the stadium area.

2. **A huge cream banner with oversized black lettering fills the top third of the view** (`step6_preset_floor_foh`, `step6_liveshow_concert`).
   - It is probably a banner or sign mesh sitting in front of the Floor (FOH) camera. Move the camera, move or hide the banner, or give it a proper size and place.

3. **Reservation and data capture look real but are not.**
   - The reservation flow collects a name and email and shows a pass code (`TMC-XXXXXX`) generated in the browser. With no ticketing backend, this makes visitors believe they have a seat.
   - Either connect it to a real ticketing or reservation backend, or label it clearly as a preview and do not issue pass codes or collect personal data.
   - If it collects any personal data, add a privacy notice and consent, and check with TM Global about Nigeria's data protection law requirements.

4. **The 2024 mark is still in use** (`step5_gate_screen`, top bar in every screenshot).
   - The wordmark shows the small "2024" badge, next to text that says 2026. Replace it with the TM CON 2026 mark from the brand team.

5. **Captions and labels to verify or fix**:
   - The progress bar reads "ASO ROCK (CBD)". Aso Rock is not the CBD. Rename the start label.
   - The corridor card says Constitution Avenue links Central Abuja "directly to the National Stadium". Verify the road geography on the map, or reword it to something provable.
   - "Velodrome Dome" is the label on the white tent arena. I asked for it not to be labelled until verified. Keep it only if the OSM tag says so, and cite the way ID in the landmark registry.
   - "60,000 seats" appears in several places. Say "about 60,000", or confirm the figure with TM Global.

6. **The "N" badge shows 7 to 8 issues** in most screenshots. These are Next.js dev warnings or errors (often hydration or React key problems). Clear them, then check the production build in the console.

## P1: quality

**Intro flight**

- The opening frame is almost entirely black with tiny labels (`step5_intro_flight_asorock`). It needs a visible glowing city, a horizon glow, and larger landmark labels, so the first second is already striking.
- The caption cards are large and sit in the middle of the screen. They hide the stadium during the lights-on moment (`step5_intro_lightson_flash`). Use a smaller lower-third card, and keep the centre clear for the roof ring sweep and the floodlight flash.
- At arrival the stadium roof looks as bright as in daytime. At night, lower the roof's base colour and let it glow warm from within, so the lights-on moment reads.
- Floodlights are flat white rectangles (`step2_stage_night`). Add glow sprites or light cones so they look lit.

**Night city**

- Street lamps and traffic dots become big orange or white discs near the camera (`step4_citygate_approach`, `step5_intro_flight_approach`). Cap their size on screen (size attenuation with a maximum) so they stay as points.
- Buildings are dark boxes with white window squares. Vary the window colours and density, and soften the white a little.

**Pins and labels**

- Pin size is inconsistent: huge in `step6_preset_upper_tier`, unreadably small in `step5_intro_completed_overview`. Clamp their on-screen size to a readable range, hide pins that overlap, and hide them when the camera is close to or inside a zone.

**Crowd and live show**

- The whole crowd takes on a heavy red cast at night and during the live show (`step6_liveshow_concert`, `step3_crowd_night_phones`). Reduce the rim-light strength and vary its colour with the stage lighting.
- The figures are blocky. Round the torsos and shoulders, add a few hair and headwear shapes, and add small proportion variation.
- Live-show beams cross the LED wall and hide the video. Make them thinner, shorter near the screen, and lower in opacity.

**UI**

- Emojis (rocket, clapper, sparkles, crowd, eye, preset icons) are used as icons. They look different on every device and are off-brand. Replace them with one consistent outline icon set.
- White text on orange: the gate button ("ENTER WITH 3D INTRO") uses white on orange (about 3:1). Use black text on orange, as set out in the design plan.
- The top-bar pill and logo can disappear against the dark night scene (`step5_intro_completed_overview` shows the logo missing). Check it renders in every mode.
- The desktop panel takes a large part of the screen. Add a collapse control so the 3D view can be seen in full.
- Consider an orange poster treatment for the gate, as in the design system's hero section, instead of a cream card on black.

## P2: performance and device QA

- Test on real devices, not only emulation: a mid-range Android phone and an iPhone in Safari. Check video textures (iOS has stricter rules), memory, and frame rate over a 5-minute session.
- Record a real number for each quality tier: frame rate and draw calls on the real devices. The step reports state targets, not measurements.
- Measure the page weight and time to first interaction on a throttled 4G connection. The city data and videos must load progressively, and the intro must start in about 3 seconds.
- Run Lighthouse and the production build. Make sure Simple view works with no WebGL.

## Next phase (Phase 5): launch readiness

1. Fix P0 and P1 above, and send before/after screenshots.
2. Real content: confirmed dates, speakers, sponsors, rights-cleared LED videos, music licensing, 2026 brand assets.
3. Real ticketing or reservation backend, with consent and privacy copy.
4. Accessibility pass: keyboard through every control, screen reader labels for zones and seats, contrast, `prefers-reduced-motion`, and a text-only alternative to the 3D view.
5. SEO and sharing: page title and description, social share image, structured event data, and a static fallback for crawlers and no-WebGL browsers.
6. Analytics (with consent), error monitoring, and a deployment with preview links.
7. Final QA on the device matrix, then a soft launch with the TM Global team.
