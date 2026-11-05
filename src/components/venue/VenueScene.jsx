'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { CameraControls, Html } from '@react-three/drei'
import { useVenue } from '@/store/useVenue'
import {
  zones,
  zoneList,
  OVERVIEW,
  CAMERA_PRESETS,
  getSeatSightlineShot,
  tourSteps,
  COMPARISON_VIEWS,
} from '@/data/zones'
import { play } from '@/lib/audio'
import { tokens } from '@/styles/tokens'
import Stadium from './Stadium'
import IntroFlight from './IntroFlight'
import PerformanceWatchdog from './PerformanceWatchdog'

// Dynamic Hazy-Savanna to Night-Sky Dome Shader with smooth 1.5s interpolation
function DynamicSkyDome() {
  const timeOfDay = useVenue((s) => s.timeOfDay)
  const isNight = timeOfDay === 'night'
  const targetT = isNight ? 1.0 : 0.0
  const tRef = useRef(isNight ? 1.0 : 0.0)

  const matRef = useRef()

  const shader = useMemo(() => {
    return new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        uDayZenith: { value: new THREE.Color(tokens.lighting.daySkyZenith) },
        uDayHorizon: { value: new THREE.Color(tokens.lighting.daySkyHorizon) },
        uNightZenith: { value: new THREE.Color(tokens.lighting.nightSkyZenith) },
        uNightHorizon: { value: new THREE.Color(tokens.lighting.nightSkyHorizon) },
        uNight: { value: isNight ? 1.0 : 0.0 },
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 uDayZenith;
        uniform vec3 uDayHorizon;
        uniform vec3 uNightZenith;
        uniform vec3 uNightHorizon;
        uniform float uNight;
        varying vec3 vWorldPosition;

        float hash(vec2 p) {
          p = fract(p * vec2(123.34, 456.21));
          p += dot(p, p + 45.32);
          return fract(p.x * p.y);
        }

        void main() {
          vec3 dir = normalize(vWorldPosition);
          float h = clamp(dir.y, 0.0, 1.0);

          vec3 day = mix(uDayHorizon, uDayZenith, pow(h, 0.65));

          // Night atmospheric sky with glowing warm horizon band
          vec3 horizonGlow = vec3(0.95, 0.48, 0.18) * 0.85;
          float horizonBand = exp(-abs(dir.y) * 12.0) * 0.95;
          vec3 night = mix(uNightHorizon + horizonGlow * horizonBand, uNightZenith, pow(h, 0.55));

          // Procedural sparkling stars
          if (uNight > 0.08 && dir.y > 0.04) {
            vec2 starCoord = floor(dir.xz / (dir.y + 0.08) * 420.0);
            float n = hash(starCoord);
            if (n > 0.984) {
              float starIntensity = smoothstep(0.984, 1.0, n) * smoothstep(0.04, 0.3, dir.y);
              night += vec3(0.88, 0.94, 1.0) * starIntensity * 1.6 * uNight;
            }
          }

          vec3 col = mix(day, night, uNight);
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    })
  }, [isNight])

  const domeRef = useRef()

  useFrame((state, delta) => {
    tRef.current = THREE.MathUtils.damp(tRef.current, targetT, 2.5, delta)
    if (matRef.current) {
      matRef.current.uniforms.uNight.value = tRef.current
    }
    // Follow camera horizontally so sky dome is concentric everywhere
    if (domeRef.current) {
      domeRef.current.position.set(state.camera.position.x, 0, state.camera.position.z)
    }
  })

  return (
    <mesh ref={domeRef} raycast={() => null}>
      <sphereGeometry args={[28000, 32, 24]} />
      <primitive object={shader} ref={matRef} attach="material" />
    </mesh>
  )
}

