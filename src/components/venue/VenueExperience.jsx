'use client'

import dynamic from 'next/dynamic'
import { Suspense, useEffect, useState } from 'react'
import { useVenue } from '@/store/useVenue'
import { initAudio, setMuted, subscribeTrack, nextTrack, getCurrentTrack, play } from '@/lib/audio'
import { EVENT_DETAILS, COMPARISON_VIEWS, CAMERA_PRESETS } from '@/data/zones'
import {
  IconReplay,
  IconLiveShow,
  IconSun,
  IconMoon,
  IconCrowd,
  IconVolumeMute,
  IconVolumeHigh,
  IconSkipNext,
  IconRocket,
  IconClose,
  IconFloor,
  IconOverview,
  IconStage,
  IconVip,
  IconUpperTier,
  IconScoreboard,
  IconArrowLeft,
  IconArrowRight,
} from '@/components/common/Icons'
import InfoPanel from './InfoPanel'
import TourHUD from './TourHUD'
import IntroOverlay from './IntroOverlay'
import SeatBookingModal from './SeatBookingModal'
import SimpleViewFallback from './SimpleViewFallback'
import './venue.css'

function getPresetIcon(iconKey) {
  switch (iconKey) {
    case 'overview':
      return <IconOverview size={13} />
    case 'stage':
      return <IconStage size={13} />
    case 'floor':
      return <IconFloor size={13} />
    case 'vip':
      return <IconVip size={13} />
    case 'upper_tier':
      return <IconUpperTier size={13} />
    case 'scoreboard':
      return <IconScoreboard size={13} />
    case 'left':
      return <IconArrowLeft size={13} />
    case 'right':
      return <IconArrowRight size={13} />
    default:
      return <IconOverview size={13} />
  }
}

// WebGL cannot render on the server.
const VenueScene = dynamic(() => import('./VenueScene'), { ssr: false })

