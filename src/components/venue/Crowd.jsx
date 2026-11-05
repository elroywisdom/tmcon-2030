// src/components/venue/Crowd.jsx
// Instanced 3D low-poly crowd system (standing floor + seated bowl)
// Based on PHASE4_DAYNIGHT_LED_CROWD_INTRO.md Section 4

'use client'

import React, { useMemo, useRef, useLayoutEffect } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useVenue } from '@/store/useVenue'
import {
  CROWD_BUDGETS,
  createStandingPersonGeometry,
  createSeatedPersonGeometry,
  sampleFloorCrowd,
  sampleSeatedCrowd,
} from '@/lib/crowdData'
import { tokens } from '@/styles/tokens'

const CROWD_VERT = `
attribute float aPartType;
attribute float aIsArm;
attribute vec3 aArmPivot;
attribute vec3 aSkinColor;
attribute float aPhase;
attribute vec4 aVariation;

uniform float uTime;
uniform float uLiveShow;
uniform float uTimeOfDay;
uniform vec3 uStagePos;

varying vec3 vColor;
varying vec3 vSkinColor;
varying vec3 vNormal;
varying vec3 vWorldPos;
varying float vPartType;
varying float vHasPhone;
varying float vNight;
varying float vHairTone;

vec3 rotateArm(vec3 p, vec3 pivot, float angleX, float angleZ) {
  vec3 rel = p - pivot;
  float cx = cos(angleX);
  float sx = sin(angleX);
  vec3 r1 = vec3(rel.x, rel.y * cx - rel.z * sx, rel.y * sx + rel.z * cx);
  float cz = cos(angleZ);
  float sz = sin(angleZ);
  vec3 r2 = vec3(r1.x * cz - r1.y * sz, r1.x * sz + r1.y * cz, r1.z);
  return pivot + r2;
}

void main() {
  vec3 localPos = position;

  // Height scale variation
  float hScale = aVariation.w;
  if (hScale > 0.5) {
    localPos.y *= hScale;
  }

  // Live show wave distance
  vec4 initPos = instanceMatrix * vec4(localPos, 1.0);
  float distToStage = length(initPos.xz - uStagePos.xz);
  float wave = sin(uTime * 6.5 - distToStage * 0.12 + aPhase);

  // Arm cheering and phone holding
  if (aIsArm > 0.5) {
    float isRight = (aIsArm > 1.5) ? 1.0 : -1.0;
    float armAngleX = mix(0.0, 2.15 + wave * 0.45, uLiveShow);
    float armAngleZ = mix(0.0, isRight * (0.32 + sin(uTime * 5.0 + aPhase) * 0.15), uLiveShow);

    if (aVariation.y > 0.5 && uTimeOfDay > 0.25 && isRight > 0.0) {
      float phoneRaise = smoothstep(0.25, 0.8, uTimeOfDay);
      armAngleX = max(armAngleX, phoneRaise * (1.75 + sin(uTime * 1.5 + aPhase) * 0.08));
      armAngleZ = max(armAngleZ, isRight * 0.18);
    }

    localPos = rotateArm(localPos, aArmPivot, armAngleX, armAngleZ);
  }

  // Idle gentle bob and sway
  float idleBob = sin(uTime * 2.8 + aPhase) * 0.022;
  float idleSway = cos(uTime * 1.6 + aPhase * 1.2) * 0.014;
  float liveBounce = max(0.0, wave) * 0.06 * uLiveShow;

  vec4 animatedWorldPos = instanceMatrix * vec4(localPos, 1.0);
  animatedWorldPos.y += idleBob + liveBounce;
  animatedWorldPos.x += idleSway;

  vWorldPos = animatedWorldPos.xyz;
  vNormal = normalize((instanceMatrix * vec4(normal, 0.0)).xyz);
  vPartType = aPartType;
  vHasPhone = aVariation.y;
  vNight = uTimeOfDay;
  vHairTone = aVariation.x;
  vSkinColor = aSkinColor;

  #ifdef USE_INSTANCING_COLOR
    vColor = instanceColor;
  #else
    vColor = vec3(0.9, 0.9, 0.9);
  #endif

  gl_Position = projectionMatrix * viewMatrix * animatedWorldPos;
}
`

