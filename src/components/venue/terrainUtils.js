// src/components/venue/terrainUtils.js
// Procedural photorealistic ground maps, bump textures, volumetric foliage & 3D curbs
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

/**
 * Creates high-detail procedural diffuse and bump maps for the Abuja stadium surroundings.
 * Features realistic Nigerian laterite soil, dry-season savanna thatch, weathered asphalt,
 * painted parking stalls, concrete curbs, and apron expansion joints.
 */
export function createPhotorealisticGroundTextures() {
  const width = 2048
  const height = 2048
  const canvasMap = document.createElement('canvas')
  canvasMap.width = width
  canvasMap.height = height
  const ctx = canvasMap.getContext('2d')

  const canvasBump = document.createElement('canvas')
  canvasBump.width = width
  canvasBump.height = height
  const ctxBump = canvasBump.getContext('2d')

  const SIZE = 3200 // World metres covered
  const toPxX = (x) => ((x + SIZE / 2) / SIZE) * width
  const toPxY = (z) => ((z + SIZE / 2) / SIZE) * height
  const scaleM = (m) => (m / SIZE) * width

  // 1. Base Savanna Soil (Warm Nigerian laterite & golden-tan dry savanna thatch)
  ctx.fillStyle = '#b7975d'
  ctx.fillRect(0, 0, width, height)
  ctxBump.fillStyle = '#808080'
  ctxBump.fillRect(0, 0, width, height)

  // Fast pseudo-noise
  const pseudoNoise = (x, y) => {
    const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453
    return s - Math.floor(s)
  }

  // 2. Multi-scale organic patches (Red clay, golden grass, and green scrub verges)
  const terrainPatches = [
    { x: 380, z: -210, rx: 360, rz: 280, color: '#5e7a3a', bump: '#8f8f8f', alpha: 0.65 },
    { x: -460, z: -320, rx: 380, rz: 290, color: '#688442', bump: '#8e8e8e', alpha: 0.55 },
    { x: 280, z: 240, rx: 310, rz: 220, color: '#647e3e', bump: '#8c8c8c', alpha: 0.55 },
    { x: -380, z: 340, rx: 290, rz: 210, color: '#6a8244', bump: '#8d8d8d', alpha: 0.5 },
    { x: 620, z: -60, rx: 390, rz: 320, color: '#567236', bump: '#919191', alpha: 0.6 },
    // Laterite red clay patches (characteristic Abuja reddish earth)
    { x: -260, z: -280, rx: 220, rz: 160, color: '#a25d32', bump: '#787878', alpha: 0.52 },
    { x: 540, z: -400, rx: 260, rz: 200, color: '#9e562d', bump: '#767676', alpha: 0.5 },
    { x: -200, z: 180, rx: 160, rz: 130, color: '#b06f3c', bump: '#7c7c7c', alpha: 0.45 },
    { x: 200, z: 340, rx: 230, rz: 150, color: '#bc904c', bump: '#858585', alpha: 0.55 },
    // Golden dry grass around roundabout & approach
    { x: -220, z: 100, rx: 180, rz: 160, color: '#c79b4a', bump: '#8a8a8a', alpha: 0.72 },
  ]

  for (const p of terrainPatches) {
    const cx = toPxX(p.x)
    const cy = toPxY(p.z)
    const r = scaleM(Math.max(p.rx, p.rz))
    const g = ctx.createRadialGradient(cx, cy, r * 0.15, cx, cy, r)
    g.addColorStop(0, p.color)
    g.addColorStop(1, 'rgba(183, 151, 93, 0)')
    ctx.save()
    ctx.globalAlpha = p.alpha
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()

    const gb = ctxBump.createRadialGradient(cx, cy, r * 0.15, cx, cy, r)
    gb.addColorStop(0, p.bump)
    gb.addColorStop(1, 'rgba(128, 128, 128, 0)')
    ctxBump.save()
    ctxBump.globalAlpha = p.alpha * 0.6
    ctxBump.fillStyle = gb
    ctxBump.beginPath()
    ctxBump.arc(cx, cy, r, 0, Math.PI * 2)
    ctxBump.fill()
    ctxBump.restore()
  }

  // 3. High-frequency terrain dirt and pebble speckle noise
  for (let i = 0; i < 3500; i++) {
    const fx = pseudoNoise(i * 1.7, i * 3.1)
    const fy = pseudoNoise(i * 5.3, i * 7.9)
    const r = 2 + (i % 6)
    ctx.fillStyle =
      i % 3 === 0
        ? 'rgba(74, 96, 46, 0.14)'
        : i % 3 === 1
          ? 'rgba(155, 86, 42, 0.12)'
          : 'rgba(215, 185, 120, 0.16)'
    ctx.beginPath()
    ctx.arc(fx * width, fy * height, r, 0, Math.PI * 2)
    ctx.fill()

    ctxBump.fillStyle = i % 2 === 0 ? 'rgba(175, 175, 175, 0.18)' : 'rgba(85, 85, 85, 0.18)'
    ctxBump.beginPath()
    ctxBump.arc(fx * width, fy * height, r * 0.8, 0, Math.PI * 2)
    ctxBump.fill()
  }

  // Helper to draw realistic asphalt with aggregate texture, stall lines and concrete curbs
  const drawAsphaltParkingLot = (x, z, w, h, rows = 4, angle = 0) => {
    ctx.save()
    ctxBump.save()
    ctx.translate(toPxX(x), toPxY(z))
    ctxBump.translate(toPxX(x), toPxY(z))
    if (angle) {
      ctx.rotate(angle)
      ctxBump.rotate(angle)
    }

    const pw = scaleM(w)
    const ph = scaleM(h)
    const hx = -pw / 2
    const hy = -ph / 2

    // 1. Concrete outer curb base
    ctx.fillStyle = '#d1ccc0'
    ctx.fillRect(hx - 3, hy - 3, pw + 6, ph + 6)
    ctxBump.fillStyle = '#ffffff' // High curb relief in bump map
    ctxBump.fillRect(hx - 3, hy - 3, pw + 6, ph + 6)

    // 2. Weathered charcoal asphalt bed
    ctx.fillStyle = '#3a3c40'
    ctx.fillRect(hx, hy, pw, ph)
    ctxBump.fillStyle = '#555555' // Slightly recessed asphalt
    ctxBump.fillRect(hx, hy, pw, ph)

    // 3. Fine asphalt aggregate gravel speckles
    ctx.fillStyle = 'rgba(200, 205, 215, 0.18)'
    for (let s = 0; s < 450; s++) {
      const sx = hx + pseudoNoise(s * 2.1, x) * pw
      const sy = hy + pseudoNoise(s * 4.3, z) * ph
      ctx.fillRect(sx, sy, 1.2, 1.2)
    }

    // 4. Painted white parking stalls
    ctx.strokeStyle = '#dedad0'
    ctx.lineWidth = 1.6
    const rowStep = ph / (rows + 1)
    for (let r = 1; r <= rows; r++) {
      const ry = hy + r * rowStep
      // Row divider line
      ctx.beginPath()
      ctx.moveTo(hx + 8, ry)
      ctx.lineTo(hx + pw - 8, ry)
      ctx.stroke()

      // Individual stall demarcation ticks
      const stalls = Math.floor(pw / 12)
      for (let c = 0; c < stalls; c++) {
        const cx = hx + 10 + c * 12
        ctx.beginPath()
        ctx.moveTo(cx, ry - 7)
        ctx.lineTo(cx, ry + 7)
        ctx.stroke()
      }
    }

    ctx.restore()
    ctxBump.restore()
  }

  // 4. Terraced Car Parks (West, South-West, East)
  // West Terraced Car Park
  drawAsphaltParkingLot(-198, -62, 135, 145, 6, 0)
  // South-West Terraced Car Park
  drawAsphaltParkingLot(-145, 155, 160, 116, 5, 0.45)
  // East Terraced Car Park
  drawAsphaltParkingLot(208, -5, 105, 270, 8, 0)

  // Curved radial parking terraces North of the stadium
  const BOWL_CENTER = [-3.8, 12.1]
  ctx.save()
  ctxBump.save()
  ctx.beginPath()
  ctx.ellipse(toPxX(BOWL_CENTER[0]), toPxY(BOWL_CENTER[1]), scaleM(225), scaleM(255), 0, Math.PI * 1.12, Math.PI * 1.88)
  ctx.ellipse(toPxX(BOWL_CENTER[0]), toPxY(BOWL_CENTER[1]), scaleM(158), scaleM(190), 0, Math.PI * 1.88, Math.PI * 1.12, true)
  ctx.closePath()
  ctx.fillStyle = '#42454a'
  ctx.fill()
  ctx.lineWidth = scaleM(2.8)
  ctx.strokeStyle = '#d4cebf'
  ctx.stroke()

  ctxBump.beginPath()
  ctxBump.ellipse(toPxX(BOWL_CENTER[0]), toPxY(BOWL_CENTER[1]), scaleM(225), scaleM(255), 0, Math.PI * 1.12, Math.PI * 1.88)
  ctxBump.ellipse(toPxX(BOWL_CENTER[0]), toPxY(BOWL_CENTER[1]), scaleM(158), scaleM(190), 0, Math.PI * 1.88, Math.PI * 1.12, true)
  ctxBump.closePath()
  ctxBump.fillStyle = '#606060'
  ctxBump.fill()
  ctx.restore()
  ctxBump.restore()

  // 5. Stadium Apron Paved Concrete Ring with Radial Paver Expansion Joints
  ctx.save()
  ctxBump.save()
  ctx.translate(toPxX(BOWL_CENTER[0]), toPxY(BOWL_CENTER[1]))
  ctxBump.translate(toPxX(BOWL_CENTER[0]), toPxY(BOWL_CENTER[1]))

  // Outer paved apron ring
  ctx.beginPath()
  ctx.ellipse(0, 0, scaleM(162), scaleM(194), 0, 0, Math.PI * 2)
  ctx.fillStyle = '#7a7a75'
  ctx.fill()
  ctx.lineWidth = scaleM(3.2)
  ctx.strokeStyle = '#dedad0' // Concrete perimeter curb
  ctx.stroke()

  ctxBump.beginPath()
  ctxBump.ellipse(0, 0, scaleM(162), scaleM(194), 0, 0, Math.PI * 2)
  ctxBump.fillStyle = '#707070'
  ctxBump.fill()

  // Radial concrete paver scorelines (44 spokes matching stadium bays)
  ctx.strokeStyle = 'rgba(215, 210, 200, 0.28)'
  ctx.lineWidth = 1.4
  for (let s = 0; s < 44; s++) {
    const ang = (s / 44) * Math.PI * 2
    ctx.beginPath()
    ctx.moveTo(Math.cos(ang) * scaleM(134), Math.sin(ang) * scaleM(162))
    ctx.lineTo(Math.cos(ang) * scaleM(162), Math.sin(ang) * scaleM(194))
    ctx.stroke()
  }

  // Inner concrete plinth ring
  ctx.beginPath()
  ctx.ellipse(0, 0, scaleM(134), scaleM(162), 0, 0, Math.PI * 2)
  ctx.fillStyle = '#9e9a90'
  ctx.fill()
  ctx.strokeStyle = '#c8c4b8'
  ctx.lineWidth = scaleM(2.0)
  ctx.stroke()
  ctx.restore()
  ctxBump.restore()

  // 6. South Avenue Approach & Gate Plaza
  ctx.save()
  ctxBump.save()
  ctx.fillStyle = '#4c4e53'
  ctx.beginPath()
  const southPts = [
    [-35, 180],
    [118, 180],
    [131, 352],
    [55, 352],
  ]
  southPts.forEach(([x, z], idx) => {
    if (idx === 0) ctx.moveTo(toPxX(x), toPxY(z))
    else ctx.lineTo(toPxX(x), toPxY(z))
  })
  ctx.closePath()
  ctx.fill()
  ctx.lineWidth = scaleM(2.4)
  ctx.strokeStyle = '#d6d1c4'
  ctx.stroke()
  ctx.restore()
  ctxBump.restore()

  // 7. West Roundabout Ring & Star Axial Paths
  const rbX = -223
  const rbZ = 52
  const starTargets = [
    [-143, 45],
    [-272, 118],
    [-306, 31],
    [-235, -45],
    [-210, 185],
  ]

  // Star approach roadways
  ctx.strokeStyle = '#4e5055'
  ctx.lineWidth = scaleM(11)
  for (const [tx, tz] of starTargets) {
    ctx.beginPath()
    ctx.moveTo(toPxX(rbX), toPxY(rbZ))
    ctx.lineTo(toPxX(tx), toPxY(tz))
    ctx.stroke()
  }

  // Roundabout asphalt ring
  ctx.beginPath()
  ctx.arc(toPxX(rbX), toPxY(rbZ), scaleM(23), 0, Math.PI * 2)
  ctx.fillStyle = '#42454a'
  ctx.fill()
  ctx.lineWidth = scaleM(2)
  ctx.strokeStyle = '#d6d1c4'
  ctx.stroke()

  // Central lawn island
  ctx.beginPath()
  ctx.arc(toPxX(rbX), toPxY(rbZ), scaleM(12.5), 0, Math.PI * 2)
  ctx.fillStyle = '#4f6c32'
  ctx.fill()
  ctx.lineWidth = scaleM(1.8)
  ctx.strokeStyle = '#d6d1c4'
  ctx.stroke()

  // Sandy warm-up track (North-West)
  ctx.save()
  ctx.translate(toPxX(-75), toPxY(-215))
  ctx.rotate(0.24)
  ctx.fillStyle = '#c79f5e'
  ctx.fillRect(-scaleM(75), -scaleM(52), scaleM(150), scaleM(104))
  ctx.strokeStyle = '#a67d40'
  ctx.lineWidth = scaleM(2.2)
  ctx.strokeRect(-scaleM(75), -scaleM(52), scaleM(150), scaleM(104))
  ctx.restore()

  // Create Three.js Textures
  const groundMap = new THREE.CanvasTexture(canvasMap)
  groundMap.colorSpace = THREE.SRGBColorSpace
  groundMap.generateMipmaps = true
  groundMap.minFilter = THREE.LinearMipmapLinearFilter
  groundMap.magFilter = THREE.LinearFilter

  const groundBump = new THREE.CanvasTexture(canvasBump)
  groundBump.generateMipmaps = true
  groundBump.minFilter = THREE.LinearMipmapLinearFilter
  groundBump.magFilter = THREE.LinearFilter

  return { groundMap, groundBump }
}

