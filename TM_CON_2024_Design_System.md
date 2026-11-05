# TM Con 2024 — Design System

> Built from `TM_Con_2024_Identity_Mini_Guide.pdf` + the live TM Con homepage. Structured to be dropped straight into Antigravity as agent context alongside your Figma file. Values marked _(approx.)_ aren't in the brand PDF — pull exact px/hex from Figma before final handoff; everything else is confirmed from the source assets.

## Overview

TM Con reads as **neubrutalist-poster-meets-African-creator-economy**: bold black-outlined geometric shapes sitting on flat color fields, with a signature **hard offset drop shadow** (no blur — a duplicated silhouette nudged down-and-right) doing all the depth work instead of soft shadows or gradients. The system has two typefaces doing distinct jobs — `Conraid` (blocky, proprietary) for the identity mark and numeric badges, `Bai Jamuree` (rounded geometric sans) for everything you actually read — and a 7-color palette that never mixes more than 2–3 blocks in one viewport.

**Key characteristics:**

- Solid black outlines on every container shape — no soft borders, no color-on-color outlines.
- Signature **hard offset shadow**: duplicate the container, fill it black, offset down-right, zero blur. This is the single most identity-defining move in the system — it appears on buttons, cards, and photo frames.
- Four container geometries only: **pill**, **rectangle**, **hexagon/chevron**, and rounded-photo-frame. No other shapes.
- Section rhythm alternates full-bleed color blocks (orange → white/grid → cream → green → photo → green → white) — never two saturated blocks back to back without a white/cream breather, same pacing logic you'd use on any color-block marketing page.
- `Conraid` is reserved for the wordmark and short numeric/date badges; `Bai Jamuree` carries every headline and all body copy.

## Colors

| Role       | Token                      | Hex       |
| ---------- | -------------------------- | --------- |
| Primary #1 | `{colors.primary-orange}`  | `#F2680B` |
| Primary #2 | `{colors.primary-navy}`    | `#3B345B` |
| Accent #1  | `{colors.accent-green}`    | `#03C280` |
| Accent #2  | `{colors.accent-lavender}` | `#EAA2EC` |
| Accent #3  | `{colors.accent-cream}`    | `#FFF7F2` |
| Tertiary   | `{colors.ink}`             | `#000000` |
| Tertiary   | `{colors.canvas}`          | `#FFFFFF` |

Each brand color also has documented tints at **75% / 50% / 25%** — use these for hover/disabled states and for the softer grid-paper background rather than introducing new hues.

**Usage observed on the live page:**

- **Orange** — hero background, primary brand color, top-of-page energy.
- **Navy** — secondary dark accent block (speaker card, "Create Moments" panel).
- **Green** — the workhorse accent: primary CTA fill (`DOWNLOAD REPORT`), the "Meet Our Speakers" and "Some Highlights" section grounds, one "Why Join" panel.
- **Lavender/pink** — softer accent block ("Learn & Get Inspired" panel), border treatment on the highlights photo grid and partner logo cards.
- **Cream** — secondary button fill, off-white card backgrounds, the black-alternating stat row.
- **Black** — nav bar, one stat block, all outlines and shadow fills, one CTA button fill.

## Typography

### Font Family

- **`Conraid`** — proprietary/accent font. Blocky, monospaced-feeling, slightly futuristic-African-print character. Reserved for the wordmark (`TM CON`) and short numeric badges (`2024`). Never set as running text.
- **`Bai Jamuree`** — primary font. Rounded geometric sans. Carries every headline, subhead, body paragraph, button label, and section eyebrow.

### Hierarchy _(approx. — confirm px in Figma)_

| Token                          | Weight            | Use                                                                                                    |
| ------------------------------ | ----------------- | ------------------------------------------------------------------------------------------------------ |
| `{typography.display}`         | Bold/Black        | Hero + section headlines ("Ride The Next Wave", "MEET OUR SPEAKERS") — large, tight leading, black ink |
| `{typography.headline}`        | Bold              | Card/section sub-titles ("Why TM CON?", "Some Highlights")                                             |
| `{typography.stat}`            | Bold              | Big numeric stats in the stat row (e.g. "3,000+")                                                      |
| `{typography.body}`            | Regular           | Paragraph copy under headlines                                                                         |
| `{typography.eyebrow}`         | Medium, uppercase | Small tag labels inside cards ("Why Join The Ride?")                                                   |
| `{typography.button}`          | Bold, uppercase   | All pill button labels — always all-caps                                                               |
| `{typography.badge}` (Conraid) | Regular           | "2024", date tags on speaker cards                                                                     |

