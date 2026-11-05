// src/styles/tokens.js
// Single source of truth for all TM CON design system tokens.
// Derived from TM_CON_2024_Identity_Mini_Guide.pdf and TMCON_UI_TOKENS_AND_PLAN.md.

export const tokens = {
  colors: {
    // Primary #1: Orange
    orange: '#f2680b',
    orange75: '#f58e48',
    orange50: '#f9b485',
    orange25: '#fcd9c2',

    // Primary #2: Navy
    navy: '#3b345b',
    navy75: '#6c6784',
    navy50: '#9d9aad',
    navy25: '#ceccd6',

    // Accent #1: Green
    green: '#03c280',
    green75: '#42d1a0',
    green50: '#81e1c0',
    green25: '#c0f0df',

    // Accent #2: Lavender / Pink
    lavender: '#eaa2ec',
    lavender75: '#efb9f1',
    lavender50: '#f5d1f6',
    lavender25: '#fae8fa',

    // Accent #3: Cream (neutral background / cards)
    cream: '#fff7f2',

    // Tertiary: Ink & Canvas
    ink: '#000000',
    canvas: '#ffffff',

    // Approved functional alert color for form errors
    errorRed: '#e03131',
    errorRedLight: '#ffe3e3',
  },

  // 3D Scene night/day lighting colors
  lighting: {
    daySkyZenith: '#bcc6cc',
    daySkyHorizon: '#d9d2c2',
    dayFog: '#bdb5a6',
    daySun: '#fff1d6',

    nightSkyZenith: '#060913',
    nightSkyHorizon: '#141d34',
    nightFog: '#0b1020',
    nightMoon: '#8eaed6',
    nightFloodlight: '#fff2db',
    nightPoleLight: '#ffd175',
  },

  // Shapes & Outlines
  shape: {
    outline: '3px',
    outlineSm: '2px',
    shadowLg: '6px',
    shadowMd: '4px',
    shadowSm: '3px',
    radiusPill: '999px',
    radiusCard: '16px',
    radiusPhoto: '24px',
    radiusRect: '0px',
  },

  // Spacing (4px base grid)
  spacing: {
    space1: '4px',
    space2: '8px',
    space3: '12px',
    space4: '16px',
    space6: '24px',
    space8: '32px',
  },

  // Typography
  typography: {
    fontPrimary: 'var(--font-bai-jamjuree, "Bai Jamjuree", sans-serif)',
    fontMono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  },
  fonts: {
    primary: 'var(--font-bai-jamjuree, "Bai Jamjuree", sans-serif)',
    mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  },

  // Motion timings
  motion: {
    durPress: '80ms',
    durUi: '180ms',
    durPanel: '260ms',
    easeUi: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
  },
}

// Generate CSS variable declarations to inject into :root
export function generateCssVariables() {
  const c = tokens.colors
  const s = tokens.shape
  const sp = tokens.spacing
  const m = tokens.motion

  return `
    --orange: ${c.orange};
    --orange-75: ${c.orange75};
    --orange-50: ${c.orange50};
    --orange-25: ${c.orange25};

    --navy: ${c.navy};
    --navy-75: ${c.navy75};
    --navy-50: ${c.navy50};
    --navy-25: ${c.navy25};

    --green: ${c.green};
    --green-75: ${c.green75};
    --green-50: ${c.green50};
    --green-25: ${c.green25};

    --lavender: ${c.lavender};
    --lavender-75: ${c.lavender75};
    --lavender-50: ${c.lavender50};
    --lavender-25: ${c.lavender25};

    --cream: ${c.cream};
    --ink: ${c.ink};
    --canvas: ${c.canvas};
    --error-red: ${c.errorRed};
    --error-red-light: ${c.errorRedLight};

    --outline: ${s.outline};
    --outline-sm: ${s.outlineSm};
    --shadow-lg: ${s.shadowLg};
    --shadow-md: ${s.shadowMd};
    --shadow-sm: ${s.shadowSm};
    --radius-pill: ${s.radiusPill};
    --radius-card: ${s.radiusCard};
    --radius-photo: ${s.radiusPhoto};
    --radius-rect: ${s.radiusRect};

    --space-1: ${sp.space1};
    --space-2: ${sp.space2};
    --space-3: ${sp.space3};
    --space-4: ${sp.space4};
    --space-6: ${sp.space6};
    --space-8: ${sp.space8};

    --dur-press: ${m.durPress};
    --dur-ui: ${m.durUi};
    --dur-panel: ${m.durPanel};
    --ease-ui: ${m.easeUi};
  `
}

