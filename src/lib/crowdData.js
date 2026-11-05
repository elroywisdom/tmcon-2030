// src/lib/crowdData.js
// Procedural low-poly crowd geometry, sampling algorithms, and authentic Nigerian event color palettes.
// Based on PHASE4_DAYNIGHT_LED_CROWD_INTRO.md Section 4.

import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { tokens } from '@/styles/tokens'
import { isSeatTaken, zones } from '@/data/zones'

export const CROWD_BUDGETS = {
  off: { floor: 0, seated: 0 },
  low: { floor: 2500, seated: 6500 },
  medium: { floor: 7000, seated: 16000 },
  high: { floor: 15000, seated: 32000 },
}

// Authentic Nigerian skin tone palette across rich melanin ranges
export const NIGERIAN_SKIN_TONES = [
  '#2a1a12', // Deep rich espresso
  '#392316', // Dark mahogany
  '#4a2f1e', // Warm chestnut
  '#5c3a26', // Warm cocoa
  '#6e4730', // Caramel bronze
  '#82563b', // Warm honey amber
  '#956447', // Light bronze amber
]

// Authentic Nigerian conference / event fashion palette
export const CROWD_CLOTHING_COLORS = [
  // Crisp White & Ivory (popular celebratory kaftans & crisp tees) ~25%
  '#ffffff',
  '#f5f6f8',
  '#edeae1',
  '#f8f8fa',
  // TM CON Brand accents (Tokens) ~20%
  tokens.colors.orange,
  tokens.colors.orange75,
  tokens.colors.green,
  tokens.colors.green75,
  tokens.colors.navy,
  tokens.colors.navy75,
  tokens.colors.lavender,
  // Charcoal / Slate / Deep Black ~20%
  '#16171a',
  '#22242a',
  '#2d3038',
  '#3a3e47',
  // Savanna Earth / Terracotta / Warm Mustard ~15%
  '#a64e32',
  '#ba6746',
  '#c88c3e',
  '#8d6842',
  '#ad7845',
  // Sand / Khaki / Cream ~10%
  '#d5cab8',
  '#c6bca8',
  '#e2d8c6',
  // Royal / Indigo / Deep Teal ~10%
  '#1a3356',
  '#1c425e',
  '#24566c',
]

function addBox(boxes, { min, max, partType, isArm = 0, armPivot = [0, 0, 0] }) {
  const [x0, y0, z0] = min
  const [x1, y1, z1] = max
  const sx = x1 - x0
  const sy = y1 - y0
  const sz = z1 - z0
  const cx = (x0 + x1) / 2
  const cy = (y0 + y1) / 2
  const cz = (z0 + z1) / 2

  const geo = new THREE.BoxGeometry(sx, sy, sz)
  geo.translate(cx, cy, cz)

  const count = geo.attributes.position.count
  const partArr = new Float32Array(count).fill(partType)
  const armArr = new Float32Array(count).fill(isArm)
  const pivotArr = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    pivotArr[i * 3 + 0] = armPivot[0]
    pivotArr[i * 3 + 1] = armPivot[1]
    pivotArr[i * 3 + 2] = armPivot[2]
  }

  geo.setAttribute('aPartType', new THREE.BufferAttribute(partArr, 1))
  geo.setAttribute('aIsArm', new THREE.BufferAttribute(armArr, 1))
  geo.setAttribute('aArmPivot', new THREE.BufferAttribute(pivotArr, 3))

  boxes.push(geo)
}

/**
 * Creates low-poly standing human geometry (~132 triangles).
 * Attributes:
 * - aPartType: 0=pants, 1=shirt, 2=skin, 3=hair/cap, 4=phone
 * - aIsArm: 0=body, 1=left arm, 2=right arm
 * - aArmPivot: shoulder coordinates for vertex shader arm raise
 */
