# Phase 4: day/night, stage LED screens, crowds, and the cinematic city-to-stadium intro

Read after `STADIUM_MODEL_BRIEF.md` and `PHASE3_TUNING_AND_DESIGN_SYSTEM.md`. Finish Phase 3 part A (stadium tuning) first. Build in the order in section 8, and send screenshots or a screen recording after each step.

## 1. What the two reference videos show

**Video A: a stage-concert visualizer (ledmapper.pro demo, about 30 s).** A 3D outdoor stage with a large centre LED wall and two side LED wings showing branded content. Beams and lasers sweep the air, with clusters of glowing particles overhead. The crowd is a field of dark 3D figures with raised arms. A row of camera preset pills (FOH, UPPER, LEFT, RIGHT, VIP) sits above a big "Play live show" / "Stop live show" button. Takeaways for us: camera presets, a live-show mode, branded LED content, a believable crowd.

**Video B: the Reboot Camp site intro (about 46 s).** Sequence:

1. Black screen with a headline and a single button. The button is also the user gesture that unlocks audio.
2. Text appears and a glowing ember with a dotted trail travels across the dark.
3. A night city view fades in: roads lit as glowing lines, buildings with lit windows.
4. The camera descends toward the stadium. The stadium starts as a dark silhouette with a few lit windows.
5. As the camera arrives, the lights turn on: rim light, floodlights, crowd and stage appear.
6. It settles on the hero view: big title, zone pins, bottom navigation. A "Skip (Esc)" button stays bottom-right throughout, and sound controls sit in the top bar.

**Do not copy** their ember, their wording ("catch fire", "the fire will find you"), their gate copy or their glowing-road look. Keep the structure (gate, flight, lights-on, hero) but give TM CON its own concept and writing. Suggested concept: a **pulse of light that travels along the real road network from the city centre to the stadium**, and the stadium lights up when it arrives. This fits a technology and media brand and reuses the road data. TM Global should approve the copy.

## 2. Day and night mode

- Add `timeOfDay: 'day' | 'night'` to the zustand store. A sun/moon toggle sits in the top bar, styled with the design system.
- Transition smoothly over about 1.5 s by interpolating a parameter set. Do not rebuild materials or the scene.
- Persist the choice per viewer. The intro always plays at night, then the user can switch.

| Parameter        | Day                                           | Night                                                       |
| ---------------- | --------------------------------------------- | ----------------------------------------------------------- |
| Sky and fog      | hazy warm grey, current values                | deep blue-black gradient, faint horizon glow, fog `#0b1020` |
| Sun              | warm directional, soft shadows on the stadium | off (a weak cool moon light)                                |
| Roof floodlights | off                                           | on, with light cones and a soft glow on the roof            |
| Roof membrane    | cream, lit by sun                             | cream, lit from within and by floodlights                   |
| LED screens      | lower contrast                                | full brightness plus bloom                                  |
| Apron and poles  | plain                                         | lit light poles, booth lights                               |
| City             | hazy, desaturated at distance                 | lit windows, street lamps, car light streams                |
| Crowd            | normal                                        | rim-lit by the LED colour, phone lights                     |
| Post-processing  | none                                          | light bloom (desktop only)                                  |

- Use emissive maps and intensity uniforms so the switch is a lerp. Cap real lights at 4 to 6 near the camera. Fake the rest with emissive sprites and cone meshes.
- On mobile, skip bloom and use glow sprites.

## 3. Stage LED screens playing video

**Screens**: the main LED wall, two side wings (live-image magnification), and optionally the stadium scoreboard and ribbon boards.

**Config in `src/data/led.js`**:

```js
export const ledScreens = [
  {
    id: "main",
    label: "Main LED wall",
    size: [32, 9],
    mount: "stage-main",
    playlist: "idle",
  },
  {
    id: "left",
    label: "Left wing",
    size: [10, 17.8],
    mount: "stage-left",
    playlist: "idle",
  },
  {
    id: "right",
    label: "Right wing",
    size: [10, 17.8],
    mount: "stage-right",
    playlist: "idle",
  },
];
export const playlists = {
  idle: [
    {
      src: "/led/tmcon-promo.mp4",
      poster: "/led/tmcon-promo.jpg",
      title: "TM CON promo",
    },
  ],
  show: [
    {
      src: "/led/live-show.mp4",
      poster: "/led/live-show.jpg",
      title: "Live show",
    },
  ],
};
```

