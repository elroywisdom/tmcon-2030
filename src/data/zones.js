// Single source of truth for Moshood Abiola National Stadium, Abuja.
// World units are in metres centered on the stadium bowl/pitch (~[-3.8, 12.1]).
// +x east, +z south (South Avenue / Independence Ave), +y up.
// The scoreboard sits in the North upper-tier gap (-z); the main stage sits at the opposite (South) end of the pitch (+z).
// Map coordinates derived from OpenStreetMap Relation 13989805.
import { tokens } from '@/styles/tokens'

export const EVENT_DETAILS = {
  name: 'TM CON 2030',
  fullName: 'Technology Media Conference',
  organizer: 'Technology Media Global (TM Global)',
  // TODO confirm with TM Global: exact event dates
  dates: 'November 2030 (Dates To Be Confirmed)',
  venue: 'Moshood Abiola National Stadium',
  city: 'Abuja, Federal Capital Territory, Nigeria',
  tagline: "Africa's Premier Intersection of Tech, Innovation & Media",
  osmAttribution: 'Map data © OpenStreetMap contributors (ODbL)',
}

// Tilted aerial overview framing the stadium, apron, round building, roundabout and terraced car parks
export const OVERVIEW = { cam: [-295, 175, 235], target: [-10, 12, 15] }

// Camera Presets per Phase 4 Section 7 of PHASE4_DAYNIGHT_LED_CROWD_INTRO.md:
// Overview, Stage, Floor (front of house), VIP, Upper tier, Left, Right
export const CAMERA_PRESETS = [
  {
    id: 'overview',
    label: 'Overview',
    iconKey: 'overview',
    cam: [-295, 175, 235],
    target: [-10, 12, 15],
    description: 'Aerial stadium overview',
  },
  {
    id: 'stage',
    label: 'Stage',
    iconKey: 'stage',
    cam: [-2, 8.5, 27],
    target: [2, 9.5, 52],
    description: 'Main Stage and LED screens',
  },
  {
    id: 'floor',
    label: 'Floor (FOH)',
    iconKey: 'floor',
    cam: [2, 4.2, 16],
    target: [4, 8.5, 54],
    description: 'Front of house sound console',
  },
  {
    id: 'vip',
    label: 'VIP',
    iconKey: 'vip',
    cam: [8, 13, 16],
    target: [-68, 16, 18],
    description: 'West VIP Executive Stand',
  },
  {
    id: 'upper_tier',
    label: 'Upper Tier',
    iconKey: 'upper_tier',
    cam: [-20, 38, -60],
    target: [6, 12, 30],
    description: 'North curved upper tier bowl',
  },
  {
    id: 'scoreboard',
    label: 'Scoreboard',
    iconKey: 'scoreboard',
    cam: [-14.5, 18, -48],
    target: [-14.5, 25.8, -101],
    description: 'North Scoreboard LED display',
  },
  {
    id: 'left',
    label: 'Left Stand',
    iconKey: 'left',
    cam: [-72, 18, 12],
    target: [8, 10, 48],
    description: 'West grandstand flank angle',
  },
  {
    id: 'right',
    label: 'Right Stand',
    iconKey: 'right',
    cam: [72, 18, 12],
    target: [-6, 10, 48],
    description: 'East grandstand flank angle',
  },
]

// Computes camera eye position looking directly at the Main Stage for any picked seat
export function getSeatSightlineShot(zoneId, index) {
  const z = zones[zoneId]
  if (!z?.seating) return null
  const { rows, cols, width } = z.seating
  const r = Math.floor(index / cols)
  const c = index % cols
  const seatW = width / cols

  let sectionPos = [0, 0, 0]
  let rotY = 0
  if (zoneId === 'vip') {
    sectionPos = [-64, 0, 18]
    rotY = Math.PI / 2
  } else if (zoneId === 'premium') {
    sectionPos = [58, 0, 6]
    rotY = -Math.PI / 2
  } else if (zoneId === 'general') {
    sectionPos = [14, 0, 82]
    rotY = Math.PI
  }

  // Local seat position within section
  const lx = (c + 0.5) * seatW - width / 2
  const ly = 2.4 + r * 0.82 + 1.25 // seat height + seated eye level (~1.25m)
  const lz = -r * 1.05

  // Rotate local coordinate around Y
  const cos = Math.cos(rotY)
  const sin = Math.sin(rotY)
  const wx = sectionPos[0] + (lx * cos + lz * sin)
  const wy = sectionPos[1] + ly
  const wz = sectionPos[2] + (-lx * sin + lz * cos)

  return {
    cam: [wx, wy, wz],
    target: [6, 8.5, 54], // Main Stage center focus
  }
}

