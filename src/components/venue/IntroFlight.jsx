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

// Real Abuja Flight Waypoints starting 300m back from the Velodrome (Package A approach):
// Origin: Moshood Abiola Stadium (lat 9.038108, lon 7.453463)
// Velodrome Dome: x ~ -128m, z ~ -486m
export const FLIGHT_WAYPOINTS = [
  // 1. High altitude 300m back from Velodrome looking south towards the Stadium
  {
    cam: [-140, 210, -890],
    target: [-80, 50, -380],
    fov: 50,
    roll: 0.0,
    caption: {
      tag: 'APPROACHING VENUE',
      title: 'Package A & Velodrome Approach',
      subtitle: 'North flight corridor approaching Moshood Abiola National Stadium',
    },
  },
  // 2. Gliding directly over the iconic Velodrome dome
  {
    cam: [-135, 160, -560],
    target: [-50, 38, -140],
    fov: 48,
    roll: 0.015,
    caption: {
      tag: 'ABUJA PRECINCT',
      title: 'Abuja Velodrome & Sports Precinct',
      subtitle: 'Geodesic cable-suspended dome & gateway boulevard',
    },
  },
  // 3. Gliding south over monumental stadium gateway and North Arrival Boulevard
  {
    cam: [-145, 125, -280],
    target: [-25, 26, -10],
    fov: 46,
    roll: 0.025,
    caption: {
      tag: 'VENUE GATEWAY',
      title: 'Package A & Stadium Gateway',
      subtitle: 'North arrival boulevard & monumental venue approach',
    },
  },
  // 4. Sweeping around the West facade & grandstand towards South plaza
  {
    cam: [-265, 115, 115],
    target: [-15, 20, 30],
    fov: 44,
    roll: -0.02,
    caption: {
      tag: 'NATIONAL VENUE',
      title: 'Moshood Abiola National Stadium',
      subtitle: 'About 60,000-seat flagship arena • Home of TM CON 2030',
    },
  },
  // 5. Final arrival at South Hero Overview pose from zones.js
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

const FLIGHT_DURATION = 13.0 // seconds (smooth majestic pace)
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
      if (p >= 0.02 && p < 0.26) {
        activeCaption = FLIGHT_WAYPOINTS[0].caption
      } else if (p >= 0.26 && p < 0.52) {
        activeCaption = FLIGHT_WAYPOINTS[1].caption
      } else if (p >= 0.52 && p < 0.78) {
        activeCaption = FLIGHT_WAYPOINTS[2].caption
      } else if (p >= 0.78 && p < 0.99) {
        activeCaption = FLIGHT_WAYPOINTS[3].caption
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
