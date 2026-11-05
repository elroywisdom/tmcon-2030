'use client'

import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useVenue } from '@/store/useVenue'
import { tokens } from '@/styles/tokens'
import { zones, isSeatTaken } from '@/data/zones'
import LEDScreen from './LEDScreen'
import Crowd from './Crowd'
import AbujaCity from './AbujaCity'
import LiveShowEffects from './LiveShowEffects'
import SiteInfrastructure from './SiteInfrastructure'
import {
  createPhotorealisticGroundTextures,
  createVolumetricTreeGeometry,
  createLeafBumpTexture,
  createDetailedCarGeometry,
} from './terrainUtils'
import { playlists } from '@/data/led'
import osmData from '@/data/osm/abuja-stadium.json'
import {
  resample,
  sweepProfile,
  roofScallop,
  seatColor,
  createLowerTierTexture,
  createUpperTierTexture,
  createBoxBandTexture,
  createRoofMembraneTextures,
} from '@/lib/stadiumGeometry'

// Stadium true geometric center from OSM relation 13989805
const BOWL_CENTER = [-3.8, 12.1]
const PITCH_CENTER = [-3.0, 12.3]
// Pitch & track long axis is tilted ~16 deg counter-clockwise (top leans West)
const PITCH_ROT_Y = (16 * Math.PI) / 180
const NUM_BAYS = 32
const N_RESAMPLE = 256 // 8 angular steps per bay

/* ---------- Shared Interactive Zone Wrapper ---------- */

function Zone({ id, children, ...props }) {
  const focusZone = useVenue((s) => s.focusZone)
  const setHovered = useVenue((s) => s.setHovered)
  return (
    <group
      {...props}
      onClick={(e) => {
        e.stopPropagation()
        focusZone(id)
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered(id)
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        setHovered(null)
        document.body.style.cursor = 'auto'
      }}
    >
      {children}
    </group>
  )
}

/* ---------- 1. Savanna Terrain, Apron, Terraced Car Parks, Hill & Skyline ---------- */

function SavannaTerrainAndSurroundings() {
  const { groundMap, groundBump } = useMemo(
    () => createPhotorealisticGroundTextures(),
    []
  )

  // Low-poly displaced rocky hill (East / North-East Abuja inselberg)
  const hillGeo = useMemo(() => {
    const geo = new THREE.ConeGeometry(260, 145, 24, 8)
    const pos = geo.attributes.position
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i)
      const vy = pos.getY(i)
      const vz = pos.getZ(i)
      const n =
        Math.sin(vx * 0.025) * Math.cos(vz * 0.025) * 18 +
        Math.sin(vx * 0.06 + vz * 0.05) * 8
      pos.setXYZ(i, vx * 1.35 + n, vy, vz * 0.95 + n)
    }
    geo.computeVertexNormals()
    return geo
  }, [])

  return (
    <group>
      {/* Main Savanna & Apron Ground Plane with Photorealistic Texture & Bump */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.05, 0]}
        receiveShadow
        raycast={() => null}
      >
        <planeGeometry args={[3200, 3200]} />
        <meshStandardMaterial
          map={groundMap}
          bumpMap={groundBump}
          bumpScale={0.32}
          roughness={0.88}
          metalness={0.02}
        />
      </mesh>

      {/* Rocky Hill to the East / North-East */}
      <mesh
        geometry={hillGeo}
        position={[960, 62, -680]}
        castShadow={false}
        receiveShadow={false}
      >
        <meshStandardMaterial color="#7d7568" roughness={0.95} />
      </mesh>

      {/* Distant Abuja Skyline on the Northern Horizon (faded in harmattan haze) */}
      <group position={[0, 0, -1350]}>
        {Array.from({ length: 28 }, (_, i) => {
          const x = (i - 14) * 58 + ((i * 19) % 23)
          const z = -((i * 37) % 120)
          const h = 24 + ((i * 17) % 52)
          const w = 18 + ((i * 13) % 22)
          return (
            <mesh key={i} position={[x, h / 2, z]}>
              <boxGeometry args={[w, h, w * 0.8]} />
              <meshStandardMaterial color="#c2bcb0" roughness={0.9} />
            </mesh>
          )
        })}
      </group>
    </group>
  )
}

/* ---------- 2. Central Pitch, 400m Terracotta Running Track, Goals, Dugouts & Yellow Gates ---------- */

