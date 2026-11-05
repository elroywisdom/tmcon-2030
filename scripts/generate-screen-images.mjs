import fs from 'fs'
import path from 'path'
import sharp from 'sharp'

const OUT_DIR = path.resolve('public/assets/screens')
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true })
}

async function createCenterWall() {
  console.log('Generating Center Wall 32:9 (3200x900)...')
  
  // Crop center keynote photo from DSC09751.jpg
  const centerPhoto = await sharp('public/assets/hero-image-slider/DSC09751.jpg')
    .resize(1100, 620, { fit: 'cover', position: 'center' })
    .jpeg({ quality: 92 })
    .toBuffer()

  const svgOverlay = Buffer.from(`
    <svg width="3200" height="900" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#0a0c10"/>
          <stop offset="25%" stop-color="#141720"/>
          <stop offset="50%" stop-color="#181b24"/>
          <stop offset="75%" stop-color="#141720"/>
          <stop offset="100%" stop-color="#0a0c10"/>
        </linearGradient>
        <linearGradient id="orangeBar" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#f26522"/>
          <stop offset="100%" stop-color="#ff8c42"/>
        </linearGradient>
        <linearGradient id="greenBar" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#00c389"/>
          <stop offset="100%" stop-color="#3ddba8"/>
        </linearGradient>
      </defs>

      <!-- Background Canvas -->
      <rect width="3200" height="900" fill="url(#bgGrad)"/>

      <!-- Subtle Stadium Grid lines -->
      <line x1="0" y1="40" x2="3200" y2="40" stroke="#222734" stroke-width="2"/>
      <line x1="0" y1="860" x2="3200" y2="860" stroke="#222734" stroke-width="2"/>

      <!-- Accent Top Strips -->
      <rect x="0" y="0" width="3200" height="8" fill="url(#orangeBar)"/>

      <!-- LEFT SECTION: Event Brand & Theme (X: 120 -> 980) -->
      <g transform="translate(140, 160)">
        <!-- Pill Badge -->
        <rect x="0" y="0" width="280" height="48" rx="24" fill="#f26522" fill-opacity="0.2" stroke="#f26522" stroke-width="2"/>
        <text x="140" y="32" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="bold" fill="#f26522" text-anchor="middle" letter-spacing="3">KEYNOTE STAGE</text>

        <!-- Main Title -->
        <text x="0" y="130" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="76" font-weight="900" fill="#ffffff" letter-spacing="-1">TM CON 2026</text>
        <text x="0" y="195" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="34" font-weight="700" fill="#00c389" letter-spacing="4">THE NEXT WAVE</text>

        <!-- Subheading & Description -->
        <text x="0" y="270" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="500" fill="#cbd5e1" letter-spacing="1">AFRICA'S MEDIA &amp; TECH FESTIVAL</text>
        <text x="0" y="315" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="400" fill="#94a3b8">Moshood Abiola National Stadium • Abuja, Nigeria</text>

        <!-- Divider line -->
        <line x1="0" y1="365" x2="800" y2="365" stroke="#2e3546" stroke-width="2"/>

        <!-- Key Metrics -->
        <text x="0" y="420" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="600" fill="#94a3b8" letter-spacing="2">VENUE ATTENDANCE</text>
        <text x="0" y="475" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="44" font-weight="900" fill="#ffffff">44,500 <tspan font-size="22" font-weight="500" fill="#00c389">DELEGATES</tspan></text>

        <text x="360" y="420" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="600" fill="#94a3b8" letter-spacing="2">STAGE SIGHTLINE</text>
        <text x="360" y="475" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="44" font-weight="900" fill="#ffffff">360° <tspan font-size="22" font-weight="500" fill="#f26522">PANORAMIC</tspan></text>
      </g>

      <!-- CENTER FRAME (Photo Frame X: 1050, Y: 140, W: 1100, H: 620) -->
      <rect x="1046" y="136" width="1108" height="628" rx="16" fill="none" stroke="#2a3040" stroke-width="4"/>
      <rect x="1042" y="132" width="1116" height="636" rx="20" fill="none" stroke="#f26522" stroke-opacity="0.35" stroke-width="2"/>

      <!-- Center Frame Label -->
      <rect x="1470" y="112" width="260" height="40" rx="20" fill="#141720" stroke="#f26522" stroke-width="2"/>
      <circle cx="1500" cy="132" r="6" fill="#f26522"/>
      <text x="1605" y="138" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="bold" fill="#ffffff" text-anchor="middle" letter-spacing="2">OFFICIAL REEL</text>

      <!-- RIGHT SECTION: Agenda & Speaker Showcase (X: 2260 -> 3060) -->
      <g transform="translate(2260, 160)">
        <!-- Pill Badge -->
        <rect x="0" y="0" width="280" height="48" rx="24" fill="#00c389" fill-opacity="0.2" stroke="#00c389" stroke-width="2"/>
        <text x="140" y="32" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="bold" fill="#00c389" text-anchor="middle" letter-spacing="3">MAIN SESSIONS</text>

        <!-- Session List -->
        <g transform="translate(0, 110)">
          <rect x="0" y="0" width="780" height="96" rx="12" fill="#181c26" stroke="#2a3040" stroke-width="1.5"/>
          <text x="30" y="42" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="bold" fill="#f26522" letter-spacing="2">10:00 - 11:30 WAT</text>
          <text x="30" y="74" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="700" fill="#ffffff">Opening Keynote: Africa's Media-Tech Renaissance</text>
        </g>

        <g transform="translate(0, 230)">
          <rect x="0" y="0" width="780" height="96" rx="12" fill="#181c26" stroke="#2a3040" stroke-width="1.5"/>
          <text x="30" y="42" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="bold" fill="#00c389" letter-spacing="2">13:30 - 15:00 WAT</text>
          <text x="30" y="74" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="700" fill="#ffffff">Panel: Creative Infrastructure &amp; Digital Rights</text>
        </g>

        <g transform="translate(0, 350)">
          <rect x="0" y="0" width="780" height="96" rx="12" fill="#181c26" stroke="#2a3040" stroke-width="1.5"/>
          <text x="30" y="42" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="bold" fill="#b197fc" letter-spacing="2">17:30 - 20:30 WAT</text>
          <text x="30" y="74" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="700" fill="#ffffff">Grand Finale: Live Audiovisual Concert &amp; Awards</text>
        </g>

        <!-- Sponsor/Partner Footer -->
        <text x="0" y="505" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="600" fill="#64748b" letter-spacing="2">POWERED BY TM GLOBAL • NBC • MARKETING + MEDIA</text>
      </g>
    </svg>
  `)

  await sharp({
    create: {
      width: 3200,
      height: 900,
      channels: 4,
      background: { r: 10, g: 12, b: 16, alpha: 1 },
    },
  })
    .composite([
      { input: svgOverlay, top: 0, left: 0 },
      { input: centerPhoto, top: 140, left: 1050 },
    ])
    .jpeg({ quality: 92 })
    .toFile(path.join(OUT_DIR, 'center-wall-32x9.jpg'))

  console.log('Saved center-wall-32x9.jpg')
}

