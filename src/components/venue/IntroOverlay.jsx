// src/components/venue/IntroOverlay.jsx
// UI Overlay for Cinematic Intro: letterbox bars, progressive landmark captions, progress bar, and skip button.
'use client'

import React from 'react'
import { useVenue } from '@/store/useVenue'
import { tokens } from '@/styles/tokens'
import { IconSparkle, IconSkipNext } from '@/components/common/Icons'

export default function IntroOverlay() {
  const isIntroPlaying = useVenue((s) => s.isIntroPlaying)
  const introPhase = useVenue((s) => s.introPhase)
  const introProgress = useVenue((s) => s.introProgress)
  const introCaption = useVenue((s) => s.introCaption)
  const lightsOnProgress = useVenue((s) => s.lightsOnProgress)
  const skipIntro = useVenue((s) => s.skipIntro)

  if (!isIntroPlaying) return null

  const isLightsOn = introPhase === 'lights_on'

  return (
    <div className="intro-overlay" aria-live="polite">
      {/* Cinematic Top Letterbox Bar */}
      <div className="intro-letterbox intro-letterbox-top">
        <div className="intro-top-content">
          <div className="intro-brand">
            <span className="intro-brand-dot" />
            <span className="intro-brand-text">TM CON 2030 • VENUE APPROACH FLIGHT</span>
          </div>
          <button
            className="intro-skip-btn"
            onClick={skipIntro}
            title="Skip flight and enter stadium (Esc)"
          >
            <span>SKIP INTRO</span>
            <span className="intro-skip-key">[ESC]</span>
            <span className="intro-skip-arrow">
              <IconSkipNext size={12} />
            </span>
          </button>
        </div>
      </div>

      {/* Center Cinematic Lights-On Title Banner */}
      {isLightsOn && (
        <div className="intro-lightson-banner">
          <div className="intro-lightson-pill">
            <span className="intro-lightson-sparkle">
              <IconSparkle size={12} />
            </span>
            <span>SYSTEM POWER ON</span>
          </div>
          <h1 className="intro-lightson-title">MOSHOOD ABIOLA NATIONAL STADIUM</h1>
          <p className="intro-lightson-subtitle">ABOUT 60,000 SEATS • TM CON 2030 FLAGSHIP VENUE</p>
        </div>
      )}

      {/* Floating Dynamic Landmark Caption Card during Flight */}
      {introCaption && !isLightsOn && (
        <div className="intro-caption-card">
          <div className="intro-caption-tag">
            <span>{introCaption.tag}</span>
          </div>
          <h2 className="intro-caption-title">{introCaption.title}</h2>
          <p className="intro-caption-desc">{introCaption.subtitle}</p>
        </div>
      )}

      {/* Cinematic Bottom Letterbox Bar with Progress Timeline */}
      <div className="intro-letterbox intro-letterbox-bottom">
        <div className="intro-timeline-wrapper">
          <div className="intro-timeline-track">
            <div
              className="intro-timeline-fill"
              style={{
                width: isLightsOn
                  ? '100%'
                  : `${Math.round(introProgress * 100)}%`,
              }}
            />
          </div>
          <div className="intro-timeline-meta">
            <span>VELODROME PRECINCT</span>
            <span className="intro-timeline-indicator">
              {isLightsOn ? 'ARRIVED • STADIUM POWER ON' : 'APPROACHING VENUE'}
            </span>
            <span>MOSHOOD ABIOLA STADIUM</span>
          </div>
        </div>
      </div>
    </div>
  )
}

