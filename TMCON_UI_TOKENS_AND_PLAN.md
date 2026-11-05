# Applying the TM CON design system to the 3D venue site

Source: `TM_CON_2024_Design_System.md`. This file turns it into tokens, component mapping and a build plan, and lists the tweaks needed because this is an interactive 3D tool, not a marketing page. It supersedes part B of `PHASE3_TUNING_AND_DESIGN_SYSTEM.md` where they differ.

**Rule of thumb:** the design system governs the **UI layer only**. The stadium, seats, track, roof and city stay realistic. Brand shows up in the 3D scene only in pins, hover and selected states, LED idle art, banners and signage.

## 1. Open items to settle first (before building)

1. **Exact values.** The design system says type sizes, spacing and shadow offsets are approximate. Pull them from the Figma file and replace the proposals below.
2. **Fonts and licences.**
   - `Conraid` is proprietary. Confirm a web-font licence and get the files. Until then, use Bai Jamjuree bold uppercase with wide letter-spacing as the fallback for the wordmark and badges.
   - The design system spells the primary font "Bai Jamuree". On Google Fonts it is **"Bai Jamjuree"**. Check it is the same face, then load it with `next/font/google`.
3. **2026 assets.** The wordmark and badges say 2024. Get the TM CON 2026 versions from the brand team. Do not reuse 2024 artwork.
4. **Functional colours.** The palette has no error, success or warning colour, and a reservation form needs them. Ask the brand owner to approve one functional red for errors only. If not approved, use an orange ground, a black icon and plain wording ("Check your email address").
5. **Night mode.** The design system has no dark mode. Decision below (section 4).

## 2. Tokens

Put these in one source file (`src/styles/tokens.js`) and generate the CSS variables from it, so the 3D code can read the same hex values. Tints are the documented 75/50/25 percent mixes with white, computed here. Confirm them against Figma.

```css
:root {
  /* brand */
  --orange: #f2680b;
  --orange-75: #f58e48;
  --orange-50: #f9b485;
  --orange-25: #fcd9c2;
  --navy: #3b345b;
  --navy-75: #6c6784;
  --navy-50: #9d9aad;
  --navy-25: #ceccd6;
  --green: #03c280;
  --green-75: #42d1a0;
  --green-50: #81e1c0;
  --green-25: #c0f0df;
  --lavender: #eaa2ec;
  --lavender-75: #efb9f1;
  --lavender-50: #f5d1f6;
  --lavender-25: #fae8fa;
  --cream: #fff7f2;
  --ink: #000000;
  --canvas: #ffffff;

  /* shape and depth (proposals) */
  --outline: 3px; /* cards, panels */
  --outline-sm: 2px; /* chips, pins, inputs */
  --shadow-lg: 6px; /* cards, panels, big buttons */
  --shadow-md: 4px; /* buttons, chips */
  --shadow-sm: 3px; /* small chips, mobile */
  --radius-pill: 999px;
  --radius-card: 16px;
  --radius-photo: 24px;
  --radius-rect: 0;

  /* spacing: 4px base */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;

  /* motion (proposals) */
  --dur-press: 80ms;
  --dur-ui: 180ms;
  --dur-panel: 260ms;
  --ease-ui: cubic-bezier(0.2, 0.8, 0.2, 1);
}
```

Signature shadow (CSS): `box-shadow: var(--shadow-md) var(--shadow-md) 0 var(--ink);` Zero blur, always down-right. This is also much cheaper than `backdrop-filter` glass over a WebGL canvas, so removing the glass panels should help frame rate on phones.

**Type** (proposed, confirm in Figma):

| Token    | Spec                                                                    |
| -------- | ----------------------------------------------------------------------- |
| display  | Bai Jamjuree 700, uppercase, `clamp(28px, 4vw, 48px)`, line-height 1.05 |
| headline | 700, 24 / 28                                                            |
| body     | 400, 16 / 24 (never below 14 in panels)                                 |
| eyebrow  | 500, uppercase, 12 / 16, letter-spacing 0.08em                          |
| button   | 700, uppercase, 14 / 16                                                 |
| badge    | Conraid 400 (fallback: Bai Jamjuree 700, tracking 0.12em), 14           |

**Text colour rule (computed contrast, verify with a checker).** Use **black text** on orange (about 6.8:1), green (about 9:1), lavender (about 10.9:1) and cream. **White on orange is about 3.1:1 and white on green about 2.3:1, so never use white text on them.** White text is fine on navy (about 11.5:1) and black.

## 3. Components: map the design system to this app

| Design system                                                    | Use in this app                                                                                                                         |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `button-primary` (green, black text, pill, offset shadow)        | Reserve this seat, Enter the venue, Confirm                                                                                             |
| `button-secondary` (cream, pill, offset shadow)                  | Back to overview, Cancel, Replay intro                                                                                                  |
| `button-nav` (white pill, no shadow)                             | Top bar Register or Get tickets                                                                                                         |
| `feature-card` (eyebrow strip, coloured body, description strip) | **Zone info card**: top strip = zone name as eyebrow, coloured body = the key facts (price, capacity, time), bottom strip = description |
| `speaker-card` (coloured ground, duotone photo)                  | Speaker list in the stage zone. Use photos only once TM Global has confirmed speakers and approved the images                           |
| `stat-card` strip                                                | Overview panel: days, speakers, sessions, seats left                                                                                    |
| `logo-card` (pink outline)                                       | Partners and vendors zone logos                                                                                                         |
| `{shape.hex}`                                                    | A small decorative badge only (for example "VIP"). Never a container for text                                                           |
| `{shape.photo-frame}`                                            | "View from seat" preview and venue photos                                                                                               |