async function createLeftImagWing() {
  console.log('Generating Left IMAG Wing 9:16 (1080x1920)...')

  // DEE_5414.jpg is 2397x1600. Crop the speaker at center-left to 1080x1920
  const speakerPhoto = await sharp('public/assets/hero-image-slider/DEE_5414.jpg')
    .resize(1080, 1920, { fit: 'cover', position: 'center' })
    .jpeg({ quality: 94 })
    .toBuffer()

  const overlaySvg = Buffer.from(`
    <svg width="1080" height="1920" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="topShadow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#000000" stop-opacity="0.85"/>
          <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
        </linearGradient>
        <linearGradient id="bottomShadow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#000000" stop-opacity="0"/>
          <stop offset="60%" stop-color="#000000" stop-opacity="0.75"/>
          <stop offset="100%" stop-color="#000000" stop-opacity="0.95"/>
        </linearGradient>
        <linearGradient id="badgeGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#f26522"/>
          <stop offset="100%" stop-color="#ff8c42"/>
        </linearGradient>
      </defs>

      <!-- Top Vignette -->
      <rect x="0" y="0" width="1080" height="320" fill="url(#topShadow)"/>

      <!-- Bottom Broadcast Gradient -->
      <rect x="0" y="1300" width="1080" height="620" fill="url(#bottomShadow)"/>

      <!-- TOP BROADCAST HEADER -->
      <g transform="translate(60, 60)">
        <!-- Live Indicator Pill -->
        <rect x="0" y="0" width="220" height="54" rx="27" fill="#000000" fill-opacity="0.65" stroke="#f26522" stroke-width="2"/>
        <circle cx="36" cy="27" r="9" fill="#ef4444"/>
        <text x="125" y="35" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="bold" fill="#ffffff" text-anchor="middle" letter-spacing="2">LIVE FEED</text>

        <!-- Cam Angle Tag -->
        <rect x="240" y="0" width="260" height="54" rx="27" fill="#000000" fill-opacity="0.65" stroke="#334155" stroke-width="1.5"/>
        <text x="370" y="35" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="600" fill="#cbd5e1" text-anchor="middle" letter-spacing="1">STAGE CAM 1 [LEFT]</text>
      </g>

      <!-- TM CON Logo Watermark Top Right -->
      <g transform="translate(820, 60)">
        <text x="190" y="40" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="900" fill="#ffffff" text-anchor="end" letter-spacing="2">TM CON</text>
        <text x="190" y="68" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="700" fill="#f26522" text-anchor="end" letter-spacing="4">2026</text>
      </g>

      <!-- LOWER THIRD BROADCAST CARD -->
      <g transform="translate(60, 1580)">
        <!-- Glassmorphism Card -->
        <rect x="0" y="0" width="960" height="240" rx="20" fill="#0b0e14" fill-opacity="0.88" stroke="#222a3a" stroke-width="2"/>
        <!-- Orange Left Accent Strip -->
        <rect x="0" y="0" width="16" height="240" rx="8" fill="url(#badgeGrad)"/>

        <!-- Speaker Name & Title -->
        <g transform="translate(50, 60)">
          <text x="0" y="0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="48" font-weight="900" fill="#ffffff" letter-spacing="-0.5">CHRIS ODEH</text>
          <text x="0" y="46" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="700" fill="#f26522" letter-spacing="1">KEYNOTE SPEAKER • MEDIA &amp; CREATIVE PRODUCER</text>
          <text x="0" y="90" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="500" fill="#94a3b8" letter-spacing="1">SESSION: AFRICA'S CREATIVE INFRASTRUCTURE</text>
        </g>

        <!-- Audio VU Meter Bars -->
        <g transform="translate(820, 70)">
          <rect x="0" y="30" width="10" height="40" rx="3" fill="#00c389"/>
          <rect x="18" y="15" width="10" height="55" rx="3" fill="#00c389"/>
          <rect x="36" y="5" width="10" height="65" rx="3" fill="#00c389"/>
          <rect x="54" y="22" width="10" height="48" rx="3" fill="#f26522"/>
          <rect x="72" y="38" width="10" height="32" rx="3" fill="#f26522"/>
        </g>
      </g>
    </svg>
  `)

  await sharp(speakerPhoto)
    .composite([{ input: overlaySvg, top: 0, left: 0 }])
    .jpeg({ quality: 94 })
    .toFile(path.join(OUT_DIR, 'imag-left-9x16.jpg'))

  console.log('Saved imag-left-9x16.jpg')
}