/**
 * Creates volumetric organic acacia/neem tree canopy geometry.
 * Merges multiple intersecting spheres with vertex displacement noise.
 */
export function createVolumetricTreeGeometry() {
  const c1 = new THREE.IcosahedronGeometry(3.6, 2)
  c1.scale(1.2, 0.85, 1.2)

  const c2 = new THREE.IcosahedronGeometry(2.5, 2)
  c2.scale(1.1, 0.8, 1.1)
  c2.translate(1.4, 1.0, 0.5)

  const c3 = new THREE.IcosahedronGeometry(2.3, 2)
  c3.scale(1.0, 0.75, 1.0)
  c3.translate(-1.3, 0.7, -0.8)

  const merged = mergeGeometries([c1, c2, c3], false) || c1

  // Perturb vertices with organic noise for leafy canopy silhouette
  const pos = merged.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const vx = pos.getX(i)
    const vy = pos.getY(i)
    const vz = pos.getZ(i)
    const noise =
      Math.sin(vx * 1.8) * Math.cos(vz * 1.8) * 0.32 +
      Math.sin(vy * 2.4 + vx) * 0.22
    pos.setXYZ(
      i,
      vx * (1.0 + noise * 0.22),
      vy * (1.0 + noise * 0.16),
      vz * (1.0 + noise * 0.22)
    )
  }
  merged.computeVertexNormals()
  return merged
}

/**
 * Creates a high-frequency leaf bump texture for realistic sunlight scattering on tree crowns.
 */
export function createLeafBumpTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#808080'
  ctx.fillRect(0, 0, 256, 256)

  for (let i = 0; i < 1200; i++) {
    const x = Math.random() * 256
    const y = Math.random() * 256
    const r = 1.5 + Math.random() * 3.5
    ctx.fillStyle = i % 2 === 0 ? 'rgba(215, 215, 215, 0.25)' : 'rgba(45, 45, 45, 0.25)'
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(4, 4)
  return tex
}

/**
 * Creates a detailed car body geometry with cabin greenhouse and wheel arches.
 */
export function createDetailedCarGeometry() {
  const body = new THREE.BoxGeometry(2.1, 0.75, 4.6)
  body.translate(0, 0.5, 0)

  const cabin = new THREE.BoxGeometry(1.85, 0.65, 2.5)
  cabin.translate(0, 1.15, -0.2)

  return mergeGeometries([body, cabin], false) || body
}