// Environmental Atmospheric Lighting Controller (Sun, Moon, Fog, Hemisphere)
function EnvironmentLighting() {
  const timeOfDay = useVenue((s) => s.timeOfDay)
  const isNight = timeOfDay === 'night'
  const targetT = isNight ? 1.0 : 0.0
  const tRef = useRef(isNight ? 1.0 : 0.0)

  const { scene } = useThree()
  const sunRef = useRef()
  const moonRef = useRef()
  const hemiRef = useRef()
  const ambRef = useRef()

  const dayFogColor = useMemo(() => new THREE.Color(tokens.lighting.dayFog), [])
  const nightFogColor = useMemo(() => new THREE.Color(tokens.lighting.nightFog), [])
  const daySkyHemi = useMemo(() => new THREE.Color('#d9e1e6'), [])
  const nightSkyHemi = useMemo(() => new THREE.Color('#222d4a'), [])
  const dayGndHemi = useMemo(() => new THREE.Color('#b59a63'), [])
  const nightGndHemi = useMemo(() => new THREE.Color('#0b101c'), [])

  useFrame((_, delta) => {
    tRef.current = THREE.MathUtils.damp(tRef.current, targetT, 2.5, delta)
    const t = tRef.current

    // Interpolate Fog
    if (scene.fog) {
      scene.fog.color.lerpColors(dayFogColor, nightFogColor, t)
      scene.fog.near = THREE.MathUtils.lerp(350, 400, t)
      scene.fog.far = THREE.MathUtils.lerp(24000, 32000, t)
    }

    // Interpolate Sun
    if (sunRef.current) {
      sunRef.current.intensity = THREE.MathUtils.lerp(2.25, 0.0, t)
    }

    // Interpolate Moon
    if (moonRef.current) {
      moonRef.current.intensity = THREE.MathUtils.lerp(0.0, 0.55, t)
    }

    // Interpolate Hemisphere
    if (hemiRef.current) {
      hemiRef.current.color.lerpColors(daySkyHemi, nightSkyHemi, t)
      hemiRef.current.groundColor.lerpColors(dayGndHemi, nightGndHemi, t)
      hemiRef.current.intensity = THREE.MathUtils.lerp(0.95, 0.42, t)
    }

    // Interpolate Ambient Fill
    if (ambRef.current) {
      ambRef.current.intensity = THREE.MathUtils.lerp(0.32, 0.16, t)
    }
  })

  return (
    <>
      <hemisphereLight ref={hemiRef} args={['#d9e1e6', '#b59a63', 0.95]} />
      <ambientLight ref={ambRef} intensity={0.32} color="#f5efe2" />

      {/* Warm South-West Sun casting soft shadows across the stadium roof & upper tier */}
      <directionalLight
        ref={sunRef}
        position={[-140, 175, 110]}
        intensity={2.25}
        color={tokens.lighting.daySun}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-165}
        shadow-camera-right={165}
        shadow-camera-top={165}
        shadow-camera-bottom={-165}
        shadow-camera-near={20}
        shadow-camera-far={520}
        shadow-bias={-0.0004}
      />

      {/* Cool Soft Moon Light (Night only) */}
      <directionalLight
        ref={moonRef}
        position={[110, 150, -90]}
        intensity={0.0}
        color={tokens.lighting.nightMoon}
      />
    </>
  )
}

// Flies the camera to the active zone, tour step, or requested comparison view.
function CameraRig({ comparisonView }) {
  const ref = useRef()
  const activeZone = useVenue((s) => s.activeZone)
  const isTouring = useVenue((s) => s.isTouring)
  const tourStep = useVenue((s) => s.tourStep)
  const isIntroPlaying = useVenue((s) => s.isIntroPlaying)
  const selectedSeat = useVenue((s) => s.selectedSeat)
  const isSeatView = useVenue((s) => s.isSeatView)
  const activePreset = useVenue((s) => s.activePreset)

  useEffect(() => {
    if (isIntroPlaying) return

    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches

    // 1. Comparison Views override everything
    if (comparisonView && COMPARISON_VIEWS[comparisonView]) {
      const shot = COMPARISON_VIEWS[comparisonView]
      ref.current?.setLookAt(...shot.cam, ...shot.target, false)
      return
    }

    // 2. View from Seat: Eye position looking directly at stage
    if (isSeatView && selectedSeat) {
      const seatShot = getSeatSightlineShot(selectedSeat.zoneId, selectedSeat.index)
      if (seatShot) {
        ref.current?.setLookAt(...seatShot.cam, ...seatShot.target, !reduceMotion)
        play('whoosh')
        return
      }
    }

    // 3. Tour Step
    if (isTouring) {
      const shot = tourSteps[tourStep] ?? OVERVIEW
      ref.current?.setLookAt(...shot.cam, ...shot.target, !reduceMotion)
      play('whoosh')
      return
    }

    // 4. Active Zone
    if (activeZone && zones[activeZone]) {
      const shot = zones[activeZone]
      ref.current?.setLookAt(...shot.cam, ...shot.target, !reduceMotion)
      play('whoosh')
      return
    }

    // 5. Camera Preset (Overview, Stage, Floor, VIP, Upper Tier, Left, Right)
    if (activePreset) {
      const preset = CAMERA_PRESETS.find((p) => p.id === activePreset)
      if (preset) {
        ref.current?.setLookAt(...preset.cam, ...preset.target, !reduceMotion)
        play('whoosh')
        return
      }
    }

    // Fallback Overview
    ref.current?.setLookAt(...OVERVIEW.cam, ...OVERVIEW.target, !reduceMotion)
  }, [
    activeZone,
    isTouring,
    tourStep,
    comparisonView,
    isIntroPlaying,
    isSeatView,
    selectedSeat,
    activePreset,
  ])

  useEffect(() => {
    if (ref.current && typeof window !== 'undefined') {
      window.__cameraControls = ref.current
    }
  })

  useFrame(() => {
    if (ref.current && !isIntroPlaying) {
      // Prevent camera from ever dipping below the ground/floor (minimum 1.8m eye level)
      if (ref.current.camera.position.y < 1.8) {
        ref.current.camera.position.y = 1.8
      }
    }
  })

  return (
    <CameraControls
      ref={(inst) => {
        ref.current = inst
        if (typeof window !== 'undefined') window.__cameraControls = inst
      }}
      enabled={!isIntroPlaying}
      makeDefault
      minDistance={6}
      maxDistance={32000}
      maxPolarAngle={Math.PI * 0.485} // Strictly clamp rotation to above floor level (never below ground)
      minPolarAngle={0.06}
      smoothTime={0.85}
    />
  )
}