function RunningTrackAndPitch() {
  const { trackTex, pitchTex, adTex } = useMemo(() => {
    // 1. Terracotta Track Texture with 8 white lanes & staggered start markings
    const tCanvas = document.createElement('canvas')
    tCanvas.width = 1024
    tCanvas.height = 1024
    const tCtx = tCanvas.getContext('2d')

    // Base terracotta rubber surface
    tCtx.fillStyle = '#a23b26'
    tCtx.fillRect(0, 0, 1024, 1024)

    // Subtle granular texture variation
    for (let i = 0; i < 3000; i++) {
      const rx = ((i * 16807) % 1024)
      const ry = ((i * 48271) % 1024)
      tCtx.fillStyle =
        i % 2 === 0 ? 'rgba(135, 42, 24, 0.25)' : 'rgba(185, 72, 48, 0.2)'
      tCtx.fillRect(rx, ry, 3, 3)
    }

    // Draw 8 oval running lanes
    const cx = 512
    const cy = 512
    for (let lane = 0; lane <= 8; lane++) {
      const rx = 315 + lane * 18.5
      const ry = 432 + lane * 18.5
      tCtx.strokeStyle = 'rgba(255, 255, 255, 0.88)'
      tCtx.lineWidth = lane === 0 || lane === 8 ? 3.5 : 2.2
      tCtx.beginPath()
      tCtx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
      tCtx.stroke()

      // Staggered start ticks & hurdle marks across lanes
      if (lane < 8) {
        const midR = rx + 9.2
        const midRy = ry + 9.2
        for (let a = 0; a < 12; a++) {
          const ang = (a / 12) * Math.PI * 2 + lane * 0.035
          const x1 = cx + Math.cos(ang) * (midR - 7)
          const y1 = cy + Math.sin(ang) * (midRy - 7)
          const x2 = cx + Math.cos(ang) * (midR + 7)
          const y2 = cy + Math.sin(ang) * (midRy + 7)
          tCtx.strokeStyle =
            a % 3 === 0 ? 'rgba(255, 255, 255, 0.9)' : 'rgba(90, 150, 230, 0.7)'
          tCtx.lineWidth = 2.5
          tCtx.beginPath()
          tCtx.moveTo(x1, y1)
          tCtx.lineTo(x2, y2)
          tCtx.stroke()
        }
      }
    }

    const trackTex = new THREE.CanvasTexture(tCanvas)
    trackTex.colorSpace = THREE.SRGBColorSpace

    // 2. Lush Natural Daytime Football Pitch Texture
    const pCanvas = document.createElement('canvas')
    pCanvas.width = 1024
    pCanvas.height = 1536
    const pCtx = pCanvas.getContext('2d')

    const stripes = 18
    const stripeH = pCanvas.height / stripes
    for (let i = 0; i < stripes; i++) {
      pCtx.fillStyle = i % 2 === 0 ? '#3e732f' : '#366828'
      pCtx.fillRect(0, i * stripeH, pCanvas.width, stripeH)
    }

    // Subtle longitudinal wear in center of pitch
    const wear = pCtx.createRadialGradient(512, 768, 40, 512, 768, 520)
    wear.addColorStop(0, 'rgba(130, 145, 70, 0.18)')
    wear.addColorStop(1, 'rgba(60, 110, 45, 0)')
    pCtx.fillStyle = wear
    pCtx.fillRect(0, 0, pCanvas.width, pCanvas.height)

    // White pitch markings
    pCtx.strokeStyle = 'rgba(255, 255, 255, 0.9)'
    pCtx.lineWidth = 6
    const m = 48
    const pw = pCanvas.width - m * 2
    const ph = pCanvas.height - m * 2
    pCtx.strokeRect(m, m, pw, ph)

    // Halfway line & center circle
    pCtx.beginPath()
    pCtx.moveTo(m, pCanvas.height / 2)
    pCtx.lineTo(pCanvas.width - m, pCanvas.height / 2)
    pCtx.stroke()

    pCtx.beginPath()
    pCtx.arc(pCanvas.width / 2, pCanvas.height / 2, 118, 0, Math.PI * 2)
    pCtx.stroke()

    pCtx.fillStyle = '#ffffff'
    pCtx.beginPath()
    pCtx.arc(pCanvas.width / 2, pCanvas.height / 2, 7, 0, Math.PI * 2)
    pCtx.fill()

    // Penalty boxes & 6-yard goal boxes
    const penW = 460
    const penH = 210
    pCtx.strokeRect((pCanvas.width - penW) / 2, m, penW, penH)
    pCtx.strokeRect(
      (pCanvas.width - penW) / 2,
      pCanvas.height - m - penH,
      penW,
      penH
    )

    const goalW = 210
    const goalH = 74
    pCtx.strokeRect((pCanvas.width - goalW) / 2, m, goalW, goalH)
    pCtx.strokeRect(
      (pCanvas.width - goalW) / 2,
      pCanvas.height - m - goalH,
      goalW,
      goalH
    )

    // Penalty arcs
    pCtx.beginPath()
    pCtx.arc(pCanvas.width / 2, m + 150, 95, 0.22 * Math.PI, 0.78 * Math.PI)
    pCtx.stroke()
    pCtx.beginPath()
    pCtx.arc(
      pCanvas.width / 2,
      pCanvas.height - m - 150,
      95,
      1.22 * Math.PI,
      1.78 * Math.PI
    )
    pCtx.stroke()

    const pitchTex = new THREE.CanvasTexture(pCanvas)
    pitchTex.colorSpace = THREE.SRGBColorSpace

    // 3. Perimeter Advertising Board Texture
    const aCanvas = document.createElement('canvas')
    aCanvas.width = 1024
    aCanvas.height = 64
    const aCtx = aCanvas.getContext('2d')
    const brands = [
      '#ffffff',
      '#d62828',
      '#ffffff',
      '#f7b801',
      '#ffffff',
      '#1d783a',
      '#ffffff',
      '#1e40af',
    ]
    const bw = aCanvas.width / (brands.length * 2)
    for (let i = 0; i < brands.length * 2; i++) {
      aCtx.fillStyle = brands[i % brands.length]
      aCtx.fillRect(i * bw, 0, bw, aCanvas.height)
      aCtx.fillStyle = '#222222'
      aCtx.fillRect(i * bw + 8, 22, bw - 16, 20)
    }
    const adTex = new THREE.CanvasTexture(aCanvas)
    adTex.wrapS = THREE.RepeatWrapping
    adTex.repeat.set(6, 1)
    adTex.colorSpace = THREE.SRGBColorSpace

    return { trackTex, pitchTex, adTex }
  }, [])

  return (
    <group
      position={[PITCH_CENTER[0], 0.06, PITCH_CENTER[1]]}
      rotation={[0, PITCH_ROT_Y, 0]}
    >
      {/* Terracotta Athletics Running Track Surface */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.01, 0]}
        scale={[1, 1.38, 1]}
        receiveShadow
      >
        <circleGeometry args={[68, 72]} />
        <meshStandardMaterial map={trackTex} roughness={0.86} />
      </mesh>

      {/* High-jump / Athletics Landing Mats in North & South D-zones & West side */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[-42, 0.04, 10]}
        receiveShadow
      >
        <planeGeometry args={[5.5, 14]} />
        <meshStandardMaterial color="#3c4c47" roughness={0.85} />
      </mesh>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[-42, 0.04, -12]}
        receiveShadow
      >
        <planeGeometry args={[5.5, 14]} />
        <meshStandardMaterial color="#3c4c47" roughness={0.85} />
      </mesh>

      {/* Football Pitch Turf Plane */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.03, 0]}
        receiveShadow
      >
        <planeGeometry args={[72, 108]} />
        <meshStandardMaterial map={pitchTex} roughness={0.78} />
      </mesh>

      {/* Perimeter Advertising Boards around the Pitch */}
      {[
        { pos: [38.5, 0.5, 0], rot: [0, Math.PI / 2, 0], len: 106 },
        { pos: [-38.5, 0.5, 0], rot: [0, Math.PI / 2, 0], len: 74 },
        { pos: [0, 0.5, -56], rot: [0, 0, 0], len: 70 },
        { pos: [0, 0.5, 56], rot: [0, 0, 0], len: 70 },
      ].map((b, idx) => (
        <mesh key={idx} position={b.pos} rotation={b.rot} castShadow receiveShadow>
          <boxGeometry args={[b.len, 0.95, 0.25]} />
          <meshStandardMaterial map={adTex} roughness={0.5} />
        </mesh>
      ))}

      {/* North & South Football Goals (white goalposts + net) */}
      {[-51.2, 51.2].map((zPos, idx) => {
        const dir = zPos < 0 ? -1 : 1
        return (
          <group key={idx} position={[0, 0, zPos]}>
            {/* Left & Right Goalposts */}
            <mesh position={[-3.66, 1.22, 0]} castShadow>
              <cylinderGeometry args={[0.07, 0.07, 2.44, 8]} />
              <meshStandardMaterial color="#ffffff" roughness={0.3} />
            </mesh>
            <mesh position={[3.66, 1.22, 0]} castShadow>
              <cylinderGeometry args={[0.07, 0.07, 2.44, 8]} />
              <meshStandardMaterial color="#ffffff" roughness={0.3} />
            </mesh>
            {/* Crossbar */}
            <mesh
              position={[0, 2.44, 0]}
              rotation={[0, 0, Math.PI / 2]}
              castShadow
            >
              <cylinderGeometry args={[0.07, 0.07, 7.4, 8]} />
              <meshStandardMaterial color="#ffffff" roughness={0.3} />
            </mesh>
            {/* Goal Net Box */}
            <mesh position={[0, 1.2, dir * 1.1]}>
              <boxGeometry args={[7.3, 2.4, 2.1]} />
              <meshStandardMaterial
                color="#f5f5f5"
                transparent
                opacity={0.32}
                wireframe={false}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        )
      })}

      {/* Team Bench Shelters (Dugouts) along the West Touchline */}
      {[-22, -9, 9, 22].map((zPos, idx) => (
        <group key={idx} position={[-39.8, 0, zPos]}>
          {/* Translucent curved polycarbonate shelter canopy */}
          <mesh position={[0, 1.15, 0]} castShadow>
            <boxGeometry args={[1.9, 2.1, 6.8]} />
            <meshStandardMaterial
              color="#d8e4ec"
              transparent
              opacity={0.55}
              roughness={0.2}
              metalness={0.3}
            />
          </mesh>
          {/* Aluminium frame ribs */}
          {[-3.2, 0, 3.2].map((rz) => (
            <mesh key={rz} position={[0, 1.15, rz]}>
              <boxGeometry args={[1.95, 2.15, 0.12]} />
              <meshStandardMaterial color="#cfd4da" metalness={0.6} />
            </mesh>
          ))}
          {/* Red/orange dugout seats inside */}
          <mesh position={[-0.3, 0.55, 0]}>
            <boxGeometry args={[0.7, 0.65, 6.2]} />
            <meshStandardMaterial color="#d84727" roughness={0.6} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/* ---------- 3. Realistic Moshood Abiola National Stadium Bowl, Roof & Facade ---------- */

function RealisticStadiumShell() {
  const outline = useMemo(() => resample(osmData.bowl, N_RESAMPLE), [])
  const bayOutline = useMemo(() => resample(osmData.bowl, NUM_BAYS), [])

  const {
    lowerTierGeo,
    boxBandGeo,
    upperTierGeo,
    endWallLeftGeo,
    endWallRightGeo,
    roofGeo,
    outerWallGeo,
    podiumGeo,
    lowerTex,
    upperTex,
    boxTex,
    roofMap,
    roofBump,
  } = useMemo(() => {
    // 1. Lower Seating Tier (s: 0.49 -> 0.64, y: 0 -> 2.1 -> 14.0)
    const lowerProfile = [
      { s: 0.49, y: 0.0, v: 0.0 },
      { s: 0.50, y: 2.2, v: 0.06 },
      { s: 0.545, y: 6.0, v: 0.36 },
      { s: 0.59, y: 10.0, v: 0.68 },
      { s: 0.64, y: 14.0, v: 1.0 },
    ]
    const lowerTierGeo = sweepProfile(outline, BOWL_CENTER, lowerProfile)

    // 2. Middle Box Band between tiers (s: 0.63 -> 0.68, y: 14.0 -> 20.2)
    const boxProfile = [
      { s: 0.64, y: 13.9, v: 0.0 },
      { s: 0.625, y: 14.2, v: 0.12 },
      { s: 0.658, y: 14.8, v: 0.22 },
      { s: 0.658, y: 19.1, v: 0.78 },
      { s: 0.632, y: 19.6, v: 0.88 },
      { s: 0.68, y: 20.2, v: 1.0 },
    ]
    const boxBandGeo = sweepProfile(outline, BOWL_CENTER, boxProfile)

    // 3. Upper Tier (s: 0.68 -> 0.85, y: 20.2 -> 33.0)
    // Upper tier breaks at the North end (Bays 17, 18, 19 -> indices 136..154 of 256) for the scoreboard
    const GAP_START = 138
    const GAP_END = 154
    const upperProfile = [
      { s: 0.68, y: 20.2, v: 0.0 },
      { s: 0.735, y: 24.5, v: 0.33 },
      { s: 0.79, y: 28.8, v: 0.66 },
      { s: 0.85, y: 33.0, v: 0.96 },
      { s: 0.88, y: 33.2, v: 1.0 },
    ]
    // Subtle saddle dip at the North/South ends so the ends are slightly lower than the long sides
    const upperYMod = (i, j, y) => {
      if (j === 0) return y
      const [x, z] = outline[i]
      const dx = x - BOWL_CENTER[0]
      const dz = z - BOWL_CENTER[1]
      const ang = Math.atan2(dz, dx) - PITCH_ROT_Y
      // Long sides are around cos(ang) = +/-1, ends are around sin(ang) = +/-1
      const endFactor = Math.pow(Math.sin(ang), 2)
      const ratio = (y - 20.2) / 13.0
      return y - endFactor * 2.2 * ratio
    }
    const upperTierGeo = sweepProfile(outline, BOWL_CENTER, upperProfile, upperYMod, {
      skipColumn: (i) => i >= GAP_START && i < GAP_END,
    })

    // Helper for the two vertical side walls closing the North scoreboard gap in the upper tier
    const makeGapSideWall = (colIdx) => {
      const [x, z] = outline[colIdx]
      const pts = [
        [0.68, 20.2],
        [0.85, 20.2],
        [0.85, upperYMod(colIdx, 3, 33.0)],
        [0.68, 20.2],
      ]
      const pos = []
      const toW = (s, y) => [
        BOWL_CENTER[0] + (x - BOWL_CENTER[0]) * s,
        y,
        BOWL_CENTER[1] + (z - BOWL_CENTER[1]) * s,
      ]
      const p0 = toW(0.68, 20.2)
      const p1 = toW(0.86, 20.2)
      const p2 = toW(0.86, upperYMod(colIdx, 3, 33.0))
      const p3 = toW(0.68, 21.0)
      pos.push(...p0, ...p1, ...p2, ...p0, ...p2, ...p3)
      const g = new THREE.BufferGeometry()
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
      g.computeVertexNormals()
      return g
    }
    const endWallLeftGeo = makeGapSideWall(GAP_START)
    const endWallRightGeo = makeGapSideWall(GAP_END)

    // 4. Quilted Scalloped Tensile Membrane Roof (s: 0.55 -> 0.84 -> 1.04, y: 34.2 -> 41.0 -> 30.0)
    const roofSteps = 17
    const roofProfile = []
    const roofRows = []
    for (let j = 0; j < roofSteps; j++) {
      const t = j / (roofSteps - 1) // 0 at inner ring (s=0.55), 1 at outer overhang (s=1.04)
      const s = 0.55 + t * (1.04 - 0.55)
      // Smooth arch curve from y=34.2 at inner edge up to crest y=40.8 at t=0.58 and down to y=30.0 at outer edge
      const arch = Math.sin(Math.PI * Math.pow(t, 0.85))
      const yBase = 34.2 * (1 - t) + 30.0 * t + arch * 8.2
      roofProfile.push({ s, y: yBase, v: t })
      roofRows.push(j)
    }
    const yModRoof = roofScallop(N_RESAMPLE, NUM_BAYS, 2.3, roofRows, 0.9)
    const sModRoof = (i, j, s) => {
      const t = j / (roofSteps - 1)
      if (t < 0.5) return s
      const bay = Math.abs(Math.sin((Math.PI * i * NUM_BAYS) / N_RESAMPLE))
      // Gently undulating scalloped outer roof edge
      return s + (t - 0.5) * 2 * 0.032 * Math.pow(bay, 0.75)
    }
    const roofGeo = sweepProfile(outline, BOWL_CENTER, roofProfile, yModRoof, {
      sMod: sModRoof,
    })

    // 5. Outer Concrete Facade Arcade & Recessed Service Wall (s: 0.90 -> 0.99, y: 0 -> 26.5)
    const outerProfile = [
      { s: 0.91, y: 0.0, v: 0.0 },
      { s: 0.91, y: 9.5, v: 0.35 },
      { s: 0.95, y: 10.0, v: 0.38 },
      { s: 0.92, y: 10.5, v: 0.4 },
      { s: 0.92, y: 17.5, v: 0.65 },
      { s: 0.96, y: 18.0, v: 0.68 },
      { s: 0.93, y: 18.5, v: 0.7 },
      { s: 0.93, y: 23.5, v: 0.88 },
      { s: 0.99, y: 24.0, v: 0.92 },
      { s: 0.99, y: 26.8, v: 1.0 },
    ]
    const outerWallGeo = sweepProfile(outline, BOWL_CENTER, outerProfile)

    // 6. Stepped Curved Concrete Podium at Base of Stadium (visible in Image 5)
    const podiumProfile = [
      { s: 0.98, y: 5.2, v: 0.0 },
      { s: 1.05, y: 5.2, v: 0.25 },
      { s: 1.05, y: 2.8, v: 0.5 },
      { s: 1.11, y: 2.8, v: 0.75 },
      { s: 1.12, y: 0.0, v: 1.0 },
    ]
    const podiumGeo = sweepProfile(outline, BOWL_CENTER, podiumProfile)

    const lowerTex = createLowerTierTexture(NUM_BAYS)
    const upperTex = createUpperTierTexture(NUM_BAYS)
    const boxTex = createBoxBandTexture(NUM_BAYS)
    const { map: roofMap, bumpMap: roofBump } =
      createRoofMembraneTextures(NUM_BAYS)

    return {
      lowerTierGeo,
      boxBandGeo,
      upperTierGeo,
      endWallLeftGeo,
      endWallRightGeo,
      roofGeo,
      outerWallGeo,
      podiumGeo,
      lowerTex,
      upperTex,
      boxTex,
      roofMap,
      roofBump,
    }
  }, [outline])

  // Inner Roof Steel Ring Truss & Catwalk Geometry (s = 0.55)
  const {
    innerTopRingGeo,
    innerBotRingGeo,
    innerHandrailGeo,
    outerEdgeRingGeo,
    crestRingGeo,
  } = useMemo(() => {
    const makeRingTube = (scaleS, heightY, radius) => {
      const pts = outline.map(
        ([x, z]) =>
          new THREE.Vector3(
            BOWL_CENTER[0] + (x - BOWL_CENTER[0]) * scaleS,
            heightY,
            BOWL_CENTER[1] + (z - BOWL_CENTER[1]) * scaleS
          )
      )
      const curve = new THREE.CatmullRomCurve3(pts, true)
      return new THREE.TubeGeometry(curve, 128, radius, 6, true)
    }
    return {
      innerTopRingGeo: makeRingTube(0.55, 34.3, 0.36),
      innerBotRingGeo: makeRingTube(0.55, 32.6, 0.32),
      innerHandrailGeo: makeRingTube(0.538, 33.2, 0.14),
      outerEdgeRingGeo: makeRingTube(1.035, 30.1, 0.28),
      crestRingGeo: makeRingTube(0.81, 41.2, 0.26),
    }
  }, [outline])

  // 32 Radial Roof Arch Ribs, Diagonal Steel Struts, Inner Truss Lacing & Outer V-Buttress Piers
  const timeOfDay = useVenue((s) => s.timeOfDay)
  const isIntroPlaying = useVenue((s) => s.isIntroPlaying)
  const introPhase = useVenue((s) => s.introPhase)
  const lightsOnProgress = useVenue((s) => s.lightsOnProgress)
  const tRef = useRef(timeOfDay === 'night' ? 1.0 : 0.0)
  const floodlightMatRef = useRef()
  const floodlightGlowRef = useRef()
  const floodlightGlowMatRef = useRef()
  const roofMatRef = useRef()
  const lightConesRef = useRef()
  const catwalkLight1 = useRef()
  const catwalkLight2 = useRef()
  const catwalkLight3 = useRef()
  const catwalkLight4 = useRef()

  const glowTexture = useMemo(() => {
    if (typeof document === 'undefined') return null
    const canvas = document.createElement('canvas')
    canvas.width = 128
    canvas.height = 128
    const ctx = canvas.getContext('2d')
    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
    grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)')
    grad.addColorStop(0.2, 'rgba(255, 240, 190, 0.9)')
    grad.addColorStop(0.5, 'rgba(255, 180, 70, 0.4)')
    grad.addColorStop(1, 'rgba(255, 120, 20, 0.0)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 128, 128)
    const tex = new THREE.CanvasTexture(canvas)
    tex.needsUpdate = true
    return tex
  }, [])

  const dayRoofColor = useMemo(() => new THREE.Color('#f2ece0'), [])
  const nightRoofColor = useMemo(() => new THREE.Color('#383531'), [])
  const roofEmissiveColor = useMemo(() => new THREE.Color('#ff9933'), [])

  const coneShader = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      uniforms: {
        uColor: { value: new THREE.Color(tokens.lighting.nightFloodlight) },
        uOpacity: { value: 0.0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uOpacity;
        varying vec2 vUv;
        void main() {
          float vertical = pow(clamp(vUv.y, 0.0, 1.0), 1.35);
          float alpha = vertical * uOpacity;
          gl_FragColor = vec4(uColor, alpha);
        }
      `,
    })
  }, [])

  const piersRef = useRef()
  const pierAccentsRef = useRef()
  const gatePortalsRef = useRef()
  const diagStrutsRef = useRef()
  const backStrutsRef = useRef()
  const innerPostsRef = useRef()
  const floodlightsRef = useRef()
  const yellowGatesRef = useRef()

  useFrame((_, delta) => {
    // Phase 4 Section 5: During flight, stadium is in dark silhouette.
    // Upon arrival at hero pose, lightsOn triggers 2.5s sequence:
    // 0.0 - 0.32: Rim sweep (roof glow ramps 0.02 -> 0.18)
    // 0.32 - 0.48: Bloom flash spike (floodlights ignite 0 -> 5.5 -> 3.2, cones ignite)
    // 0.48 - 1.0: Full steady night lighting
    if (isIntroPlaying) {
      if (introPhase === 'flight') {
        if (floodlightMatRef.current) floodlightMatRef.current.emissiveIntensity = 0.0
        if (floodlightGlowMatRef.current) floodlightGlowMatRef.current.opacity = 0.0
        coneShader.uniforms.uOpacity.value = 0.0
        if (roofMatRef.current) {
          roofMatRef.current.color.copy(nightRoofColor)
          roofMatRef.current.emissive.copy(roofEmissiveColor)
          roofMatRef.current.emissiveIntensity = 0.02
        }
        if (catwalkLight1.current) catwalkLight1.current.intensity = 0.0
        if (catwalkLight2.current) catwalkLight2.current.intensity = 0.0
        if (catwalkLight3.current) catwalkLight3.current.intensity = 0.0
        if (catwalkLight4.current) catwalkLight4.current.intensity = 0.0
        return
      } else if (introPhase === 'lights_on') {
        const p = lightsOnProgress
        if (p < 0.32) {
          const subP = p / 0.32
          if (floodlightMatRef.current) floodlightMatRef.current.emissiveIntensity = 0.0
          if (floodlightGlowMatRef.current) floodlightGlowMatRef.current.opacity = 0.0
          coneShader.uniforms.uOpacity.value = 0.0
          if (roofMatRef.current) {
            roofMatRef.current.color.copy(nightRoofColor)
            roofMatRef.current.emissive.copy(roofEmissiveColor)
            roofMatRef.current.emissiveIntensity = THREE.MathUtils.lerp(0.02, 0.25, subP)
          }
          if (catwalkLight1.current) catwalkLight1.current.intensity = 0.0
          if (catwalkLight2.current) catwalkLight2.current.intensity = 0.0
          if (catwalkLight3.current) catwalkLight3.current.intensity = 0.0
          if (catwalkLight4.current) catwalkLight4.current.intensity = 0.0
        } else if (p < 0.48) {
          const flashSub = (p - 0.32) / 0.16
          const flashSpike = Math.sin(flashSub * Math.PI) * 2.3
          const floodVal = THREE.MathUtils.lerp(0.0, 3.2, flashSub) + flashSpike
          if (floodlightMatRef.current) floodlightMatRef.current.emissiveIntensity = floodVal
          if (floodlightGlowMatRef.current) floodlightGlowMatRef.current.opacity = Math.min(1.2, THREE.MathUtils.lerp(0.0, 0.85, flashSub) + flashSpike * 0.3)
          coneShader.uniforms.uOpacity.value = THREE.MathUtils.lerp(0.0, 0.42, flashSub)
          if (roofMatRef.current) {
            roofMatRef.current.color.copy(nightRoofColor)
            roofMatRef.current.emissive.copy(roofEmissiveColor)
            roofMatRef.current.emissiveIntensity = 0.35 + flashSpike * 0.15
          }
          const catVal = THREE.MathUtils.lerp(0.0, 2.2, flashSub) + flashSpike * 0.8
          if (catwalkLight1.current) catwalkLight1.current.intensity = catVal
          if (catwalkLight2.current) catwalkLight2.current.intensity = catVal
          if (catwalkLight3.current) catwalkLight3.current.intensity = catVal
          if (catwalkLight4.current) catwalkLight4.current.intensity = catVal
        } else {
          if (floodlightMatRef.current) floodlightMatRef.current.emissiveIntensity = 3.2
          if (floodlightGlowMatRef.current) floodlightGlowMatRef.current.opacity = 0.85
          coneShader.uniforms.uOpacity.value = 0.42
          if (roofMatRef.current) {
            roofMatRef.current.color.copy(nightRoofColor)
            roofMatRef.current.emissive.copy(roofEmissiveColor)
            roofMatRef.current.emissiveIntensity = 0.35
          }
          if (catwalkLight1.current) catwalkLight1.current.intensity = 2.2
          if (catwalkLight2.current) catwalkLight2.current.intensity = 2.2
          if (catwalkLight3.current) catwalkLight3.current.intensity = 2.2
          if (catwalkLight4.current) catwalkLight4.current.intensity = 2.2
        }
        return
      }
    }

    const targetT = timeOfDay === 'night' ? 1.0 : 0.0
    tRef.current = THREE.MathUtils.damp(tRef.current, targetT, 2.5, delta)
    const t = tRef.current

    if (floodlightMatRef.current) {
      floodlightMatRef.current.emissiveIntensity = THREE.MathUtils.lerp(0.0, 3.2, t)
    }
    if (floodlightGlowMatRef.current) {
      floodlightGlowMatRef.current.opacity = THREE.MathUtils.lerp(0.0, 0.85, t)
    }
    coneShader.uniforms.uOpacity.value = THREE.MathUtils.lerp(0.0, 0.42, t)
    if (roofMatRef.current) {
      roofMatRef.current.color.lerpColors(dayRoofColor, nightRoofColor, t)
      roofMatRef.current.emissive.copy(roofEmissiveColor)
      roofMatRef.current.emissiveIntensity = THREE.MathUtils.lerp(0.0, 0.35, t)
    }
    if (catwalkLight1.current) catwalkLight1.current.intensity = THREE.MathUtils.lerp(0.0, 2.2, t)
    if (catwalkLight2.current) catwalkLight2.current.intensity = THREE.MathUtils.lerp(0.0, 2.2, t)
    if (catwalkLight3.current) catwalkLight3.current.intensity = THREE.MathUtils.lerp(0.0, 2.2, t)
    if (catwalkLight4.current) catwalkLight4.current.intensity = THREE.MathUtils.lerp(0.0, 2.2, t)
  })

  useLayoutEffect(() => {
    const dummy = new THREE.Object3D()
    const upVec = new THREE.Vector3(0, 1, 0)

    const orientSegment = (ref, idx, pA, pB, thickness = 1) => {
      const vA = new THREE.Vector3(...pA)
      const vB = new THREE.Vector3(...pB)
      const mid = vA.clone().add(vB).multiplyScalar(0.5)
      const dir = vB.clone().sub(vA)
      const len = dir.length()
      dummy.position.copy(mid)
      dummy.quaternion.setFromUnitVectors(upVec, dir.normalize())
      dummy.scale.set(thickness, len, thickness)
      dummy.updateMatrix()
      ref.current.setMatrixAt(idx, dummy.matrix)
    }

    for (let b = 0; b < NUM_BAYS; b++) {
      const [bx, bz] = bayOutline[b]
      const nextB = (b + 1) % NUM_BAYS
      const [nx, nz] = bayOutline[nextB]
      const dx = bx - BOWL_CENTER[0]
      const dz = bz - BOWL_CENTER[1]
      const outAngle = Math.atan2(dx, dz)

      // 1. Outer Concrete V-Shaped Buttress Pier at bay boundary (s = 0.985)
      const px = BOWL_CENTER[0] + dx * 0.985
      const pz = BOWL_CENTER[1] + dz * 0.985
      dummy.position.set(px, 13.5, pz)
      dummy.rotation.set(0, outAngle, 0)
      dummy.scale.set(1, 1, 1)
      dummy.updateMatrix()
      piersRef.current.setMatrixAt(b, dummy.matrix)

      // Red-brown / terracotta accent face on the outer slanted pier face
      const ax = BOWL_CENTER[0] + dx * 1.002
      const az = BOWL_CENTER[1] + dz * 1.002
      dummy.position.set(ax, 14.5, az)
      dummy.rotation.set(-0.06, outAngle, 0)
      dummy.scale.set(1, 1, 1)
      dummy.updateMatrix()
      pierAccentsRef.current.setMatrixAt(b, dummy.matrix)

      // Dark Gate Portal opening between piers (s = 0.935)
      const mx = (bx + nx) * 0.5 - BOWL_CENTER[0]
      const mz = (bz + nz) * 0.5 - BOWL_CENTER[1]
      const mAngle = Math.atan2(mx, mz)
      dummy.position.set(
        BOWL_CENTER[0] + mx * 0.935,
        7.8,
        BOWL_CENTER[1] + mz * 0.935
      )
      dummy.rotation.set(0, mAngle, 0)
      dummy.scale.set(1, 1, 1)
      dummy.updateMatrix()
      gatePortalsRef.current.setMatrixAt(b, dummy.matrix)

      // 2. Slim Diagonal Steel Strut from Inner Roof Ring (s=0.55, y=34.2) down & back to Upper Tier Top (s=0.85, y=32.5)
      const pInner = [
        BOWL_CENTER[0] + dx * 0.55,
        34.2,
        BOWL_CENTER[1] + dz * 0.55,
      ]
      const pUpperRear = [
        BOWL_CENTER[0] + dx * 0.85,
        32.5,
        BOWL_CENTER[1] + dz * 0.85,
      ]
      orientSegment(diagStrutsRef, b, pInner, pUpperRear, 1)

      // Secondary Steel Strut from Upper Tier Rear (s=0.85, y=32.5) up to Roof Crest (s=0.81, y=41.2)
      const pCrest = [
        BOWL_CENTER[0] + dx * 0.81,
        41.2,
        BOWL_CENTER[1] + dz * 0.81,
      ]
      orientSegment(backStrutsRef, b, pUpperRear, pCrest, 1)

      // 3. Yellow Track Perimeter Gate at foot of each radial aisle (s = 0.488, y = 1.1)
      dummy.position.set(
        BOWL_CENTER[0] + dx * 0.488,
        1.15,
        BOWL_CENTER[1] + dz * 0.488
      )
      dummy.rotation.set(0, outAngle, 0)
      dummy.scale.set(1, 1, 1)
      dummy.updateMatrix()
      yellowGatesRef.current.setMatrixAt(b, dummy.matrix)
    }

    // 64 Vertical & Diagonal Truss Posts + Roof-Mounted Floodlights around Inner Ring (s = 0.55)
    for (let k = 0; k < 64; k++) {
      const idx = (k * 4) % N_RESAMPLE
      const [kx, kz] = outline[idx]
      const dx = kx - BOWL_CENTER[0]
      const dz = kz - BOWL_CENTER[1]
      const ang = Math.atan2(dx, dz)

      const rx = BOWL_CENTER[0] + dx * 0.55
      const rz = BOWL_CENTER[1] + dz * 0.55
      dummy.position.set(rx, 33.45, rz)
      dummy.rotation.set(0, ang, k % 2 === 0 ? 0 : 0.48)
      dummy.scale.set(1, 1, 1)
      dummy.updateMatrix()
      innerPostsRef.current.setMatrixAt(k, dummy.matrix)

      // Floodlight housing slung under the inner catwalk ring (aimed toward pitch)
      dummy.position.set(rx, 32.15, rz)
      dummy.rotation.set(0.35, ang + Math.PI, 0)
      dummy.scale.set(1, 1, 1)
      dummy.updateMatrix()
      floodlightsRef.current.setMatrixAt(k, dummy.matrix)

      // Radiant Floodlight Glow Sprites facing toward arena interior
      dummy.position.set(rx, 31.85, rz)
      dummy.rotation.set(0.35, ang + Math.PI, 0)
      dummy.scale.set(1, 1, 1)
      dummy.updateMatrix()
      if (floodlightGlowRef.current) floodlightGlowRef.current.setMatrixAt(k, dummy.matrix)

      // Downward angled light cone slung from floodlight unit toward running track / pitch
      const pitchTarget = [
        BOWL_CENTER[0] + dx * 0.16,
        0.5,
        BOWL_CENTER[1] + dz * 0.16,
      ]
      orientSegment(lightConesRef, k, [rx, 32.15, rz], pitchTarget, 1)
    }

    piersRef.current.instanceMatrix.needsUpdate = true
    pierAccentsRef.current.instanceMatrix.needsUpdate = true
    gatePortalsRef.current.instanceMatrix.needsUpdate = true
    diagStrutsRef.current.instanceMatrix.needsUpdate = true
    backStrutsRef.current.instanceMatrix.needsUpdate = true
    innerPostsRef.current.instanceMatrix.needsUpdate = true
    floodlightsRef.current.instanceMatrix.needsUpdate = true
    if (floodlightGlowRef.current) floodlightGlowRef.current.instanceMatrix.needsUpdate = true
    if (lightConesRef.current) lightConesRef.current.instanceMatrix.needsUpdate = true
    yellowGatesRef.current.instanceMatrix.needsUpdate = true
  }, [bayOutline, outline])

  // 32 Curved Radial Arch Rib Tubes along the roof bay valleys
  const radialArchGeos = useMemo(() => {
    return bayOutline.map(([bx, bz]) => {
      const dx = bx - BOWL_CENTER[0]
      const dz = bz - BOWL_CENTER[1]
      const pts = [0.55, 0.66, 0.78, 0.9, 1.035].map((s, idx) => {
        const yVals = [34.2, 39.2, 41.0, 37.8, 30.1]
        return new THREE.Vector3(
          BOWL_CENTER[0] + dx * s,
          yVals[idx],
          BOWL_CENTER[1] + dz * s
        )
      })
      const curve = new THREE.CatmullRomCurve3(pts)
      return new THREE.TubeGeometry(curve, 16, 0.24, 6, false)
    })
  }, [bayOutline])

  // North Scoreboard position in the Upper-Tier Break (Bay 18: [-18.9, -131.8])
  const scoreboardPos = useMemo(() => {
    const [bx, bz] = bayOutline[18]
    const dx = bx - BOWL_CENTER[0]
    const dz = bz - BOWL_CENTER[1]
    return [BOWL_CENTER[0] + dx * 0.77, 0, BOWL_CENTER[1] + dz * 0.77]
  }, [bayOutline])

  return (
    <group>
      {/* 1. Lower Seating Tier (warm mosaic + cream VIP block + tunnels) */}
      <mesh geometry={lowerTierGeo} receiveShadow castShadow>
        <meshStandardMaterial
          map={lowerTex}
          roughness={0.72}
          metalness={0.05}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 3D Tunnel Portal Canopies at West VIP, East, North-West & South-West curves */}
      {[26, 10, 2, 18, 22, 30].map((bayIdx) => {
        const [bx, bz] = bayOutline[bayIdx]
        const dx = bx - BOWL_CENTER[0]
        const dz = bz - BOWL_CENTER[1]
        const ang = Math.atan2(dx, dz)
        const isMain = bayIdx === 26 || bayIdx === 10
        return (
          <group
            key={bayIdx}
            position={[
              BOWL_CENTER[0] + dx * 0.515,
              isMain ? 3.2 : 2.6,
              BOWL_CENTER[1] + dz * 0.515,
            ]}
            rotation={[0, ang, 0]}
          >
            {/* Concrete portal lintel & side walls */}
            <mesh position={[0, 2.2, 0]} castShadow receiveShadow>
              <boxGeometry args={[isMain ? 8.5 : 6.2, 0.9, 5.5]} />
              <meshStandardMaterial color="#d2cdc2" roughness={0.75} />
            </mesh>
            {/* Dark interior tunnel throat */}
            <mesh position={[0, 0.1, 0.2]}>
              <boxGeometry args={[isMain ? 7.2 : 5.0, 4.0, 4.8]} />
              <meshStandardMaterial color="#121417" roughness={0.95} />
            </mesh>
          </group>
        )
      })}

      {/* 2. Middle Hospitality / Press Box Band between tiers */}
      <mesh geometry={boxBandGeo} receiveShadow castShadow>
        <meshStandardMaterial
          map={boxTex}
          roughness={0.55}
          metalness={0.15}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 3. Upper Seating Tier (shaded maroon mosaic, breaks open at North scoreboard) */}
      <mesh geometry={upperTierGeo} receiveShadow castShadow>
        <meshStandardMaterial
          map={upperTex}
          roughness={0.75}
          metalness={0.05}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh geometry={endWallLeftGeo} receiveShadow castShadow>
        <meshStandardMaterial
          color="#cfc9be"
          roughness={0.8}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh geometry={endWallRightGeo} receiveShadow castShadow>
        <meshStandardMaterial
          color="#cfc9be"
          roughness={0.8}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 4. Large Black Scoreboard Screen in the North Upper-Tier Gap */}
      <group position={scoreboardPos} rotation={[0, PITCH_ROT_Y, 0]}>
        {/* Twin steel/concrete support columns */}
        {[-4.2, 4.2].map((sx) => (
          <mesh key={sx} position={[sx, 20.5, 0]} castShadow>
            <boxGeometry args={[1.1, 23, 1.3]} />
            <meshStandardMaterial color="#b8b4ac" roughness={0.6} />
          </mesh>
        ))}
        {/* Horizontal structural crossbeams */}
        {[16, 21, 31].map((sy) => (
          <mesh key={sy} position={[0, sy, 0]} castShadow>
            <boxGeometry args={[10.5, 0.8, 1.1]} />
            <meshStandardMaterial color="#7a7e82" metalness={0.5} />
          </mesh>
        ))}
        {/* Matte-black scoreboard LED panel */}
        <mesh position={[0, 25.8, 0.8]} castShadow>
          <boxGeometry args={[15.2, 9.6, 1.1]} />
          <meshStandardMaterial
            color="#15171a"
            roughness={0.35}
            metalness={0.2}
          />
        </mesh>
        {/* Active North Scoreboard LED Screen (16:10 aspect, zero distortion, playing event video) */}
        <LEDScreen
          size={[15, 9.4]}
          position={[0, 25.8, 1.4]}
          src="/video/stage-screen-video.mp4"
          poster="/video/stage-screen-poster.jpg"
          focus={[0.5, 0.5]}
        />
      </group>

      {/* 5. Signature Quilted Scalloped Tensile Membrane Roof */}
      <mesh geometry={roofGeo} castShadow receiveShadow>
        <meshStandardMaterial
          ref={roofMatRef}
          map={roofMap}
          bumpMap={roofBump}
          bumpScale={0.35}
          color="#f2ece0"
          emissive="#ffe8be"
          emissiveIntensity={0}
          roughness={0.62}
          metalness={0.04}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 6. Roof Steelwork: 32 Radial Arch Ribs, Inner Ring Truss + Catwalk, Struts & Floodlights */}
      {radialArchGeos.map((g, i) => (
        <mesh key={i} geometry={g} castShadow>
          <meshStandardMaterial
            color="#8e9194"
            roughness={0.45}
            metalness={0.6}
          />
        </mesh>
      ))}
      <mesh geometry={innerTopRingGeo} castShadow>
        <meshStandardMaterial color="#676b70" roughness={0.4} metalness={0.65} />
      </mesh>
      <mesh geometry={innerBotRingGeo} castShadow>
        <meshStandardMaterial color="#585c62" roughness={0.45} metalness={0.65} />
      </mesh>
      <mesh geometry={innerHandrailGeo}>
        <meshStandardMaterial color="#7c8085" roughness={0.5} metalness={0.5} />
      </mesh>
      <mesh geometry={outerEdgeRingGeo}>
        <meshStandardMaterial color="#b5afa3" roughness={0.5} metalness={0.4} />
      </mesh>
      <mesh geometry={crestRingGeo}>
        <meshStandardMaterial color="#9a9892" roughness={0.5} metalness={0.5} />
      </mesh>

      {/* Instanced Diagonal Steel Struts from Inner Roof Edge to Upper Tier */}
      <instancedMesh
        ref={diagStrutsRef}
        args={[undefined, undefined, NUM_BAYS]}
        castShadow
      >
        <cylinderGeometry args={[0.22, 0.22, 1, 6]} />
        <meshStandardMaterial color="#7b7f84" roughness={0.4} metalness={0.65} />
      </instancedMesh>

      {/* Instanced Rear Roof V-Struts */}
      <instancedMesh
        ref={backStrutsRef}
        args={[undefined, undefined, NUM_BAYS]}
      >
        <cylinderGeometry args={[0.2, 0.2, 1, 6]} />
        <meshStandardMaterial color="#85888c" roughness={0.45} metalness={0.6} />
      </instancedMesh>

      {/* Instanced Inner Ring Truss Vertical/Diagonal Lacing Posts */}
      <instancedMesh ref={innerPostsRef} args={[undefined, undefined, 64]}>
        <boxGeometry args={[0.22, 1.85, 0.22]} />
        <meshStandardMaterial color="#5c6066" roughness={0.45} metalness={0.65} />
      </instancedMesh>

      {/* Instanced Roof-Mounted Floodlight Units along Inner Ring (no corner pylons!) */}
      <instancedMesh ref={floodlightsRef} args={[undefined, undefined, 64]}>
        <boxGeometry args={[1.35, 0.75, 0.65]} />
        <meshStandardMaterial
          ref={floodlightMatRef}
          color="#2b2e33"
          roughness={0.35}
          metalness={0.5}
          emissive={tokens.lighting.nightFloodlight}
          emissiveIntensity={0}
        />
      </instancedMesh>

      {/* Instanced Radiant Floodlight Glow Sprites / Flares (P1 Quality Fix) */}
      <instancedMesh ref={floodlightGlowRef} args={[undefined, undefined, 64]}>
        <planeGeometry args={[4.8, 4.8]} />
        <meshBasicMaterial
          ref={floodlightGlowMatRef}
          map={glowTexture}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
          opacity={0}
        />
      </instancedMesh>

      {/* Instanced Volumetric Light Cones Slung Under Floodlights */}
      <instancedMesh ref={lightConesRef} args={[undefined, undefined, 64]}>
        <cylinderGeometry args={[0.35, 6.8, 1, 14, 1, true]} />
        <primitive object={coneShader} attach="material" />
      </instancedMesh>

      {/* 4 Soft Point Lights Slung Under Catwalk at Night (North, South, East, West) */}
      <pointLight
        ref={catwalkLight1}
        position={[BOWL_CENTER[0], 31.5, BOWL_CENTER[1] - 48]}
        color={tokens.lighting.nightFloodlight}
        intensity={0}
        distance={190}
        decay={1.6}
      />
      <pointLight
        ref={catwalkLight2}
        position={[BOWL_CENTER[0], 31.5, BOWL_CENTER[1] + 48]}
        color={tokens.lighting.nightFloodlight}
        intensity={0}
        distance={190}
        decay={1.6}
      />
      <pointLight
        ref={catwalkLight3}
        position={[BOWL_CENTER[0] + 62, 31.5, BOWL_CENTER[1]]}
        color={tokens.lighting.nightFloodlight}
        intensity={0}
        distance={190}
        decay={1.6}
      />
      <pointLight
        ref={catwalkLight4}
        position={[BOWL_CENTER[0] - 62, 31.5, BOWL_CENTER[1]]}
        color={tokens.lighting.nightFloodlight}
        intensity={0}
        distance={190}
        decay={1.6}
      />

      {/* Instanced Bright Yellow Track Perimeter Gates */}
      <instancedMesh ref={yellowGatesRef} args={[undefined, undefined, NUM_BAYS]}>
        <boxGeometry args={[2.3, 2.1, 0.18]} />
        <meshStandardMaterial color="#ebb828" roughness={0.4} metalness={0.2} />
      </instancedMesh>

      {/* 7. Outer Concrete Facade Arcade, V-Buttress Piers with Red-Brown Accents & Stepped Base Podium */}
      <mesh geometry={outerWallGeo} receiveShadow castShadow>
        <meshStandardMaterial
          color="#b9b4aa"
          roughness={0.82}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh geometry={podiumGeo} receiveShadow castShadow>
        <meshStandardMaterial
          color="#d2cdc3"
          roughness={0.78}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 32 Instanced Concrete Buttress Piers */}
      <instancedMesh
        ref={piersRef}
        args={[undefined, undefined, NUM_BAYS]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[3.4, 25.5, 4.8]} />
        <meshStandardMaterial color="#ccc7bd" roughness={0.75} />
      </instancedMesh>

      {/* 32 Instanced Red-Brown / Terracotta Pier Accent Faces */}
      <instancedMesh
        ref={pierAccentsRef}
        args={[undefined, undefined, NUM_BAYS]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[2.4, 18.5, 1.4]} />
        <meshStandardMaterial color="#9e4d36" roughness={0.7} />
      </instancedMesh>

      {/* 32 Instanced Dark Gate Portal Openings */}
      <instancedMesh
        ref={gatePortalsRef}
        args={[undefined, undefined, NUM_BAYS]}
      >
        <boxGeometry args={[6.8, 5.2, 2.2]} />
        <meshStandardMaterial color="#1f2226" roughness={0.9} />
      </instancedMesh>
    </group>
  )
}

/* ---------- 4. Apron Portacabins, West Round Building, Roundabout, Helipad, White Tensile Arena & Training Track ---------- */

function SiteLandmarksAndApronFurniture() {
  const timeOfDay = useVenue((s) => s.timeOfDay)
  const tRef = useRef(timeOfDay === 'night' ? 1.0 : 0.0)
  const lampHeadMatRef = useRef()
  const boothMatRef = useRef()

  const boothOutline = useMemo(() => resample(osmData.bowl, 44), [])
  const boothsRef = useRef()
  const polesRef = useRef()
  const lampHeadsRef = useRef()

  useFrame((_, delta) => {
    const targetT = timeOfDay === 'night' ? 1.0 : 0.0
    tRef.current = THREE.MathUtils.damp(tRef.current, targetT, 2.5, delta)
    const t = tRef.current

    if (lampHeadMatRef.current) {
      lampHeadMatRef.current.emissiveIntensity = THREE.MathUtils.lerp(0.0, 2.5, t)
    }
    if (boothMatRef.current) {
      boothMatRef.current.emissiveIntensity = THREE.MathUtils.lerp(0.0, 0.45, t)
    }
  })

  useLayoutEffect(() => {
    const dummy = new THREE.Object3D()
    for (let i = 0; i < 44; i++) {
      const [bx, bz] = boothOutline[i]
      const dx = bx - BOWL_CENTER[0]
      const dz = bz - BOWL_CENTER[1]
      const ang = Math.atan2(dx, dz)

      // White portacabins & ticket booths along the outer apron ring (s = 1.19)
      dummy.position.set(
        BOWL_CENTER[0] + dx * 1.19,
        1.5,
        BOWL_CENTER[1] + dz * 1.19
      )
      dummy.rotation.set(0, ang, 0)
      dummy.scale.set(1, 1, 1)
      dummy.updateMatrix()
      boothsRef.current.setMatrixAt(i, dummy.matrix)

      // Apron perimeter light poles (s = 1.24)
      dummy.position.set(
        BOWL_CENTER[0] + dx * 1.24,
        5.5,
        BOWL_CENTER[1] + dz * 1.24
      )
      dummy.rotation.set(0, ang, 0)
      dummy.scale.set(1, 1, 1)
      dummy.updateMatrix()
      polesRef.current.setMatrixAt(i, dummy.matrix)

      // Apron pole lamp heads (y = 11.1)
      dummy.position.set(
        BOWL_CENTER[0] + dx * 1.24,
        11.1,
        BOWL_CENTER[1] + dz * 1.24
      )
      dummy.rotation.set(0, ang, 0)
      dummy.scale.set(1, 1, 1)
      dummy.updateMatrix()
      lampHeadsRef.current.setMatrixAt(i, dummy.matrix)
    }
    boothsRef.current.instanceMatrix.needsUpdate = true
    polesRef.current.instanceMatrix.needsUpdate = true
    if (lampHeadsRef.current) lampHeadsRef.current.instanceMatrix.needsUpdate = true
  }, [boothOutline])

  // White Tensile-Roof Arena Geometry (faceted peaked fabric membrane at [429, -131], radius 62m)
  const tentRoofGeo = useMemo(() => {
    const radialSegs = 48
    const rings = 12
    const R = 60
    const pos = []
    const idx = []

    for (let r = 0; r <= rings; r++) {
      const t = r / rings // 0 at center, 1 at outer rim
      const rad = t * R
      for (let a = 0; a <= radialSegs; a++) {
        const theta = (a / radialSegs) * Math.PI * 2
        const scallop = Math.abs(Math.sin(theta * 6))
        const rMod = rad * (1 + (t > 0.5 ? 0.08 * scallop : 0))
        const x = Math.cos(theta) * rMod
        const z = Math.sin(theta) * rMod
        // Crown rises to 26m at center and dips to 6.5m at scalloped rim with 12 radial ridges
        const y =
          6.5 +
          Math.pow(1 - t, 1.35) * 19.5 +
          Math.sin(Math.PI * t) * 2.8 * scallop
        pos.push(x, y, z)
      }
    }
    const cols = radialSegs + 1
    for (let r = 0; r < rings; r++) {
      for (let a = 0; a < radialSegs; a++) {
        const i0 = r * cols + a
        const i1 = i0 + 1
        const i2 = (r + 1) * cols + a
        const i3 = i2 + 1
        idx.push(i0, i2, i1, i1, i2, i3)
      }
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    g.setIndex(idx)
    g.computeVertexNormals()
    return g
  }, [])

  return (
    <group>
      {/* 1. Ring of 44 White Portacabins & Ticket Booths on Stadium Apron */}
      <instancedMesh
        ref={boothsRef}
        args={[undefined, undefined, 44]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[6.8, 3.0, 3.5]} />
        <meshStandardMaterial
          ref={boothMatRef}
          color="#f2efe9"
          emissive="#ffecb0"
          emissiveIntensity={0}
          roughness={0.65}
        />
      </instancedMesh>

      {/* 44 Apron Light Poles */}
      <instancedMesh ref={polesRef} args={[undefined, undefined, 44]}>
        <cylinderGeometry args={[0.16, 0.22, 11, 6]} />
        <meshStandardMaterial color="#7d8084" metalness={0.5} />
      </instancedMesh>

      {/* 44 Apron Lamp Heads with Night Glow */}
      <instancedMesh ref={lampHeadsRef} args={[undefined, undefined, 44]}>
        <cylinderGeometry args={[0.42, 0.22, 0.45, 8]} />
        <meshStandardMaterial
          ref={lampHeadMatRef}
          color="#303236"
          emissive={tokens.lighting.nightPoleLight}
          emissiveIntensity={0}
        />
      </instancedMesh>

      {/* 2. Four White Turnstile Canopies across South Entrance Avenue */}
      {[18, 38, 58, 78].map((cx) => (
        <group key={cx} position={[cx, 0, 215]}>
          <mesh position={[0, 4.2, 0]} castShadow receiveShadow>
            <boxGeometry args={[14, 0.6, 6.2]} />
            <meshStandardMaterial color="#f4f2ec" roughness={0.6} />
          </mesh>
          {[-5.5, 0, 5.5].map((px) => (
            <mesh key={px} position={[px, 2.1, 0]} castShadow>
              <cylinderGeometry args={[0.22, 0.22, 4.2, 8]} />
              <meshStandardMaterial color="#c8c5bc" />
            </mesh>
          ))}
        </group>
      ))}

      {/* 3. Round Landmark Building with 16-Spoke Radial Roof & Open Central Courtyard (OSM Way 1046913215) */}
      <group position={[-143, 0, 45]}>
        {/* Outer cylindrical concrete arcade wall */}
        <mesh position={[0, 3.2, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[26, 26, 6.4, 36, 1, true]} />
          <meshStandardMaterial
            color="#d4cfc4"
            roughness={0.78}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* Inner open courtyard wall */}
        <mesh position={[0, 3.2, 0]}>
          <cylinderGeometry args={[8.2, 8.2, 6.4, 24, 1, true]} />
          <meshStandardMaterial
            color="#b8b2a6"
            roughness={0.8}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* Dark grey-brown annular flat roof */}
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 6.45, 0]}
          receiveShadow
          castShadow
        >
          <ringGeometry args={[8.0, 26.8, 36]} />
          <meshStandardMaterial
            color="#58544f"
            roughness={0.82}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* 16 Light-Concrete Radial Roof Spoke Beams */}
        {Array.from({ length: 16 }, (_, s) => {
          const ang = (s / 16) * Math.PI * 2
          const midR = 17.4
          return (
            <mesh
              key={s}
              position={[Math.cos(ang) * midR, 6.65, Math.sin(ang) * midR]}
              rotation={[0, -ang + Math.PI / 2, 0]}
              castShadow
            >
              <boxGeometry args={[0.75, 0.45, 18.8]} />
              <meshStandardMaterial color="#dfd9ce" roughness={0.65} />
            </mesh>
          )
        })}
        {/* Green trees inside the open central courtyard */}
        {[
          [-2.5, -2.0],
          [2.8, 1.5],
          [0, 2.8],
        ].map(([tx, tz], idx) => (
          <mesh key={idx} position={[tx, 3.8, tz]} castShadow>
            <sphereGeometry args={[3.4, 10, 8]} />
            <meshStandardMaterial color="#3b6636" roughness={0.88} />
          </mesh>
        ))}
      </group>

      {/* 4. West Circular Roundabout Garden with Star Paths & Flagpoles */}
      <group position={[-223, 0, 52]}>
        {/* Circular asphalt ring road */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]} receiveShadow>
          <ringGeometry args={[13.2, 23.5, 40]} />
          <meshStandardMaterial color="#67696d" roughness={0.88} />
        </mesh>
        {/* Concrete outer & inner kerbs */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.09, 0]}>
          <ringGeometry args={[12.4, 13.3, 40]} />
          <meshStandardMaterial color="#c4bfb4" roughness={0.8} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.09, 0]}>
          <ringGeometry args={[23.4, 24.3, 40]} />
          <meshStandardMaterial color="#c4bfb4" roughness={0.8} />
        </mesh>
        {/* Central green lawn island */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.12, 0]} receiveShadow>
          <circleGeometry args={[12.5, 36]} />
          <meshStandardMaterial color="#587738" roughness={0.9} />
        </mesh>
        {/* Cluster of 7 Flagpoles in the Roundabout Island */}
        {Array.from({ length: 7 }, (_, f) => {
          const ang = (f / 7) * Math.PI * 2
          const r = f === 0 ? 0 : 4.5
          return (
            <mesh
              key={f}
              position={[Math.cos(ang) * r, 7, Math.sin(ang) * r]}
              castShadow
            >
              <cylinderGeometry args={[0.12, 0.16, 14, 6]} />
              <meshStandardMaterial color="#e8e6e0" />
            </mesh>
          )
        })}
      </group>

      {/* 5. Helipad (from site-plan.json & foreground of Image 5) */}
      {[
        [-272, 118], // SW helipad visible in foreground of Image 5
        [-306, 31], // West helipad from site-plan.json
      ].map(([hx, hz], idx) => (
        <group key={idx} position={[hx, 0.08, hz]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <circleGeometry args={[20.5, 36]} />
            <meshStandardMaterial color="#918f8a" roughness={0.82} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
            <ringGeometry args={[18.8, 20.2, 36]} />
            <meshStandardMaterial color="#d8d4ca" roughness={0.75} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
            <circleGeometry args={[2.6, 24]} />
            <meshStandardMaterial color="#d9b44a" roughness={0.7} />
          </mesh>
        </group>
      ))}

      {/* 6. White Tensile-Roof Arena with 6 Tall Masts (East-North-East, OSM Way 223440553) */}
      <group position={[426, 0, -112]}>
        {/* Lower arena wall */}
        <mesh position={[0, 4.0, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[52, 54, 8, 24]} />
          <meshStandardMaterial color="#dcd8ce" roughness={0.75} />
        </mesh>
        {/* Faceted white tensile membrane roof */}
        <mesh geometry={tentRoofGeo} castShadow receiveShadow>
          <meshStandardMaterial
            color="#f6f4ec"
            roughness={0.52}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* 6 Tall Angled Steel Masts around perimeter */}
        {Array.from({ length: 6 }, (_, m) => {
          const ang = (m / 6) * Math.PI * 2 + 0.25
          const mx = Math.cos(ang) * 63
          const mz = Math.sin(ang) * 63
          return (
            <mesh
              key={m}
              position={[mx, 21, mz]}
              rotation={[Math.sin(ang) * 0.14, 0, -Math.cos(ang) * 0.14]}
              castShadow
            >
              <cylinderGeometry args={[0.35, 0.65, 42, 8]} />
              <meshStandardMaterial color="#c8c6c0" metalness={0.5} />
            </mesh>
          )
        })}
      </group>

      {/* 7. North-East Training Pitch with Terracotta Track (OSM Way 634881008) */}
      <group position={[62, 0.06, -262]} rotation={[0, PITCH_ROT_Y, 0]}>
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[1, 1.38, 1]}
          receiveShadow
        >
          <circleGeometry args={[54, 48]} />
          <meshStandardMaterial color="#b35438" roughness={0.88} />
        </mesh>
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.02, 0]}
          receiveShadow
        >
          <planeGeometry args={[56, 90]} />
          <meshStandardMaterial color="#c49e54" roughness={0.88} />
        </mesh>
      </group>

      {/* 8. Parabolic Satellite Dishes & Broadcast Compound in SW Lawn (visible in Image 5) */}
      {[
        [-168, 202, 4.2],
        [-188, 198, 2.8],
        [-214, 196, 4.5],
      ].map(([sx, sz, r], idx) => (
        <group key={idx} position={[sx, 0, sz]}>
          <mesh position={[0, 1.4, 0]}>
            <cylinderGeometry args={[0.5, 0.8, 2.8, 8]} />
            <meshStandardMaterial color="#b5b2aa" />
          </mesh>
          <mesh position={[0, 3.2, 0]} rotation={[0.55, 0.3, 0]} castShadow>
            <cylinderGeometry args={[r, r * 0.25, 1.4, 16]} />
            <meshStandardMaterial color="#f4f3ef" roughness={0.4} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/* ---------- 5. Daytime Asphalt Roads, Surrounding Buildings, Trees & Cars ---------- */

function DaytimeRoadNetwork() {
  const roadMeshes = useMemo(() => {
    const list = []
    const roads = osmData.roads || []
    for (const r of roads) {
      if (!r.pts || r.pts.length < 2) continue
      const isMajor =
        r.type.includes('motorway') ||
        r.type.includes('trunk') ||
        r.type.includes('primary')
      const width = isMajor ? 11.5 : r.type === 'service' ? 6.0 : 8.0
      const halfW = width / 2

      const pos = []
      const idx = []
      let vCount = 0

      for (let i = 0; i < r.pts.length - 1; i++) {
        const [x0, z0] = r.pts[i]
        const [x1, z1] = r.pts[i + 1]
        const dx = x1 - x0
        const dz = z1 - z0
        const len = Math.hypot(dx, dz)
        if (len < 0.1) continue
        const nx = (-dz / len) * halfW
        const nz = (dx / len) * halfW
        const y = isMajor ? 0.08 : 0.05

        pos.push(
          x0 + nx,
          y,
          z0 + nz,
          x0 - nx,
          y,
          z0 - nz,
          x1 + nx,
          y,
          z1 + nz,
          x1 - nx,
          y,
          z1 - nz
        )
        idx.push(
          vCount,
          vCount + 2,
          vCount + 1,
          vCount + 1,
          vCount + 2,
          vCount + 3
        )
        vCount += 4
      }
      if (pos.length === 0) continue
      const geo = new THREE.BufferGeometry()
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
      geo.setIndex(idx)
      geo.computeVertexNormals()
      list.push({ id: r.id, geo, isMajor })
    }
    return list
  }, [])

  return (
    <group>
      {roadMeshes.map((r) => (
        <mesh key={r.id} geometry={r.geo} receiveShadow>
          <meshStandardMaterial
            color={r.isMajor ? '#5d5f63' : '#6c6e72'}
            roughness={0.88}
            metalness={0.02}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  )
}

function SurroundingBuildings() {
  const buildingMeshes = useMemo(() => {
    const list = []
    const buildings = osmData.buildings || []
    for (const b of buildings) {
      // Skip 223440553 since we render the high-detail White Tensile Arena directly
      if (b.id === 223440553) continue
      if (!b.poly || b.poly.length < 3) continue
      const shape = new THREE.Shape()
      shape.moveTo(b.poly[0][0], -b.poly[0][1])
      for (let i = 1; i < b.poly.length; i++) {
        shape.lineTo(b.poly[i][0], -b.poly[i][1])
      }
      shape.closePath()
      const h = b.height || 5.5
      const geo = new THREE.ExtrudeGeometry(shape, {
        depth: h,
        bevelEnabled: false,
      })
      geo.rotateX(Math.PI / 2)
      list.push({ id: b.id, geo })
    }
    return list
  }, [])

  return (
    <group>
      {buildingMeshes.map((b, idx) => (
        <mesh key={b.id} geometry={b.geo} castShadow receiveShadow>
          <meshStandardMaterial
            color={idx % 3 === 0 ? '#dfd9ce' : idx % 3 === 1 ? '#cfc7b8' : '#e6e1d6'}
            roughness={0.8}
          />
        </mesh>
      ))}

      {/* Gymnastics & Blue-Roof Buildings to the South-East (from site-plan.json) */}
      <group position={[329, 0, 183]}>
        <mesh position={[0, 4.5, 0]} castShadow receiveShadow>
          <boxGeometry args={[40, 9, 25]} />
          <meshStandardMaterial color="#dbd5c9" roughness={0.78} />
        </mesh>
        <mesh position={[0, 9.3, 0]}>
          <boxGeometry args={[41.5, 0.8, 26.5]} />
          <meshStandardMaterial color="#8f8b84" roughness={0.7} />
        </mesh>
      </group>
      <group position={[360, 0, 73]}>
        <mesh position={[0, 5, 0]} castShadow receiveShadow>
          <boxGeometry args={[48, 10, 41]} />
          <meshStandardMaterial color="#e0dbd0" roughness={0.78} />
        </mesh>
        <mesh position={[0, 10.4, 0]}>
          <boxGeometry args={[49.5, 0.9, 42.5]} />
          <meshStandardMaterial color="#4b6b8a" roughness={0.65} />
        </mesh>
      </group>

      {/* Orange-Roofed Housing Strip in the far North-East (doctors' quarters) */}
      <group position={[630, 0, -250]} rotation={[0, (25 * Math.PI) / 180, 0]}>
        {Array.from({ length: 18 }, (_, i) => {
          const r = Math.floor(i / 6)
          const c = i % 6
          return (
            <group key={i} position={[(r - 1) * 32, 0, (c - 2.5) * 28]}>
              <mesh position={[0, 2.5, 0]}>
                <boxGeometry args={[18, 5, 16]} />
                <meshStandardMaterial color="#e2dcd0" roughness={0.8} />
              </mesh>
              <mesh position={[0, 5.6, 0]}>
                <boxGeometry args={[19.5, 1.4, 17.5]} />
                <meshStandardMaterial color="#b85d3b" roughness={0.75} />
              </mesh>
            </group>
          )
        })}
      </group>
    </group>
  )
}

function SavannaTreesAndParkedCars() {
  const crownsRef = useRef()
  const trunksRef = useRef()
  const carsRef = useRef()

  const { treeList, carList } = useMemo(() => {
    const trees = []
    const addTree = (x, z, scale = 1, tint = 0) => {
      // Never place a tree inside the stadium apron
      const dist = Math.hypot(
        (x - BOWL_CENTER[0]) / 158,
        (z - BOWL_CENTER[1]) / 190
      )
      if (dist < 1.02) return
      trees.push({ x, z, scale, tint })
    }

    // 1. Tree rows in West Terraced Car Park
    for (const rowX of [-168, -196, -224, -252]) {
      for (let z = -125; z <= -5; z += 15) {
        addTree(rowX, z, 0.9 + ((z * 7) % 5) * 0.08, Math.abs(z) % 3)
      }
    }

    // 2. Tree rows in South-West Terraced Car Park
    for (let r = 0; r < 4; r++) {
      for (let k = -4; k <= 4; k++) {
        const bx = -135 - r * 22 + k * 14
        const bz = 135 + r * 18 + k * 10
        addTree(bx, bz, 0.95, (r + k + 10) % 3)
      }
    }

    // 3. Tree rows in East Terraced Car Park
    for (const rowX of [165, 192, 220, 248]) {
      for (let z = -130; z <= 115; z += 16) {
        addTree(rowX, z, 0.92, Math.abs(z) % 3)
      }
    }

    // 4. Curved radial tree rows in North Car Park behind the stadium (matches Image 5)
    for (let a = 0; a < 10; a++) {
      const ang = Math.PI * 1.16 + (a / 9) * Math.PI * 0.68
      for (const rad of [175, 198, 222, 245]) {
        const tx = BOWL_CENTER[0] + Math.cos(ang) * rad
        const tz = BOWL_CENTER[1] + Math.sin(ang) * (rad * 1.1)
        addTree(tx, tz, 0.88 + (a % 3) * 0.12, a % 3)
      }
    }

    // 5. Dense woodland around the White Tensile Arena & Axial Boulevard (matches Image 5)
    for (let t = 0; t < 18; t++) {
      const f = t / 17
      const ax = 185 + f * 175
      const az = -65 - f * 45
      addTree(ax - 8, az - 18, 1.15, t % 3)
      addTree(ax + 8, az + 18, 1.15, (t + 1) % 3)
    }
    for (let i = 0; i < 180; i++) {
      const h1 = Math.sin(i * 91.7) * 43758.5
      const h2 = Math.sin(i * 37.3) * 43758.5
      const fx = h1 - Math.floor(h1)
      const fz = h2 - Math.floor(h2)
      const tx = 240 + fx * 380
      const tz = -340 + fz * 380
      if (Math.hypot(tx - 426, tz - -112) > 68) {
        addTree(tx, tz, 0.9 + (i % 5) * 0.14, i % 3)
      }
    }

    // 6. Trees around West Roundabout, Round Building & Savanna perimeter
    const westClumps = [
      [-120, 88],
      [-105, 102],
      [-92, 114],
      [-168, 72],
      [-180, 68],
      [-192, 18],
      [-172, 14],
      [-245, 75],
      [-262, 62],
      [-135, 195],
      [-108, 212],
      [-155, 225],
      [-85, 245],
      [-122, 265],
    ]
    for (const [wx, wz] of westClumps) {
      addTree(wx, wz, 1.1, 0)
    }

    for (let i = 0; i < 240; i++) {
      const h1 = Math.sin((i + 300) * 53.1) * 43758.5
      const h2 = Math.sin((i + 300) * 19.7) * 43758.5
      const fx = h1 - Math.floor(h1)
      const fz = h2 - Math.floor(h2)
      const tx = -520 + fx * 1040
      const tz = -460 + fz * 920
      // Keep clear of training track and south plaza
      if (
        Math.hypot(tx - 62, tz - -262) > 95 &&
        !(tx > -50 && tx < 140 && tz > 170 && tz < 360)
      ) {
        addTree(tx, tz, 0.85 + (i % 4) * 0.15, i % 3)
      }
    }

    // Parked vehicles & OB broadcast vans in SW, West and East parking lots
    const cars = []
    // OB Broadcast vans in SW parking lot (visible on right side of Image 5)
    for (let v = 0; v < 16; v++) {
      const row = Math.floor(v / 5)
      const col = v % 5
      cars.push({
        x: -118 - row * 18 + col * 9,
        z: 132 + row * 14 + col * 5,
        rot: 0.45,
        isVan: v % 2 === 0,
        colorIdx: v % 6,
      })
    }
    // Cars in West & East car parks
    for (let c = 0; c < 48; c++) {
      const isEast = c >= 24
      const idx = c % 24
      const row = Math.floor(idx / 8)
      const col = idx % 8
      cars.push({
        x: isEast ? 175 + row * 26 : -180 - row * 28,
        z: isEast ? -95 + col * 22 : -110 + col * 14,
        rot: 0,
        isVan: false,
        colorIdx: c % 6,
      })
    }

    return { treeList: trees, carList: cars }
  }, [])

  const volumetricTreeGeo = useMemo(() => createVolumetricTreeGeometry(), [])
  const leafBumpTex = useMemo(() => createLeafBumpTexture(), [])
  const carGeo = useMemo(() => createDetailedCarGeometry(), [])

  useLayoutEffect(() => {
    const dummy = new THREE.Object3D()
    const treeColors = [
      new THREE.Color('#324b22'), // acacia crown
      new THREE.Color('#435a28'), // savanna neem
      new THREE.Color('#4e6430'), // golden dry-season acacia
      new THREE.Color('#273c1a'), // deep olive shade
      new THREE.Color('#394d24'), // savanna green
    ]

    treeList.forEach((t, i) => {
      dummy.position.set(t.x, 4.8 * t.scale, t.z)
      dummy.rotation.set(0, (i * 1.7) % (Math.PI * 2), 0)
      dummy.scale.set(t.scale * 1.15, t.scale * 0.9, t.scale * 1.15)
      dummy.updateMatrix()
      crownsRef.current.setMatrixAt(i, dummy.matrix)
      crownsRef.current.setColorAt(i, treeColors[t.tint % treeColors.length])

      dummy.position.set(t.x, 1.8 * t.scale, t.z)
      dummy.scale.set(t.scale, t.scale, t.scale)
      dummy.updateMatrix()
      trunksRef.current.setMatrixAt(i, dummy.matrix)
    })
    crownsRef.current.instanceMatrix.needsUpdate = true
    if (crownsRef.current.instanceColor)
      crownsRef.current.instanceColor.needsUpdate = true
    trunksRef.current.instanceMatrix.needsUpdate = true

    const carColors = [
      new THREE.Color('#f3f4f6'),
      new THREE.Color('#e5e7eb'),
      new THREE.Color('#2563eb'),
      new THREE.Color('#374151'),
      new THREE.Color('#b91c1c'),
      new THREE.Color('#d1d5db'),
    ]
    carList.forEach((c, i) => {
      dummy.position.set(c.x, c.isVan ? 1.5 : 0.9, c.z)
      dummy.rotation.set(0, c.rot, 0)
      dummy.scale.set(
        c.isVan ? 1.35 : 1,
        c.isVan ? 1.65 : 1,
        c.isVan ? 1.55 : 1
      )
      dummy.updateMatrix()
      carsRef.current.setMatrixAt(i, dummy.matrix)
      carsRef.current.setColorAt(
        i,
        c.isVan ? carColors[0] : carColors[c.colorIdx]
      )
    })
    carsRef.current.instanceMatrix.needsUpdate = true
    if (carsRef.current.instanceColor)
      carsRef.current.instanceColor.needsUpdate = true
  }, [treeList, carList])

  return (
    <group>
      <instancedMesh
        ref={crownsRef}
        args={[volumetricTreeGeo, undefined, treeList.length]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          roughness={0.82}
          bumpMap={leafBumpTex}
          bumpScale={0.35}
        />
      </instancedMesh>
      <instancedMesh
        ref={trunksRef}
        args={[undefined, undefined, treeList.length]}
        castShadow
      >
        <cylinderGeometry args={[0.32, 0.58, 4.0, 7]} />
        <meshStandardMaterial color="#38281b" roughness={0.94} />
      </instancedMesh>
      <instancedMesh
        ref={carsRef}
        args={[carGeo, undefined, carList.length]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial roughness={0.42} metalness={0.25} />
      </instancedMesh>
    </group>
  )
}

/* ---------- 6. Interactive Zones, LOD Seating Selection, Stage & Vendors ---------- */

function InteractiveSectionSeats({ id }) {
  const { rows, cols, width } = zones[id].seating
  const count = rows * cols
  const seatW = width / cols
  const ref = useRef()
  const selected = useVenue((s) => s.selectedSeat)
  const activeZone = useVenue((s) => s.activeZone)
  const focusZone = useVenue((s) => s.focusZone)
  const selectSeat = useVenue((s) => s.selectSeat)

  // Only render instanced 3D seats when the camera has zoomed into this section (LOD per Section 7)
  const isSectionActive = activeZone === id

  const ROW_D = 1.05
  const ROW_H = 0.82

  useLayoutEffect(() => {
    if (!ref.current || !isSectionActive) return
    const o = new THREE.Object3D()
    for (let i = 0; i < count; i++) {
      const r = Math.floor(i / cols)
      const c = i % cols
      o.position.set(
        (c + 0.5) * seatW - width / 2,
        2.4 + r * ROW_H,
        -r * ROW_D
      )
      o.updateMatrix()
      ref.current.setMatrixAt(i, o.matrix)
    }
    ref.current.instanceMatrix.needsUpdate = true
  }, [count, cols, seatW, width, isSectionActive])

  // Real mosaic colours for free seats, desaturated grey for taken, white for selected
  useLayoutEffect(() => {
    if (!ref.current || !isSectionActive) return
    const taken = new THREE.Color('#787570')
    const pick = new THREE.Color('#ffffff')
    const tierPalette =
      id === 'vip' ? 'vip' : id === 'general' ? 'upper' : 'lower'

    for (let i = 0; i < count; i++) {
      const r = Math.floor(i / cols)
      const c = i % cols
      const isSelected = selected?.zoneId === id && selected.index === i
      const freeColor = new THREE.Color(seatColor(tierPalette, r, c, 3))
      ref.current.setColorAt(
        i,
        isSelected ? pick : isSeatTaken(id, i) ? taken : freeColor
      )
    }
    ref.current.instanceColor.needsUpdate = true
  }, [selected, id, count, cols, isSectionActive])

  if (!isSectionActive) return null

  return (
    <instancedMesh
      ref={ref}
      args={[undefined, undefined, count]}
      onClick={(e) => {
        e.stopPropagation()
        if (activeZone !== id) return focusZone(id)
        const i = e.instanceId
        if (i == null || isSeatTaken(id, i)) return
        selectSeat({
          zoneId: id,
          index: i,
          label: `Row ${Math.floor(i / cols) + 1}, Seat ${(i % cols) + 1}`,
        })
      }}
    >
      <boxGeometry args={[seatW * 0.74, 0.45, 0.58]} />
      <meshStandardMaterial roughness={0.55} />
    </instancedMesh>
  )
}

function SeatingSectionProxy({ id, position, rotationY }) {
  const { width } = zones[id].seating
  const hovered = useVenue((s) => s.hovered === id)
  const active = useVenue((s) => s.activeZone === id)

  return (
    <Zone id={id} position={position} rotation={[0, rotationY, 0]}>
      {/* Invisible click/hover proxy aligned with the raked lower/upper stand */}
      <mesh position={[0, 8, -6]} rotation={[-0.65, 0, 0]} visible={false}>
        <boxGeometry args={[width, 18, 2.5]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      {/* Subtle coloured edge banner along the front barrier when hovered or active */}
      {(hovered || active) && (
        <mesh position={[0, 2.35, 0.2]}>
          <boxGeometry args={[width, 0.45, 0.35]} />
          <meshStandardMaterial color={zones[id].color} roughness={0.4} />
        </mesh>
      )}
      <InteractiveSectionSeats id={id} />
    </Zone>
  )
}

function MainStageAndFloor() {
  const activeZone = useVenue((s) => s.activeZone)
  const isTouring = useVenue((s) => s.isTouring)
  const ledTrackIndex = useVenue((s) => s.ledTrackIndex)
  const liveShow = useVenue((s) => s.liveShow)

  const playlist = liveShow ? playlists.show : playlists.idle
  const currentTrack = playlist[ledTrackIndex % playlist.length] || playlist[0]

  // Stage placed at South end of pitch opposite North scoreboard per Section 9
  return (
    <group
      position={[PITCH_CENTER[0], 0, PITCH_CENTER[1]]}
      rotation={[0, PITCH_ROT_Y, 0]}
    >
      <Zone id="stage" position={[0, 0, 44]} rotation={[0, Math.PI, 0]}>
        {/* Main Stage Base Deck */}
        <mesh position={[0, 1.4, 0]} castShadow receiveShadow>
          <boxGeometry args={[38, 2.8, 14]} />
          <meshStandardMaterial color="#1a1c20" roughness={0.7} />
        </mesh>

        {/* Stage Sub-woofer Front Line */}
        <mesh position={[0, 0.5, 7.1]} castShadow>
          <boxGeometry args={[34, 1.0, 0.9]} />
          <meshStandardMaterial color="#111315" roughness={0.8} />
        </mesh>

        {/* 1. Centre Flagship LED Wall (size: 32m x 9m, aspect-cover zero distortion, playing event video) */}
        <LEDScreen
          size={[32, 9]}
          position={[0, 8.5, -5.2]}
          src="/video/stage-screen-video.mp4"
          poster="/video/stage-screen-poster.jpg"
          focus={[0.5, 0.48]}
        />

        {/* 2. Left IMAG Side Wing (size: 9m x 16m portrait, playing event video) */}
        <LEDScreen
          size={[9, 16]}
          position={[-19.8, 10.0, -4.8]}
          rotation={[0, 0.16, 0]}
          src="/video/stage-screen-video.mp4"
          poster="/video/stage-screen-poster.jpg"
          focus={[0.5, 0.5]}
        />

        {/* 3. Right IMAG Side Wing (size: 9m x 16m portrait, playing event video) */}
        <LEDScreen
          size={[9, 16]}
          position={[19.8, 10.0, -4.8]}
          rotation={[0, -0.16, 0]}
          src="/video/stage-screen-video.mp4"
          poster="/video/stage-screen-poster.jpg"
          focus={[0.5, 0.5]}
        />

        {/* Line Array Speaker Columns (Suspended beside stage wings) */}
        {[-26, 26].map((sx) => (
          <group key={sx} position={[sx, 12, -2.5]}>
            {Array.from({ length: 8 }, (_, i) => (
              <mesh
                key={i}
                position={[0, -i * 0.75, Math.pow(i * 0.12, 1.4)]}
                rotation={[i * 0.05, 0, 0]}
                castShadow
              >
                <boxGeometry args={[1.5, 0.65, 1.0]} />
                <meshStandardMaterial color="#1e2024" roughness={0.5} />
              </mesh>
            ))}
          </group>
        ))}

        {/* Heavy Black Aluminum Truss Roof Grid overhead */}
        <mesh position={[0, 18.5, -0.5]} castShadow>
          <boxGeometry args={[44, 1.2, 16]} />
          <meshStandardMaterial color="#2d3036" metalness={0.7} roughness={0.35} />
        </mesh>

        {/* Four Massive Structural Truss Towers */}
        {[-21, 21].map((tx) =>
          [-7, 7].map((tz) => (
            <mesh key={`${tx}-${tz}`} position={[tx, 9.2, tz]} castShadow>
              <cylinderGeometry args={[0.55, 0.55, 18.5, 8]} />
              <meshStandardMaterial color="#363940" metalness={0.7} roughness={0.35} />
            </mesh>
          ))
        )}

        {/* Front Stage Crowd Safety Barrier */}
        <mesh position={[0, 0.6, 9.2]} castShadow>
          <boxGeometry args={[42, 1.2, 0.15]} />
          <meshStandardMaterial color="#686b72" metalness={0.8} roughness={0.3} />
        </mesh>

        {/* Live Show Concert Lighting: Moving searchlight beams, lasers & sparkles */}
        <LiveShowEffects stagePosition={[0, 18.2, 0]} />
      </Zone>

      {/* Front-Of-House (FOH) Sound & Lighting Tent on the pitch */}
      <group position={[0, 0, 10]}>
        <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
          <boxGeometry args={[7.2, 0.9, 4.8]} />
          <meshStandardMaterial color="#1f2226" roughness={0.8} />
        </mesh>
        <mesh position={[0, 2.6, 0]} castShadow>
          <boxGeometry args={[7.4, 0.25, 5.0]} />
          <meshStandardMaterial color="#2a2e34" metalness={0.4} />
        </mesh>
        {[-3.4, 3.4].map((px) =>
          [-2.2, 2.2].map((pz) => (
            <mesh key={`${px}-${pz}`} position={[px, 1.5, pz]} castShadow>
              <cylinderGeometry args={[0.08, 0.08, 2.3, 6]} />
              <meshStandardMaterial color="#555860" metalness={0.7} />
            </mesh>
          ))
        )}
      </group>

      {/* Standing Floor Arena on Pitch */}
      <Zone id="floor" position={[0, 0.1, 14]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} visible={activeZone === 'floor'}>
          <planeGeometry args={[56, 46]} />
          <meshStandardMaterial
            color={tokens.colors.green}
            transparent
            opacity={0.25}
          />
        </mesh>
      </Zone>
    </group>
  )
}

const AWNINGS = [
  '#f2784b',
  '#e0a83e',
  '#5aa9e6',
  '#d46a8a',
  '#7bc67b',
  '#4cc9b0',
]

function VendorVillageAndZones() {
  return (
    <group>
      {/* Vendor Village on East Apron Promenade */}
      <Zone id="vendors" position={[132, 0, 18]}>
        {Array.from({ length: 12 }, (_, i) => {
          const x = (i % 2) * 11
          const z = (Math.floor(i / 2) - 2.5) * 10
          return (
            <group key={i} position={[x, 0, z]}>
              <mesh position={[0, 1.6, 0]} castShadow receiveShadow>
                <boxGeometry args={[5.5, 3.2, 4.5]} />
                <meshStandardMaterial color="#f2efe9" roughness={0.7} />
              </mesh>
              <mesh position={[0, 3.4, 0]} castShadow>
                <boxGeometry args={[6.2, 0.35, 5.2]} />
                <meshStandardMaterial
                  color={AWNINGS[i % AWNINGS.length]}
                  roughness={0.6}
                />
              </mesh>
            </group>
          )
        })}
      </Zone>

      {/* Car Park Zone Proxy (South-West & East Terraced Car Parks) */}
      <Zone id="carpark" position={[-135, 0, 155]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.2, 0]} visible={false}>
          <planeGeometry args={[140, 110]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      </Zone>

      {/* Restrooms & Concourse Services Proxy */}
      <Zone id="restrooms" position={[-118, 0, 18]}>
        <mesh position={[0, 3, 0]} visible={false}>
          <boxGeometry args={[20, 8, 28]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      </Zone>
    </group>
  )
}

/* ---------- Whole Daytime Abuja Stadium Scene Composition ---------- */

export default function Stadium({ hideConcertOverlay = false }) {
  const bowlOutline = useMemo(() => resample(osmData.bowl, N_RESAMPLE), [])
  const qualityTier = useVenue((s) => s.qualityTier)

  return (
    <group>
      {/* 1. Savanna Terrain, Apron, Terraced Car Parks, Rocky Hill & Skyline */}
      <SavannaTerrainAndSurroundings />
      <SiteInfrastructure />

      {/* 2. Real Moshood Abiola National Stadium Bowl, Quilted Roof & Arcade Facade */}
      <RealisticStadiumShell />

      {/* 3. Athletics Track, Football Pitch, Goals, Advertising Boards & Dugouts */}
      <RunningTrackAndPitch />

      {/* 4. Site Plan Landmarks: Apron Booths, Round Building, Roundabout, Helipad, White Tensile Arena & Training Track */}
      <SiteLandmarksAndApronFurniture />

      {/* 5. Daytime Asphalt Roads, Surrounding Buildings, Savanna Trees & Cars */}
      <DaytimeRoadNetwork />
      <SurroundingBuildings />
      <SavannaTreesAndParkedCars />

      {/* Broader Abuja City Environment, Landmarks, Highway Traffic, Streetlights & Aso Rock */}
      {qualityTier !== 'simple' && <AbujaCity />}

      {/* 6. Interactive Seating Sections (VIP West, Premium East, General South/Upper) */}
      <SeatingSectionProxy
        id="vip"
        position={[-64, 0, 18]}
        rotationY={Math.PI / 2 + PITCH_ROT_Y}
      />
      <SeatingSectionProxy
        id="premium"
        position={[58, 0, 6]}
        rotationY={-Math.PI / 2 + PITCH_ROT_Y}
      />
      <SeatingSectionProxy
        id="general"
        position={[14, 0, 82]}
        rotationY={Math.PI + PITCH_ROT_Y}
      />

      {/* 7. Concert Stage, Floor Arena, Instanced Realistic Crowds & Vendor Village */}
      {!hideConcertOverlay && <MainStageAndFloor />}
      {!hideConcertOverlay && <Crowd bowlOutline={bowlOutline} />}
      <VendorVillageAndZones />
    </group>
  )
}