async function createRightImagWing() {
  console.log('Generating Right IMAG Wing 9:16 (1080x1920)...')

  // Q97A3613.jpg has the speaker at the podium under chandeliers with TM CON logo
  const speakerPhoto = await sharp('public/assets/hero-image-slider/Q97A3613.jpg')
    .resize(1080, 1920, { fit: 'cover', position: 'center' })
    .jpeg({ quality: 94 })
    .toBuffer()

  const overlaySvg = Buffer.from(`
    <svg width="1080" height="1920" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="topShadowR" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#000000" stop-opacity="0.85"/>
          <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
        </linearGradient>
        <linearGradient id="bottomShadowR" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#000000" stop-opacity="0"/>
          <stop offset="60%" stop-color="#000000" stop-opacity="0.75"/>
          <stop offset="100%" stop-color="#000000" stop-opacity="0.95"/>
        </linearGradient>
        <linearGradient id="greenGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#00c389"/>
          <stop offset="100%" stop-color="#3ddba8"/>
        </linearGradient>
      </defs>

      <!-- Top Vignette -->
      <rect x="0" y="0" width="1080" height="320" fill="url(#topShadowR)"/>

      <!-- Bottom Broadcast Gradient -->
      <rect x="0" y="1300" width="1080" height="620" fill="url(#bottomShadowR)"/>

      <!-- TOP BROADCAST HEADER -->
      <g transform="translate(60, 60)">
        <rect x="0" y="0" width="220" height="54" rx="27" fill="#000000" fill-opacity="0.65" stroke="#00c389" stroke-width="2"/>
        <circle cx="36" cy="27" r="9" fill="#ef4444"/>
        <text x="125" y="35" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="bold" fill="#ffffff" text-anchor="middle" letter-spacing="2">LIVE FEED</text>

        <rect x="240" y="0" width="280" height="54" rx="27" fill="#000000" fill-opacity="0.65" stroke="#334155" stroke-width="1.5"/>
        <text x="380" y="35" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="600" fill="#cbd5e1" text-anchor="middle" letter-spacing="1">STAGE CAM 2 [PODIUM]</text>
      </g>

      <!-- TM CON Logo Watermark Top Right -->
      <g transform="translate(820, 60)">
        <text x="190" y="40" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="900" fill="#ffffff" text-anchor="end" letter-spacing="2">TM CON</text>
        <text x="190" y="68" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="700" fill="#00c389" text-anchor="end" letter-spacing="4">2026</text>
      </g>

      <!-- LOWER THIRD BROADCAST CARD -->
      <g transform="translate(60, 1580)">
        <rect x="0" y="0" width="960" height="240" rx="20" fill="#0b0e14" fill-opacity="0.88" stroke="#222a3a" stroke-width="2"/>
        <rect x="0" y="0" width="16" height="240" rx="8" fill="url(#greenGrad)"/>

        <g transform="translate(50, 60)">
          <text x="0" y="0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="48" font-weight="900" fill="#ffffff" letter-spacing="-0.5">BIZZLE OSIKOYA</text>
          <text x="0" y="46" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="700" fill="#00c389" letter-spacing="1">CO-FOUNDER, THE PLUG • MUSIC &amp; TECH EXECUTIVE</text>
          <text x="0" y="90" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="500" fill="#94a3b8" letter-spacing="1">TOPIC: BUILDING GLOBAL AUDIENCES</text>
        </g>

        <g transform="translate(820, 70)">
          <rect x="0" y="20" width="10" height="50" rx="3" fill="#00c389"/>
          <rect x="18" y="8" width="10" height="62" rx="3" fill="#00c389"/>
          <rect x="36" y="16" width="10" height="54" rx="3" fill="#00c389"/>
          <rect x="54" y="30" width="10" height="40" rx="3" fill="#f26522"/>
          <rect x="72" y="44" width="10" height="26" rx="3" fill="#f26522"/>
        </g>
      </g>
    </svg>
  `)

  await sharp(speakerPhoto)
    .composite([{ input: overlaySvg, top: 0, left: 0 }])
    .jpeg({ quality: 94 })
    .toFile(path.join(OUT_DIR, 'imag-right-9x16.jpg'))

  console.log('Saved imag-right-9x16.jpg')
}

