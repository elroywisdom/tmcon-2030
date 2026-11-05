'use client'

import { useState, useEffect } from 'react'
import { useVenue } from '@/store/useVenue'
import { zones, zoneList, itinerary, EVENT_DETAILS } from '@/data/zones'
import { playlists } from '@/data/led'
import { play } from '@/lib/audio'
import {
  IconSparkle,
  IconSkipPrev,
  IconSkipNext,
  IconPlay,
  IconPause,
  IconFullscreen,
  IconLightning,
  IconEye,
  IconLightbulb,
  IconClose,
  IconCollapse,
  IconExpand,
  IconArrowLeft,
  IconArrowRight,
} from '@/components/common/Icons'

const naira = (n) => `₦${n.toLocaleString('en-NG')}`

export default function InfoPanel() {
  const activeZone = useVenue((s) => s.activeZone)
  const selectedSeat = useVenue((s) => s.selectedSeat)
  const focusZone = useVenue((s) => s.focusZone)
  const reset = useVenue((s) => s.reset)
  const isTouring = useVenue((s) => s.isTouring)
  const startTour = useVenue((s) => s.startTour)
  const selectSeat = useVenue((s) => s.selectSeat)
  const ledTrackIndex = useVenue((s) => s.ledTrackIndex)
  const ledPlaying = useVenue((s) => s.ledPlaying)
  const nextLedTrack = useVenue((s) => s.nextLedTrack)
  const prevLedTrack = useVenue((s) => s.prevLedTrack)
  const toggleLedPlaying = useVenue((s) => s.toggleLedPlaying)
  const liveShow = useVenue((s) => s.liveShow)
  const toggleLiveShow = useVenue((s) => s.toggleLiveShow)
  const fullscreenModal = useVenue((s) => s.fullscreenModal)
  const setFullscreenModal = useVenue((s) => s.setFullscreenModal)
  const isSeatView = useVenue((s) => s.isSeatView)
  const setViewFromSeat = useVenue((s) => s.setViewFromSeat)
  const setIsBookingOpen = useVenue((s) => s.setIsBookingOpen)
  const openBooking = useVenue((s) => s.openBooking)

  const currentPlaylist = liveShow ? playlists.show : playlists.idle
  const currentTrack =
    currentPlaylist[ledTrackIndex % currentPlaylist.length] || currentPlaylist[0]

  const [collapsed, setCollapsed] = useState(false)
  const zone = zones[activeZone]

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('sidebar') === 'collapsed') {
      setCollapsed(true)
    }
  }, [])

  const go = (id) => {
    play('click')
    focusZone(id)
  }

  const handleStartTour = () => {
    play('click')
    startTour()
  }

  // If tour is active, hide the main panel so TourHUD shines
  if (isTouring) return null

  return (
    <>
      {/* Floating Expand Tab when Panel is Collapsed */}
      {collapsed && (
        <button
          className="panel-expand-btn outlined-block"
          onClick={() => {
            play('click')
            setCollapsed(false)
          }}
          title="Open event details and zone information"
          aria-label="Expand sidebar panel"
        >
          <IconExpand size={16} />
          <span>EVENT DETAILS</span>
        </button>
      )}

      <aside
        className={`panel outlined-block ${collapsed ? 'is-collapsed' : ''}`}
        style={{ '--accent': zone?.color || 'var(--orange)' }}
        aria-live="polite"
        aria-hidden={collapsed}
      >
        {/* Header Venue Info & Collapse Button */}
        <div className="panel-header-tag">
          <div className="panel-brand-cluster">
            <img
              src="/brand/TMCON-logo-Black.svg"
              alt="TM CON"
              className="panel-logo"
            />
            <span className="event-date">{EVENT_DETAILS.dates}</span>
          </div>
          <button
            className="panel-collapse-btn is-icon-only"
            onClick={() => {
              play('click')
              setCollapsed(true)
            }}
            title="Collapse sidebar to view full 3D arena"
            aria-label="Collapse sidebar panel"
          >
            <IconCollapse size={15} />
          </button>
        </div>

        {zone ? (
          <>
            <button
              className="link back-link"
              onClick={() => {
                play('click')
                reset()
              }}
            >
              <IconArrowLeft size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
              Back to full venue overview
            </button>

            <div className="zone-title-wrap">
              <h2>{zone.label}</h2>
              {zone.badge && <span className="zone-sub-badge">{zone.badge}</span>}
            </div>

            <p className="zone-blurb">{zone.blurb}</p>

            {zone.id === 'stage' && (
              <div className="led-controller-card">
                <div className="led-controller-header">
                  <span className="led-status-tag">
                    <IconSparkle size={11} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                    NOW PLAYING ON STAGE LED
                  </span>
                  <span className="led-track-num">
                    {(ledTrackIndex % currentPlaylist.length) + 1} / {currentPlaylist.length}
                  </span>
                </div>
                <div className="led-track-info">
                  <strong>{currentTrack?.title}</strong>
                  <span>{currentTrack?.speaker} • {currentTrack?.tag}</span>
                </div>

                <div className="led-controls-row">
                  <button
                    className="led-btn"
                    onClick={() => {
                      play('click')
                      prevLedTrack(currentPlaylist.length)
                    }}
                    title="Previous Track"
                  >
                    <IconSkipPrev size={13} />
                    <span>PREV</span>
                  </button>

                  <button
                    className="led-btn primary"
                    onClick={() => {
                      play('click')
                      toggleLedPlaying()
                    }}
                    title={ledPlaying ? 'Pause video' : 'Play video'}
                  >
                    {ledPlaying ? <IconPause size={13} /> : <IconPlay size={13} />}
                    <span>{ledPlaying ? 'PAUSE' : 'PLAY'}</span>
                  </button>

                  <button
                    className="led-btn"
                    onClick={() => {
                      play('click')
                      nextLedTrack(currentPlaylist.length)
                    }}
                    title="Next Track"
                  >
                    <span>NEXT</span>
                    <IconSkipNext size={13} />
                  </button>
                </div>

                <div className="led-secondary-actions">
                  <button
                    className="led-fullscreen-btn"
                    onClick={() => setFullscreenModal(currentTrack)}
                  >
                    <IconFullscreen size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
                    OPEN REEL FULLSCREEN
                  </button>

                  <button
                    className={`live-show-pill ${liveShow ? 'active' : ''}`}
                    onClick={() => {
                      play('click')
                      toggleLiveShow()
                    }}
                  >
                    <IconLightning size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 5 }} />
                    {liveShow ? 'LIVE SHOW RUNNING' : 'PLAY LIVE SHOW'}
                  </button>
                </div>
              </div>
            )}

            {zone.seating && (
              <div className="seat-box">
                <div className="seat-box-header">
                  <span className="seat-price">{naira(zone.seating.price)}</span>
                  <span className="seat-price-label">/ reserved seat</span>
                </div>
                <p className="seat-hint">
                  Click any available seat block in the 3D stand to select. Grey seats are already booked.
                </p>

                {selectedSeat?.zoneId === zone.id ? (
                  <div className="seat-selected-card">
                    <div className="seat-selected-badge">
                      <span className="dot-active" />
                      <strong>{selectedSeat.label}</strong>
                    </div>

                    <div className="seat-actions-row">
                      <button
                        className="cta cta-view-seat"
                        onClick={() => {
                          play('whoosh')
                          setViewFromSeat(true)
                        }}
                        title="Position camera at seat eye level looking at the stage"
                      >
                        <IconEye size={15} />
                        <span>VIEW FROM SEAT</span>
                      </button>

                      <button
                        className="cta cta-reserve"
                        onClick={() => {
                          play('click')
                          setIsBookingOpen(true)
                        }}
                      >
                        Reserve Seat →
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="seat-empty-hint">
                    <IconLightbulb size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
                    <span>Click a coloured seat in the 3D model to select it</span>
                  </div>
                )}
              </div>
            )}

            <h3>{zone.itemsHeading}</h3>
            <ul className="items-list">
              {zone.items.map((item, i) => (
                <li key={i}>
                  <span className="item-title">{item.title}</span>
                  <span className="item-meta muted">{item.meta}</span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <>
            <div className="overview-hero">
              <h2>Explore the Venue</h2>
              <p className="overview-sub">
                {EVENT_DETAILS.venue} • {EVENT_DETAILS.city}
              </p>

              {/* Primary Reserve Seats Action on Side Panel */}
              <button
                className="reserve-seats-hero-btn outlined-block"
                onClick={() => {
                  play('click')
                  openBooking('vip')
                }}
                title="Select and reserve seats in the stadium"
              >
                <div className="reserve-seats-content">
                  <span className="reserve-seats-tag">SEATING & RESERVATIONS</span>
                  <div className="reserve-seats-title-row">
                    <strong>RESERVE SEATS</strong>
                    <span className="reserve-seats-arrow">→</span>
                  </div>
                  <span className="reserve-seats-desc">
                    Pick VIP Executive, Premium, or General Bowl seats with 3D sightline preview
                  </span>
                </div>
              </button>

              <button className="tour-cta" onClick={handleStartTour}>
                <span className="tour-cta-icon">
                  <IconSparkle size={14} />
                </span>
                <div className="tour-cta-text">
                  <strong>Take the 3D Guided Tour</strong>
                  <span>Cinematic flythrough of all venue zones</span>
                </div>
              </button>
            </div>

            <div className="itinerary-section">
              <h3>Day Schedule Highlights</h3>
              <ul className="itinerary-list">
                {itinerary.map((item) => (
                  <li key={item.time}>
                    <span className="time-badge">{item.time}</span>
                    <span className="itinerary-title">{item.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        <div className="nav-section">
          <h4>Venue Zones</h4>
          <nav className="chips" aria-label="Venue zones">
            {zoneList.map((z) => (
              <button
                key={z.id}
                className="chip"
                style={{ '--accent': z.color }}
                aria-pressed={activeZone === z.id}
                onClick={() => go(z.id)}
              >
                <span className="chip-dot" />
                {z.label}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* LED Fullscreen Modal Player */}
      {fullscreenModal && (
        <div className="modal-backdrop" onClick={() => setFullscreenModal(null)}>
          <div className="led-modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setFullscreenModal(null)}>
              <IconClose size={18} />
            </button>
            <div className="modal-header">
              <span className="event-pill">STAGE LED REEL</span>
              <h2>{fullscreenModal.title}</h2>
              <p className="muted">
                {fullscreenModal.speaker} • {fullscreenModal.tag}
              </p>
            </div>
            <div className="led-media-viewport">
              <img
                src={fullscreenModal.poster}
                alt={fullscreenModal.title}
                loading="eager"
              />
            </div>
          </div>
        </div>
      )}

    </>
  )
}
