// src/components/venue/IntroFlight.jsx
// Cinematic 18-second aerial drone intro flying from Aso Rock across Abuja to Moshood Abiola Stadium.
// Implements Phase 4 Section 5 of PHASE4_DAYNIGHT_LED_CROWD_INTRO.md.
'use client'

import React, { useRef, useMemo, useEffect } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { useVenue } from '@/store/useVenue'
import { OVERVIEW } from '@/data/zones'
import { play } from '@/lib/audio'

// Real Abuja Flight Waypoints (in local metres centered at stadium [0, 0]):
// Origin: Moshood Abiola Stadium (lat 9.038108, lon 7.453463)
// Aso Rock / Three Arms Zone: x ~ +8800m, z ~ -4400m
export const FLIGHT_WAYPOINTS = [
  // 1. High altitude over Aso Rock & Three Arms Zone looking southwest towards Central Area
  {
    cam: [8800, 1050, -4400],
    target: [6200, 140, -3100],
    fov: 55,
    roll: 0.0,
    caption: {
      tag: 'ABUJA LANDMARK',
      title: 'Aso Rock & Three Arms Zone',
      subtitle: '400m granite monolith & Presidential Complex overlooking the capital',
    },
  },
  // 2. Gliding above National Assembly towards National Mosque & Central Business District
  {
    cam: [6000, 750, -2900],
    target: [4000, 90, -2000],
    fov: 53,
    roll: 0.035, // ~2 degrees bank
    caption: {
      tag: 'CENTRAL DISTRICT',
      title: 'Central Business District',
      subtitle: 'Golden dome of National Mosque & Central Bank of Nigeria tower',
    },
  },
  // 3. Constitution Avenue corridor tracking southwest
  {
    cam: [3800, 520, -1800],
    target: [1900, 60, -900],
    fov: 50,
    roll: -0.045, // banking into the curve
    caption: {
      tag: 'CEREMONIAL AXIS',
      title: 'Constitution Avenue Corridor',
      subtitle: 'Ceremonial arterial boulevard connecting Central Area towards the National Stadium precinct',
    },
  },
  // 4. Over Umaru Musa Yar\'Adua Expressway descending past City Gate
  {
    cam: [1500, 310, -700],
    target: [250, 40, -100],
    fov: 46,
    roll: 0.03,
    caption: {
      tag: 'SPORTS PRECINCT',
      title: 'Package A & Velodrome',
      subtitle: 'Cable-suspended velodrome dome & monumental stadium gateway',
    },
  },
  // 5. Sweeping around the stadium exterior to south approach
  {
    cam: [-80, 230, 420],
    target: [-10, 25, 40],
    fov: 43,
    roll: -0.015,
    caption: {
      tag: 'NATIONAL VENUE',
      title: 'Moshood Abiola National Stadium',
      subtitle: 'About 60,000-seat flagship arena • Home of TM CON 2030',
    },
  },
  // 6. Final arrival at South Hero Overview pose from zones.js
  {
    cam: OVERVIEW.cam,
    target: OVERVIEW.target,
    fov: 42,
    roll: 0.0,
    caption: null,
  },
]

// Smooth S-curve cubic ease in/out per brief Section 5
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

const FLIGHT_DURATION = 18.0 // seconds
const LIGHTS_ON_DURATION = 2.5 // seconds