async function createScoreboardScreen() {
  console.log('Generating Scoreboard Screen 16:10 (1600x1000)...')

  // Center photo from DSC09957.jpg showing all 5 panel speakers on stage
  const panelPhoto = await sharp('public/assets/hero-image-slider/DSC09957.jpg')
    .resize(920, 560, { fit: 'cover', position: 'center' })
    .jpeg({ quality: 92 })
    .toBuffer()

  const overlaySvg = Buffer.from(`
    <svg width="1600" height="1000" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sbBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#0b0e14"/>
          <stop offset="100%" stop-color="#141822"/>
        </linearGradient>
        <linearGradient id="sbHeader" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#f26522"/>
          <stop offset="50%" stop-color="#00c389"/>
          <stop offset="100%" stop-color="#f26522"/>
        </linearGradient>
      </defs>

      <!-- Background -->
      <rect width="1600" height="1000" fill="url(#sbBg)"/>
      <rect x="0" y="0" width="1600" height="8" fill="url(#sbHeader)"/>

      <!-- TOP STADIUM HEADER -->
      <g transform="translate(60, 50)">
        <text x="0" y="24" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="700" fill="#f26522" letter-spacing="3">MOSHOOD ABIOLA NATIONAL STADIUM • ABUJA</text>
        <text x="0" y="72" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="42" font-weight="900" fill="#ffffff" letter-spacing="-0.5">TM CON 2026 — OFFICIAL SCOREBOARD</text>
      </g>

      <g transform="translate(1320, 60)">
        <rect x="0" y="0" width="220" height="50" rx="25" fill="#f26522" fill-opacity="0.2" stroke="#f26522" stroke-width="2"/>
        <circle cx="28" cy="25" r="7" fill="#ef4444"/>
        <text x="125" y="32" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="bold" fill="#ffffff" text-anchor="middle" letter-spacing="2">SESSION LIVE</text>
      </g>

      <line x1="60" y1="140" x2="1540" y2="140" stroke="#222736" stroke-width="2"/>

      <!-- LEFT PHOTO BORDER (X: 60, Y: 180, W: 920, H: 560) -->
      <rect x="56" y="176" width="928" height="568" rx="14" fill="none" stroke="#2a3245" stroke-width="3"/>
      <rect x="52" y="172" width="936" height="576" rx="18" fill="none" stroke="#f26522" stroke-opacity="0.3" stroke-width="1.5"/>

      <!-- RIGHT TELEMETRY PANELS (X: 1020, Y: 180) -->
      <g transform="translate(1020, 180)">
        <!-- Card 1: Attendance -->
        <rect x="0" y="0" width="520" height="125" rx="12" fill="#151922" stroke="#283040" stroke-width="1.5"/>
        <text x="24" y="34" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="bold" fill="#94a3b8" letter-spacing="2">VENUE ATTENDANCE</text>
        <text x="24" y="85" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="42" font-weight="900" fill="#00c389">44,500 <tspan font-size="20" font-weight="600" fill="#cbd5e1">/ 60,000</tspan></text>
        <text x="24" y="110" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="600" fill="#f26522">PITCH &amp; BOWL FILLED TO CAPACITY</text>

        <!-- Card 2: Breakdown -->
        <rect x="0" y="145" width="520" height="125" rx="12" fill="#151922" stroke="#283040" stroke-width="1.5"/>
        <text x="24" y="179" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="bold" fill="#94a3b8" letter-spacing="2">ZONE BREAKDOWN</text>
        <text x="24" y="222" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="800" fill="#ffffff">Floor Pitch: <tspan fill="#f26522">13,150</tspan> | Bowl: <tspan fill="#00c389">31,350</tspan></text>
        <text x="24" y="252" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="500" fill="#94a3b8">Interactive VIP &amp; Premium: Sold Out</text>

        <!-- Card 3: Next Event -->
        <rect x="0" y="290" width="520" height="125" rx="12" fill="#151922" stroke="#283040" stroke-width="1.5"/>
        <text x="24" y="324" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="bold" fill="#f26522" letter-spacing="2">NEXT ON MAIN STAGE</text>
        <text x="24" y="365" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="800" fill="#ffffff">Live Audiovisual Showcase</text>
        <text x="24" y="398" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="600" fill="#00c389">17:30 WAT • 8 Spotlights &amp; Lasers</text>

        <!-- Card 4: Audio Status -->
        <rect x="0" y="435" width="520" height="125" rx="12" fill="#151922" stroke="#283040" stroke-width="1.5"/>
        <text x="24" y="469" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="bold" fill="#94a3b8" letter-spacing="2">AUDIO BROADCAST</text>
        <text x="24" y="510" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="800" fill="#ffffff">Afrobeats • Live Stadium Feed</text>
        <text x="24" y="542" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="600" fill="#b197fc">Dolby Atmos Surround Active</text>
      </g>

      <!-- BOTTOM TICKER TAPE -->
      <g transform="translate(60, 800)">
        <rect x="0" y="0" width="1480" height="130" rx="14" fill="#0f121a" stroke="#222a3a" stroke-width="2"/>
        <rect x="0" y="0" width="8" height="130" rx="4" fill="#00c389"/>

        <g transform="translate(40, 45)">
          <text x="0" y="0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="bold" fill="#f26522" letter-spacing="2">OFFICIAL SPONSORS &amp; PARTNERS</text>
          <text x="0" y="40" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="800" fill="#ffffff" letter-spacing="3">TM GLOBAL • NBC NIGERIA • MARKETING + MEDIA • DIGITAL NATIVE AFRICA • INGENE</text>
        </g>
      </g>
    </svg>
  `)

  await sharp({
    create: {
      width: 1600,
      height: 1000,
      channels: 4,
      background: { r: 11, g: 14, b: 20, alpha: 1 },
    },
  })
    .composite([
      { input: overlaySvg, top: 0, left: 0 },
      { input: panelPhoto, top: 180, left: 60 },
    ])
    .jpeg({ quality: 92 })
    .toFile(path.join(OUT_DIR, 'scoreboard-16x10.jpg'))

  console.log('Saved scoreboard-16x10.jpg')
}