// Stable style object to prevent Drei <Html> useLayoutEffect re-render cascade in React 19
const STABLE_PIN_HTML_STYLE = { pointerEvents: 'none' }

function PinItem({ z, hidden }) {
  const { camera } = useThree()
  const focusZone = useVenue((s) => s.focusZone)
  const activePreset = useVenue((s) => s.activePreset)
  const pinV = useMemo(() => new THREE.Vector3(...z.pin), [z.pin])
  const btnRef = useRef()

  useFrame(() => {
    if (!btnRef.current) return
    const dist = camera.position.distanceTo(pinV)
    // Hide when too close (inside zone < 60m), too far (> 500m), or active in preset
    const isInsideZone = activePreset === z.id
    const isVisible = !hidden && !isInsideZone && dist >= 60 && dist <= 520
    btnRef.current.style.display = isVisible ? 'inline-flex' : 'none'
    btnRef.current.style.pointerEvents = isVisible ? 'auto' : 'none'
  })

  return (
    <Html
      position={z.pin}
      center
      zIndexRange={[10, 0]}
      style={STABLE_PIN_HTML_STYLE}
    >
      <button
        ref={btnRef}
        className="pin outlined-block"
        style={{
          '--accent': z.color,
          height: '30px',
          padding: '4px 10px',
          fontSize: '11px',
          fontWeight: 800,
          whiteSpace: 'nowrap',
        }}
        onClick={() => focusZone(z.id)}
        aria-label={`Explore ${z.label}`}
      >
        <span className="pin-dot" />
        <span className="pin-text">{z.label}</span>
      </button>
    </Html>
  )
}

// Floating interactive pins, styled with neubrutalist pill & hard offset shadow
function Pins({ hidePins }) {
  const activeZone = useVenue((s) => s.activeZone)
  const isTouring = useVenue((s) => s.isTouring)
  const isIntroPlaying = useVenue((s) => s.isIntroPlaying)
  const activePreset = useVenue((s) => s.activePreset)
  const isSeatView = useVenue((s) => s.isSeatView)

  const hidden = Boolean(
    hidePins ||
    activeZone ||
    isTouring ||
    isIntroPlaying ||
    (activePreset && activePreset !== 'overview') ||
    isSeatView
  )

  return zoneList.map((z) => <PinItem key={z.id} z={z} hidden={hidden} />)
}

export default function VenueScene({ comparisonView = null }) {
  const reset = useVenue((s) => s.reset)
  const isTouring = useVenue((s) => s.isTouring)
  const initialCam =
    (comparisonView && COMPARISON_VIEWS[comparisonView]?.cam) || OVERVIEW.cam

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.05,
      }}
      camera={{ position: initialCam, fov: 44, near: 1, far: 38000 }}
      onPointerMissed={() => {
        if (!isTouring && !comparisonView) reset()
      }}
    >
      <color attach="background" args={[tokens.lighting.dayFog]} />
      <fog attach="fog" args={[tokens.lighting.dayFog, 400, 32000]} />

      <DynamicSkyDome />
      <EnvironmentLighting />

      <Stadium hideConcertOverlay={Boolean(comparisonView)} />
      <Pins hidePins={Boolean(comparisonView)} />
      <CameraRig comparisonView={comparisonView} />
      <IntroFlight />
      <PerformanceWatchdog />
    </Canvas>
  )
}