const CROWD_FRAG = `
uniform float uTime;
uniform float uTimeOfDay;
uniform float uLiveShow;
uniform vec3 uLedColor;
uniform vec3 uStagePos;

varying vec3 vColor;
varying vec3 vSkinColor;
varying vec3 vNormal;
varying vec3 vWorldPos;
varying float vPartType;
varying float vHasPhone;
varying float vNight;
varying float vHairTone;

void main() {
  vec3 N = normalize(vNormal);
  vec3 baseColor = vColor;

  if (vPartType < 0.5) {
    baseColor = vColor * 0.65;
  } else if (vPartType > 0.5 && vPartType < 1.5) {
    baseColor = vColor;
  } else if (vPartType > 1.5 && vPartType < 2.5) {
    baseColor = vSkinColor;
  } else if (vPartType > 2.5 && vPartType < 3.5) {
    if (vHairTone < 0.8) {
      baseColor = vec3(0.09, 0.08, 0.07);
    } else if (vHairTone < 1.8) {
      baseColor = vec3(0.94, 0.92, 0.88);
    } else {
      baseColor = vColor;
    }
  } else if (vPartType > 3.5) {
    if (vHasPhone > 0.5 && vNight > 0.25) {
      vec3 screenGlow = vec3(0.92, 0.97, 1.0);
      gl_FragColor = vec4(screenGlow * (1.2 + 2.5 * vNight), 1.0);
      return;
    } else {
      baseColor = vec3(0.12, 0.12, 0.14);
    }
  }

  vec3 sunDir = normalize(vec3(0.35, 0.85, 0.4));
  float NdotL = max(0.0, dot(N, sunDir));

  vec3 dayAmb = vec3(0.55, 0.52, 0.48);
  vec3 nightAmb = vec3(0.12, 0.14, 0.20);
  vec3 amb = mix(dayAmb, nightAmb, vNight);

  vec3 daySun = vec3(1.15, 1.10, 1.02);
  vec3 nightMoon = vec3(0.18, 0.22, 0.32);
  vec3 directLight = mix(daySun, nightMoon, vNight) * NdotL;

  // Calibrated stage illumination (softened to eliminate heavy red cast per P1)
  float distToStage = length(vWorldPos.xz - uStagePos.xz);
  float ledReach = clamp(1.0 - distToStage / 88.0, 0.0, 1.0);
  vec3 stageGlow = uLedColor * (ledReach * vNight * (0.24 + 0.28 * uLiveShow));

  // Subtle directional rim light from stadium floodlights & stage rig
  vec3 eyeDir = normalize(cameraPosition - vWorldPos);
  float rimFactor = pow(clamp(1.0 - max(0.0, dot(N, eyeDir)), 0.0, 1.0), 3.0);
  vec3 rimLight = mix(vec3(0.4, 0.45, 0.6), uLedColor, uLiveShow * 0.45) * (rimFactor * 0.32 * vNight);

  vec3 totalLight = amb + directLight + stageGlow + rimLight;
  vec3 finalColor = baseColor * totalLight;

  gl_FragColor = vec4(finalColor, 1.0);
}
`