async function createCenterWallLive() {
  console.log('Generating Center Wall Live Show 32:9 (3200x900)...')

  const centerPhoto = await sharp('public/assets/hero-image-slider/DSC09957.jpg')
    .resize(1100, 620, { fit: 'cover', position: 'center' })
    .jpeg({ quality: 92 })
    .toBuffer()

  const svgOverlay = Buffer.from(`
    <svg width="3200" height="900" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="liveBg" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#05070a"/>
          <stop offset="30%" stop-color="#100f1c"/>
          <stop offset="50%" stop-color="#1a1226"/>
          <stop offset="70%" stop-color="#100f1c"/>
          <stop offset="100%" stop-color="#05070a"/>
        </linearGradient>
        <linearGradient id="neonOrange" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#f26522"/>
          <stop offset="50%" stop-color="#ff007f"/>
          <stop offset="100%" stop-color="#00c389"/>
        </linearGradient>
      </defs>

      <rect width="3200" height="900" fill="url(#liveBg)"/>
      <rect x="0" y="0" width="3200" height="10" fill="url(#neonOrange)"/>

      <!-- LEFT SECTION: Concert Title -->
      <g transform="translate(140, 180)">
        <rect x="0" y="0" width="260" height="48" rx="24" fill="#ff007f" fill-opacity="0.25" stroke="#ff007f" stroke-width="2"/>
        <text x="130" y="32" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="bold" fill="#ff007f" text-anchor="middle" letter-spacing="3">CONCERT ARENA</text>

        <text x="0" y="130" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="76" font-weight="900" fill="#ffffff" letter-spacing="-1">LIVE CONCERT</text>
        <text x="0" y="195" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="36" font-weight="800" fill="#f26522" letter-spacing="4">TM CON 2026 FINALE</text>

        <text x="0" y="270" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="600" fill="#b197fc" letter-spacing="1">AUDIOVISUAL SHOWCASE • LASERS &amp; SPOTLIGHTS</text>
        <text x="0" y="315" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="400" fill="#94a3b8">Moshood Abiola National Stadium • 44,500 Fans Cheering</text>

        <!-- Spectrum Visualizer graphic -->
        <g transform="translate(0, 380)">
          <rect x="0" y="40" width="14" height="60" rx="4" fill="#f26522"/>
          <rect x="24" y="20" width="14" height="80" rx="4" fill="#f26522"/>
          <rect x="48" y="5" width="14" height="95" rx="4" fill="#ff007f"/>
          <rect x="72" y="30" width="14" height="70" rx="4" fill="#ff007f"/>
          <rect x="96" y="10" width="14" height="90" rx="4" fill="#00c389"/>
          <rect x="120" y="25" width="14" height="75" rx="4" fill="#00c389"/>
          <rect x="144" y="45" width="14" height="55" rx="4" fill="#00c389"/>
          <rect x="168" y="15" width="14" height="85" rx="4" fill="#b197fc"/>
          <rect x="192" y="35" width="14" height="65" rx="4" fill="#b197fc"/>
          <text x="240" y="65" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="700" fill="#ffffff" letter-spacing="2">SURROUND SOUND ACTIVE</text>
        </g>
      </g>

      <!-- CENTER FRAME -->
      <rect x="1046" y="136" width="1108" height="628" rx="16" fill="none" stroke="#3d254c" stroke-width="4"/>
      <rect x="1042" y="132" width="1116" height="636" rx="20" fill="none" stroke="#ff007f" stroke-opacity="0.45" stroke-width="2"/>

      <rect x="1470" y="112" width="260" height="40" rx="20" fill="#140f20" stroke="#ff007f" stroke-width="2"/>
      <circle cx="1500" cy="132" r="6" fill="#ff007f"/>
      <text x="1605" y="138" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="bold" fill="#ffffff" text-anchor="middle" letter-spacing="2">LIVE ON STAGE</text>

      <!-- RIGHT SECTION: Performance Lineup -->
      <g transform="translate(2260, 180)">
        <rect x="0" y="0" width="280" height="48" rx="24" fill="#00c389" fill-opacity="0.25" stroke="#00c389" stroke-width="2"/>
        <text x="140" y="32" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="bold" fill="#00c389" text-anchor="middle" letter-spacing="3">LINEUP NOW</text>

        <g transform="translate(0, 100)">
          <rect x="0" y="0" width="780" height="105" rx="14" fill="#171224" stroke="#352449" stroke-width="1.5"/>
          <text x="32" y="44" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="bold" fill="#ff007f" letter-spacing="2">NOW PLAYING</text>
          <text x="32" y="80" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="26" font-weight="800" fill="#ffffff">Afrobeats Audiovisual Symphony</text>
        </g>

        <g transform="translate(0, 230)">
          <rect x="0" y="0" width="780" height="105" rx="14" fill="#171224" stroke="#352449" stroke-width="1.5"/>
          <text x="32" y="44" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="bold" fill="#00c389" letter-spacing="2">NEXT TRACK</text>
          <text x="32" y="80" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="26" font-weight="800" fill="#ffffff">The Next Wave Live Producer Set</text>
        </g>

        <g transform="translate(0, 360)">
          <rect x="0" y="0" width="780" height="105" rx="14" fill="#171224" stroke="#352449" stroke-width="1.5"/>
          <text x="32" y="44" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="bold" fill="#f26522" letter-spacing="2">AWARDS CEREMONY</text>
          <text x="32" y="80" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="26" font-weight="800" fill="#ffffff">African Tech &amp; Media Innovation Winners</text>
        </g>
      </g>
    </svg>
  `)

  await sharp({
    create: {
      width: 3200,
      height: 900,
      channels: 4,
      background: { r: 5, g: 7, b: 10, alpha: 1 },
    },
  })
    .composite([
      { input: svgOverlay, top: 0, left: 0 },
      { input: centerPhoto, top: 140, left: 1050 },
    ])
    .jpeg({ quality: 92 })
    .toFile(path.join(OUT_DIR, 'center-wall-live-32x9.jpg'))

  console.log('Saved center-wall-live-32x9.jpg')
}

async function run() {
  await createCenterWall()
  await createCenterWallLive()
  await createLeftImagWing()
  await createRightImagWing()
  await createScoreboardScreen()
  console.log('All tailored screen images generated successfully!')
}

run().catch(console.error)
