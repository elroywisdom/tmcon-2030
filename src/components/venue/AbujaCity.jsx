// src/components/venue/AbujaCity.jsx
// Photorealistic 3D Abuja City model, verified OSM landmarks, instanced buildings,
// streetlights, animated highway traffic, and Aso Rock topography.
// Based on PHASE4_DAYNIGHT_LED_CROWD_INTRO.md Section 6.

'use client'

import React, { useMemo, useRef, useState, useEffect } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useVenue } from '@/store/useVenue'
import { ABUJA_LANDMARKS } from '@/data/landmarks'
import { tokens } from '@/styles/tokens'

// Building Window & Night Lighting Shader
const BUILDING_VERT = `
attribute vec3 aColor;
attribute float aWindowChance;
attribute float aHeight;

uniform float uTime;
uniform float uTimeOfDay;

varying vec3 vColor;
varying vec3 vWorldPos;
varying vec3 vNormal;
varying float vWindowChance;
varying float vHeight;

void main() {
  vec4 wPos = instanceMatrix * vec4(position, 1.0);
  vWorldPos = wPos.xyz;
  vNormal = normalize((instanceMatrix * vec4(normal, 0.0)).xyz);
  vColor = aColor;
  vWindowChance = aWindowChance;
  vHeight = aHeight;
  gl_Position = projectionMatrix * viewMatrix * wPos;
}
`

const BUILDING_FRAG = `
uniform float uTime;
uniform float uTimeOfDay;

varying vec3 vColor;
varying vec3 vWorldPos;
varying vec3 vNormal;
varying float vWindowChance;
varying float vHeight;

float hash2(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

void main() {
  vec3 N = normalize(vNormal);
  vec3 baseColor = vColor;

  // Window grid on vertical walls
  float isWall = abs(N.y) < 0.3 ? 1.0 : 0.0;
  vec2 windowGrid = fract(vec2(vWorldPos.x + vWorldPos.z, vWorldPos.y) * 0.28);
  vec2 windowId = floor(vec2(vWorldPos.x + vWorldPos.z, vWorldPos.y) * 0.28);
  float isInsideWindow = (windowGrid.x > 0.22 && windowGrid.x < 0.78 && windowGrid.y > 0.22 && windowGrid.y < 0.78) ? 1.0 : 0.0;

  float windowLit = (hash2(windowId) < vWindowChance) ? 1.0 : 0.0;
  // Natural night window color variation: warm tungsten, amber gold, soft daylight, subtle cyan/mint
  float colorPick = hash2(windowId + 1.37);
  vec3 windowColor;
  if (colorPick < 0.40) {
    windowColor = vec3(1.0, 0.76, 0.42); // Warm tungsten / residential
  } else if (colorPick < 0.75) {
    windowColor = vec3(1.0, 0.86, 0.62); // Soft golden amber
  } else if (colorPick < 0.90) {
    windowColor = vec3(0.82, 0.92, 1.0);  // Cool commercial fluorescent
  } else {
    windowColor = vec3(0.78, 0.96, 0.88); // Soft mint / modern office
  }

  // Day lighting
  vec3 sunDir = normalize(vec3(0.35, 0.85, 0.4));
  float NdotL = max(0.0, dot(N, sunDir));
  vec3 dayLight = mix(vec3(0.65, 0.62, 0.58), vec3(1.15, 1.10, 1.02), NdotL);
  vec3 nightAmbient = vec3(0.06, 0.08, 0.13);

  vec3 litBuilding = baseColor * mix(dayLight, nightAmbient, uTimeOfDay);

  // Softened window glow at night (calibrated to prevent blown-out harsh white)
  if (isWall > 0.5 && isInsideWindow > 0.5 && windowLit > 0.5 && uTimeOfDay > 0.2) {
    float windowIntensity = smoothstep(0.2, 0.85, uTimeOfDay) * 0.92;
    litBuilding += windowColor * windowIntensity;
  }

  gl_FragColor = vec4(litBuilding, 1.0);
}
`

