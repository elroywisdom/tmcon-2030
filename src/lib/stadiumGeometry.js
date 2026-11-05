// src/lib/stadiumGeometry.js
import * as THREE from 'three'

// Evenly resample a closed polygon [[x,z],...] to n points by arc length.
export function resample(points, n) {
  const pts = [...points, points[0]]
  const seg = []
  let total = 0
  for (let i = 0; i < pts.length - 1; i++) {
    const d = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1])
    seg.push(d)
    total += d
  }
  const out = []
  let i = 0
  let acc = 0
  for (let k = 0; k < n; k++) {
    const target = (k / n) * total
    while (acc + seg[i] < target && i < seg.length - 1) {
      acc += seg[i]
      i++
    }
    const t = seg[i] > 0 ? (target - acc) / seg[i] : 0
    out.push([
      pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t,
      pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t,
    ])
  }
  return out
}

// Sweep a cross-section profile around an outline.
// profile: [{ s, y, v }]  s = scale from centre (1 = outer edge), y = height.
// yMod(i, j, y) lets you add per-vertex height (roof scallops).
// opts: { sMod, skipColumn } for outer edge scallop and scoreboard gap.
export function sweepProfile(
  outline,
  center,
  profile,
  yMod = (i, j, y) => y,
  opts = {}
) {
  const n = outline.length
  const m = profile.length
  const sMod = opts.sMod || ((i, j, s) => s)
  const skipColumn = opts.skipColumn || (() => false)

  // Use n + 1 columns so UV u wraps cleanly from 0 to 1 without a seam
  const cols = n + 1
  const pos = []
  const uvs = []
  const idx = []

  for (let j = 0; j < m; j++) {
    const v = profile[j].v !== undefined ? profile[j].v : j / Math.max(1, m - 1)
    for (let i = 0; i <= n; i++) {
      const ii = i % n
      const [x, z] = outline[ii]
      const sc = sMod(ii, j, profile[j].s)
      const yy = yMod(ii, j, profile[j].y)
      pos.push(
        center[0] + (x - center[0]) * sc,
        yy,
        center[1] + (z - center[1]) * sc
      )
      uvs.push(i / n, v)
    }
  }

  for (let j = 0; j < m - 1; j++) {
    for (let i = 0; i < n; i++) {
      if (skipColumn(i, j)) continue
      const a = j * cols + i
      const b = j * cols + (i + 1)
      const c = (j + 1) * cols + i
      const d = (j + 1) * cols + (i + 1)
      idx.push(a, c, b, b, c, d)
    }
  }

  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

// Roof scallops: P radial bays, soft bulges, stronger toward the middle of the roof band.
// Also incorporates 4 stacked concentric quilted cushions per bay like the real membrane roof.
export function roofScallop(n, P, amp, roofRows, cushionAmp = 0.85) {
  const minRow = Math.min(...roofRows)
  const maxRow = Math.max(...roofRows)
  const span = Math.max(1, maxRow - minRow)

  return (i, j, y) => {
    if (!roofRows.includes(j)) return y
    const bay = Math.abs(Math.sin((Math.PI * i * P) / n)) // 0..1 per bay
    // Radial progress across the membrane from inner ring (0) to outer edge (1)
    const radialT = (j - minRow) / span
    // 4 stacked quilted cushions radially across each bay
    const cushion = Math.abs(Math.sin(Math.PI * radialT * 4))
    const radialEnvelope = Math.sin(Math.PI * Math.min(1, Math.max(0, radialT)))
    const domeLift =
      amp * Math.pow(bay, 0.68) * (0.55 + 0.45 * radialEnvelope) +
      cushionAmp * Math.pow(bay, 0.55) * Math.pow(cushion, 0.75)
    return y + domeLift
  }
}

// Seat colours: clustered mosaic like the real Moshood Abiola Stadium stands.
const LOWER = [
  '#f5c531', // vibrant golden yellow
  '#f39c24', // warm amber
  '#ec6426', // deep orange
  '#d8392b', // bright red
  '#b92c28', // rich crimson
  '#8e2a2a', // deep wine
  '#f06a24', // sunrise orange
  '#d9d0bd', // cream highlight
]
const UPPER = [
  '#f5c531', // vibrant golden yellow
  '#f39c24', // warm amber
  '#ec6426', // warm orange
  '#d8392b', // bright red
  '#b92c28', // crimson
  '#8e2a2a', // wine burgundy
  '#f06a24', // bright orange
  '#e59b25', // golden yellow
  '#cfc6b3', // light stone highlight
]
const VIP = ['#d9d0bd', '#cfc6b3', '#e2dac8']

function hash2(a, b) {
  let h = (Math.imul(a, 374761393) + Math.imul(b, 668265263)) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  h ^= h >>> 16
  return (h >>> 0) / 4294967295
}

export function seatColor(tier, r, c, seed = 1) {
  const palette = tier === 'vip' ? VIP : tier === 'upper' ? UPPER : LOWER
  const cluster = hash2(Math.floor(r / 2) + seed * 17, Math.floor(c / 5))
  const jitter = hash2(r * 7 + seed, c * 13)
  const k =
    Math.floor((cluster * 0.7 + jitter * 0.3) * palette.length) %
    palette.length
  return palette[k]
}

// Generate procedural canvas texture for Lower Tier seating mosaic + tunnels + aisles
export function createLowerTierTexture(P = 32) {
  const canvas = document.createElement('canvas')
  canvas.width = 2048
  canvas.height = 512
  const ctx = canvas.getContext('2d')

  // Concrete step base
  ctx.fillStyle = '#8b867e'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const rows = 26
  const colsPerBay = 24
  const totalCols = P * colsPerBay
  const cellW = canvas.width / totalCols
  const cellH = canvas.height / rows

  // Draw seats row by row (r=0 bottom near track, r=rows-1 top under box band)
  for (let r = 0; r < rows; r++) {
    const y = canvas.height - (r + 1) * cellH
    // Concrete step shadow line
    ctx.fillStyle = 'rgba(35, 28, 24, 0.32)'
    ctx.fillRect(0, y + cellH * 0.78, canvas.width, cellH * 0.22)

    for (let c = 0; c < totalCols; c++) {
      const bayIdx = Math.floor(c / colsPerBay)
      const colInBay = c % colsPerBay

      // Radial stepped aisle between bays
      if (colInBay === 0 || colInBay === colsPerBay - 1) {
        ctx.fillStyle = r % 2 === 0 ? '#9c968d' : '#8a847b'
        ctx.fillRect(c * cellW, y, cellW, cellH * 0.85)
        // Yellow aisle-end marker at bottom 2 rows
        if (r < 2) {
          ctx.fillStyle = '#f0c432'
          ctx.fillRect(c * cellW, y, cellW, cellH)
        }
        continue
      }

      // West VIP stand block is around Bays 25, 26, 27
      const isVipBlock = bayIdx >= 25 && bayIdx <= 27
      const tierType = isVipBlock ? 'vip' : 'lower'
      ctx.fillStyle = seatColor(tierType, r, c, 3)
      ctx.fillRect(
        c * cellW + cellW * 0.08,
        y + cellH * 0.08,
        cellW * 0.84,
        cellH * 0.72
      )
    }
  }

  // Horizontal front walkway and yellow perimeter rail base
  ctx.fillStyle = '#b8b2a8'
  ctx.fillRect(0, canvas.height - 14, canvas.width, 14)
  ctx.fillStyle = '#ebb82c'
  ctx.fillRect(0, canvas.height - 5, canvas.width, 5)

  // Vomitory / tunnel portals cut into the lower tier
  const bayW = canvas.width / P
  for (let b = 0; b < P; b++) {
    // Major players/VIP tunnel at Bay 26 (West center) and Bay 10 (East center) and ends (Bay 2, Bay 18)
    const isMajorTunnel = b === 26 || b === 10 || b === 2 || b === 18
    const isVomitory = b % 2 === 0

    if (isMajorTunnel) {
      const cx = (b + 0.5) * bayW
      const tw = bayW * 0.46
      const th = canvas.height * 0.48
      // Concrete sloped sidewall & lintel canopy
      ctx.fillStyle = '#c8c3b9'
      ctx.fillRect(cx - tw / 2 - 7, canvas.height - th - 10, tw + 14, th + 10)
      // Dark tunnel mouth
      ctx.fillStyle = '#141619'
      ctx.fillRect(cx - tw / 2, canvas.height - th, tw, th)
    } else if (isVomitory) {
      const cx = (b + 0.5) * bayW
      const tw = bayW * 0.28
      const th = canvas.height * 0.34
      const ty = canvas.height * 0.38
      ctx.fillStyle = '#c5bfb5'
      ctx.fillRect(cx - tw / 2 - 5, ty - 6, tw + 10, th + 10)
      ctx.fillStyle = '#181a1f'
      ctx.fillRect(cx - tw / 2, ty, tw, th)
    }
  }

  // Subtle top shade from middle tier overhang
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.28)
  grad.addColorStop(0, 'rgba(18, 12, 10, 0.55)')
  grad.addColorStop(1, 'rgba(18, 12, 10, 0.0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, canvas.width, canvas.height * 0.28)

  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.ClampToEdgeWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

// Generate procedural canvas texture for Upper Tier (dark maroon mosaic + vomitory portals + roof shade)
export function createUpperTierTexture(P = 32) {
  const canvas = document.createElement('canvas')
  canvas.width = 2048
  canvas.height = 512
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#8b867e'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const rows = 28
  const colsPerBay = 24
  const totalCols = P * colsPerBay
  const cellW = canvas.width / totalCols
  const cellH = canvas.height / rows

  for (let r = 0; r < rows; r++) {
    const y = canvas.height - (r + 1) * cellH
    ctx.fillStyle = 'rgba(20, 12, 12, 0.38)'
    ctx.fillRect(0, y + cellH * 0.76, canvas.width, cellH * 0.24)

    for (let c = 0; c < totalCols; c++) {
      const colInBay = c % colsPerBay
      if (colInBay === 0 || colInBay === colsPerBay - 1) {
        ctx.fillStyle = '#8d867e'
        ctx.fillRect(c * cellW, y, cellW, cellH * 0.85)
        continue
      }
      ctx.fillStyle = seatColor('upper', r, c, 9)
      ctx.fillRect(
        c * cellW + cellW * 0.08,
        y + cellH * 0.08,
        cellW * 0.84,
        cellH * 0.72
      )
    }
  }

  // Vomitory portals along the bottom of the upper tier (white concrete boxes with dark openings)
  const bayW = canvas.width / P
  for (let b = 0; b < P; b++) {
    const cx = (b + 0.5) * bayW
    const tw = bayW * 0.24
    const th = canvas.height * 0.24
    const ty = canvas.height - th - 6
    ctx.fillStyle = '#d2cdc3'
    ctx.fillRect(cx - tw / 2 - 5, ty - 5, tw + 10, th + 11)
    ctx.fillStyle = '#17191d'
    ctx.fillRect(cx - tw / 2, ty + 2, tw, th)
  }

  // Strong top-down shadow gradient from the overhanging roof
  const shade = ctx.createLinearGradient(0, 0, 0, canvas.height)
  shade.addColorStop(0, 'rgba(15, 10, 12, 0.62)')
  shade.addColorStop(0.55, 'rgba(20, 12, 14, 0.28)')
  shade.addColorStop(1, 'rgba(20, 12, 14, 0.05)')
  ctx.fillStyle = shade
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.ClampToEdgeWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

// Generate procedural texture for the Middle Hospitality / Press Box Band between tiers
export function createBoxBandTexture(P = 32) {
  const canvas = document.createElement('canvas')
  canvas.width = 2048
  canvas.height = 256
  const ctx = canvas.getContext('2d')

  // Dark recessed concourse/box background
  ctx.fillStyle = '#20252b'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const bayW = canvas.width / P
  for (let b = 0; b < P; b++) {
    const x0 = b * bayW
    // White/light-grey concrete structural column at bay boundary
    ctx.fillStyle = '#d4cfc5'
    ctx.fillRect(x0 - 4, 0, 8, canvas.height)

    // Glazed hospitality box windows with mullions
    const winW = bayW * 0.72
    const winX = x0 + bayW * 0.14
    ctx.fillStyle = '#151c22'
    ctx.fillRect(winX, 46, winW, 156)

    // Subtle glass reflection band
    ctx.fillStyle = 'rgba(180, 200, 215, 0.16)'
    ctx.fillRect(winX + 4, 54, winW - 8, 38)

    // Window vertical mullions
    ctx.fillStyle = '#7c8288'
    for (let m = 1; m < 5; m++) {
      ctx.fillRect(winX + (winW * m) / 5, 46, 2, 156)
    }

    // Small daylight breezeway opening on one side of the pier
    ctx.fillStyle = '#c9cfd2'
    ctx.fillRect(x0 + 8, 64, bayW * 0.06, 95)
  }

  // Top and bottom white/light-grey concrete cantilever fascia beams
  ctx.fillStyle = '#ddd8ce'
  ctx.fillRect(0, 0, canvas.width, 44)
  ctx.fillStyle = '#b8b2a6'
  ctx.fillRect(0, 38, canvas.width, 8)

  ctx.fillStyle = '#dfd9cf'
  ctx.fillRect(0, canvas.height - 44, canvas.width, 44)
  ctx.fillStyle = '#aba59a'
  ctx.fillRect(0, canvas.height - 44, canvas.width, 7)

  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.ClampToEdgeWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

// Generate procedural quilted membrane texture & bump map for the 32-bay tensile roof
export function createRoofMembraneTextures(P = 32) {
  const canvas = document.createElement('canvas')
  canvas.width = 2048
  canvas.height = 512
  const ctx = canvas.getContext('2d')

  const bumpCanvas = document.createElement('canvas')
  bumpCanvas.width = 2048
  bumpCanvas.height = 512
  const bCtx = bumpCanvas.getContext('2d')

  const bayW = canvas.width / P
  const cushions = 4
  const cushH = canvas.height / cushions

  for (let b = 0; b < P; b++) {
    const x0 = b * bayW
    for (let c = 0; c < cushions; c++) {
      const y0 = c * cushH

      // Base warm weathered cream-grey membrane
      ctx.fillStyle = '#e7e0d2'
      ctx.fillRect(x0, y0, bayW, cushH)

      // Soft pillow shading across each bay x cushion
      const rGrad = ctx.createRadialGradient(
        x0 + bayW * 0.5,
        y0 + cushH * 0.48,
        bayW * 0.05,
        x0 + bayW * 0.5,
        y0 + cushH * 0.5,
        bayW * 0.65
      )
      rGrad.addColorStop(0, '#f3ede0')
      rGrad.addColorStop(0.65, '#e2dac9')
      rGrad.addColorStop(1, '#c5bcab')
      ctx.fillStyle = rGrad
      ctx.fillRect(x0, y0, bayW, cushH)

      // Bump map pillow gradient
      const bGrad = bCtx.createRadialGradient(
        x0 + bayW * 0.5,
        y0 + cushH * 0.5,
        bayW * 0.04,
        x0 + bayW * 0.5,
        y0 + cushH * 0.5,
        bayW * 0.62
      )
      bGrad.addColorStop(0, '#ffffff')
      bGrad.addColorStop(0.7, '#999999')
      bGrad.addColorStop(1, '#222222')
      bCtx.fillStyle = bGrad
      bCtx.fillRect(x0, y0, bayW, cushH)
    }

    // Radial valley rib line between bays
    ctx.fillStyle = '#8d8679'
    ctx.fillRect(x0 - 2, 0, 4, canvas.height)
  }

  // Concentric purlin seam lines between the 4 stacked cushions
  for (let c = 1; c < cushions; c++) {
    const y = c * cushH
    ctx.fillStyle = '#9e9789'
    ctx.fillRect(0, y - 2, canvas.width, 4)
  }

  // Subtle fabric panel seam lines inside each cushion
  ctx.strokeStyle = 'rgba(130, 122, 108, 0.25)'
  ctx.lineWidth = 1
  for (let i = 1; i < cushions * 4; i++) {
    const y = (i / (cushions * 4)) * canvas.height
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(canvas.width, y)
    ctx.stroke()
  }

  const map = new THREE.CanvasTexture(canvas)
  map.wrapS = THREE.RepeatWrapping
  map.wrapT = THREE.ClampToEdgeWrapping
  map.colorSpace = THREE.SRGBColorSpace

  const bumpMap = new THREE.CanvasTexture(bumpCanvas)
  bumpMap.wrapS = THREE.RepeatWrapping
  bumpMap.wrapT = THREE.ClampToEdgeWrapping

  return { map, bumpMap }
}

