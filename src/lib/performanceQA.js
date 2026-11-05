// src/lib/performanceQA.js
// Automatic Quality Tier detection (High, Medium, Low, Simple) and dynamic FPS watchdog.
// Implements Phase 4 Section 9 of PHASE4_DAYNIGHT_LED_CROWD_INTRO.md.

export const QUALITY_TIERS = {
  high: {
    id: 'high',
    label: 'High (Desktop)',
    targetFps: 60,
    dpr: [1, 2],
    crowdLevel: 'high',
    enableCity: true,
    enableVideoLed: true,
    enableLiveShowFx: true,
  },
  medium: {
    id: 'medium',
    label: 'Medium (Standard)',
    targetFps: 45,
    dpr: [1, 1.5],
    crowdLevel: 'medium',
    enableCity: true,
    enableVideoLed: true,
    enableLiveShowFx: true,
  },
  low: {
    id: 'low',
    label: 'Low (Mobile)',
    targetFps: 30,
    dpr: [1, 1],
    crowdLevel: 'low',
    enableCity: false, // disable distant city to stay under 150 draw calls on mobile
    enableVideoLed: false, // fallback poster
    enableLiveShowFx: false,
  },
  simple: {
    id: 'simple',
    label: 'Simple View',
    targetFps: 30,
    dpr: [1, 1],
    crowdLevel: 'off',
    enableCity: false,
    enableVideoLed: false,
    enableLiveShowFx: false,
  },
}

export function detectInitialQualityTier() {
  if (typeof window === 'undefined') return 'high'

  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )

  const mem = navigator.deviceMemory || 4 // GB
  const cores = navigator.hardwareConcurrency || 4

  // Check GPU via WebGL debug info
  let isFastGpu = false
  try {
    const canvas = document.createElement('canvas')
    const gl =
      canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
      if (debugInfo) {
        const renderer = gl
          .getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
          .toLowerCase()
        if (
          renderer.includes('apple') ||
          renderer.includes('nvidia') ||
          renderer.includes('rtx') ||
          renderer.includes('gtx') ||
          renderer.includes('radeon')
        ) {
          isFastGpu = true
        }
      }
    }
  } catch (e) {}

  if (isMobile) {
    if (mem >= 6 && cores >= 8 && isFastGpu) return 'medium'
    if (mem >= 4 && cores >= 4) return 'low'
    return 'simple'
  }

  // Desktop
  if (mem >= 8 && cores >= 8 && isFastGpu) return 'high'
  if (mem >= 4 && cores >= 4) return 'medium'
  return 'low'
}