export default function AbujaCity() {
  const timeOfDay = useVenue((s) => s.timeOfDay)
  const activeZone = useVenue((s) => s.activeZone)

  const [cityData, setCityData] = useState(null)
  const buildingRef = useRef()
  const streetlightRef = useRef()
  const trafficRef = useRef()
  const materialRef = useRef()
  const trafficMaterialRef = useRef()

  // Load baked city datasets progressively
  useEffect(() => {
    let active = true
    async function load() {
      try {
        const [bRes, lRes, tRes] = await Promise.all([
          fetch('/city/buildings.json').then((r) => r.json()),
          fetch('/city/streetlights.json').then((r) => r.json()),
          fetch('/city/traffic.json').then((r) => r.json()),
        ])
        if (active) {
          setCityData({
            buildings: bRes,
            streetlights: lRes,
            traffic: tRes,
          })
        }
      } catch (err) {
        console.warn('Progressive city load fallback:', err)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [])

  // 1. Instanced City Buildings setup
  const buildingCount = cityData?.buildings?.length || 0
  const buildingGeo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), [])
  const buildingMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: BUILDING_VERT,
      fragmentShader: BUILDING_FRAG,
      uniforms: {
        uTime: { value: 0 },
        uTimeOfDay: { value: timeOfDay === 'night' ? 1.0 : 0.0 },
      },
      toneMapped: true,
    })
  }, [])

  useEffect(() => {
    if (!buildingRef.current || !cityData?.buildings) return
    const dummy = new THREE.Object3D()
    const colorArr = new Float32Array(buildingCount * 3)
    const chanceArr = new Float32Array(buildingCount)
    const heightArr = new Float32Array(buildingCount)

    cityData.buildings.forEach((b, i) => {
      dummy.position.set(b.x, b.h / 2, b.z)
      dummy.scale.set(b.w, b.h, b.d)
      dummy.updateMatrix()
      buildingRef.current.setMatrixAt(i, dummy.matrix)

      const c = new THREE.Color(b.color)
      colorArr[i * 3 + 0] = c.r
      colorArr[i * 3 + 1] = c.g
      colorArr[i * 3 + 2] = c.b
      chanceArr[i] = b.windowChance
      heightArr[i] = b.h
    })

    buildingRef.current.instanceMatrix.needsUpdate = true
    buildingGeo.setAttribute('aColor', new THREE.InstancedBufferAttribute(colorArr, 3))
    buildingGeo.setAttribute('aWindowChance', new THREE.InstancedBufferAttribute(chanceArr, 1))
    buildingGeo.setAttribute('aHeight', new THREE.InstancedBufferAttribute(heightArr, 1))
  }, [cityData?.buildings, buildingCount, buildingGeo])

  // 2. Instanced Streetlights along Roads (capped radius so lights remain crisp points)
  const streetlightCount = cityData?.streetlights?.length || 0
  const streetlightGeo = useMemo(() => new THREE.SphereGeometry(0.35, 6, 6), [])
  useEffect(() => {
    if (!streetlightRef.current || !cityData?.streetlights) return
    const dummy = new THREE.Object3D()
    cityData.streetlights.forEach((s, i) => {
      dummy.position.set(s.position[0], s.position[1], s.position[2])
      dummy.scale.set(1, 1, 1)
      dummy.updateMatrix()
      streetlightRef.current.setMatrixAt(i, dummy.matrix)
      streetlightRef.current.setColorAt(i, new THREE.Color(s.color))
    })
    streetlightRef.current.instanceMatrix.needsUpdate = true
    if (streetlightRef.current.instanceColor) {
      streetlightRef.current.instanceColor.needsUpdate = true
    }
  }, [cityData?.streetlights, streetlightCount])

  // 3. Highway Traffic Flow (scaled for realism)
  const trafficCount = cityData?.traffic?.length || 0
  const trafficGeo = useMemo(() => new THREE.BoxGeometry(2.4, 0.6, 1.2), [])

  // Per-frame animation for day/night interpolation and highway traffic
  useFrame((state, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime()
      const targetNight = timeOfDay === 'night' ? 1.0 : 0.0
      materialRef.current.uniforms.uTimeOfDay.value = THREE.MathUtils.damp(
        materialRef.current.uniforms.uTimeOfDay.value,
        targetNight,
        2.5,
        delta
      )
    }

    // Animate vehicle traffic along road vectors
    if (trafficRef.current && cityData?.traffic) {
      const dummy = new THREE.Object3D()
      const time = state.clock.getElapsedTime()
      cityData.traffic.forEach((car, i) => {
        const p1 = car.p1
        const p2 = car.p2
        const progress = (car.t + time * car.speed * 0.15) % 1.0
        const x = p1[0] + (p2[0] - p1[0]) * progress
        const y = p1[1] + (p2[1] - p1[1]) * progress
        const z = p1[2] + (p2[2] - p1[2]) * progress

        const rotY = Math.atan2(p2[0] - p1[0], p2[1] - p1[1])
        dummy.position.set(x, y, z)
        dummy.rotation.set(0, rotY, 0)
        dummy.updateMatrix()
        trafficRef.current.setMatrixAt(i, dummy.matrix)
      })
      trafficRef.current.instanceMatrix.needsUpdate = true
    }
  })

  const isNight = timeOfDay === 'night'

  return (
    <group name="abuja-city-environment">
      {/* 1. Instanced City Buildings */}
      {buildingCount > 0 && (
        <instancedMesh
          ref={buildingRef}
          args={[buildingGeo, buildingMaterial, buildingCount]}
        >
          <primitive object={buildingMaterial} ref={materialRef} attach="material" />
        </instancedMesh>
      )}

      {/* 2. Instanced Streetlights along Roads (glow at night) */}
      {streetlightCount > 0 && (
        <instancedMesh
          ref={streetlightRef}
          args={[streetlightGeo, undefined, streetlightCount]}
        >
          <meshBasicMaterial
            toneMapped={false}
            transparent
            opacity={isNight ? 0.95 : 0.25}
          />
        </instancedMesh>
      )}

      {/* 3. Moving Highway Vehicle Headlights & Taillights */}
      {trafficCount > 0 && (
        <instancedMesh
          ref={trafficRef}
          args={[trafficGeo, undefined, trafficCount]}
        >
          <meshBasicMaterial
            toneMapped={false}
            transparent
            opacity={isNight ? 1.0 : 0.4}
          />
        </instancedMesh>
      )}

      {/* 4. Verified Landmarks Silhouettes with Illuminated Elements */}
      <LandmarkSilhouettes isNight={isNight} activeZone={activeZone} />

      {/* 5. Regional Savanna Terrain & CBD Ground Fabric */}
      <RegionalSavannaTerrain isNight={isNight} />

      {/* 6. Aso Rock Monolith & Savanna Inselbergs */}
      <AsoRockAndSavannaHills isNight={isNight} />
    </group>
  )
}