export default function IntroFlight() {
  const { camera } = useThree()
  const isIntroPlaying = useVenue((s) => s.isIntroPlaying)
  const introPhase = useVenue((s) => s.introPhase)
  const setIntroProgress = useVenue((s) => s.setIntroProgress)
  const startLightsOn = useVenue((s) => s.startLightsOn)
  const setLightsOnProgress = useVenue((s) => s.setLightsOnProgress)
  const completeIntro = useVenue((s) => s.completeIntro)
  const skipIntro = useVenue((s) => s.skipIntro)

  const flightTimer = useRef(0)
  const lightsTimer = useRef(0)
  const pulseMeshRef = useRef()
  const rimSweepMeshRef = useRef()
  const lastIntroU = useRef(-1)
  const lastActiveCaption = useRef(null)

  // Build Catmull-Rom splines
  const { posCurve, targetCurve, fovCurve, rollCurve } = useMemo(() => {
    const camPts = FLIGHT_WAYPOINTS.map((w) => new THREE.Vector3(...w.cam))
    const tgtPts = FLIGHT_WAYPOINTS.map((w) => new THREE.Vector3(...w.target))
    const fovPts = FLIGHT_WAYPOINTS.map((w, idx) => new THREE.Vector3(idx / (FLIGHT_WAYPOINTS.length - 1), w.fov, 0))
    const rollPts = FLIGHT_WAYPOINTS.map((w, idx) => new THREE.Vector3(idx / (FLIGHT_WAYPOINTS.length - 1), w.roll, 0))

    return {
      posCurve: new THREE.CatmullRomCurve3(camPts, false, 'centripetal'),
      targetCurve: new THREE.CatmullRomCurve3(tgtPts, false, 'centripetal'),
      fovCurve: new THREE.CatmullRomCurve3(fovPts, false, 'centripetal'),
      rollCurve: new THREE.CatmullRomCurve3(rollPts, false, 'centripetal'),
    }
  }, [])

  // Listen for Escape key to skip intro
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isIntroPlaying) {
        skipIntro()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isIntroPlaying, skipIntro])

  // Reset timers on intro start
  useEffect(() => {
    if (isIntroPlaying && introPhase === 'flight') {
      flightTimer.current = 0
      lightsTimer.current = 0
    }
  }, [isIntroPlaying, introPhase])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__setFlightProgress = (u) => {
        flightTimer.current = u * FLIGHT_DURATION
      }
    }
    return () => {
      delete window.__setFlightProgress
    }
  }, [])

  useFrame((_, delta) => {
    if (!isIntroPlaying) return

    // Clamp delta time to 0.1s to avoid skipping intro when loading or switching tabs
    const dt = Math.min(delta, 0.1)

    // 1. FLIGHT PHASE
    if (introPhase === 'flight') {
      flightTimer.current += dt
      const u = Math.min(1.0, flightTimer.current / FLIGHT_DURATION)
      const p = ease(u)

      // Camera position & target along centripetal splines
      const currentPos = posCurve.getPoint(p)
      const currentTarget = targetCurve.getPoint(Math.min(1.0, p + 0.025))

      // Camera FOV narrowing from 55 down to 42 degrees
      const currentFov = THREE.MathUtils.lerp(55, 42, p)
      camera.fov = currentFov
      camera.updateProjectionMatrix()

      // Drive CameraControls if available to prevent fight with controls loop
      if (window.__cameraControls) {
        window.__cameraControls.setLookAt(
          currentPos.x,
          currentPos.y,
          currentPos.z,
          currentTarget.x,
          currentTarget.y,
          currentTarget.z,
          false
        )
      } else {
        // Camera bank / roll on curves
        const currentRoll = rollCurve.getPoint(p).y
        camera.up.set(Math.sin(currentRoll), Math.cos(currentRoll), 0)
        camera.position.copy(currentPos)
        camera.lookAt(currentTarget)
      }

      // Landmark captions fade in as each region passes
      let activeCaption = null
      if (p >= 0.02 && p < 0.22) {
        activeCaption = FLIGHT_WAYPOINTS[0].caption
      } else if (p >= 0.22 && p < 0.44) {
        activeCaption = FLIGHT_WAYPOINTS[1].caption
      } else if (p >= 0.44 && p < 0.68) {
        activeCaption = FLIGHT_WAYPOINTS[2].caption
      } else if (p >= 0.68 && p < 0.88) {
        activeCaption = FLIGHT_WAYPOINTS[3].caption
      } else if (p >= 0.88 && p < 0.99) {
        activeCaption = FLIGHT_WAYPOINTS[4].caption
      }

      if (
        Math.abs(u - lastIntroU.current) >= 0.01 ||
        activeCaption !== lastActiveCaption.current ||
        u >= 1.0
      ) {
        lastIntroU.current = u
        lastActiveCaption.current = activeCaption
        setIntroProgress(u, activeCaption)
      }

      // Road pulse traveling ahead of camera along expressway corridor
      if (pulseMeshRef.current) {
        // Pulse moves from Aso Rock (8500, -4200) to Stadium (0, 0)
        const pulseP = Math.min(1.0, p * 1.15 + 0.05)
        const pulseX = THREE.MathUtils.lerp(8800, 0, pulseP)
        const pulseZ = THREE.MathUtils.lerp(-4400, 0, pulseP)
        pulseMeshRef.current.position.set(pulseX, 15, pulseZ)
        pulseMeshRef.current.scale.setScalar(1 + Math.sin(flightTimer.current * 6) * 0.3)
      }

      // Reached destination overview pose: transition to lights-on moment
      if (u >= 1.0) {
        if (window.__cameraControls) {
          window.__cameraControls.setLookAt(...OVERVIEW.cam, ...OVERVIEW.target, false)
        } else {
          camera.position.set(...OVERVIEW.cam)
          camera.up.set(0, 1, 0)
          camera.lookAt(new THREE.Vector3(...OVERVIEW.target))
        }
        camera.fov = 42
        camera.updateProjectionMatrix()
        startLightsOn()
        try {
          play('whoosh')
        } catch (e) {}
      }
    }

    // 2. LIGHTS-ON ARRIVAL PHASE
    else if (introPhase === 'lights_on') {
      lightsTimer.current += dt
      const pLights = Math.min(1.0, lightsTimer.current / LIGHTS_ON_DURATION)
      setLightsOnProgress(pLights)

      // Keep camera locked at the hero overview pose
      if (window.__cameraControls) {
        window.__cameraControls.setLookAt(...OVERVIEW.cam, ...OVERVIEW.target, false)
      } else {
        camera.position.set(...OVERVIEW.cam)
        camera.up.set(0, 1, 0)
        camera.lookAt(new THREE.Vector3(...OVERVIEW.target))
      }

      // Roof rim light sweep during the first 0.8s
      if (rimSweepMeshRef.current) {
        const sweepProgress = Math.min(1.0, lightsTimer.current / 0.8)
        if (sweepProgress < 1.0) {
          rimSweepMeshRef.current.visible = true
          const angle = sweepProgress * Math.PI * 2
          const rx = Math.cos(angle) * 105
          const rz = Math.sin(angle) * 82
          rimSweepMeshRef.current.position.set(rx, 32.5, rz)
        } else {
          rimSweepMeshRef.current.visible = false
        }
      }

      // Completed 2.5s lights-on sequence
      if (pLights >= 1.0) {
        completeIntro()
      }
    }
  })

  if (!isIntroPlaying) return null

  return (
    <group name="intro-flight-effects">
      {/* Luminous pulse wave traveling ahead of camera along the expressway */}
      {introPhase === 'flight' && (
        <mesh ref={pulseMeshRef} position={[8800, 15, -4400]}>
          <sphereGeometry args={[45, 16, 16]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.85} />
        </mesh>
      )}

      {/* 360-degree light sweep bead running around inner roof cable rim */}
      {introPhase === 'lights_on' && (
        <mesh ref={rimSweepMeshRef} visible={false}>
          <sphereGeometry args={[4.5, 16, 16]} />
          <meshBasicMaterial color="#fff3d6" />
        </mesh>
      )}
    </group>
  )
}