export default function VenueExperience() {
  const entered = useVenue((s) => s.entered)
  const setEntered = useVenue((s) => s.setEntered)
  const reset = useVenue((s) => s.reset)
  const activeZone = useVenue((s) => s.activeZone)
  const focusZone = useVenue((s) => s.focusZone)
  const isTouring = useVenue((s) => s.isTouring)
  const stopTour = useVenue((s) => s.stopTour)
  const timeOfDay = useVenue((s) => s.timeOfDay)
  const toggleTimeOfDay = useVenue((s) => s.toggleTimeOfDay)
  const crowdLevel = useVenue((s) => s.crowdLevel)
  const setCrowdLevel = useVenue((s) => s.setCrowdLevel)
  const isIntroPlaying = useVenue((s) => s.isIntroPlaying)
  const startIntro = useVenue((s) => s.startIntro)
  const skipIntro = useVenue((s) => s.skipIntro)
  const replayIntro = useVenue((s) => s.replayIntro)
  const soundEnabled = useVenue((s) => s.soundEnabled)
  const setSoundEnabled = useVenue((s) => s.setSoundEnabled)
  const liveShow = useVenue((s) => s.liveShow)
  const toggleLiveShow = useVenue((s) => s.toggleLiveShow)
  const selectedSeat = useVenue((s) => s.selectedSeat)
  const isSeatView = useVenue((s) => s.isSeatView)
  const setViewFromSeat = useVenue((s) => s.setViewFromSeat)
  const activePreset = useVenue((s) => s.activePreset)
  const setPreset = useVenue((s) => s.setPreset)
  const isUiRevealed = useVenue((s) => s.isUiRevealed)

  const [muted, setMutedState] = useState(false)
  const [comparisonView, setComparisonView] = useState(null)
  const venueSetComparisonView = useVenue((s) => s.setComparisonView)
  const [currentTrack, setCurrentTrack] = useState(() => getCurrentTrack())
  const [hasWebGL, setHasWebGL] = useState(true)

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas')
      const gl =
        canvas.getContext('webgl2') ||
        canvas.getContext('webgl') ||
        canvas.getContext('experimental-webgl')
      if (!gl) setHasWebGL(false)
    } catch (e) {
      setHasWebGL(false)
    }
  }, [])

  useEffect(() => {
    return subscribeTrack((t) => setCurrentTrack(t))
  }, [])

  useEffect(() => {
    window.__setComparisonView = (v) => {
      setComparisonView(v)
      venueSetComparisonView(v)
      if (v) setEntered(true)
    }
    window.__useVenue = useVenue
    const params = new URLSearchParams(window.location.search)
    const v = Number(params.get('view'))
    if (v >= 1 && v <= 5) {
      setComparisonView(v)
      venueSetComparisonView(v)
      setEntered(true)
    }

    if (params.get('webgl') === '0') {
      setHasWebGL(false)
    }
    if (params.get('entered') === 'true') {
      setEntered(true)
      skipIntro()
    }
    const p = params.get('preset')
    if (p) {
      setEntered(true)
      skipIntro()
      setPreset(p)
    }
    const tod = params.get('timeOfDay')
    if (tod && tod === 'night') {
      if (useVenue.getState().timeOfDay !== 'night') {
        toggleTimeOfDay()
      }
    }
    if (params.get('liveshow') === 'true') {
      if (!useVenue.getState().liveShow) {
        toggleLiveShow()
      }
    }
    if (params.get('intro') === 'lightson') {
      setEntered(true)
      startIntro()
      setTimeout(() => {
        if (window.__setFlightProgress) window.__setFlightProgress(1.0)
      }, 500)
    }
    return () => {
      delete window.__setComparisonView
    }
  }, [setEntered, venueSetComparisonView, skipIntro, setPreset, toggleTimeOfDay, toggleLiveShow, startIntro])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (isIntroPlaying) {
          skipIntro()
        } else if (isTouring) {
          stopTour()
        } else {
          reset()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [reset, isTouring, stopTour, isIntroPlaying, skipIntro])

  const enter = async (withIntro = true) => {
    setEntered(true)
    if (soundEnabled) {
      try {
        await initAudio()
      } catch (e) {
        // AudioContext may be suspended or blocked in automated environments
      }
    } else {
      setMuted(true)
      setMutedState(true)
    }

    // Check reduced motion
    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (withIntro && !reduceMotion) {
      startIntro()
    } else {
      skipIntro()
    }
  }

  const toggleMute = () => {
    setMuted(!muted)
    setMutedState(!muted)
    setSoundEnabled(muted) // if currently muted, next state is unmuted (enabled)
  }

  return (
    <main className="venue-root">
      {hasWebGL ? (
        <Suspense fallback={null}>
          <VenueScene comparisonView={comparisonView} />
        </Suspense>
      ) : (
        <SimpleViewFallback />
      )}

      {/* Cinematic Intro Overlay (letterbox, progress bar, captions, skip) */}
      <IntroOverlay />

      {!comparisonView && !isIntroPlaying && entered && isUiRevealed && <InfoPanel />}
      {!comparisonView && !isIntroPlaying && entered && isUiRevealed && <TourHUD />}
      {!comparisonView && !isIntroPlaying && entered && isUiRevealed && <SeatBookingModal />}

      {/* Neubrutalist Top Bar per TM CON 2026 Design System */}
      {!isIntroPlaying && entered && isUiRevealed && (
        <header className="top-bar animate-in">
          <div className="nav-brand-cluster">
            <img
              src="/brand/TMCON-logo-Black.svg"
              alt="TM CON"
              className="nav-logo"
            />
            <span className="nav-concept-pill">SIDE PROJECT DEMO</span>
            <span className="nav-divider">/</span>
            <span className="nav-venue-label">
              {comparisonView
                ? COMPARISON_VIEWS[comparisonView]?.title
                : 'MOSHOOD ABIOLA STADIUM • ABUJA'}
            </span>
          </div>

          <div className="nav-actions">
            {/* Replay Cinematic Drone Intro */}
            {!comparisonView && (
              <button
                className="replay-intro-btn"
                onClick={replayIntro}
                title="Replay the 13s cinematic corridor flight"
              >
                <IconReplay size={14} />
                <span>REPLAY INTRO</span>
              </button>
            )}

            {/* Day / Night Toggle: icon only */}
            <button
              className={`time-toggle-btn is-icon-only ${timeOfDay}`}
              onClick={toggleTimeOfDay}
              aria-label={`Current mode: ${timeOfDay}. Click to switch to ${timeOfDay === 'day' ? 'night' : 'day'}`}
              title={`Switch to ${timeOfDay === 'day' ? 'night' : 'day'} mode`}
            >
              <span className="toggle-icon">
                {timeOfDay === 'day' ? <IconSun size={16} /> : <IconMoon size={16} />}
              </span>
            </button>

            {/* Crowd Density Setting (Filled by default, clicking reduces crowd) */}
            {!comparisonView && (
              <button
                className={`crowd-toggle-btn ${crowdLevel}`}
                onClick={() => {
                  const order = ['high', 'medium', 'low', 'off']
                  const nextIdx = (order.indexOf(crowdLevel) + 1) % order.length
                  setCrowdLevel(order[nextIdx])
                }}
                title={`Crowd: ${crowdLevel === 'high' ? 'FILLED (HIGH)' : crowdLevel.toUpperCase()}. Click to reduce crowd.`}
              >
                <span className="toggle-icon">
                  <IconCrowd size={14} />
                </span>
                <span className="toggle-label">
                  {crowdLevel === 'high'
                    ? 'FILLED'
                    : crowdLevel === 'off'
                    ? 'NO CROWD'
                    : `${crowdLevel.toUpperCase()}`}
                </span>
              </button>
            )}

            {!comparisonView && (
              <div className="audio-control-wrap" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                {/* Music Toggle: icon only */}
                <button
                  className={`mute-btn is-icon-only ${!muted && entered ? 'is-playing' : ''}`}
                  onClick={toggleMute}
                  aria-pressed={muted}
                  aria-label={muted ? 'Unmute music' : `Now Playing: ${currentTrack?.title || 'Alan Walker'}. Click to mute.`}
                  title={muted ? 'Unmute music' : `Now Playing: ${currentTrack?.title || 'Alan Walker'}. Click to mute.`}
                >
                  {!muted && entered ? (
                    <span className="mute-icon is-playing">
                      <IconVolumeHigh size={16} />
                    </span>
                  ) : (
                    <span className="mute-icon">
                      <IconVolumeMute size={16} />
                    </span>
                  )}
                </button>
                {!muted && entered && (
                  <button
                    className="track-skip-btn is-icon-only"
                    onClick={(e) => {
                      e.stopPropagation()
                      nextTrack()
                    }}
                    title="Switch track (Alan Walker / Avicii - Wake Me Up)"
                    aria-label="Switch track"
                  >
                    <IconSkipNext size={14} />
                  </button>
                )}
              </div>
            )}
          </div>
        </header>
      )}

      {/* Floating Camera Presets Dock (Phase 4 Section 7 & P1 UI Quality) */}
      {!comparisonView && !isIntroPlaying && entered && isUiRevealed && (
        <aside className="camera-presets-dock animate-in" aria-label="Camera Presets">
          <div className="camera-presets-wrapper outlined-block">
            <span className="camera-presets-tag">CAMERA</span>
            <div className="camera-presets-grid">
              {CAMERA_PRESETS.map((p) => {
                const isActive = activePreset === p.id && !activeZone && !isSeatView
                const isArrowOnly = p.id === 'left' || p.id === 'right'
                return (
                  <button
                    key={p.id}
                    className={`camera-preset-btn ${isArrowOnly ? 'icon-only' : ''} ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      play('whoosh')
                      setPreset(p.id)
                    }}
                    title={p.label}
                    aria-label={p.description || p.label}
                  >
                    <span className="preset-icon">{getPresetIcon(p.iconKey)}</span>
                    {!isArrowOnly && <span className="preset-label">{p.label}</span>}
                  </button>
                )
              })}
            </div>
          </div>
        </aside>
      )}

      {/* Helper navigation hint in overview */}
      {!comparisonView && !isTouring && entered && !isSeatView && !isIntroPlaying && isUiRevealed && (
        <div className="orbit-hint animate-in">
          <span>
            Drag to orbit • Scroll to zoom • Click any zone or seat to focus
          </span>
        </div>
      )}

      {/* Floating View-from-Seat Sightline Indicator */}
      {isSeatView && selectedSeat && (
        <div className="seat-view-indicator">
          <div className="seat-view-content">
            <span className="seat-view-dot" />
            <div className="seat-view-text">
              <strong>{selectedSeat.label} • VIEW FROM SEAT</strong>
              <span>Sightline looking across bowl directly at Main Stage & 32m LED screen</span>
            </div>
            <button
              className="seat-view-exit-btn"
              onClick={() => setViewFromSeat(false)}
            >
              <span>EXIT SEAT VIEW</span>
              <IconClose size={13} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: 4 }} />
            </button>
          </div>
        </div>
      )}

      {/* Visible Required OpenStreetMap Attribution */}
      {entered && !isIntroPlaying && isUiRevealed && (
        <div className="osm-attribution animate-in">
          <span>{EVENT_DETAILS.osmAttribution}</span>
        </div>
      )}

      {/* Entry Gate - Neubrutalist Orange Poster per Design System */}
      {!entered && !comparisonView && (
        <div className="gate gate-poster-overlay">
          <div className="gate-card gate-orange-poster outlined-block">
            <div className="gate-header-strip">
              <span className="gate-eyebrow-pill">PORTFOLIO DEMO</span>
              <span className="gate-edition-pill">SIDE PROJECT</span>
            </div>
            <div className="gate-brand-banner">
              <img
                src="/brand/TMCON-logo-Black.svg"
                alt="TM CON"
                className="gate-logo"
              />
            </div>
            <h1 className="gate-poster-title">{EVENT_DETAILS.name}</h1>
            <p className="gate-subtitle">A 3D simulation of hosting TM CON at the National Stadium</p>

            <div className="gate-meta-grid">
              <div className="meta-box">
                <span className="meta-label">DATE</span>
                <strong>{EVENT_DETAILS.dates}</strong>
              </div>
              <div className="meta-box">
                <span className="meta-label">VENUE</span>
                <strong>{EVENT_DETAILS.venue}</strong>
              </div>
            </div>

            <div className="gate-actions-row">
              <button
                className="cta cta-gate-intro"
                onClick={() => enter(true)}
              >
                <span>ENTER WITH 3D INTRO</span>
                <IconRocket size={16} />
              </button>

              <button
                className="cta-gate-skip"
                onClick={() => enter(false)}
              >
                <span>SKIP INTRO & EXPLORE VENUE</span>
                <IconSkipNext size={14} />
              </button>
            </div>

            <button
              className="gate-sound-toggle"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title="Toggle audio before entering"
            >
              {soundEnabled ? (
                <>
                  <IconVolumeHigh size={14} />
                  <span>AUDIO: ON (ALAN WALKER & AVICII)</span>
                </>
              ) : (
                <>
                  <IconVolumeMute size={14} />
                  <span>AUDIO: MUTED</span>
                </>
              )}
            </button>

            <span className="gate-audio-note">
              Includes cinematic aerial drone fly-in
            </span>
          </div>
        </div>
      )}
    </main>
  )
}