/**
 * 3D Silhouettes for Verified OSM Abuja Landmarks
 */
function LandmarkSilhouettes({ isNight, activeZone }) {
  const activePreset = useVenue((s) => s.activePreset)
  const isTouring = useVenue((s) => s.isTouring)
  const isSeatView = useVenue((s) => s.isSeatView)
  const comparisonView = useVenue((s) => s.comparisonView)
  const showLandmarkLabels =
    !comparisonView &&
    !activeZone &&
    !isTouring &&
    !isSeatView &&
    activePreset === 'overview'

  return (
    <group name="abuja-landmarks">
      {/* A. Abuja City Gate (Triangular monumental arch gateway at southwest highway entrance) */}
      <group position={[-532.4, 0, 266.5]} rotation={[0, 0.46, 0]}>
        {/* Massive angled concrete pylons forming the triangular gateway */}
        <mesh position={[-16, 19, 0]} rotation={[0, 0, -0.26]} castShadow>
          <boxGeometry args={[4.5, 42, 6]} />
          <meshStandardMaterial color="#ded7c6" roughness={0.65} />
        </mesh>
        <mesh position={[16, 19, 0]} rotation={[0, 0, 0.26]} castShadow>
          <boxGeometry args={[4.5, 42, 6]} />
          <meshStandardMaterial color="#ded7c6" roughness={0.65} />
        </mesh>
        {/* Central Crown Crossbeam & Nigerian Coat of Arms motif */}
        <mesh position={[0, 36.5, 0]} castShadow>
          <boxGeometry args={[18, 4.5, 7]} />
          <meshStandardMaterial color="#4a4f56" metalness={0.6} />
        </mesh>
        {/* Gate Concourse Plaza Platform */}
        <mesh position={[0, 0.6, 0]} receiveShadow>
          <cylinderGeometry args={[42, 45, 1.2, 32]} />
          <meshStandardMaterial color="#cfc7b6" roughness={0.8} />
        </mesh>
        {/* Night Accent Lighting (Nigerian Green Flag illumination) */}
        {isNight && (
          <pointLight
            position={[0, 18, 0]}
            color={tokens.colors.green}
            intensity={2.8}
            distance={90}
          />
        )}
      </group>

      {/* B. Moshood Abiola Velodrome Dome (North of stadium across expressway) */}
      <group position={[-127.9, 0, -485.6]}>
        {/* White tensile geodesic dome */}
        <mesh position={[0, 16, 0]} castShadow receiveShadow>
          <sphereGeometry args={[75, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.48]} />
          <meshStandardMaterial
            color="#f7f7f5"
            roughness={0.35}
            emissive={isNight ? '#e6efff' : '#000000'}
            emissiveIntensity={isNight ? 0.35 : 0}
          />
        </mesh>
        {/* Circular concrete base plinth */}
        <mesh position={[0, 1.5, 0]} receiveShadow>
          <cylinderGeometry args={[78, 80, 3, 32]} />
          <meshStandardMaterial color="#b2ada3" roughness={0.7} />
        </mesh>
      </group>

      {/* C. Central Bank of Nigeria (CBN) HQ & CBD High-Rise Cluster */}
      <group position={[4345.3, 0, -1413.6]}>
        {/* Main CBN Glass Tower */}
        <mesh position={[0, 49, 0]} castShadow>
          <boxGeometry args={[65, 98, 55]} />
          <meshStandardMaterial
            color="#283a4c"
            metalness={0.7}
            roughness={0.25}
            emissive={isNight ? '#163447' : '#000000'}
            emissiveIntensity={isNight ? 0.6 : 0}
          />
        </mesh>
        {/* Emerald Green Crown Illumination at Night */}
        <mesh position={[0, 99, 0]}>
          <boxGeometry args={[67, 3, 57]} />
          <meshStandardMaterial
            color={tokens.colors.green}
            emissive={tokens.colors.green}
            emissiveIntensity={isNight ? 2.2 : 0.4}
          />
        </mesh>
      </group>

      {/* D. National Christian Centre (Sweeping Gothic Arches & Cross Spire) */}
      <group position={[4553.8, 0, -1137.9]}>
        {/* Main Cathedral Nave and Sloped Concrete Roof */}
        <mesh position={[0, 24, 0]} castShadow>
          <coneGeometry args={[38, 48, 4]} />
          <meshStandardMaterial color="#ded7cb" roughness={0.55} />
        </mesh>
        {/* Soaring Central Spire */}
        <mesh position={[0, 62, 0]} castShadow>
          <cylinderGeometry args={[0.8, 3.2, 42, 6]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive={isNight ? '#fff2dd' : '#000000'}
            emissiveIntensity={isNight ? 1.5 : 0}
          />
        </mesh>
      </group>

      {/* E. Abuja National Mosque (Golden Dome + Four Minarets) */}
      <group position={[3994.1, 0, -2442.3]}>
        {/* Central Golden Dome */}
        <mesh position={[0, 44, 0]} castShadow>
          <sphereGeometry args={[26, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
          <meshStandardMaterial
            color="#d4af37"
            metalness={0.85}
            roughness={0.2}
            emissive={isNight ? '#ffd700' : '#000000'}
            emissiveIntensity={isNight ? 1.4 : 0}
          />
        </mesh>
        {/* Mosque Main Cubic Hall */}
        <mesh position={[0, 20, 0]} castShadow>
          <boxGeometry args={[70, 40, 70]} />
          <meshStandardMaterial color="#f0ede4" roughness={0.6} />
        </mesh>
        {/* Four Soaring 84m Minarets */}
        {[-44, 44].map((mx) =>
          [-44, 44].map((mz) => (
            <mesh key={`${mx}-${mz}`} position={[mx, 44, mz]} castShadow>
              <cylinderGeometry args={[1.6, 2.8, 88, 8]} />
              <meshStandardMaterial
                color="#f0ede4"
                emissive={isNight ? '#ffd700' : '#000000'}
                emissiveIntensity={isNight ? 0.4 : 0}
              />
            </mesh>
          ))
        )}
      </group>

      {/* F. Eagle Square (Ceremonial Parade Grounds) */}
      <group position={[5095.9, 0, -2525.3]}>
        <mesh position={[0, 0.4, 0]} receiveShadow>
          <boxGeometry args={[140, 0.8, 90]} />
          <meshStandardMaterial color="#cfc8b8" roughness={0.8} />
        </mesh>
        {/* VIP Presidential Canopy */}
        <mesh position={[0, 11, -38]} castShadow>
          <boxGeometry args={[65, 3.5, 24]} />
          <meshStandardMaterial color="#03c280" roughness={0.4} />
        </mesh>
      </group>

      {/* G. National Assembly Complex (Parliament in Three Arms Zone) */}
      <group position={[6346.8, 0, -3319.0]}>
        {/* Broad White Parliamentary Complex */}
        <mesh position={[0, 16, 0]} castShadow>
          <boxGeometry args={[120, 32, 85]} />
          <meshStandardMaterial color="#f8f7f2" roughness={0.45} />
        </mesh>
        {/* Golden Central Assembly Dome */}
        <mesh position={[0, 38, 0]} castShadow>
          <sphereGeometry args={[22, 28, 14, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
          <meshStandardMaterial
            color="#d4af37"
            metalness={0.8}
            roughness={0.25}
            emissive={isNight ? '#ffd700' : '#000000'}
            emissiveIntensity={isNight ? 1.2 : 0}
          />
        </mesh>
      </group>

      {/* H. Transcorp Hilton Abuja (Maitama Landmark Hotel) */}
      <group position={[4553.4, 0, -4075.5]}>
        <mesh position={[0, 34, 0]} castShadow>
          <boxGeometry args={[75, 68, 48]} />
          <meshStandardMaterial
            color="#eae5da"
            roughness={0.5}
            emissive={isNight ? '#f2680b' : '#000000'}
            emissiveIntensity={isNight ? 0.35 : 0}
          />
        </mesh>
      </group>

      {/* 3D Visual Beacon Plinths for Verified Landmarks */}
      <LandmarkBeacon position={[-532.4, 0, 266.5]} isNight={isNight} color="#008751" />
      <LandmarkBeacon position={[-127.9, 0, -485.6]} isNight={isNight} color="#ffffff" />
      <LandmarkBeacon position={[3994.1, 0, -2442.3]} isNight={isNight} color="#ffbe3b" />
      <LandmarkBeacon position={[4345.3, 0, -1413.6]} isNight={isNight} color="#008751" />
      <LandmarkBeacon position={[6346.8, 0, -3319.0]} isNight={isNight} color="#008751" />
      <LandmarkBeacon position={[9078.3, 0, -4675.2]} isNight={isNight} color="#d4793f" />
    </group>
  )
}

/**
 * Architectural Ground Beacon for Landmarks (Zero Drei <Html> overhead)
 */
function LandmarkBeacon({ position, isNight, color }) {
  return (
    <group position={position}>
      {/* Illuminated Base Ring */}
      <mesh position={[0, 0.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[18, 22, 24]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={isNight ? 0.85 : 0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Vertical Light Column on Horizon */}
      {isNight && (
        <mesh position={[0, 45, 0]}>
          <cylinderGeometry args={[1.2, 3.5, 90, 8]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.15}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  )
}

/**
 * Regional Abuja Savanna Terrain & CBD Ground Network
 * Extends 36km across the entire flight corridor & landmark basin,
 * eliminating the black void under Aso Rock, National Mosque, and CBN.
 */
function RegionalSavannaTerrain({ isNight }) {
  // Coarse displaced rolling topography for the broader Abuja Federal Capital Territory
  const regionalTerrainGeo = useMemo(() => {
    const geo = new THREE.PlaneGeometry(36000, 36000, 32, 32)
    const pos = geo.attributes.position
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i)
      const vy = pos.getY(i)
      // Natural low undulating topography (valleys and ridges)
      const elevation =
        Math.sin(vx * 0.0006) * Math.cos(vy * 0.0007) * 42 +
        Math.sin(vx * 0.0018 + vy * 0.0014) * 22
      pos.setZ(i, elevation)
    }
    geo.computeVertexNormals()
    return geo
  }, [])

  return (
    <group name="regional-abuja-terrain">
      {/* 1. Vast continuous 36km Savanna Earth Slab (centered between Stadium & Aso Rock) */}
      <mesh
        geometry={regionalTerrainGeo}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[4500, -1.2, -2500]}
        receiveShadow
        raycast={() => null}
      >
        <meshStandardMaterial
          color={isNight ? '#0a0d0d' : '#baaa94'}
          roughness={0.95}
          metalness={0.02}
        />
      </mesh>

      {/* 2. Central Business District (CBD) Urban Ground Pad (Asphalt & Paved Parcels) */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[4600, -0.4, -2200]}
        receiveShadow
        raycast={() => null}
      >
        <planeGeometry args={[7500, 5200]} />
        <meshStandardMaterial
          color={isNight ? '#101317' : '#9a9488'}
          roughness={0.88}
        />
      </mesh>

      {/* 3. CBD Arterial Highway Grid & Night Streetlights Under Landmarks */}
      <CBDUrbanFabric isNight={isNight} />
    </group>
  )
}

/**
 * CBD Urban Fabric: Constitution Avenue, Shehu Shagari Way, Street Blocks & Lights
 */
function CBDUrbanFabric({ isNight }) {
  const roadMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: isNight ? '#16191d' : '#33373d',
        roughness: 0.8,
      }),
    [isNight]
  )

  return (
    <group name="cbd-urban-fabric">
      {/* Constitution Avenue Main Spine (connecting Central Area towards Stadium corridor) */}
      <mesh
        position={[4500, 0.2, -2100]}
        rotation={[-Math.PI / 2, 0, 0.26]}
        material={roadMat}
      >
        <planeGeometry args={[42, 6800]} />
      </mesh>

      {/* Shehu Shagari Way (Three Arms Zone arterial past National Assembly) */}
      <mesh
        position={[5800, 0.2, -2800]}
        rotation={[-Math.PI / 2, 0, -0.42]}
        material={roadMat}
      >
        <planeGeometry args={[36, 5200]} />
      </mesh>

      {/* Independence Avenue Grid Cross-Connector */}
      <mesh
        position={[4200, 0.2, -1800]}
        rotation={[-Math.PI / 2, 0, 1.15]}
        material={roadMat}
      >
        <planeGeometry args={[32, 4800]} />
      </mesh>

      {/* Night City Illumination: Low-rise commercial office blocks in CBD */}
      <group position={[4400, 0, -2200]}>
        {Array.from({ length: 45 }, (_, i) => {
          const bx = ((i % 9) - 4) * 220 + ((i * 37) % 60)
          const bz = (Math.floor(i / 9) - 2) * 240 + ((i * 53) % 70)
          const bh = 18 + ((i * 29) % 55)
          const bw = 45 + ((i * 17) % 35)
          const bd = 40 + ((i * 23) % 30)
          return (
            <mesh key={i} position={[bx, bh / 2, bz]} castShadow>
              <boxGeometry args={[bw, bh, bd]} />
              <meshStandardMaterial
                color={isNight ? '#18202b' : '#c8c2b7'}
                roughness={0.65}
                emissive={isNight ? (i % 3 === 0 ? '#ffb347' : '#90c0ef') : '#000000'}
                emissiveIntensity={isNight ? 0.45 : 0}
              />
            </mesh>
          )
        })}
      </group>

      {/* Luminous Street Light Grid Points in CBD at Night */}
      {isNight && (
        <points position={[4500, 3.5, -2200]}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={120}
              array={
                new Float32Array(
                  Array.from({ length: 120 * 3 }, (_, idx) => {
                    const i = Math.floor(idx / 3)
                    const axis = idx % 3
                    if (axis === 0) return ((i % 12) - 6) * 190 + (Math.sin(i) * 30)
                    if (axis === 1) return 2.5
                    return (Math.floor(i / 12) - 5) * 180 + (Math.cos(i) * 30)
                  })
                )
              }
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial
            size={3.5}
            color="#ffbe6b"
            transparent
            opacity={0.85}
            sizeAttenuation={false}
          />
        </points>
      )}
    </group>
  )
}

/**
 * Aso Rock Granite Monolith & Savanna Mountains
 */
function AsoRockAndSavannaHills({ isNight }) {
  const asoGeo = useMemo(() => {
    // Ellipsoidal smooth granite monolith with natural contours
    const geo = new THREE.SphereGeometry(1, 36, 22, 0, Math.PI * 2, 0, Math.PI * 0.5)
    geo.scale(1100, 400, 750)
    return geo
  }, [])

  return (
    <group name="aso-rock-monolith">
      {/* 1. Main Aso Rock 400m Monolith */}
      <mesh position={[9078.3, 0, -4675.2]} geometry={asoGeo} receiveShadow>
        <meshStandardMaterial
          color="#5c5449"
          roughness={0.88}
          metalness={0.15}
          emissive={isNight ? '#1a181e' : '#000000'}
          emissiveIntensity={isNight ? 0.3 : 0}
        />
      </mesh>

      {/* 2. Katampe Hill & Surrounding Inselbergs */}
      <mesh position={[3200, 0, -5600]} receiveShadow>
        <coneGeometry args={[600, 180, 16]} />
        <meshStandardMaterial color="#686054" roughness={0.9} />
      </mesh>
      <mesh position={[6800, 0, -6200]} receiveShadow>
        <coneGeometry args={[750, 210, 16]} />
        <meshStandardMaterial color="#686054" roughness={0.9} />
      </mesh>
    </group>
  )
}