**Principle:** headlines and buttons in `Bai Jamuree` run **uppercase and bold** for punch; body copy drops to sentence case at a lighter weight for readability. `Conraid` shows up in small doses only — it's a flavor accent, not a workhorse font.

## Shapes

Four geometries, always with a **solid black outline** (per the brand guide: _"solid outlines, only to be in black colour"_):

| Token                 | Form                              | Use                                                                                                       |
| --------------------- | --------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `{shape.pill}`        | Full-rounded capsule              | Every button, nav CTA                                                                                     |
| `{shape.rect}`        | Sharp-cornered rectangle          | Lavender card block, some containers                                                                      |
| `{shape.hex}`         | Elongated hexagon / chevron-point | Accent shape (green block) — used sparingly as a highlight device, not a container for text-heavy content |
| `{shape.photo-frame}` | Large rounded rectangle           | Hero photo, highlight grid photos — often gets a colored (pink/orange) border instead of black            |

**Drop shadow construction** (per brand guide, verbatim logic): _duplicate the container shape, fill it solid black, and offset it below and to the right of the main shape_ — no blur, no opacity fade. This is a hard silhouette shadow, closer to a neubrutalist/pop-art shadow than a conventional soft UI shadow.

## Elevation & Depth

| Level             | Treatment                                             | Use                                                                         |
| ----------------- | ----------------------------------------------------- | --------------------------------------------------------------------------- |
| 0 (flat)          | No outline, no shadow                                 | Full-bleed color-block section backgrounds                                  |
| 1 (outline)       | 2–3px solid black outline, no shadow                  | Nav CTA, logo cards, small chips                                            |
| 2 (offset shadow) | Black outline + hard offset duplicate shadow          | **All primary/secondary buttons**, feature cards, speaker cards, stat cards |
| 3 (photo frame)   | Colored (not black) border on rounded photo container | Hero image, highlight photo grid                                            |

There are no soft shadows, gradients, or blurs anywhere in the system — depth is 100% communicated by outline + hard offset duplicate.

## Components

### Buttons — the signature component

This is the piece to get pixel-exact, since it's the most repeated and most identity-carrying element on the page.

**`button-primary`** (e.g. "DOWNLOAD REPORT")

- Fill: `{colors.accent-green}`, text: `{colors.ink}`, shape: `{shape.pill}`
- 2–3px solid black outline
- Hard offset shadow: black duplicate pill, offset ~4–6px down and right, 0 blur
- Label: `{typography.button}` — bold, uppercase, small trailing arrow icon
- On dark section grounds, this same button also appears in solid **black** fill with white text (speaker section variant) — treat black as an alternate primary fill on dark/saturated backgrounds where green would clash.

**`button-secondary`** (e.g. "BE OUR PARTNERS IN CRIME")

- Fill: `{colors.accent-cream}` or `{colors.canvas}`, text: `{colors.ink}`, shape: `{shape.pill}`
- Same black outline + hard offset shadow treatment as primary
- Label: bold, uppercase, small trailing icon (arrow/external-link glyph)

**`button-nav`** (top bar "PARTNER WITH US")

- Fill: `{colors.canvas}`, text: `{colors.ink}`, shape: `{shape.pill}`
- Flat — **no offset shadow** on the nav bar variant (keeps the sticky header calm; shadow is reserved for in-page CTAs)

**Recommended interaction state** _(not visible in a static screenshot, but the standard convention for this offset-shadow style — flag for confirmation in Figma):_ on press, the button shifts down-right to meet its shadow (shadow offset → 0), giving a tactile "pressed into place" feel. Hover can simply darken the fill 10–15% via the documented tint scale.

### Cards

