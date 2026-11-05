// src/components/venue/LiveShowEffects.jsx
// Concert live-show effects: sweeping searchlight beams, lasers, and stage particle sparkles.
// Implements Phase 4 Section 7 of PHASE4_DAYNIGHT_LED_CROWD_INTRO.md.
'use client'

import React, { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useVenue } from '@/store/useVenue'

const BEAM_COLORS = [
  '#f2680b', // TM Orange
  '#03c280', // TM Green
  '#00e5ff', // Neon Cyan
  '#ff007f', // Magenta
  '#ffb800', // Gold
  '#a855f7', // Purple
  '#00f59b', // Mint
  '#ff3366', // Coral
]

export default function LiveShowEffects({ stagePosition = [0, 15, 44] }) {
  const liveShow = useVenue((s) => s.liveShow)
  const beamsGroupRef = useRef()
  const lasersGroupRef = useRef()
  const sparklesRef = useRef()

  // Particle sparkle positions and random velocities
  const PARTICLE_COUNT = 160
  const { particleData, dummy } = useMemo(() => {
    const data = []
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      data.push({
        x: (Math.random() - 0.5) * 36,
        y: Math.random() * 22 + 2,
        z: (Math.random() - 0.5) * 12,
        speedY: Math.random() * 4.5 + 2.5,
        swaySpeed: Math.random() * 3.0 + 1.5,
        phase: Math.random() * Math.PI * 2,
        size: Math.random() * 0.45 + 0.2,
      })
    }
    return { particleData: data, dummy: new THREE.Object3D() }
  }, [])

  useFrame((state, delta) => {
    if (!liveShow) return
    const t = state.clock.getElapsedTime()

    // 1. Sweeping Stage Light Beams
    if (beamsGroupRef.current) {
      beamsGroupRef.current.children.forEach((beam, idx) => {
        const offset = idx * 0.78
        const pan = Math.sin(t * 2.2 + offset) * 0.58
        const tilt = Math.cos(t * 1.8 + offset * 1.3) * 0.42 - 0.45
        beam.rotation.z = pan
        beam.rotation.x = tilt
      })
    }

    // 2. High-speed Lasers Scanning Across Stands
    if (lasersGroupRef.current) {
      lasersGroupRef.current.children.forEach((laser, idx) => {
        const offset = idx * 1.4
        const scanPan = Math.sin(t * 4.5 + offset) * 0.75
        const scanPitch = Math.cos(t * 3.2 + offset) * 0.25 - 0.35
        laser.rotation.y = scanPan
        laser.rotation.x = scanPitch
      })
    }

    // 3. Stage Sparkles Rising from Deck
    if (sparklesRef.current) {
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const p = particleData[i]
        p.y += p.speedY * delta
        if (p.y > 26) {
          p.y = 2.0 // reset back to stage floor
          p.x = (Math.random() - 0.5) * 36
          p.z = (Math.random() - 0.5) * 12
        }
        const sway = Math.sin(t * p.swaySpeed + p.phase) * 0.65
        dummy.position.set(
          stagePosition[0] + p.x + sway,
          stagePosition[1] - 13 + p.y,
          stagePosition[2] + p.z
        )
        const pulseScale = p.size * (0.8 + Math.sin(t * 8 + p.phase) * 0.3)
        dummy.scale.set(pulseScale, pulseScale, pulseScale)
        dummy.updateMatrix()
        sparklesRef.current.setMatrixAt(i, dummy.matrix)
      }
      sparklesRef.current.instanceMatrix.needsUpdate = true
    }
  })

  if (!liveShow) return null

  return (
    <group position={stagePosition}>
      {/* 8 Sweeping Moving-Head Spotlight Beams (Thinned and flanked to clear LED screen per P1) */}
      <group ref={beamsGroupRef} position={[0, 0, 0]}>
        {BEAM_COLORS.map((col, idx) => {
          // Flank the 32m center screen: 4 fixtures on stage left wing, 4 on stage right wing
          const posX = idx < 4 ? -20 + idx * 2.2 : 13.4 + (idx - 4) * 2.2
          return (
            <group key={idx} position={[posX, 1.5, 0]}>
              <mesh position={[0, 18, -18]} rotation={[-Math.PI / 4, 0, 0]}>
                <cylinderGeometry args={[0.08, 1.8, 50, 12, 1, true]} />
                <meshBasicMaterial
                  color={col}
                  transparent
                  opacity={0.14}
                  blending={THREE.AdditiveBlending}
                  side={THREE.DoubleSide}
                  depthWrite={false}
                />
              </mesh>
            </group>
          )
        })}
      </group>

      {/* 4 Pencil-Thin Laser Scan Fans */}
      <group ref={lasersGroupRef} position={[0, 2.2, 0]}>
        {['#00ffff', '#00ff66', '#ff00aa', '#ffea00'].map((col, idx) => {
          const posX = idx < 2 ? -18 + idx * 3.0 : 15 + (idx - 2) * 3.0
          return (
            <group key={idx} position={[posX, 0, 0]}>
              <mesh position={[0, 30, -40]} rotation={[-0.45, 0, 0]}>
                <cylinderGeometry args={[0.02, 0.06, 95, 6, 1, true]} />
                <meshBasicMaterial
                  color={col}
                  transparent
                  opacity={0.42}
                  blending={THREE.AdditiveBlending}
                  depthWrite={false}
                />
              </mesh>
            </group>
          )
        })}
      </group>

      {/* Instanced Particle Sparkles Above Stage */}
      <instancedMesh
        ref={sparklesRef}
        args={[undefined, undefined, PARTICLE_COUNT]}
      >
        <sphereGeometry args={[0.25, 8, 8]} />
        <meshBasicMaterial
          color="#ffdd80"
          transparent
          opacity={0.85}
          blending={THREE.AdditiveBlending}
        />
      </instancedMesh>
    </group>
  )
}

