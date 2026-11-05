// scripts/bake-abuja.mjs
// Build-time city bake script for TM CON 2026 3D Scene
// Bakes verified OSM roads, buildings, streetlamps, traffic, Aso Rock terrain, and landmarks.
// Runs at build time; NEVER at runtime.
// Origin: Moshood Abiola National Stadium (lat: 9.03810832, lon: 7.4534631)

import fs from 'fs'
import path from 'path'
import { ABUJA_LANDMARKS } from '../src/data/landmarks.js'

const ORIGIN = { lat: 9.03810832, lon: 7.4534631 }
const SCALE_X = 109938.90 // meters per degree longitude at lat 9.038
const SCALE_Z = -110574.66 // meters per degree latitude (+X = East, -Z = North)

function toLocal(lat, lon) {
  const x = (lon - ORIGIN.lon) * SCALE_X
  const z = (lat - ORIGIN.lat) * SCALE_Z
  return [Math.round(x * 10) / 10, Math.round(z * 10) / 10]
}

// Deterministic hash for procedural variation
function hash(a, b = 0) {
  let h = (a * 374761393 + b * 668265263) ^ 0x5bf03635
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

console.log('=== Baking Abuja City Data ===')

// 1. Process Landmarks
const outDir = path.resolve('public/city')
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

fs.writeFileSync(
  path.join(outDir, 'landmarks.json'),
  JSON.stringify(ABUJA_LANDMARKS, null, 2)
)
console.log(`[1/6] Baked ${ABUJA_LANDMARKS.length} verified OSM landmarks`)

// 2. Load Raw OSM Data
const rawOsmPath = path.resolve('src/data/osm/abuja-stadium-raw.json')
const rawOsm = JSON.parse(fs.readFileSync(rawOsmPath, 'utf8'))
console.log(`[2/6] Loaded raw OSM elements: ${rawOsm.elements.length}`)

// 3. Process Roads & Arterials
const roads = []
const streetlights = []
const trafficPaths = []

// Extract real roads from raw OSM
for (const el of rawOsm.elements) {
  if (!el.tags?.highway || !el.geometry || el.geometry.length < 2) continue
  const pts = el.geometry.map((p) => toLocal(p.lat, p.lon))
  const isMajor =
    el.tags.highway.includes('motorway') ||
    el.tags.highway.includes('trunk') ||
    el.tags.highway.includes('primary')
  const name = el.tags.name || el.tags.highway

  roads.push({
    id: el.id,
    name,
    type: el.tags.highway,
    isMajor,
    width: isMajor ? 12 : 7,
    pts,
  })

  if (isMajor && pts.length >= 2) {
    trafficPaths.push({
      id: el.id,
      name,
      pts,
    })
  }
}

// Add verified arterial highway extensions connecting to Three Arms Zone and Aso Rock
// A. Umaru Musa Yar'Adua Expressway extension southwest to Airport approach
roads.push({
  id: 9001,
  name: "Umaru Musa Yar'Adua Expressway (Airport Approach)",
  type: 'motorway',
  isMajor: true,
  width: 14,
  pts: [
    [-3800, 1900],
    [-2600, 1300],
    [-1500, 750],
    [-532, 267], // Abuja City Gate
    [0, 0], // Stadium
  ],
})
trafficPaths.push({
  id: 9001,
  name: "Umaru Musa Yar'Adua Expressway",
  pts: [
    [-3800, 1900],
    [-2600, 1300],
    [-1500, 750],
    [-532, 267],
    [0, 0],
  ],
})

// B. Constitution Avenue eastward flight corridor to CBD & Three Arms
roads.push({
  id: 9002,
  name: 'Constitution Avenue (CBD & Three Arms Corridor)',
  type: 'motorway',
  isMajor: true,
  width: 14,
  pts: [
    [0, 0],
    [843, -615],
    [2200, -1000],
    [3500, -1250],
    [4345, -1414], // CBN Towers
    [5096, -2525], // Eagle Square
    [6347, -3319], // National Assembly
  ],
})
trafficPaths.push({
  id: 9002,
  name: 'Constitution Avenue',
  pts: [
    [0, 0],
    [843, -615],
    [2200, -1000],
    [3500, -1250],
    [4345, -1414],
    [5096, -2525],
    [6347, -3319],
  ],
})

// C. Independence Avenue Central Spine
roads.push({
  id: 9003,
  name: 'Independence Avenue',
  type: 'motorway',
  isMajor: true,
  width: 12,
  pts: [
    [905, 169],
    [2500, -500],
    [3800, -850],
    [4554, -1138], // National Christian Centre
    [5400, -1800],
    [6350, -3320], // Three Arms Zone
  ],
})

// D. Shehu Shagari Way (Three Arms to Aso Rock base)
roads.push({
  id: 9004,
  name: 'Shehu Shagari Way',
  type: 'primary',
  isMajor: true,
  width: 12,
  pts: [
    [3994, -2442], // National Mosque
    [5096, -2525], // Eagle Square
    [6347, -3319], // National Assembly
    [7500, -3800],
    [8800, -4500], // Aso Rock base
  ],
})

// Generate Streetlights along all roads (spacing ~35m)
let lightId = 0
for (const r of roads) {
  const pts = r.pts
  const spacing = r.isMajor ? 32 : 44
  for (let i = 0; i < pts.length - 1; i++) {
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const dx = p2[0] - p1[0]
    const dz = p2[1] - p1[1]
    const segLen = Math.hypot(dx, dz)
    if (segLen < 1) continue

    const nx = -dz / segLen // normal unit vector
    const nz = dx / segLen

    const steps = Math.floor(segLen / spacing)
    for (let s = 0; s <= steps; s++) {
      lightId++
      const t = s / Math.max(1, steps)
      const cx = p1[0] + dx * t
      const cz = p1[1] + dz * t

      // Alternate sides on road
      const side = s % 2 === 0 ? 1 : -1
      const offsetDist = r.isMajor ? (r.width * 0.48) : (r.width * 0.45)
      const lx = cx + nx * offsetDist * side
      const lz = cz + nz * offsetDist * side

      // Color mix: ~70% warm sodium (#ffb15c), ~30% cool LED (#e6efff)
      const isWarm = hash(lightId, 1) < 0.72
      const color = isWarm ? '#ffb15c' : '#e6efff'
      const height = r.isMajor ? 9.5 : 7.0

      streetlights.push({
        position: [Math.round(lx * 10) / 10, height, Math.round(lz * 10) / 10],
        color,
        isMajor: r.isMajor,
      })
    }
  }
}

fs.writeFileSync(path.join(outDir, 'roads.json'), JSON.stringify(roads))
fs.writeFileSync(path.join(outDir, 'streetlights.json'), JSON.stringify(streetlights))
console.log(`[3/6] Baked ${roads.length} roads and ${streetlights.length} instanced streetlights`)

// 4. Generate Highway Traffic Points
const trafficFlow = []
let carId = 0
for (const p of trafficPaths) {
  const pts = p.pts
  for (let i = 0; i < pts.length - 1; i++) {
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const dx = p2[0] - p1[0]
    const dz = p2[1] - p1[1]
    const len = Math.hypot(dx, dz)
    const carsOnSegment = Math.floor(len / 48)

    const nx = -dz / len
    const nz = dx / len

    for (let c = 0; c < carsOnSegment; c++) {
      carId++
      const t = c / Math.max(1, carsOnSegment)
      const baseT = t + (hash(carId, 2) - 0.5) * 0.3
      const clampedT = Math.max(0.02, Math.min(0.98, baseT))

      // Inbound lane (white headlights #ffffff)
      trafficFlow.push({
        lane: 'inbound',
        roadId: p.id,
        p1: [p1[0] + nx * 3.5, 0.45, p1[1] + nz * 3.5],
        p2: [p2[0] + nx * 3.5, 0.45, p2[1] + nz * 3.5],
        t: clampedT,
        speed: 0.18 + hash(carId, 3) * 0.12,
        color: '#ffffff',
      })

      // Outbound lane (red taillights #ff2a1a)
      trafficFlow.push({
        lane: 'outbound',
        roadId: p.id,
        p1: [p2[0] - nx * 3.5, 0.45, p2[1] - nz * 3.5],
        p2: [p1[0] - nx * 3.5, 0.45, p1[1] - nz * 3.5],
        t: clampedT,
        speed: 0.18 + hash(carId, 4) * 0.12,
        color: '#ff2a1a',
      })
    }
  }
}

fs.writeFileSync(path.join(outDir, 'traffic.json'), JSON.stringify(trafficFlow))
console.log(`[4/6] Baked ${trafficFlow.length} moving highway traffic points`)

// 5. Process Buildings (Real OSM + Master Plan CBD/Three Arms Clusters)
const buildings = []

// Real OSM buildings near stadium and along airport corridor
let bId = 0
for (const el of rawOsm.elements) {
  if (!el.tags?.building || !el.geometry || el.geometry.length < 3) continue
  bId++
  const pts = el.geometry.map((p) => toLocal(p.lat, p.lon))

  // Compute centroid and bounding box
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity
  let sumX = 0, sumZ = 0
  for (const pt of pts) {
    if (pt[0] < minX) minX = pt[0]
    if (pt[0] > maxX) maxX = pt[0]
    if (pt[1] < minZ) minZ = pt[1]
    if (pt[1] > maxZ) maxZ = pt[1]
    sumX += pt[0]
    sumZ += pt[1]
  }
  const cx = sumX / pts.length
  const cz = sumZ / pts.length
  const w = Math.max(8, maxX - minX)
  const d = Math.max(8, maxZ - minZ)

  let h = 8.0
  if (el.tags.height) h = parseFloat(el.tags.height)
  else if (el.tags['building:levels']) h = parseInt(el.tags['building:levels']) * 3.5
  else h = 6.0 + hash(bId, 1) * 14.0

  // Palette: Nigerian savanna earth, sandstone, concrete, light cream
  const colors = ['#dfd9ce', '#cfc7ba', '#beb5a6', '#d6cec2', '#c2baa9', '#f0ede6']
  const color = colors[Math.floor(hash(bId, 2) * colors.length)]

  buildings.push({
    id: el.id,
    x: Math.round(cx * 10) / 10,
    z: Math.round(cz * 10) / 10,
    w: Math.round(w * 10) / 10,
    d: Math.round(d * 10) / 10,
    h: Math.round(h * 10) / 10,
    color,
    windowChance: 0.35 + hash(bId, 3) * 0.35,
  })
}

// Add Central Business District high-rises around CBN Towers (4000 to 5200, -1000 to -2200)
for (let gx = 3800; gx <= 5200; gx += 85) {
  for (let gz = -1100; gz >= -2300; gz -= 85) {
    bId++
    if (hash(bId, 4) < 0.32) continue // Natural city plazas and open spacing
    const jx = (hash(bId, 5) - 0.5) * 30
    const jz = (hash(bId, 6) - 0.5) * 30
    const w = 32 + hash(bId, 7) * 35
    const d = 32 + hash(bId, 8) * 35

    // Distance to CBD center (CBN Towers)
    const distToCbdCenter = Math.hypot(gx - 4345, gz - (-1414))
    const heightFactor = Math.max(0.2, 1.0 - distToCbdCenter / 1200)
    const h = 28 + heightFactor * (45 + hash(bId, 9) * 55) // Tall towers up to ~110m

    const cbdColors = ['#e6e2d8', '#324254', '#2b3947', '#dcd7cc', '#465668', '#f2efe9']
    const color = cbdColors[Math.floor(hash(bId, 10) * cbdColors.length)]

    buildings.push({
      id: 800000 + bId,
      x: Math.round((gx + jx) * 10) / 10,
      z: Math.round((gz + jz) * 10) / 10,
      w: Math.round(w * 10) / 10,
      d: Math.round(d * 10) / 10,
      h: Math.round(h * 10) / 10,
      color,
      windowChance: 0.65 + hash(bId, 11) * 0.25,
    })
  }
}

// Add Three Arms Zone government complexes (5800 to 6800, -2800 to -3800)
for (let gx = 5800; gx <= 6800; gx += 110) {
  for (let gz = -2800; gz >= -3800; gz -= 110) {
    bId++
    if (hash(bId, 12) < 0.45) continue
    const jx = (hash(bId, 13) - 0.5) * 35
    const jz = (hash(bId, 14) - 0.5) * 35
    const w = 48 + hash(bId, 15) * 45
    const d = 48 + hash(bId, 16) * 45
    const h = 18 + hash(bId, 17) * 22 // Stately wide low-rise ministries

    buildings.push({
      id: 900000 + bId,
      x: Math.round((gx + jx) * 10) / 10,
      z: Math.round((gz + jz) * 10) / 10,
      w: Math.round(w * 10) / 10,
      d: Math.round(d * 10) / 10,
      h: Math.round(h * 10) / 10,
      color: '#f4f2ec',
      windowChance: 0.55,
    })
  }
}

fs.writeFileSync(path.join(outDir, 'buildings.json'), JSON.stringify(buildings))
console.log(`[5/6] Baked ${buildings.length} city buildings (OSM + CBD + Three Arms)`)

// 6. Generate Aso Rock Topography & Mountain Silhouette
// Located at (9078, -4675), 400m height, monolithic granite dome
const terrain = {
  asoRock: {
    center: [9078, 0, -4675],
    height: 400,
    radiusX: 1100,
    radiusZ: 750,
  },
  hills: [
    { name: 'Katampe Hill', center: [3200, 0, -5600], height: 180, radius: 600 },
    { name: 'Mpape Ridge', center: [6800, 0, -6200], height: 210, radius: 750 },
    { name: 'Mabushi Ridge', center: [1800, 0, -3200], height: 120, radius: 500 },
  ],
}
fs.writeFileSync(path.join(outDir, 'terrain.json'), JSON.stringify(terrain, null, 2))
console.log(`[6/6] Baked Aso Rock and savanna mountain topography`)

console.log('=== City Bake Complete! ===')

