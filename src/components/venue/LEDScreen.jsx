'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useVenue } from '@/store/useVenue'

const vert = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const frag = `
  uniform sampler2D map;
  uniform float uGlow;
  uniform vec2 uGrid;
  uniform float uTime;
  uniform float uHasMap;
  uniform vec2 uUvScale;
  uniform vec2 uUvOffset;
  varying vec2 vUv;

  void main() {
    vec3 c = vec3(0.06, 0.08, 0.12);
    if (uHasMap > 0.5) {
      // Aspect-ratio cover mapping (zero stretching / distortion)
      vec2 texUv = vUv * uUvScale + uUvOffset;
      texUv = clamp(texUv, 0.001, 0.999);
      c = texture2D(map, texUv).rgb;
    } else {
      // Procedural fallback gradient with TM brand colours
      float wave = sin(vUv.x * 6.0 + uTime * 1.5) * 0.5 + 0.5;
      vec3 colA = vec3(0.95, 0.41, 0.04); // TM Orange
      vec3 colB = vec3(0.01, 0.76, 0.50); // TM Green
      c = mix(colA, colB, wave * vUv.y);
    }

    // Stable LED Pixel Grid Mask (distance-filtered, anti-aliased to prevent moiré flickering)
    vec2 g = fract(vUv * uGrid);
    float dist = length(g - 0.5);
    float led = smoothstep(0.48, 0.22, dist);
    
    // Subtle scanline and edge falloff with stable baseline (floor of 0.88 to prevent black strobe)
    float scanline = sin(vUv.y * uGrid.y * 3.14159) * 0.03 + 0.97;
    float vig = smoothstep(1.3, 0.35, length(vUv - 0.5) * 1.3);

    c *= mix(0.88, 1.02, led) * scanline * vig * uGlow;
    gl_FragColor = vec4(c, 1.0);
  }
`

// Shared video texture manager singleton
// Guarantees all screens share ONE single decoding pipeline, eliminating decoder contention,
// memory overhead, and desynced looping glitching.
const sharedVideoCache = new Map()

function getSharedVideoSource(src) {
  if (typeof window === 'undefined') return null
  if (sharedVideoCache.has(src)) {
    return sharedVideoCache.get(src)
  }

  const video = document.createElement('video')
  video.src = src
  video.loop = true
  video.muted = true
  video.playsInline = true
  video.setAttribute('playsinline', '')
  video.setAttribute('webkit-playsinline', '')
  video.crossOrigin = 'anonymous'
  video.preload = 'auto'
  video.autoplay = true

  // Keep element in DOM inside viewport so Chrome/macOS power manager never throttles background video decoding
  video.style.position = 'fixed'
  video.style.bottom = '0'
  video.style.right = '0'
  video.style.width = '4px'
  video.style.height = '4px'
  video.style.opacity = '0.01'
  video.style.pointerEvents = 'none'
  video.style.zIndex = '-9999'
  document.body.appendChild(video)

  const videoTex = new THREE.VideoTexture(video)
  videoTex.colorSpace = THREE.SRGBColorSpace
  videoTex.generateMipmaps = false
  videoTex.minFilter = THREE.LinearFilter
  videoTex.magFilter = THREE.LinearFilter
  videoTex.format = THREE.RGBAFormat

  const record = {
    video,
    texture: videoTex,
    isReady: false,
    width: 640,
    height: 360,
    subscribers: new Set(),
  }

  const notify = () => {
    record.width = video.videoWidth || record.width
    record.height = video.videoHeight || record.height
    record.subscribers.forEach((cb) => cb(record))
  }

  const startPlayback = () => {
    video.play().then(() => {
      record.isReady = true
      notify()
    }).catch(() => {
      const resume = () => {
        video.play().then(() => {
          record.isReady = true
          notify()
          window.removeEventListener('pointerdown', resume)
          window.removeEventListener('keydown', resume)
        }).catch(() => {})
      }
      window.addEventListener('pointerdown', resume, { once: true })
      window.addEventListener('keydown', resume, { once: true })
    })
  }

  video.addEventListener('loadeddata', () => {
    record.isReady = true
    notify()
    startPlayback()
  })
  video.addEventListener('canplay', () => {
    record.isReady = true
    notify()
    startPlayback()
  })
  video.addEventListener('canplaythrough', () => {
    record.isReady = true
    notify()
    startPlayback()
  })

  // Smooth loop handling without black flash
  video.addEventListener('ended', () => {
    video.currentTime = 0
    video.play().catch(() => {})
  })

  // Prevent stalling
  video.addEventListener('stalled', () => {
    if (video.paused) video.play().catch(() => {})
  })
  video.addEventListener('waiting', () => {
    if (video.paused) video.play().catch(() => {})
  })

  video.load()
  startPlayback()

  sharedVideoCache.set(src, record)
  return record
}

// Poster texture cache singleton
const posterTextureCache = new Map()
function getPosterTexture(url, onLoad) {
  if (!url || typeof window === 'undefined') return null
  if (posterTextureCache.has(url)) {
    const tex = posterTextureCache.get(url)
    if (tex && onLoad) onLoad(tex)
    return tex
  }
  const loader = new THREE.TextureLoader()
  loader.load(url, (loadedTex) => {
    loadedTex.colorSpace = THREE.SRGBColorSpace
    loadedTex.generateMipmaps = false
    loadedTex.minFilter = THREE.LinearFilter
    loadedTex.magFilter = THREE.LinearFilter
    posterTextureCache.set(url, loadedTex)
    if (onLoad) onLoad(loadedTex)
  })
  return null
}

