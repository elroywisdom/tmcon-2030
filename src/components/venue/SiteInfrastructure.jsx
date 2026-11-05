// src/components/venue/SiteInfrastructure.jsx
// 3D concrete curbs, parking terrace retaining walls, steel light poles,
// and subterranean bedrock base to guarantee depth and prevent underground views.
import { useMemo } from 'react'
import * as THREE from 'three'
import { useVenue } from '@/store/useVenue'

export default function SiteInfrastructure() {
  const timeOfDay = useVenue((s) => s.timeOfDay)
  const isNight = timeOfDay === 'night'

  // Parking Light Poles along the parking rows
  const polePositions = useMemo(() => {
    const list = []
    // West car park light poles (3 rows of 4 poles)
    for (const x of [-245, -205, -165]) {
      for (const z of [-115, -75, -35, 5]) {
        list.push([x, z])
      }
    }
    // East car park light poles (2 rows of 6 poles)
    for (const x of [180, 235]) {
      for (let z = -110; z <= 100; z += 42) {
        list.push([x, z])
      }
    }
    // South-West car park light poles
    for (let r = 0; r < 3; r++) {
      for (let k = -2; k <= 2; k++) {
        const bx = -145 - r * 30 + k * 22
        const bz = 135 + r * 22 + k * 18
        list.push([bx, bz])
      }
    }
    return list
  }, [])

  // 3D Concrete Curbs & Terrace Retaining Walls around parking lots
  const curbSegments = useMemo(() => {
    // [x, z, width, depth, rotation]
    return [
      // West Car Park Terrace perimeter curbs
      [-198, -135, 137, 0.45, 0],
      [-198, 11, 137, 0.45, 0],
      [-266, -62, 0.45, 146, 0],
      [-130, -62, 0.45, 146, 0],
      // East Car Park Terrace perimeter curbs
      [208, -141, 107, 0.45, 0],
      [208, 131, 107, 0.45, 0],
      [155, -5, 0.45, 272, 0],
      [261, -5, 0.45, 272, 0],
      // South Avenue Approach Curbs
      [58, 266, 0.5, 172, 0.08],
      [118, 266, 0.5, 172, -0.08],
    ]
  }, [])

  return (
    <group name="site-infrastructure">
      {/* 1. Subterranean Bedrock Base Skirt (Guarantees no floating empty space or bottom view) */}
      <mesh position={[0, -45, 0]}>
        <cylinderGeometry args={[1620, 1620, 90, 48, 1, true]} />
        <meshStandardMaterial
          color="#382c20"
          roughness={0.95}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[0, -90, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1620, 48]} />
        <meshStandardMaterial color="#2a2016" roughness={0.98} />
      </mesh>

      {/* 2. 3D Concrete Curbs & Terrace Retaining Walls (0.35m height, casting real shadows) */}
      {curbSegments.map(([cx, cz, w, d, rot], idx) => (
        <mesh
          key={idx}
          position={[cx, 0.18, cz]}
          rotation={[0, rot, 0]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[w, 0.36, d]} />
          <meshStandardMaterial color="#d4cebf" roughness={0.78} />
        </mesh>
      ))}

      {/* 3. 3D Double-Arm Galvanized Steel Parking Light Poles */}
      {polePositions.map(([px, pz], idx) => (
        <group key={idx} position={[px, 0, pz]}>
          {/* Vertical Pole */}
          <mesh position={[0, 5.5, 0]} castShadow>
            <cylinderGeometry args={[0.16, 0.24, 11, 6]} />
            <meshStandardMaterial color="#7a8086" metalness={0.5} roughness={0.45} />
          </mesh>
          {/* T-Arm Crossbar */}
          <mesh position={[0, 10.9, 0]} castShadow>
            <boxGeometry args={[3.8, 0.14, 0.14]} />
            <meshStandardMaterial color="#686e74" metalness={0.6} />
          </mesh>
          {/* Twin Luminaires */}
          {[-1.8, 1.8].map((lx) => (
            <mesh key={lx} position={[lx, 10.75, 0]} castShadow>
              <boxGeometry args={[0.7, 0.22, 0.38]} />
              <meshStandardMaterial
                color="#303236"
                emissive={isNight ? '#ffeaad' : '#000000'}
                emissiveIntensity={isNight ? 2.5 : 0}
              />
            </mesh>
          ))}
          {/* Concrete Base Plinth */}
          <mesh position={[0, 0.3, 0]} receiveShadow>
            <cylinderGeometry args={[0.5, 0.55, 0.6, 8]} />
            <meshStandardMaterial color="#c2bcaf" roughness={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