export default function Crowd({ bowlOutline }) {
  const crowdLevel = useVenue((s) => s.crowdLevel)
  const timeOfDay = useVenue((s) => s.timeOfDay)
  const liveShow = useVenue((s) => s.liveShow)

  const floorRef = useRef()
  const seatedRef = useRef()
  const materialRef = useRef()

  // Maximum budgets allocated once for high tier
  const maxFloor = CROWD_BUDGETS.high.floor
  const maxSeated = CROWD_BUDGETS.high.seated

  // 1. Precompute points once
  const floorPoints = useMemo(() => sampleFloorCrowd(maxFloor), [maxFloor])
  const seatedPoints = useMemo(
    () => sampleSeatedCrowd(maxSeated, bowlOutline),
    [maxSeated, bowlOutline]
  )

  const allocFloor = Math.max(maxFloor, floorPoints.length)
  const allocSeated = Math.max(maxSeated, seatedPoints.length)

  // 2. Geometries with per-instance attributes
  const { floorGeo, seatedGeo } = useMemo(() => {
    const fGeo = createStandingPersonGeometry()
    const sGeo = createSeatedPersonGeometry()

    // Attach per-instance attributes for Floor Crowd
    const fSkinArr = new Float32Array(allocFloor * 3)
    const fPhaseArr = new Float32Array(allocFloor)
    const fVarArr = new Float32Array(allocFloor * 4)

    for (let i = 0; i < allocFloor; i++) {
      const p = floorPoints[i] || floorPoints[0]
      const sc = new THREE.Color(p?.skinColor || '#392316')
      fSkinArr[i * 3 + 0] = sc.r
      fSkinArr[i * 3 + 1] = sc.g
      fSkinArr[i * 3 + 2] = sc.b
      fPhaseArr[i] = p?.phase || 0
      fVarArr[i * 4 + 0] = p?.hairTone || 0
      fVarArr[i * 4 + 1] = p?.hasPhone || 0
      fVarArr[i * 4 + 2] = 0.0
      fVarArr[i * 4 + 3] = p?.heightScale || 1.0
    }

    fGeo.setAttribute('aSkinColor', new THREE.InstancedBufferAttribute(fSkinArr, 3))
    fGeo.setAttribute('aPhase', new THREE.InstancedBufferAttribute(fPhaseArr, 1))
    fGeo.setAttribute('aVariation', new THREE.InstancedBufferAttribute(fVarArr, 4))

    // Attach per-instance attributes for Seated Crowd
    const sSkinArr = new Float32Array(allocSeated * 3)
    const sPhaseArr = new Float32Array(allocSeated)
    const sVarArr = new Float32Array(allocSeated * 4)

    for (let i = 0; i < allocSeated; i++) {
      const p = seatedPoints[i] || seatedPoints[0]
      const sc = new THREE.Color(p?.skinColor || '#392316')
      sSkinArr[i * 3 + 0] = sc.r
      sSkinArr[i * 3 + 1] = sc.g
      sSkinArr[i * 3 + 2] = sc.b
      sPhaseArr[i] = p?.phase || 0
      sVarArr[i * 4 + 0] = p?.hairTone || 0
      sVarArr[i * 4 + 1] = p?.hasPhone || 0
      sVarArr[i * 4 + 2] = 0.0
      sVarArr[i * 4 + 3] = p?.heightScale || 1.0
    }

    sGeo.setAttribute('aSkinColor', new THREE.InstancedBufferAttribute(sSkinArr, 3))
    sGeo.setAttribute('aPhase', new THREE.InstancedBufferAttribute(sPhaseArr, 1))
    sGeo.setAttribute('aVariation', new THREE.InstancedBufferAttribute(sVarArr, 4))

    return { floorGeo: fGeo, seatedGeo: sGeo }
  }, [allocFloor, allocSeated, floorPoints, seatedPoints])

  // 3. Shared custom shader material
  const crowdMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: CROWD_VERT,
      fragmentShader: CROWD_FRAG,
      uniforms: {
        uTime: { value: 0 },
        uLiveShow: { value: 0 },
        uTimeOfDay: { value: timeOfDay === 'night' ? 1.0 : 0.0 },
        uStagePos: { value: new THREE.Vector3(-3.0, 3.0, 56.3) },
        uLedColor: { value: new THREE.Color(tokens.colors.orange) },
      },
      toneMapped: true,
      side: THREE.FrontSide,
    })
  }, [])

  // 4. Populate instance matrices and clothing colors once
  useLayoutEffect(() => {
    if (!floorRef.current || !seatedRef.current) return

    const dummy = new THREE.Object3D()

    // Setup Floor Instances
    for (let i = 0; i < allocFloor; i++) {
      if (i < floorPoints.length) {
        const p = floorPoints[i]
        dummy.position.set(p.position[0], p.position[1], p.position[2])
        dummy.rotation.set(0, p.rotationY, 0)
        dummy.scale.set(1, 1, 1)
        floorRef.current.setColorAt(i, new THREE.Color(p.clothesColor))
      } else {
        dummy.position.set(0, -100, 0)
        dummy.scale.set(0, 0, 0)
      }
      dummy.updateMatrix()
      floorRef.current.setMatrixAt(i, dummy.matrix)
    }
    floorRef.current.instanceMatrix.needsUpdate = true
    if (floorRef.current.instanceColor) floorRef.current.instanceColor.needsUpdate = true

    // Setup Seated Instances
    for (let i = 0; i < allocSeated; i++) {
      if (i < seatedPoints.length) {
        const p = seatedPoints[i]
        dummy.position.set(p.position[0], p.position[1], p.position[2])
        dummy.rotation.set(0, p.rotationY, 0)
        dummy.scale.set(1, 1, 1)
        seatedRef.current.setColorAt(i, new THREE.Color(p.clothesColor))
      } else {
        dummy.position.set(0, -100, 0)
        dummy.scale.set(0, 0, 0)
      }
      dummy.updateMatrix()
      seatedRef.current.setMatrixAt(i, dummy.matrix)
    }
    seatedRef.current.instanceMatrix.needsUpdate = true
    if (seatedRef.current.instanceColor) seatedRef.current.instanceColor.needsUpdate = true
  }, [floorPoints, seatedPoints, allocFloor, allocSeated])

  // 5. Instantly adjust active instance count when crowdLevel changes
  useLayoutEffect(() => {
    const budget = CROWD_BUDGETS[crowdLevel] || CROWD_BUDGETS.high
    if (floorRef.current) {
      floorRef.current.count = Math.min(budget.floor, floorPoints.length)
    }
    if (seatedRef.current) {
      seatedRef.current.count = Math.min(budget.seated, seatedPoints.length)
    }
  }, [crowdLevel, floorPoints.length, seatedPoints.length])

  // 6. Smooth per-frame animation and live-show / time-of-day transitions
  useFrame((state, delta) => {
    if (!materialRef.current) return
    const mat = materialRef.current
    mat.uniforms.uTime.value = state.clock.getElapsedTime()

    // Smooth damp towards target liveShow and night values
    const targetLive = liveShow ? 1.0 : 0.0
    const targetNight = timeOfDay === 'night' ? 1.0 : 0.0
    mat.uniforms.uLiveShow.value = THREE.MathUtils.damp(
      mat.uniforms.uLiveShow.value,
      targetLive,
      4.0,
      delta
    )
    mat.uniforms.uTimeOfDay.value = THREE.MathUtils.damp(
      mat.uniforms.uTimeOfDay.value,
      targetNight,
      2.0,
      delta
    )

    // Dynamic stage mood color: cycles harmoniously during concert, warm golden neutral when idle
    const time = state.clock.getElapsedTime()
    if (liveShow) {
      const cycle = (time * 0.4) % 4.0
      if (cycle < 1.0) {
        mat.uniforms.uLedColor.value.setRGB(0.1, 0.85, 0.95) // Neon cyan
      } else if (cycle < 2.0) {
        mat.uniforms.uLedColor.value.setRGB(0.95, 0.65, 0.15) // Gold
      } else if (cycle < 3.0) {
        mat.uniforms.uLedColor.value.setRGB(0.85, 0.25, 0.9)  // Violet magenta
      } else {
        mat.uniforms.uLedColor.value.setRGB(0.15, 0.9, 0.6)  // Mint green
      }
    } else {
      mat.uniforms.uLedColor.value.setRGB(0.92, 0.72, 0.48) // Warm golden stage wash
    }
  })

  return (
    <group name="crowd-system">
      <primitive object={crowdMaterial} ref={materialRef} attach="material" />
      <instancedMesh
        ref={floorRef}
        args={[floorGeo, crowdMaterial, allocFloor]}
        castShadow
      />
      <instancedMesh
        ref={seatedRef}
        args={[seatedGeo, crowdMaterial, allocSeated]}
        castShadow
      />
    </group>
  )
}