**`stat-card`** — the 5-block stats row under the hero. Alternates cream/white and solid black backgrounds; bold numeral in `{typography.stat}`, small caption label below. Sharp rectangle, hairline dividers between cells, no shadow (this row reads as one continuous strip).

**`feature-card`** ("Why Join The Ride?" 2×2 grid)

- White top strip: small eyebrow icon + `{typography.eyebrow}` label
- Colored body panel filling most of the card (rotates through green / orange / lavender / navy)
- White bottom strip: `{typography.body}` description text
- Whole card: black outline, rounded corners, hard offset shadow

**`speaker-card`**

- Colored ground (rotates through green / navy / pink / black across the 4 cards)
- Duotone-toned photo cutout bleeding to the card edge
- Speaker name set large in bold `{typography.display}` (or Conraid for extra flavor on short names)
- Small `Conraid` date/eyebrow badge in the corner
- Black outline, rounded corners, offset shadow

**`logo-card`** (Partners & Sponsors grid)

- White fill, **pink/lavender** outline (a rare non-black outline exception), rounded rectangle, centered logo, no shadow

### Section wrappers

Same color-block logic as any marketing color-block system: pick one ground color per section, let it run full width, and always return to white/cream before the next saturated block:

`Hero (orange)` → `Why TM Con (white + grid-paper texture)` → `Stats (black/cream strip)` → `Why Join The Ride (cream)` → `Meet Our Speakers (green)` → `Creator Economy Report (full-bleed photo)` → `Highlights (green)` → `Partners (white)`

## Do's and Don'ts

**Do**

- Keep all outlines solid black, no exceptions except the pink logo-card border.
- Apply the hard offset shadow consistently in one direction (down-right) across every button and card — consistency of direction is what sells the effect.
- Reserve `Conraid` for the wordmark and short numeric badges only.
- Alternate saturated section grounds with white/cream breathing room, same as any color-block marketing page.

**Don't**

- Don't blur or soften the signature shadow — it's a flat duplicate silhouette, not a conventional drop shadow.
- Don't set body copy in `Conraid` — it's a display/accent font only.
- Don't mix the hexagon/chevron shape with buttons or text-heavy cards — it's an accent device, not a container.
- Don't introduce colors outside the 7-token palette (5 brand + black/white).
- Don't stack more than one saturated color block in the same viewport.

## Responsive Behavior _(approx. — confirm breakpoints in Figma)_

- Stat row: 5-up on desktop → likely 2–3 up on tablet → stacked single column on mobile.
- Feature-card grid: 2×2 on desktop → single column stack on mobile, panels keep their internal 3-strip structure.
- Speaker grid: 2×2 on desktop → single column on mobile.
- Buttons stay pill-shaped and full-width friendly on mobile; offset shadow value may need to shrink slightly (2–3px) at small sizes so it doesn't overwhelm a smaller tap target.
- Nav collapses to a hamburger below tablet width; the "PARTNER WITH US" pill typically stays visible on the bar.

## Known Gaps

- Exact type scale (px/line-height per token), spacing base unit, and shadow offset distance aren't specified in the brand PDF — these are visually approximated from the live homepage screenshot. Pull the real values from your Figma file before wiring up tokens in Antigravity.
- No documented hover/press/disabled states — the press-state recommendation above is a standard convention for this shadow style, not a confirmed spec.
- No dark-mode equivalent exists; the black stat-block and navy speaker card are the closest existing "dark" surfaces.
- Form styling (if the site gets a contact/RSVP form) isn't shown anywhere in the current assets.

## Handoff Notes for Antigravity

1. Set up `{colors.*}` and `{shape.*}` as CSS variables/Tailwind theme tokens first — the palette and shape vocabulary are the two things every component depends on.
2. Build `button-primary` and `button-secondary` first and get the offset-shadow mechanic exactly right; every other card in the system reuses that same shadow technique.
3. Load `Bai Jamuree` as the default font-family; load `Conraid` as a secondary family scoped only to the wordmark/badge components so it can't leak into body text by accident.
4. Build `feature-card` and `speaker-card` as variants of one base "outlined color-block card" component rather than two separate components — they share the outline + shadow + rounded-corner mechanics.
