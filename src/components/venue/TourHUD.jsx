'use client'

import { useEffect, useState } from 'react'
import { useVenue } from '@/store/useVenue'
import { tourSteps } from '@/data/zones'
import { play } from '@/lib/audio'
import {
  IconClose,
  IconPlay,
  IconPause,
  IconArrowLeft,
  IconArrowRight,
  IconSparkle,
} from '@/components/common/Icons'

export default function TourHUD() {
  const isTouring = useVenue((s) => s.isTouring)
  const tourStep = useVenue((s) => s.tourStep)
  const nextTourStep = useVenue((s) => s.nextTourStep)
  const prevTourStep = useVenue((s) => s.prevTourStep)
  const setTourStep = useVenue((s) => s.setTourStep)
  const stopTour = useVenue((s) => s.stopTour)

  const [autoPlay, setAutoPlay] = useState(true)
  const [progress, setProgress] = useState(0)

  const current = tourSteps[tourStep] || tourSteps[0]
  const total = tourSteps.length
  const isLast = tourStep === total - 1

  // Auto-advance timer (8s per stop)
  useEffect(() => {
    if (!isTouring || !autoPlay) {
      setProgress(0)
      return
    }

    const duration = 8000
    const intervalTime = 50
    let elapsed = 0

    const timer = setInterval(() => {
      elapsed += intervalTime
      const pct = Math.min(100, (elapsed / duration) * 100)
      setProgress(pct)

      if (elapsed >= duration) {
        clearInterval(timer)
        play('click')
        nextTourStep(total)
      }
    }, intervalTime)

    return () => {
      clearInterval(timer)
    }
  }, [isTouring, tourStep, autoPlay, total, nextTourStep])

  if (!isTouring) return null

  return (
    <aside className="tour-hud outlined-block" aria-label="Guided Tour">
      {/* Auto-play progress bar */}
      {autoPlay && (
        <div className="tour-progress-track">
          <div className="tour-progress-fill" style={{ width: `${progress}%` }} />
        </div>
      )}

      <div className="tour-hud-header">
        <div className="tour-badge">
          <span className="tour-pulse" />
          <span>GUIDED TOUR • STOP {tourStep + 1} OF {total}</span>
        </div>
        <button
          className="tour-close-btn"
          onClick={() => {
            play('click')
            stopTour()
          }}
          aria-label="Exit tour"
          title="Exit tour (Esc)"
        >
          <IconClose size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
          <span>Exit Tour</span>
        </button>
      </div>

      <div className="tour-hud-content">
        <span className="tour-subtitle">{current.subtitle}</span>
        <h2 className="tour-title">{current.title}</h2>
        <p className="tour-description">{current.description}</p>
      </div>

      {/* Step dots */}
      <div className="tour-dots">
        {tourSteps.map((step, idx) => (
          <button
            key={step.id}
            className={`tour-dot ${idx === tourStep ? 'active' : ''}`}
            onClick={() => {
              play('click')
              setTourStep(idx)
              setProgress(0)
            }}
            aria-label={`Jump to ${step.title}`}
            title={step.title}
          />
        ))}
      </div>

      <div className="tour-hud-controls">
        <div className="tour-hud-left">
          <button
            className="tour-btn tour-btn-secondary"
            onClick={() => {
              play('click')
              prevTourStep()
              setProgress(0)
            }}
            disabled={tourStep === 0}
          >
            <IconArrowLeft size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
            <span>Previous</span>
          </button>
          <button
            className="tour-btn tour-btn-secondary"
            onClick={() => {
              play('click')
              setAutoPlay(!autoPlay)
            }}
            aria-pressed={autoPlay}
          >
            {autoPlay ? <IconPause size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} /> : <IconPlay size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />}
            <span>{autoPlay ? 'Pause' : 'Auto-play'}</span>
          </button>
        </div>

        <button
          className="tour-btn tour-btn-primary"
          onClick={() => {
            play('click')
            nextTourStep(total)
            setProgress(0)
          }}
        >
          {isLast ? (
            <>
              <span>Finish Tour</span>
              <IconSparkle size={13} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: 5 }} />
            </>
          ) : (
            <>
              <span>Next Stop</span>
              <IconArrowRight size={13} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: 5 }} />
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