export function createStandingPersonGeometry() {
  const parts = []

  // 1. Trousers/Legs (partType = 0)
  addBox(parts, { min: [-0.14, 0.0, -0.07], max: [-0.02, 0.82, 0.07], partType: 0 })
  addBox(parts, { min: [0.02, 0.0, -0.07], max: [0.14, 0.82, 0.07], partType: 0 })

  // 2. Torso with tapered waist and chest (partType = 1) - P1 rounded silhouette
  addBox(parts, { min: [-0.15, 0.82, -0.08], max: [0.15, 1.12, 0.08], partType: 1 })
  addBox(parts, { min: [-0.18, 1.12, -0.09], max: [0.18, 1.38, 0.09], partType: 1 })
  // Rounded shoulder bevels
  addBox(parts, { min: [-0.20, 1.30, -0.06], max: [-0.16, 1.40, 0.06], partType: 1 })
  addBox(parts, { min: [0.16, 1.30, -0.06], max: [0.20, 1.40, 0.06], partType: 1 })

  // 3. Head & Neck (partType = 2, skin)
  addBox(parts, { min: [-0.05, 1.38, -0.05], max: [0.05, 1.45, 0.05], partType: 2 })
  addBox(parts, { min: [-0.09, 1.45, -0.09], max: [0.09, 1.66, 0.09], partType: 2 })

  // 4. Headwear: Kufi cap / traditional wrap (partType = 3)
  addBox(parts, { min: [-0.10, 1.62, -0.10], max: [0.10, 1.73, 0.10], partType: 3 })
  addBox(parts, { min: [-0.11, 1.66, -0.11], max: [0.11, 1.75, 0.11], partType: 3 })

  // 5. Left Arm (isArm = 1)
  const leftPivot = [-0.19, 1.36, 0.0]
  addBox(parts, { min: [-0.23, 0.96, -0.045], max: [-0.17, 1.38, 0.045], partType: 1, isArm: 1, armPivot: leftPivot })
  addBox(parts, { min: [-0.22, 0.80, -0.035], max: [-0.18, 0.96, 0.035], partType: 2, isArm: 1, armPivot: leftPivot })

  // 6. Right Arm (isArm = 2)
  const rightPivot = [0.19, 1.36, 0.0]
  addBox(parts, { min: [0.17, 0.96, -0.045], max: [0.23, 1.38, 0.045], partType: 1, isArm: 2, armPivot: rightPivot })
  addBox(parts, { min: [0.18, 0.80, -0.035], max: [0.22, 0.96, 0.035], partType: 2, isArm: 2, armPivot: rightPivot })

  // 7. Smartphone in right hand (partType = 4)
  addBox(parts, { min: [0.18, 0.82, 0.05], max: [0.23, 0.93, 0.07], partType: 4, isArm: 2, armPivot: rightPivot })

  return mergeGeometries(parts, false)
}

/**
 * Creates low-poly seated human geometry (~160 triangles) with rounded shoulders.
 */
export function createSeatedPersonGeometry() {
  const parts = []

  // 1. Thighs resting forward (partType = 0)
  addBox(parts, { min: [-0.14, 0.36, -0.05], max: [0.14, 0.46, 0.35], partType: 0 })

  // 2. Lower legs / shins down to footrest (partType = 0)
  addBox(parts, { min: [-0.14, 0.02, 0.26], max: [-0.02, 0.36, 0.37], partType: 0 })
  addBox(parts, { min: [0.02, 0.02, 0.26], max: [0.14, 0.36, 0.37], partType: 0 })

  // 3. Torso / Shirt (partType = 1) with waist taper and shoulder rounding
  addBox(parts, { min: [-0.15, 0.46, -0.08], max: [0.15, 0.78, 0.08], partType: 1 })
  addBox(parts, { min: [-0.18, 0.78, -0.09], max: [0.18, 1.05, 0.09], partType: 1 })
  addBox(parts, { min: [-0.20, 0.98, -0.06], max: [-0.16, 1.07, 0.06], partType: 1 })
  addBox(parts, { min: [0.16, 0.98, -0.06], max: [0.20, 1.07, 0.06], partType: 1 })

  // 4. Head & Neck (partType = 2)
  addBox(parts, { min: [-0.05, 1.05, -0.05], max: [0.05, 1.11, 0.05], partType: 2 })
  addBox(parts, { min: [-0.09, 1.11, -0.09], max: [0.09, 1.30, 0.09], partType: 2 })

  // 5. Cap / Headwear (partType = 3)
  addBox(parts, { min: [-0.10, 1.26, -0.10], max: [0.10, 1.37, 0.10], partType: 3 })
  addBox(parts, { min: [-0.11, 1.30, -0.11], max: [0.11, 1.39, 0.11], partType: 3 })

  // 6. Left Arm (isArm = 1)
  const leftPivot = [-0.19, 1.03, 0.0]
  addBox(parts, { min: [-0.23, 0.68, -0.045], max: [-0.17, 1.05, 0.045], partType: 1, isArm: 1, armPivot: leftPivot })
  addBox(parts, { min: [-0.22, 0.52, 0.05], max: [-0.18, 0.68, 0.24], partType: 2, isArm: 1, armPivot: leftPivot })

  // 7. Right Arm (isArm = 2)
  const rightPivot = [0.19, 1.03, 0.0]
  addBox(parts, { min: [0.17, 0.68, -0.045], max: [0.23, 1.05, 0.045], partType: 1, isArm: 2, armPivot: rightPivot })
  addBox(parts, { min: [0.18, 0.52, 0.05], max: [0.22, 0.68, 0.24], partType: 2, isArm: 2, armPivot: rightPivot })

  // 8. Smartphone in right hand (partType = 4)
  addBox(parts, { min: [0.18, 0.56, 0.23], max: [0.23, 0.66, 0.26], partType: 4, isArm: 2, armPivot: rightPivot })

  return mergeGeometries(parts, false)
}