Build one base **OutlinedBlock** (outline + radius + offset shadow + ground colour) and make buttons, cards, panels, modals and chips variants of it, as the design system's own handoff notes suggest.

**Components the design system does not define, proposed:**

- **Inputs**: cream fill, 2px black outline, 12px radius, eyebrow-style label above, focus = 4px hard ring (`0 0 0 3px #FFF7F2, 0 0 0 6px #000`).
- **Toggle** (day/night, sound): pill track with a black outline. Day = orange fill and a sun icon. Night = navy fill and a moon icon.
- **Slider and segmented control** (crowd density, quality): pill track, black outline, filled part in green.
- **Tabs and chips**: pills; selected = filled with the zone colour and the offset shadow, unselected = cream with outline only.
- **Modal and bottom sheet**: OutlinedBlock, cream ground, orange header strip.
- **Toast**: green with black text, black outline and offset shadow.
- **Tooltip**: ink fill, white text, 2px radius.
- **Seat legend**: Available = green, Taken = navy 50% with a diagonal hatch, Selected = orange with a black outline, Yours = lavender.
- **States for every control**: hover (fill to the 75% tint), pressed (move down-right by the shadow offset and drop the shadow to 0 in 80 ms), disabled (25% tint with a dashed outline), focus (hard ring above), loading.

## 4. Day and night: keep the UI the same

The design system has no dark variant, and flat cream and colour panels read strongly over both a bright day scene and a dark night scene. So **do not change the panel colours between day and night.** Only the toggle's own state changes. If a dark UI is wanted later, define it as a separate approved token set (navy and ink grounds with cream outlines) rather than improvising.

## 5. Layout and zone colours

- **Top bar**: black bar (as the design system's nav), TM CON wordmark left, then the day/night toggle, sound toggle and a white pill Register button (flat, no shadow).
- **Desktop**: zone card as a cream OutlinedBlock on the right (about 380 px). **Mobile**: bottom sheet with a drag handle, maximum 46 percent of the screen height, shadow reduced to 3 px.
- **Zone navigation**: a horizontally scrollable row of pills.
- **Do not stack more than one saturated block in view.** One coloured strip on the card and small pins is the limit while the 3D scene is on screen.

**Zone colour mapping** (8 zones, 5 palette families, so identify by label and icon as well as colour):

| Zone                         | Colour                                              |
| ---------------------------- | --------------------------------------------------- |
| Main stage                   | orange                                              |
| Standing floor               | orange 50%                                          |
| VIP                          | navy                                                |
| Premium                      | lavender                                            |
| General                      | green                                               |
| Vendors, car park, restrooms | cream fill with black outline and an icon (neutral) |

## 6. Where the brand appears in 3D

- **Pins and labels**: pills with black outline and offset shadow, as HTML overlays. Keep them small, and hide them while the camera is moving.
- **Hover and selected**: an orange edge band on the hovered section, and a pin-style marker with black outline for the selected seat. Do not recolour the real seat mosaic.
- **Stage LED idle art**: TM CON key visual with the flat geometric shapes and hard offset shadows, on orange.
- **Banners and gates**: the wordmark and the year badge on apron banners and gate arches.
- **Crowd**: put 10 to 15 percent of the crowd in brand-colour tees. Subtle, but it ties the scene to the brand.
- **Grid-paper texture**: use on the loading and gate screens, not in the 3D world.
- **Gate and intro**: the gate screen is a single orange poster (display headline, one green pill button with offset shadow). The cinematic flight starts when it is pressed.

## 7. Build plan

1. Resolve section 1 with the brand owner and Figma.
2. Create `tokens.js`, generate the CSS variables, and load the fonts with `next/font`.
3. Build the OutlinedBlock, then Button, Chip, Card, Panel and Sheet, Input, Toggle, Slider, Modal, Toast, Tooltip, Badge and Pin.
4. Add a hidden `/design-system` page that shows every component in every state at desktop and mobile sizes, for review. Compare it with Figma.
5. Apply to the screens: gate, top bar, zone card, chips, tour HUD, reservation modal, settings popover, LED controls.
6. Wire the 3D hooks (section 6) and read colours from the tokens, never from hard-coded hex.
7. QA: contrast with a checker, keyboard focus, `prefers-reduced-motion`, 360 px width, and screenshots against Figma.

## 8. Do not

- Do not use blur, gradients or soft shadows in the UI.
- Do not use white text on orange, green or lavender.
- Do not set body text in Conraid.
- Do not add colours outside the palette and its tints, except the one approved functional red.
- Do not recolour the stadium to match the brand.
- Do not ship 2024 artwork in a 2026 product.