// Five reference comparison views from Section 10 of STADIUM_MODEL_BRIEF.md
export const COMPARISON_VIEWS = {
  1: {
    id: 1,
    title: '1. Exterior from the south at ground level (apron, piers, gates, roof edge)',
    cam: [38, 9.5, 224],
    target: [2, 16.5, 130],
  },
  2: {
    id: 2,
    title: '2. Tilted aerial of the whole stadium and surroundings',
    cam: [-375, 195, 105],
    target: [35, 8, -15],
  },
  3: {
    id: 3,
    title: '3. Inside, looking across the pitch at the long-side stands',
    cam: [-48, 12.5, 42],
    target: [62, 19, -8],
  },
  4: {
    id: 4,
    title: '4. Inside, looking along the track at the curved end (yellow gates, terracotta track)',
    cam: [-24, 4.2, 68],
    target: [-14, 16.5, -75],
  },
  5: {
    id: 5,
    title: '5. Roof from above, showing scalloped quilted bays and the oval opening',
    cam: [-78, 138, 86],
    target: [-4, 12, 4],
  },
}

export const zones = {
  stage: {
    id: 'stage',
    label: 'Main Stage',
    badge: 'South End Pitch (Opposite Scoreboard)',
    color: tokens.colors.orange,
    cam: [-2, 8.5, 27],
    target: [2, 9.5, 52],
    pin: [10, 19, 54],
    blurb:
      'The conference flagship stage positioned at the South end of the pitch opposite the scoreboard, featuring an ultra-HD LED wall, dynamic trusses, and line-array acoustics.',
    itemsHeading: 'Schedule & Keynotes',
    items: [
      // TODO confirm with TM Global: confirmed keynote speakers
      {
        title: 'Opening Keynote (Speaker to be confirmed)',
        meta: '10:00 • The Future of African Media & Tech Innovation',
      },
      // TODO confirm with TM Global: confirmed panel speakers
      {
        title: 'Panel Session (Speakers to be announced)',
        meta: '11:45 • Scaling Infrastructure & Creator Economics',
      },
      // TODO confirm with TM Global: confirmed fireside guests
      {
        title: 'Fireside Chat (Guests to be announced)',
        meta: '14:15 • AI, Creative IP & Global Storytelling',
      },
      // TODO confirm with TM Global: closing live performer
      {
        title: 'Closing Live Performance (Performer to be announced)',
        meta: '17:30 • Live Audiovisual Showcase',
      },
    ],
  },
  vip: {
    id: 'vip',
    label: 'VIP Executive Stand',
    badge: 'West Main Stand (Cream VIP Block & Hospitality Boxes)',
    color: tokens.colors.navy,
    cam: [8, 13, 16],
    target: [-68, 16, 18],
    pin: [-72, 22, 18],
    blurb:
      'Covered seating in the West Main Stand featuring the central pale-cream VIP block, dedicated players/VIP tunnel portal, and glazed hospitality suites in the box band above.',
    itemsHeading: 'VIP Inclusions',
    items: [
      {
        title: 'Reserved cream-block VIP seating',
        meta: 'Numbered ergonomic seats in the central West Stand',
      },
      // TODO confirm with TM Global: gate designations
      {
        title: 'Dedicated VIP entrance',
        meta: 'West Concourse Approach & Executive Reception',
      },
      {
        title: 'Glazed Hospitality Box Lounge',
        meta: 'Mid-tier executive box band with catering & networking',
      },
      {
        title: 'Backstage & speaker lounge pass',
        meta: 'Access to speaker networking areas',
      },
    ],
    seating: { rows: 12, cols: 36, width: 56, price: 150000 },
  },
  premium: {
    id: 'premium',
    label: 'Premium Section',
    badge: 'East Long-Side Lower Tier',
    color: tokens.colors.lavender,
    cam: [-14, 13, 10],
    target: [62, 16, 6],
    pin: [66, 22, 6],
    blurb:
      'Lower-tier mosaic seating along the East long side, offering panoramic sightlines across the terracotta running track, central pitch, and main stage.',
    itemsHeading: 'Premium Perks',
    items: [
      {
        title: 'Reserved lower-tier seating',
        meta: 'Numbered seats along the East Grandstand',
      },
      // TODO confirm with TM Global: gate designations
      {
        title: 'Priority apron turnstile gate',
        meta: 'East Apron Concourse Gates',
      },
      {
        title: 'Official TM CON tech pack',
        meta: 'Official conference merchandise & delegate badge',
      },
    ],
    seating: { rows: 12, cols: 40, width: 72, price: 75000 },
  },
  general: {
    id: 'general',
    label: 'General Seating',
    badge: 'Upper Tier & Curved End Stands',
    color: tokens.colors.green,
    cam: [-6, 15, 32],
    target: [-14, 18, -72],
    pin: [-14, 24, -76],
    blurb:
      'Shaded upper-tier maroon seating and curved end stands under the scalloped tensile roof canopy, with sweeping views of the entire about 60,000-seat bowl.',
    itemsHeading: 'Access & Details',
    items: [
      {
        title: 'Reserved bowl seat',
        meta: 'Numbered section & row seat selection',
      },
      // TODO confirm with TM Global: gate designations
      {
        title: 'General admission entrance',
        meta: 'Numbered Perimeter Arcade Gates',
      },
      {
        title: 'Digital event pass & recording archive',
        meta: 'Full on-demand video access post-event',
      },
    ],
    seating: { rows: 12, cols: 42, width: 76, price: 25000 },
  },
  floor: {
    id: 'floor',
    label: 'Standing Floor & Pitch',
    badge: 'Central Arena Turf',
    color: tokens.colors.orange50,
    cam: [-18, 22, -16],
    target: [4, 4, 28],
    pin: [2, 24, 22],
    blurb:
      'Immersive standing floor on the central football pitch directly in front of the main stage, framed by the 8-lane terracotta athletics track and two-tier bowl.',
    itemsHeading: 'Floor Details',
    items: [
      {
        title: 'Stage-side floor access',
        meta: 'Open standing area directly before the main stage',
      },
      {
        title: 'Live demo pods & creator stations',
        meta: 'Interactive tech showcases on the pitch perimeter',
      },
      {
        title: 'Hydration stations',
        meta: 'Complimentary water points around running track edge',
      },
    ],
    price: 15000,
  },
  vendors: {
    id: 'vendors',
    label: 'Vendor & Brand Village',
    badge: 'East Apron Promenade',
    color: tokens.colors.orange25,
    cam: [210, 38, 62],
    target: [135, 3, 18],
    pin: [138, 12, 18],
    blurb:
      'Outdoor brand village on the wide paved East stadium apron next to the terraced car park, featuring partner booths, hardware test pods, and food courts.',
    itemsHeading: 'Featured Pavilions',
    items: [
      // TODO confirm with TM Global: confirmed brand partners
      {
        title: 'Media & Technology Pavilion (Partners to be confirmed)',
        meta: 'Interactive hardware, VR & production tech',
      },
      {
        title: 'Fintech & Digital Commerce Lounge (Sponsor to be confirmed)',
        meta: 'Creator monetization & payments showcase',
      },
      {
        title: 'Abuja Artisan Food & Refreshment Court',
        meta: 'Curated food trucks, grills & specialty beverages',
      },
      {
        title: 'Creator Studio & Podcast Lounge',
        meta: 'Live broadcast & interview booths',
      },
    ],
  },
  carpark: {
    id: 'carpark',
    label: 'Car Park & Arrival',
    badge: 'Terraced Lots & South Gate Avenue',
    color: tokens.colors.navy25,
    cam: [-255, 92, 285],
    target: [-65, 4, 125],
    pin: [-135, 14, 155],
    blurb:
      'Tree-lined terraced car parks on the West, South-West, and East sides of the stadium, plus the wide paved South arrival avenue and turnstile plaza.',
    itemsHeading: 'Access & Logistics',
    items: [
      // TODO confirm with TM Global: which car parks and gates will open
      {
        title: 'Terraced Stadium Car Parks',
        meta: 'Tree-shaded parking terraces on West, SW & East grounds',
      },
      {
        title: 'South Gate Plaza Arrival',
        meta: 'Main pedestrian avenue with white turnstile canopies',
      },
      {
        title: 'Expressway Access',
        meta: 'Connected via Independence Ave & Constitution Ave',
      },
      {
        title: 'Walking Distance',
        meta: 'Direct step-free access onto the outer stadium apron',
      },
    ],
  },
  restrooms: {
    id: 'restrooms',
    label: 'Restrooms & Services',
    badge: 'Apron Ring & Concourse Amenities',
    color: tokens.colors.lavender25,
    cam: [-185, 28, 85],
    target: [-122, 4, 25],
    pin: [-122, 12, 25],
    blurb:
      'Concourse restrooms, medical first-aid points, and ticket/information booths spaced around the paved stadium apron and ground-level arcade.',
    itemsHeading: 'Facility Locations',
    items: [
      {
        title: 'Concourse Restrooms',
        meta: 'Available on all stadium gates and stand levels',
      },
      {
        title: 'Apron Information & Ticket Booths',
        meta: 'White portacabin ring around the outer apron',
      },
      {
        title: 'First Aid & Medical Points',
        meta: 'Stationed along West and South concourses',
      },
    ],
  },
}