export default function LEDScreen({
  size = [32, 9],
  src = null,
  poster = '/assets/hero-image-slider/DSC09751.jpg',
  aspectRatio = 16 / 9,
  focus = [0.5, 0.5],
  fit = 'cover',
  ...props
}) {
  const timeOfDay = useVenue((s) => s.timeOfDay)
  const isNight = timeOfDay === 'night'
  const glowTarget = isNight ? 1.6 : 0.95
  const glowRef = useRef(glowTarget)
  const matRef = useRef()

  // Deconstruct array props to stable primitives
  const screenW = size[0]
  const screenH = size[1]
  const focusX = focus?.[0] ?? 0.5
  const focusY = focus?.[1] ?? 0.5

  const initialRecord = src ? sharedVideoCache.get(src) : null
  const initialTex = initialRecord?.isReady ? initialRecord.texture : null
  const [activeTexture, setActiveTexture] = useState(() => initialTex)
  const uvScaleRef = useRef(new THREE.Vector2(1, 1))
  const uvOffsetRef = useRef(new THREE.Vector2(0, 0))

  const computeUvTransform = (imgWidth, imgHeight) => {
    if (!imgWidth || !imgHeight) return
    const screenAspect = screenW / screenH
    const imgAspect = imgWidth / imgHeight

    let sX = 1.0
    let sY = 1.0
    let oX = 0.0
    let oY = 0.0

    if (fit === 'cover') {
      if (screenAspect > imgAspect) {
        // Screen is wider than image: fill width, crop and center height
        sX = 1.0
        sY = imgAspect / screenAspect
        oX = 0.0
        oY = (1.0 - sY) * (1.0 - focusY)
      } else {
        // Screen is taller than image: fill height, crop and center width
        sY = 1.0
        sX = screenAspect / imgAspect
        oY = 0.0
        oX = (1.0 - sX) * focusX
      }
    }

    uvScaleRef.current.set(sX, sY)
    uvOffsetRef.current.set(oX, oY)
    if (matRef.current) {
      matRef.current.uniforms.uUvScale.value.copy(uvScaleRef.current)
      matRef.current.uniforms.uUvOffset.value.copy(uvOffsetRef.current)
    }
  }

  // Load poster immediately and connect shared video source
  useEffect(() => {
    let active = true

    // 1. Initial poster texture
    if (poster) {
      getPosterTexture(poster, (loadedTex) => {
        if (!active) return
        setActiveTexture((prev) => (prev ? prev : loadedTex))
        const w = loadedTex.image?.naturalWidth || loadedTex.image?.width || 1920
        const h = loadedTex.image?.naturalHeight || loadedTex.image?.height || 1080
        computeUvTransform(w, h)
      })
    }

    // 2. Shared video texture connection
    if (src) {
      const record = getSharedVideoSource(src)
      if (record) {
        const onUpdate = (rec) => {
          if (!active) return
          setActiveTexture(rec.texture)
          computeUvTransform(rec.width, rec.height)
        }

        record.subscribers.add(onUpdate)
        if (record.isReady) {
          setActiveTexture(record.texture)
          computeUvTransform(record.width, record.height)
        }

        return () => {
          active = false
          record.subscribers.delete(onUpdate)
        }
      }
    }

    return () => {
      active = false
    }
  }, [src, poster, screenW, screenH, focusX, focusY, fit])

  // Stable ShaderMaterial instance (never torn down during rendering)
  const shader = useMemo(() => {
    const existingRec = src ? sharedVideoCache.get(src) : null
    const startTex = existingRec?.isReady ? existingRec.texture : null

    return new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      side: THREE.FrontSide,
      toneMapped: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
      uniforms: {
        map: { value: startTex },
        uGlow: { value: glowTarget },
        uGrid: { value: new THREE.Vector2(screenW * 3.0, screenH * 3.0) },
        uTime: { value: 0 },
        uHasMap: { value: startTex ? 1.0 : 0.0 },
        uUvScale: { value: new THREE.Vector2(1, 1) },
        uUvOffset: { value: new THREE.Vector2(0, 0) },
      },
    })
  }, [screenW, screenH])

  useFrame((_, delta) => {
    glowRef.current = THREE.MathUtils.damp(glowRef.current, glowTarget, 2.5, delta)
    if (matRef.current) {
      matRef.current.uniforms.uGlow.value = glowRef.current
      matRef.current.uniforms.uTime.value += delta
      matRef.current.uniforms.uUvScale.value.copy(uvScaleRef.current)
      matRef.current.uniforms.uUvOffset.value.copy(uvOffsetRef.current)

      const currentTex = activeTexture || (src && sharedVideoCache.get(src)?.isReady ? sharedVideoCache.get(src).texture : null)
      if (currentTex) {
        matRef.current.uniforms.map.value = currentTex
        matRef.current.uniforms.uHasMap.value = 1.0
      } else {
        matRef.current.uniforms.uHasMap.value = 0.0
      }
    }
  })

  return (
    <group {...props}>
      {/* Matte black bezel frame (placed behind the screen with clearance) */}
      <mesh position={[0, 0, -0.06]} castShadow>
        <boxGeometry args={[screenW + 0.5, screenH + 0.5, 0.10]} />
        <meshStandardMaterial color="#101216" roughness={0.7} metalness={0.4} />
      </mesh>

      {/* LED Display Surface (offset clearly forward by 0.02m to guarantee zero co-planar z-fighting) */}
      <mesh position={[0, 0, 0.02]}>
        <planeGeometry args={[screenW, screenH]} />
        <primitive object={shader} ref={matRef} attach="material" />
      </mesh>
    </group>
  )
}