Modes: **idle** (promo loop), **session** (when a session is opened in the panel, play that speaker's clip), **show** (live show), **off**. Content comes from files TM Global owns or licenses. Do not ship placeholder footage from the web.

**Technical rules**

- One `<video>` per source: `muted`, `loop`, `playsInline`, `preload="metadata"`, `crossOrigin="anonymous"`. Feed it to a `THREE.VideoTexture` (`colorSpace = SRGBColorSpace`, no mipmaps, linear filter).
- Only 1 simultaneous decode on mobile, 2 on desktop. Pause when the stage is not in view or the tab is hidden. Update the texture with `requestVideoFrameCallback` where supported.
- LED look: a small shader with a round pixel mask, slight glow and view-angle dimming. Day contrast is lower and night glow is higher.
- Video specs for the content team: 16:9, 1280x720 for mobile and 1920x1080 for desktop, H.264 MP4 plus VP9 or AV1 WebM, about 2 to 3 Mbps, 10 to 20 s seamless loops, under 8 MB each, no audio track. Provide a poster JPG for each.
- Fallbacks: poster plus a subtle animated gradient if video fails, on Low quality, or with `prefers-reduced-motion`.
- Controls (in the stage zone panel): now showing, play or pause, previous or next, mute, "Open on full screen" (accessible modal player), and "Live show".
- Audio from videos is muted by default. All sound stays under the app's master mute.

Skeleton (agent to finish and test):

```jsx
"use client";
import { useEffect, useMemo } from "react";
import * as THREE from "three";

const vert = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;
const frag = `
uniform sampler2D map; uniform float uGlow; uniform vec2 uGrid; varying vec2 vUv;
void main(){
  vec3 c = texture2D(map, vUv).rgb;
  vec2 g = fract(vUv * uGrid);
  float led = smoothstep(0.55, 0.25, length(g - 0.5));
  c *= mix(0.6, 1.0, led) * uGlow;
  gl_FragColor = vec4(c, 1.0);
  #include <colorspace_fragment>
}`;

export default function LEDScreen({ size, src, glow = 1 }) {
  const { video, tex } = useMemo(() => {
    const v = document.createElement("video");
    Object.assign(v, {
      src,
      loop: true,
      muted: true,
      playsInline: true,
      crossOrigin: "anonymous",
      preload: "metadata",
    });
    const t = new THREE.VideoTexture(v);
    t.colorSpace = THREE.SRGBColorSpace;
    t.generateMipmaps = false;
    return { video: v, tex: t };
  }, [src]);
  useEffect(() => {
    video.play().catch(() => {});
    return () => {
      video.pause();
      video.removeAttribute("src");
      video.load();
      tex.dispose();
    };
  }, [video, tex]);
  return (
    <mesh>
      <planeGeometry args={size} />
      <shaderMaterial
        vertexShader={vert}
        fragmentShader={frag}
        toneMapped={false}
        uniforms={{
          map: { value: tex },
          uGlow: { value: glow },
          uGrid: { value: [size[0] * 4, size[1] * 4] },
        }}
      />
    </mesh>
  );
}
```

## 4. Crowds on the floor and in the stands

- **Seated crowd**: fill the seats that are marked **taken** in the seat data, so the stadium matches what the seat picker shows. Free seats stay empty, so visitors can see what is available. Fill about 80 to 90 percent of taken seats.
- **Standing crowd**: Poisson-disc sampling on the standing floor polygon, denser toward the stage. Keep aisles, barriers and a media pit clear. All figures face the stage.
- **Rendering**: instanced low-poly people. Near LOD: a body, a head and two arms (about 150 triangles). Far LOD: a flat impostor quad. Per-instance variation: skin tone across a realistic range of Nigerian skin tones, clothing from a muted palette, three simple hair or head-covering variants, small height variation.
- **Animation**: in the vertex shader only, not on the CPU. Gentle bob and sway with a per-instance phase. In live-show mode, arms go up in a wave that ripples out from the stage, timed to the music tempo. At night, add tiny phone lights.
- **Budgets**: desktop up to 25,000 instances (about 5,000 floor, 20,000 seated). Mobile up to 6,000. Setting: Crowd Off, Low, Medium or High, auto-chosen by device. "Simple view" disables the crowd.
- Stylised, faceless figures. No identifiable real people.

## 5. The cinematic intro (first visit only)

**Timeline, about 16 to 20 s, always skippable.**

1. **Loading**: brand mark plus progress while city chunks, stadium, LED posters and audio preload.
2. **Gate**: dark screen, TM CON headline, one button ("Enter"). This is the audio unlock. Add a "Skip intro" link and a sound on/off choice.
3. **City at night**: start high over the city centre near Aso Rock and the Three Arms Zone, in a dusk-to-night sky with a glowing horizon. Fade in the headline and the first caption.
4. **Drone flight**: a spline path through 6 to 8 waypoints, south-west along the expressway toward the stadium, descending from about 1,000 m to about 120 m. Ease in and out. Add a small camera roll (up to 3 degrees on turns) and narrow the field of view from about 55 to 42 degrees as it descends. A pulse of light runs along the real road ahead of the camera. Landmark captions fade in as each passes.
5. **Approach**: the stadium is a dark silhouette with a few lit windows. Sound: a low hum rising.
6. **Arrival and lights-on**: the camera arcs round to the hero pose from `zones.js` (the south overview) and stops. Then, over about 2.5 s: a sweep of light runs round the roof rim (0.8 s), the floodlights flash on with a short bloom spike, the roof glows from within, the LED wall boots from black to the logo to the promo reel, the crowd fades in with arms up, and the audio plays a power-up hit with a crowd swell. Then the UI fades in (title, pins, bottom nav, panel) and control passes to the user.

**Rules**

- Show once, keyed by a `localStorage` flag, with a "Replay intro" button in the menu. Support `?intro=1` to force it.
- `prefers-reduced-motion`: skip the flight, crossfade straight to the hero pose with lights-on.
- Low-power devices: shorter path and fewer city layers, or skip the flight and show a still with an "Explore" button.
- The intro must start within about 3 s on a decent 4G connection, loading the city progressively.

Path skeleton:

```js
import * as THREE from "three";
// Waypoints in local metres (see bake script). y is altitude.
export const flight = {
  position: new THREE.CatmullRomCurve3(PATH_POINTS, false, "centripetal"),
  target: new THREE.CatmullRomCurve3(LOOK_POINTS, false, "centripetal"),
  duration: 18,
};
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
// per frame: t = ease(clamp(elapsed / flight.duration, 0, 1))
// camera.position.copy(flight.position.getPoint(t))
// camera.lookAt(flight.target.getPoint(Math.min(1, t + 0.02)))
// camera.fov = lerp(55, 42, t); camera.updateProjectionMatrix()
```

## 6. Real Abuja landmarks and city data

**Use real places, but do not hand-place them.** Resolve each by name through OSM (Overpass or Nominatim) and Wikidata, check the coordinates against the Google Earth screenshots, and keep a landmark table in the repo. Heights come from OSM `height` or `building:levels` tags where present. Model landmarks as simple, recognisable silhouettes, not detailed replicas, and label them in the scene.

Candidates, with rough direction from the stadium (verify all, and pick 5 to 7 that lie along the flight path):

| Landmark                                    | Rough position and look                                             |
| ------------------------------------------- | ------------------------------------------------------------------- |
| Moshood Abiola National Stadium             | destination                                                         |
| Abuja City Gate                             | near the stadium, south-west (seen in your Google Earth screenshot) |
| Nigerian National Mosque                    | north-east, Central Area; golden dome, four minarets                |
| National Christian Centre                   | beside the mosque; large dome with a cross                          |
| Eagle Square                                | Central Area, open plaza                                            |
| National Assembly Complex (Three Arms Zone) | further north-east; golden dome                                     |
| Presidential Villa                          | at the foot of Aso Rock                                             |
| Aso Rock                                    | large rock outcrop, the city's far north-east backdrop              |
| Central Bank of Nigeria HQ and Ceddi Plaza  | tall towers in the Central Business District                        |
| Transcorp Hilton Abuja                      | tall hotel in Maitama                                               |
| Jabi Lake, Millennium Park                  | water and green space north-west or north of the centre             |
| Umaru Musa Yar'Adua (airport) Expressway    | the road that carries the light pulse to the stadium                |

**City bake script** (`scripts/bake-abuja.mjs`, run at build time, never at runtime):

- Region: a box covering the stadium, Central Area and Aso Rock (about 20 x 20 km).
- Layers by distance: major roads for the whole box and all roads near the stadium; buildings only in the Central Business District, the flight corridor and within about 2.5 km of the stadium; landuse polygons (residential and commercial) to scatter light points; water; parks.
- Output chunked typed arrays in `public/city/`, loaded progressively and drawn with instancing.
- Budgets: buildings up to 120,000 instances desktop and 40,000 mobile. Light points up to 150,000 desktop and 40,000 mobile.
- Terrain (optional): a coarse height map for Aso Rock and the hills (for example, open terrain tiles with attribution), or a few hand-made hill meshes at OSM peak and rock locations.

**Night lighting for the city**

- Street lamps: instanced points along road lines every 30 to 40 m, a mix of about 70 percent warm (`#ffb15c`) and 30 percent cool (`#e6efff`), denser on expressways.
- Buildings: a shader with random lit windows, density falling with distance.
- Landmarks: lit domes and tower tops.
- Traffic: moving instanced points on highways, red one way and white the other.
- Sky glow near the horizon.

**Day**: hazy, desaturated distant layers, off-white and beige buildings, fog by distance.

Keep "Map data © OpenStreetMap contributors" on screen, plus any terrain data attribution.

## 7. Camera presets and live show (from Video A)

- Add presets to the existing zone navigation: **Overview, Stage, Floor (front of house), VIP, Upper tier, Left, Right**.
- **View from seat**: when a seat is selected, offer a button that puts the camera at seat height looking at the stage. This helps people pick seats.
- **Live show** toggle: moving beams and lasers, particle sparkles above the stage, the LED screens switch to the show reel, the crowd raises its arms, and a sound cue plays. If pressed in day mode, switch to night first.

## 8. Build order and checkpoints

1. Day and night toggle with parameter sets (no city yet).
2. Stage LED screens with video, controls and fallbacks.
3. Crowds (floor and seated) with the Low, Medium and High setting.
4. Abuja city bake, landmarks and night lights.
5. Intro flight and the lights-on moment, with the gate, skip and replay.
6. Camera presets, view from seat, live show.
7. Performance and device QA.

Send screenshots or a short recording after each step.

## 9. Performance, quality tiers and fallbacks

- Auto-detect a tier (High, Medium, Low, Simple) from device memory, core count and GPU class, and drop a tier if the frame rate stays under 30 fps for 2 s.
- Targets: 60 fps on desktop, at least 30 fps on a mid-range phone. Draw calls under 250 desktop and 150 mobile.
- Simple view: no crowd, no city, still-image LED, no intro, same zones and seat selection.
- Never autoplay audio before the gate click. All sound obeys the master mute.

## 10. Acceptance criteria

- The day/night switch is smooth and every light, glow and city layer changes with it.
- The LED screens play real video on desktop and mobile, with working controls and fallbacks.
- Crowds appear on the floor and in the stands, match the taken seats, and stay within budget.
- The intro flies from the city to the stadium along real roads past real landmarks, stops at the hero pose, and the lights turn on. It is skippable, replayable and skipped for reduced motion.
- Landmarks are real, labelled and verified against the map.
- All existing features still work: zones, seat selection, tour, audio, panel.

## 11. Do not

- Do not copy another event's concept, copy, ember or visual style.
- Do not use videos, music or images TM Global does not have the rights to.
- Do not call Overpass or any map service at runtime.
- Do not animate crowd members one by one on the CPU.
- Do not block first paint on city data. Load it progressively.
- Do not present unverified landmark positions as fact.