export const zoneList = Object.values(zones)

export const itinerary = [
  { time: '08:00', title: 'Gates Open & Badge Collection' },
  { time: '09:30', title: 'Welcome Address by TM Global Leadership' },
  // TODO confirm with TM Global: confirmed keynote title
  { time: '10:00', title: 'Opening Keynote: Africa’s Media-Tech Renaissance' },
  { time: '12:00', title: 'Networking Break & Brand Village Showcase' },
  { time: '13:30', title: 'Afternoon Breakout Tracks: AI, Media & Infrastructure' },
  { time: '16:00', title: 'TM Global Innovation Awards' },
  { time: '17:30', title: 'Closing Live Audiovisual Concert' },
]

export const tourSteps = [
  {
    id: 'overview',
    title: 'Moshood Abiola National Stadium, Abuja',
    subtitle: 'Venue of TM CON 2030',
    description:
      'Welcome to the 3D digital model of Nigeria’s national stadium in daytime Abuja, built from OpenStreetMap data and real architectural references.',
    cam: OVERVIEW.cam,
    target: OVERVIEW.target,
    zoneId: null,
  },
  {
    id: 'stage',
    title: 'The Main Stage',
    subtitle: 'South End Pitch Rig',
    description:
      'Positioned at the South end of the pitch opposite the scoreboard, featuring an ultra-wide LED wall and concert trussing under the stadium roof.',
    cam: zones.stage.cam,
    target: zones.stage.target,
    zoneId: 'stage',
  },
  {
    id: 'vip',
    title: 'West Main Stand (VIP)',
    subtitle: 'Cream VIP Block & Hospitality Boxes',
    description:
      'The central VIP block in the West Stand with cream seating, players tunnel portal, and glazed hospitality suites in the box band above.',
    cam: zones.vip.cam,
    target: zones.vip.target,
    zoneId: 'vip',
  },
  {
    id: 'floor',
    title: 'Central Pitch & Terracotta Track',
    subtitle: 'Immersive Arena Floor',
    description:
      'The central football pitch and 8-lane terracotta athletics track surrounded by the two-tier mosaic seating bowl.',
    cam: zones.floor.cam,
    target: zones.floor.target,
    zoneId: 'floor',
  },
  {
    id: 'vendors',
    title: 'Brand Village & Apron Promenade',
    subtitle: 'East Stadium Apron',
    description:
      'Open-air exhibition village on the paved stadium apron next to the East terraced car park.',
    cam: zones.vendors.cam,
    target: zones.vendors.target,
    zoneId: 'vendors',
  },
  {
    id: 'carpark',
    title: 'Terraced Car Parks & Arrival Avenue',
    subtitle: 'South Gate Plaza & West Approach',
    description:
      'Tree-lined parking terraces, the West roundabout garden and landmark courtyard building, and the South arrival avenue.',
    cam: zones.carpark.cam,
    target: zones.carpark.target,
    zoneId: 'carpark',
  },
]

// Deterministic seat availability calculation
export function isSeatTaken(zoneId, index) {
  let h = 0
  for (const c of zoneId) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return ((index * 2654435761 + h) >>> 0) % 100 < 30
}