const PITCH_CENTER = [-3.0, 12.3]
const PITCH_ROT_Y = (16 * Math.PI) / 180
const BOWL_CENTER = [-3.8, 12.1]

// Pseudorandom deterministic hash
function hash2(x, y) {
  let h = (x * 374761393 + y * 668265263) ^ 0x5bf03635
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

/**
 * Samples standing crowd points on the football pitch in front of the stage.
 * Fills the entire football pitch to the brim from touchline to touchline and goal to stage.
 * Faces the stage center [0, 2.5, 44] in pitch coordinate space.
 */
export function sampleFloorCrowd(maxBudget = 15000) {
  const points = []
  const step = 0.65 // ~0.65m spacing for high-density concert floor crowd
  const xMin = -34.2
  const xMax = 34.2
  const zMin = -52.2
  const zMax = 35.4

  let idx = 0
  for (let z = zMax; z >= zMin; z -= step) {
    const rowOffset = (Math.round(Math.abs(z) * 10) % 2 === 0) ? 0 : step * 0.5

    for (let x = xMin + rowOffset; x <= xMax; x += step) {
      idx++
      const jitterX = (hash2(idx, 1) - 0.5) * 0.22
      const jitterZ = (hash2(idx, 2) - 0.5) * 0.22
      const px = x + jitterX
      const pz = z + jitterZ

      // Boundaries & Exclusions:
      // 1. Stage safety front barrier
      if (pz > 35.5) continue
      // 2. Far goal line edge of pitch
      if (pz < -52.5) continue
      // 3. Touchline boundary
      if (Math.abs(px) > 34.5) continue

      // 4. FOH sound & lighting console tent in center of pitch
      if (Math.abs(px) < 4.2 && pz > 7.5 && pz < 12.5) continue

      // 5. Very subtle narrow central emergency runner
      if (Math.abs(px) < 0.55 && pz < 6.0 && pz > -40.0 && hash2(idx, 3) < 0.65) continue

      // High density across entire football pitch (packed to the brim: 93% occupancy)
      if (hash2(idx, 4) > 0.93) continue

      // Local orientation: all floor attendees face the stage center [0, 2.5, 44]
      const toStageX = 0 - px
      const toStageZ = 44 - pz
      const localRotY = Math.atan2(toStageX, toStageZ)
      const headJitter = (hash2(idx, 19) - 0.5) * 0.24
      const worldRotY = localRotY + PITCH_ROT_Y + headJitter

      // Transform local pitch point (px, 0.12, pz) to world coordinates
      const cosR = Math.cos(PITCH_ROT_Y)
      const sinR = Math.sin(PITCH_ROT_Y)
      const wx = PITCH_CENTER[0] + (px * cosR + pz * sinR)
      const wz = PITCH_CENTER[1] + (-px * sinR + pz * cosR)
      const wy = 0.12

      const skinColor = NIGERIAN_SKIN_TONES[Math.floor(hash2(idx, 5) * NIGERIAN_SKIN_TONES.length)]
      const clothesColor = CROWD_CLOTHING_COLORS[Math.floor(hash2(idx, 6) * CROWD_CLOTHING_COLORS.length)]
      const phase = hash2(idx, 7) * Math.PI * 2
      const hairTone = Math.floor(hash2(idx, 8) * 3) // 0=dark, 1=white cap, 2=brand cap
      const hasPhone = hash2(idx, 9) < 0.28 ? 1.0 : 0.0 // 28% have smartphones out
      const heightScale = 0.93 + hash2(idx, 10) * 0.14

      points.push({
        position: [wx, wy, wz],
        rotationY: worldRotY,
        skinColor,
        clothesColor,
        phase,
        hairTone,
        hasPhone,
        heightScale,
      })

      if (points.length >= maxBudget) return points
    }
  }

  return points
}

/**
 * Samples seated crowd points matching taken seats and realistic stadium bowl occupancy.
 * Densely populates both Lower and Upper tiers across the entire 60,000-seat bowl.
 */
export function sampleSeatedCrowd(maxBudget = 35000, bowlOutline) {
  const points = []
  let seed = 42

  // --- Part 1: Interactive Seating Sections (VIP, Premium, General) ---
  const interactiveConfigs = [
    {
      id: 'vip',
      worldPos: [-64, 0, 18],
      worldRotY: Math.PI / 2 + PITCH_ROT_Y,
    },
    {
      id: 'premium',
      worldPos: [58, 0, 6],
      worldRotY: -Math.PI / 2 + PITCH_ROT_Y,
    },
    {
      id: 'general',
      worldPos: [14, 0, 82],
      worldRotY: Math.PI + PITCH_ROT_Y,
    },
  ]

  const ROW_D = 1.05
  const ROW_H = 0.82

  for (const config of interactiveConfigs) {
    const sec = zones[config.id]?.seating
    if (!sec) continue
    const { rows, cols, width } = sec
    const seatW = width / cols
    const totalSeats = rows * cols

    const sectionMatrix = new THREE.Matrix4().compose(
      new THREE.Vector3(...config.worldPos),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0, config.worldRotY, 0)),
      new THREE.Vector3(1, 1, 1)
    )

    for (let i = 0; i < totalSeats; i++) {
      seed++
      // Only place crowd in taken seats
      if (!isSeatTaken(config.id, i)) continue
      // Fill ~90% of taken seats
      if (hash2(seed, 10) > 0.90) continue

      const r = Math.floor(i / cols)
      const c = i % cols

      // Local seat position (hip height on chair)
      const localPos = new THREE.Vector3(
        (c + 0.5) * seatW - width / 2,
        2.4 + r * ROW_H + 0.28,
        -r * ROW_D
      )
      localPos.applyMatrix4(sectionMatrix)

      const wx = localPos.x
      const wy = localPos.y
      const wz = localPos.z

      // Face towards pitch center with natural posture variation
      const rotY = Math.atan2(PITCH_CENTER[0] - wx, PITCH_CENTER[1] - wz) + (hash2(seed, 11) - 0.5) * 0.18

      const skinColor = NIGERIAN_SKIN_TONES[Math.floor(hash2(seed, 12) * NIGERIAN_SKIN_TONES.length)]
      const clothesColor = CROWD_CLOTHING_COLORS[Math.floor(hash2(seed, 13) * CROWD_CLOTHING_COLORS.length)]
      const phase = hash2(seed, 14) * Math.PI * 2
      const hairTone = Math.floor(hash2(seed, 15) * 3)
      const hasPhone = hash2(seed, 16) < 0.24 ? 1.0 : 0.0
      const heightScale = 0.94 + hash2(seed, 17) * 0.12

      points.push({
        position: [wx, wy, wz],
        rotationY: rotY,
        skinColor,
        clothesColor,
        phase,
        hairTone,
        hasPhone,
        heightScale,
      })

      if (points.length >= maxBudget) return points
    }
  }

  // --- Part 2: Entire 60,000-seat stadium bowl (Lower and Upper tiers) ---
  if (!bowlOutline || bowlOutline.length === 0) return points

  const nCols = bowlOutline.length
  const GAP_START = 138
  const GAP_END = 154

  // Lower tier: 16 rows, 4 sub-seats per outline column (spacing ~0.55m per seat)
  const lowerRows = 16
  for (let r = 0; r < lowerRows; r++) {
    const s = 0.505 + (r / (lowerRows - 1)) * 0.130
    const y = 2.4 + (r / (lowerRows - 1)) * 11.2

    for (let c = 0; c < nCols; c++) {
      // Vomitoria / stairway aisle clearance every 16 columns (every 2 bays)
      if (c % 16 === 0) continue

      // Skip narrow footprint of interactive sections to prevent duplicate overlap
      if ((c >= 202 && c <= 218) || (c >= 73 && c <= 89)) continue

      const nextC = (c + 1) % nCols
      const [ox1, oz1] = bowlOutline[c]
      const [ox2, oz2] = bowlOutline[nextC]

      for (let sub = 0; sub < 4; sub++) {
        seed++
        const t = (sub + 0.5) / 4
        const ox = ox1 + (ox2 - ox1) * t
        const oz = oz1 + (oz2 - oz1) * t

        const dx = ox - BOWL_CENTER[0]
        const dz = oz - BOWL_CENTER[1]

        // High occupancy: 91%
        if (hash2(seed, 20) > 0.91) continue

        const wx = BOWL_CENTER[0] + dx * s
        const wz = BOWL_CENTER[1] + dz * s
        const wy = y + 0.28

        const rotY = Math.atan2(PITCH_CENTER[0] - wx, PITCH_CENTER[1] - wz) + (hash2(seed, 21) - 0.5) * 0.20

        const skinColor = NIGERIAN_SKIN_TONES[Math.floor(hash2(seed, 22) * NIGERIAN_SKIN_TONES.length)]
        const clothesColor = CROWD_CLOTHING_COLORS[Math.floor(hash2(seed, 23) * CROWD_CLOTHING_COLORS.length)]
        const phase = hash2(seed, 24) * Math.PI * 2
        const hairTone = Math.floor(hash2(seed, 25) * 3)
        const hasPhone = hash2(seed, 26) < 0.22 ? 1.0 : 0.0
        const heightScale = 0.94 + hash2(seed, 27) * 0.12

        points.push({
          position: [wx, wy, wz],
          rotationY: rotY,
          skinColor,
          clothesColor,
          phase,
          hairTone,
          hasPhone,
          heightScale,
        })

        if (points.length >= maxBudget) return points
      }
    }
  }

  // Upper tier: 22 rows, 4 sub-seats per outline column
  const upperRows = 22
  for (let r = 0; r < upperRows; r++) {
    const s = 0.690 + (r / (upperRows - 1)) * 0.155
    const rawY = 20.4 + (r / (upperRows - 1)) * 12.4

    for (let c = 0; c < nCols; c++) {
      // Skip North scoreboard opening
      if (c >= GAP_START && c < GAP_END) continue
      // Vomitoria / stairway aisle clearance every 16 columns
      if (c % 16 === 0) continue

      const nextC = (c + 1) % nCols
      const [ox1, oz1] = bowlOutline[c]
      const [ox2, oz2] = bowlOutline[nextC]

      for (let sub = 0; sub < 4; sub++) {
        seed++
        const t = (sub + 0.5) / 4
        const ox = ox1 + (ox2 - ox1) * t
        const oz = oz1 + (oz2 - oz1) * t

        const dx = ox - BOWL_CENTER[0]
        const dz = oz - BOWL_CENTER[1]

        // Subtle saddle dip matching upperTierGeo
        const ang = Math.atan2(dz, dx) - PITCH_ROT_Y
        const endFactor = Math.pow(Math.sin(ang), 2)
        const ratio = (rawY - 20.2) / 13.0
        const wy = rawY - endFactor * 2.2 * ratio + 0.28

        // High occupancy: 90%
        if (hash2(seed, 30) > 0.90) continue

        const wx = BOWL_CENTER[0] + dx * s
        const wz = BOWL_CENTER[1] + dz * s

        const rotY = Math.atan2(PITCH_CENTER[0] - wx, PITCH_CENTER[1] - wz) + (hash2(seed, 31) - 0.5) * 0.20

        const skinColor = NIGERIAN_SKIN_TONES[Math.floor(hash2(seed, 32) * NIGERIAN_SKIN_TONES.length)]
        const clothesColor = CROWD_CLOTHING_COLORS[Math.floor(hash2(seed, 33) * CROWD_CLOTHING_COLORS.length)]
        const phase = hash2(seed, 34) * Math.PI * 2
        const hairTone = Math.floor(hash2(seed, 35) * 3)
        const hasPhone = hash2(seed, 36) < 0.20 ? 1.0 : 0.0
        const heightScale = 0.94 + hash2(seed, 37) * 0.12

        points.push({
          position: [wx, wy, wz],
          rotationY: rotY,
          skinColor,
          clothesColor,
          phase,
          hairTone,
          hasPhone,
          heightScale,
        })

        if (points.length >= maxBudget) return points
      }
    }
  }

  return points
}
