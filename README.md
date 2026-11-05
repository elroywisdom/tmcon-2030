# TM CON 2030 — Interactive 3D Stadium & Conference Experience

> **Moshood Abiola National Stadium, Abuja • November 2030**  
> An interactive WebGL/Three.js 3D digital twin and architectural visualization experience built for TM CON 2030 (Technology Media Conference).

---

## Overview

TM CON 2030 is an interactive 3D stadium experience designed and engineered as a high-fidelity digital twin of Nigeria's Moshood Abiola National Stadium in Abuja. Visitors can explore the complete arena in real time, inspect camera sightlines from reserved seats, experience stadium lighting and concerts, switch between Day and Night atmospheric conditions, and tour surrounding Abuja landmarks.

Built with **Next.js 15**, **React 19**, **Three.js (r174)**, **React Three Fiber**, and **Zustand**, strictly conforming to a Neubrutalist design system.

---

## Key Features

- **Geospatially Accurate Digital Twin**: Stadium bowl, cable-stayed membrane roof, vomitories, concourses, and surrounding Abuja corridor modeled from OpenStreetMap geospatial coordinates.
- **Cinematic 18s Drone Corridor Flight**: Aerial flythrough approaching from Abuja City Gate past Aso Rock, Central Business District landmarks, and sweeping into the stadium bowl.
- **Interactive Seat Sightline Preview**: Select seats in VIP Executive, Premium, and General Admission stands to preview real-world sightlines looking directly at the Main Stage and LED walls.
- **Real-Time LED Screens**: Multi-screen video rendering across Main Stage (32:9), Left IMAG (9:16), Right IMAG (9:16), and North Scoreboard (16:10).
- **Concert & Live Show Mode**: Dynamic sweeping spotlights, laser beams, aerial particle sparkles, and real-time crowd wave simulations.
- **Dynamic Lighting & Environment**: Instant toggle between bright Day mode (sun elevation, warm terrain, atmospheric fog) and atmospheric Night mode (sky stars, streetlights, glowing windows, lit stadium apron).
- **Procedural 3D Crowd**: Instanced crowd filling both the standing pitch and seated tiers with user-controlled density cycling (`FILLED` &rarr; `MEDIUM` &rarr; `LOW` &rarr; `NO CROWD`).
- **Interactive Audio Engine**: Dual soundtrack player featuring spatial ambient stadium sound, Alan Walker, and Avicii ("Wake Me Up").
- **Strict Neubrutalist Design System**: High-contrast black ink outlines (`#121212`), cream canvas cards, hard offset shadows, vibrant `#ff6b35` accents, and platform-independent outline SVG iconography.
- **Ground Polar Angle Clamp**: Camera controls strictly prevent the viewer from orbiting below ground level.

---

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **UI Library**: [React 19](https://react.dev/)
- **3D Engine**: [Three.js r174](https://threejs.org/)
- **React 3D Integration**: [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber) & [@react-three/drei](https://github.com/pmndrs/drei)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Audio Engine**: [Howler.js](https://howlerjs.com/)
- **Styling**: Vanilla CSS with Design System Tokens & Neubrutalist styling

---

## Getting Started

### Prerequisites

- Node.js 18.18+ or 20+
- npm or yarn

### Installation

```bash
# Clone repository
git clone https://github.com/elroywisdom/tmcon-2030.git
cd tmcon-2030

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
# Build production bundle
npm run build

# Start production server
npm start
```

---

## Project Structure

```text
├── public/
│   ├── audio/              # Spatial sound effects and soundtracks
│   ├── brand/              # TM CON SVG/PNG logo brand assets
│   ├── city/               # Procedural Abuja GIS data (roads, buildings, landmarks)
│   ├── fonts/              # Typography (Bai Jamjuree)
│   └── video/              # Stage and IMAG video assets
├── src/
│   ├── app/                # Next.js App Router (layout, page, metadata)
│   ├── components/
│   │   ├── common/         # Neubrutalist SVG icon suite
│   │   └── venue/          # 3D Three.js components & UI overlays
│   │       ├── VenueExperience.jsx   # Top-level coordinator & controls
│   │       ├── VenueScene.jsx        # Three.js canvas & camera rigs
│   │       ├── Stadium.jsx           # Stadium geometry & materials
│   │       ├── InfoPanel.jsx         # Collapsible event & ticket side panel
│   │       ├── IntroFlight.jsx       # 18s cinematic corridor drone intro
│   │       ├── AbujaCity.jsx         # Surrounding city & landmarks
│   │       └── ...
│   ├── data/               # Zones, camera presets, LED playlists, schedule
│   ├── lib/                # Audio controller, stadium geometry helpers
│   └── store/              # Zustand global venue state (useVenue.js)
```

---

## License

Created for TM CON (Technology Media Global) portfolio demonstration.
All rights reserved.
