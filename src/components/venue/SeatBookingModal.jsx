// src/components/venue/SeatBookingModal.jsx
// Simulated Neubrutalist Seat Booking Flow for TM CON 2030 Portfolio Showcase.
'use client'

import React, { useState, useEffect } from 'react'
import { useVenue } from '@/store/useVenue'
import { zones } from '@/data/zones'
import { play } from '@/lib/audio'
import {
  IconClose,
  IconCheck,
  IconEye,
  IconSparkle,
  IconTicket,
  IconCreditCard,
  IconDownload,
  IconCopy,
  IconArrowRight,
  IconArrowLeft,
} from '@/components/common/Icons'

const naira = (n) => `₦${(n || 0).toLocaleString('en-NG')}`

const SEATING_TIERS = [
  {
    id: 'vip',
    label: 'VIP Executive Stand',
    zoneKey: 'vip',
    badge: 'West Grandstand • Executive Box',
    price: 150000,
    color: '#ff6b35',
    perks: [
      'West Executive Lounge access with VIP reception',
      'Padded executive leather seating with direct sightlines',
      'Complimentary refreshments, networking lounge & afterparty pass',
      'Priority Fast-Track Turnstile Entry',
    ],
    sampleSeats: ['Row A • Seat 08', 'Row B • Seat 14', 'Row C • Seat 22', 'Row D • Seat 05'],
  },
  {
    id: 'premium',
    label: 'Premium Section',
    zoneKey: 'premium',
    badge: 'East Long-Side Lower Tier',
    price: 75000,
    color: '#9b72cf',
    perks: [
      'Reserved lower-tier seating along the East Grandstand',
      'Unobstructed trackside panoramic views of the main stage',
      'Priority Apron Concourse Turnstile Gates',
      'Official TM CON tech pack & official delegate badge',
    ],
    sampleSeats: ['Row A • Seat 12', 'Row B • Seat 24', 'Row C • Seat 36', 'Row D • Seat 18'],
  },
  {
    id: 'general',
    label: 'General Seating',
    zoneKey: 'general',
    badge: 'Upper Tier & Curved End Stands',
    price: 25000,
    color: '#2ec4b6',
    perks: [
      'Reserved upper-tier bowl seating under tensile roof canopy',
      'Sweeping elevated view of the full 60,000-seat stadium',
      'Access to perimeter vendor village and food courts',
      'Digital event pass & high-definition livestream recording',
    ],
    sampleSeats: ['Row F • Seat 10', 'Row G • Seat 28', 'Row H • Seat 33', 'Row J • Seat 45'],
  },
]

export default function SeatBookingModal() {
  const isBookingOpen = useVenue((s) => s.isBookingOpen)
  const setIsBookingOpen = useVenue((s) => s.setIsBookingOpen)
  const selectedSeat = useVenue((s) => s.selectedSeat)
  const selectSeat = useVenue((s) => s.selectSeat)
  const setViewFromSeat = useVenue((s) => s.setViewFromSeat)
  const focusZone = useVenue((s) => s.focusZone)
  const activeZone = useVenue((s) => s.activeZone)

  // Step 1: 'tier_seat', Step 2: 'attendee', Step 3: 'payment', Step 4: 'confirmation'
  const [step, setStep] = useState(1)

  // Initial tier selection based on current active zone or selected seat
  const initialTierId =
    selectedSeat?.zoneId ||
    (activeZone === 'premium' ? 'premium' : activeZone === 'general' ? 'general' : 'vip')
  const [selectedTierId, setSelectedTierId] = useState(initialTierId)

  // Selected seat label
  const initialSeatLabel = selectedSeat?.label || 'Row B • Seat 14'
  const [seatLabel, setSeatLabel] = useState(initialSeatLabel)

  // Attendee state (blank by default for visitor input)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [badgeName, setBadgeName] = useState('')

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [isProcessing, setIsProcessing] = useState(false)
  const [bookingRef, setBookingRef] = useState('TMC-2030-8941A')
  const [copiedRef, setCopiedRef] = useState(false)
  const [downloadNotice, setDownloadNotice] = useState(false)

  // Sync state when modal opens or selectedSeat changes
  useEffect(() => {
    if (selectedSeat) {
      if (['vip', 'premium', 'general'].includes(selectedSeat.zoneId)) {
        setSelectedTierId(selectedSeat.zoneId)
      }
      setSeatLabel(selectedSeat.label)
    } else if (activeZone && ['vip', 'premium', 'general'].includes(activeZone)) {
      setSelectedTierId(activeZone)
    }
  }, [selectedSeat, activeZone, isBookingOpen])

  if (!isBookingOpen) return null

  const currentTier =
    SEATING_TIERS.find((t) => t.id === selectedTierId) || SEATING_TIERS[0]

  const ticketPrice = currentTier.price
  const facilityFee = 1500
  const totalPrice = ticketPrice + facilityFee

  const handleClose = () => {
    play('click')
    setIsBookingOpen(false)
    setStep(1)
    setIsProcessing(false)
  }

  const handleSelectTier = (tierId) => {
    play('click')
    setSelectedTierId(tierId)
    const tier = SEATING_TIERS.find((t) => t.id === tierId)
    if (tier) {
      setSeatLabel(tier.sampleSeats[1] || tier.sampleSeats[0])
    }
  }

  const handleSelectSampleSeat = (seat) => {
    play('click')
    setSeatLabel(seat)
  }

  const handlePreviewSightline = () => {
    play('whoosh')
    selectSeat({
      zoneId: currentTier.zoneKey,
      index: 14,
      label: `${currentTier.label} (${seatLabel})`,
    })
    focusZone(currentTier.zoneKey)
    setViewFromSeat(true)
    setIsBookingOpen(false)
  }

  const handleProceedToAttendee = () => {
    play('click')
    selectSeat({
      zoneId: currentTier.zoneKey,
      index: 14,
      label: `${currentTier.label} (${seatLabel})`,
    })
    setStep(2)
  }

  const handleProceedToPayment = () => {
    play('click')
    setStep(3)
  }

  const handleExecutePayment = () => {
    play('click')
    setIsProcessing(true)
    setTimeout(() => {
      try {
        play('bell')
      } catch (e) {}
      const randRef = `TMC-2030-${Math.floor(1000 + Math.random() * 9000)}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`
      setBookingRef(randRef)
      setIsProcessing(false)
      setStep(4)
    }, 1200)
  }

  const handleCopyRef = () => {
    try {
      navigator.clipboard.writeText(bookingRef)
      setCopiedRef(true)
      play('click')
      setTimeout(() => setCopiedRef(false), 2000)
    } catch (e) {}
  }

  const handleDownloadPass = () => {
    play('click')
    setDownloadNotice(true)
    setTimeout(() => setDownloadNotice(false), 3000)
  }

  const handleViewSeatIn3D = () => {
    play('whoosh')
    selectSeat({
      zoneId: currentTier.zoneKey,
      index: 14,
      label: `${currentTier.label} (${seatLabel})`,
    })
    focusZone(currentTier.zoneKey)
    setViewFromSeat(true)
    setIsBookingOpen(false)
  }

  return (
    <div className="booking-modal-backdrop" onClick={handleClose}>
      <div className="booking-modal-card outlined-block" onClick={(e) => e.stopPropagation()}>
        {/* Header Bar */}
        <div className="booking-modal-header">
          <div className="booking-header-left">
            <span className="booking-event-pill">
              <IconSparkle size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
              TM CON 2030 • SEAT RESERVATION
            </span>
            <h2>{step === 4 ? 'Reservation Confirmed' : 'Reserve Your Stadium Seat'}</h2>
          </div>
          <button
            className="booking-modal-close"
            onClick={handleClose}
            aria-label="Close booking modal"
          >
            <IconClose size={16} />
          </button>
        </div>

        {/* Stepper Progress Indicator */}
        <div className="booking-stepper">
          {[
            { num: 1, label: 'Seat & Tier' },
            { num: 2, label: 'Attendee' },
            { num: 3, label: 'Payment' },
            { num: 4, label: 'Digital Pass' },
          ].map((s) => (
            <div
              key={s.num}
              className={`stepper-step ${step === s.num ? 'active' : ''} ${step > s.num ? 'completed' : ''}`}
            >
              <span className="step-circle">
                {step > s.num ? <IconCheck size={12} /> : s.num}
              </span>
              <span className="step-label">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Scrollable Modal Body */}
        <div className="booking-modal-body">
          {/* STEP 1: SEAT & TIER SELECTION */}
          {step === 1 && (
            <div className="booking-step-content">
              <div className="side-project-banner-note">
                <span>This simulated reservation is an interactive concept experience. No real tickets are sold.</span>
              </div>

              <p className="booking-intro-text">
                Choose your seating section at Moshood Abiola Stadium. Test your seat sightlines in 3D before confirming your simulated reservation.
              </p>

              {/* Tier Selector Cards */}
              <div className="tier-cards-grid">
                {SEATING_TIERS.map((tier) => {
                  const isSelected = selectedTierId === tier.id
                  return (
                    <div
                      key={tier.id}
                      className={`tier-card outlined-block ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleSelectTier(tier.id)}
                      style={{ '--tier-color': tier.color }}
                    >
                      <div className="tier-card-top">
                        <div>
                          <div className="tier-badge-pill">{tier.badge}</div>
                          <h4 className="tier-card-title">{tier.label}</h4>
                        </div>
                        <div className="tier-card-price">
                          <strong>{naira(tier.price)}</strong>
                          <span>/ seat</span>
                        </div>
                      </div>

                      <ul className="tier-perks-list">
                        {tier.perks.slice(0, 2).map((perk, i) => (
                          <li key={i}>
                            <IconCheck size={12} className="perk-check" />
                            <span>{perk}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                })}
              </div>

              {/* Selected Seat Configurator */}
              <div className="seat-config-box outlined-block">
                <div className="seat-config-header">
                  <div>
                    <span className="config-tag">SELECTED SEAT POSITION</span>
                    <div className="config-current-seat">
                      <strong>{currentTier.label}</strong> • {seatLabel}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="cta-preview-sightline"
                    onClick={handlePreviewSightline}
                    title="Move 3D camera to this seat looking at the main stage"
                  >
                    <IconEye size={14} />
                    <span>PREVIEW 3D SIGHTLINE</span>
                  </button>
                </div>

                <div className="sample-seats-row">
                  <span className="quick-pick-label">Quick Pick Seat:</span>
                  <div className="sample-seats-chips">
                    {currentTier.sampleSeats.map((seat, i) => (
                      <button
                        key={i}
                        type="button"
                        className={`seat-chip ${seatLabel === seat ? 'active' : ''}`}
                        onClick={() => handleSelectSampleSeat(seat)}
                      >
                        {seat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Price Summary */}
              <div className="booking-price-breakdown">
                <div className="price-row">
                  <span>1 × {currentTier.label} ({seatLabel})</span>
                  <strong>{naira(ticketPrice)}</strong>
                </div>
                <div className="price-row">
                  <span>Digital Reservation & Facility Fee</span>
                  <strong>{naira(facilityFee)}</strong>
                </div>
                <div className="price-row total-row">
                  <span>Total Amount</span>
                  <strong className="price-total-accent">{naira(totalPrice)}</strong>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: ATTENDEE DETAILS */}
          {step === 2 && (
            <div className="booking-step-content">
              <div className="order-recap-pill">
                <span className="recap-tier" style={{ background: currentTier.color }}>
                  {currentTier.label}
                </span>
                <span className="recap-seat">{seatLabel}</span>
                <span className="recap-price">{naira(totalPrice)}</span>
              </div>

              <div className="booking-form-grid">
                <div className="form-group">
                  <label htmlFor="booking-name">Full Name (for badge & venue access)</label>
                  <input
                    id="booking-name"
                    type="text"
                    className="neubrutal-input"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Alex Morgan"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="booking-email">Work Email (for ticket delivery)</label>
                  <input
                    id="booking-email"
                    type="email"
                    className="neubrutal-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. attendee@example.com"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="booking-company">Organization & Role</label>
                  <input
                    id="booking-company"
                    type="text"
                    className="neubrutal-input"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g. Software Engineer • Tech Corp"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="booking-badge">Badge Display Name</label>
                  <input
                    id="booking-badge"
                    type="text"
                    className="neubrutal-input"
                    value={badgeName}
                    onChange={(e) => setBadgeName(e.target.value)}
                    placeholder="e.g. ALEX"
                  />
                </div>
              </div>

              <div className="venue-perk-summary-box">
                <span className="perk-summary-tag">YOUR INCLUDED PASS BENEFITS:</span>
                <ul className="included-perks-list">
                  {currentTier.perks.map((perk, i) => (
                    <li key={i}>
                      <IconCheck size={13} style={{ color: '#00875a', marginRight: 6 }} />
                      <span>{perk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* STEP 3: SIMULATED PAYMENT */}
          {step === 3 && (
            <div className="booking-step-content">
              <div className="simulation-banner outlined-block">
                <IconSparkle size={15} style={{ color: '#d9530f' }} />
                <div>
                  <strong>PORTFOLIO SIMULATION MODE</strong>
                  <p>No actual funds will be transferred. This simulates the official ticketing checkout experience.</p>
                </div>
              </div>

              <div className="payment-options-grid">
                {[
                  { id: 'card', label: 'Simulated Card', meta: 'Test Card •••• 2030' },
                  { id: 'transfer', label: 'Simulated Bank Transfer', meta: 'Instant Mock Payment' },
                  { id: 'applepay', label: 'Apple / Google Pay Demo', meta: 'One-touch biometric auth' },
                ].map((m) => (
                  <div
                    key={m.id}
                    className={`payment-option-card ${paymentMethod === m.id ? 'active' : ''}`}
                    onClick={() => {
                      play('click')
                      setPaymentMethod(m.id)
                    }}
                  >
                    <div className="payment-radio-dot">
                      {paymentMethod === m.id && <div className="inner-dot" />}
                    </div>
                    <div>
                      <strong>{m.label}</strong>
                      <span>{m.meta}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Final Summary */}
              <div className="final-order-card outlined-block">
                <div className="summary-title">Reservation Order Summary</div>
                <div className="summary-table">
                  <div className="table-row">
                    <span>Attendee</span>
                    <strong>{fullName || 'Guest Attendee'} ({email || 'guest@example.com'})</strong>
                  </div>
                  <div className="table-row">
                    <span>Venue & Edition</span>
                    <strong>Moshood Abiola National Stadium • 2030</strong>
                  </div>
                  <div className="table-row">
                    <span>Seating Tier</span>
                    <strong>{currentTier.label}</strong>
                  </div>
                  <div className="table-row">
                    <span>Reserved Position</span>
                    <strong className="seat-highlight">{seatLabel}</strong>
                  </div>
                  <div className="table-row total-highlight">
                    <span>Total Amount Due</span>
                    <span className="price-tag">{naira(totalPrice)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: DIGITAL PASS & CONFIRMATION */}
          {step === 4 && (
            <div className="booking-step-content confirmation-content">
              <div className="confirmation-badge-row">
                <span className="confirmed-pill">
                  <IconCheck size={14} />
                  <span>RESERVATION CONFIRMED</span>
                </span>
                <span className="confirmed-date">November 2030 • Moshood Abiola Stadium</span>
              </div>

              {/* Collectible Neubrutalist Ticket Stub */}
              <div className="digital-ticket-card outlined-block">
                <div className="ticket-top-banner">
                  <div className="ticket-branding">
                    <span className="ticket-logo">TM CON 2030</span>
                    <span className="ticket-tagline">Technology Media Conference</span>
                  </div>
                  <div className="ticket-tier-tag" style={{ background: currentTier.color }}>
                    {currentTier.label}
                  </div>
                </div>

                <div className="ticket-body-grid">
                  <div className="ticket-field">
                    <span className="field-lbl">ATTENDEE</span>
                    <strong className="field-val">{fullName || 'Attendee Delegate'}</strong>
                    <span className="field-sub">{company || 'Technology & Media Guest'}</span>
                  </div>
                  <div className="ticket-field">
                    <span className="field-lbl">SEAT ASSIGNMENT</span>
                    <strong className="field-val seat-number">{seatLabel}</strong>
                    <span className="field-sub">{currentTier.badge}</span>
                  </div>
                  <div className="ticket-field">
                    <span className="field-lbl">GATE & ENTRANCE</span>
                    <strong className="field-val">Gate 1 • West Turnstiles</strong>
                    <span className="field-sub">Open from 08:00 AM</span>
                  </div>
                  <div className="ticket-field">
                    <span className="field-lbl">BOOKING REF</span>
                    <div className="ref-copy-group">
                      <code className="ref-code">{bookingRef}</code>
                      <button
                        type="button"
                        className="copy-ref-btn"
                        onClick={handleCopyRef}
                        title="Copy booking reference"
                      >
                        {copiedRef ? <IconCheck size={12} /> : <IconCopy size={12} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Scannable Barcode & QR Code Section */}
                <div className="ticket-barcode-section">
                  <div className="ticket-qr-box">
                    {/* Procedural SVG QR Code */}
                    <svg width="68" height="68" viewBox="0 0 68 68" fill="none">
                      <rect width="68" height="68" fill="#fffdf9" />
                      {/* Corner 1 */}
                      <rect x="6" y="6" width="18" height="18" stroke="#121212" strokeWidth="3" fill="none" />
                      <rect x="11" y="11" width="8" height="8" fill="#121212" />
                      {/* Corner 2 */}
                      <rect x="44" y="6" width="18" height="18" stroke="#121212" strokeWidth="3" fill="none" />
                      <rect x="49" y="11" width="8" height="8" fill="#121212" />
                      {/* Corner 3 */}
                      <rect x="6" y="44" width="18" height="18" stroke="#121212" strokeWidth="3" fill="none" />
                      <rect x="11" y="49" width="8" height="8" fill="#121212" />
                      {/* Simulated data bits */}
                      <rect x="28" y="8" width="4" height="4" fill="#121212" />
                      <rect x="36" y="8" width="4" height="4" fill="#121212" />
                      <rect x="28" y="16" width="4" height="8" fill="#121212" />
                      <rect x="36" y="20" width="4" height="4" fill="#121212" />
                      <rect x="16" y="28" width="4" height="8" fill="#121212" />
                      <rect x="24" y="28" width="8" height="4" fill="#121212" />
                      <rect x="36" y="28" width="4" height="8" fill="#121212" />
                      <rect x="44" y="28" width="4" height="4" fill="#121212" />
                      <rect x="52" y="28" width="8" height="4" fill="#121212" />
                      <rect x="20" y="40" width="4" height="4" fill="#121212" />
                      <rect x="28" y="40" width="12" height="4" fill="#ff6b35" />
                      <rect x="44" y="40" width="4" height="4" fill="#121212" />
                      <rect x="28" y="48" width="4" height="8" fill="#121212" />
                      <rect x="36" y="48" width="8" height="4" fill="#121212" />
                      <rect x="48" y="48" width="4" height="8" fill="#121212" />
                      <rect x="56" y="44" width="4" height="8" fill="#121212" />
                    </svg>
                  </div>

                  <div className="ticket-barcode-lines">
                    <div className="barcode-bars">
                      {Array.from({ length: 42 }).map((_, i) => (
                        <span
                          key={i}
                          className="bar-line"
                          style={{
                            width: (i % 5 === 0 ? 3 : i % 3 === 0 ? 2 : 1) + 'px',
                            opacity: i % 7 === 0 ? 0.35 : 1,
                          }}
                        />
                      ))}
                    </div>
                    <span className="barcode-text">TMCON-2030-ABUJA-VERIFIED-SEAT</span>
                  </div>
                </div>
              </div>

              {downloadNotice && (
                <div className="download-feedback-pill">
                  <IconCheck size={13} />
                  <span>Simulated Ticket Pass saved to your device!</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Anchored Modal Footer */}
        <div className="booking-modal-footer">
          {step === 1 && (
            <>
              <button
                type="button"
                className="cta cta-booking-secondary"
                onClick={handleClose}
              >
                Cancel
              </button>
              <button
                type="button"
                className="cta cta-booking-primary"
                onClick={handleProceedToAttendee}
              >
                <span>Continue to Attendee Info</span>
                <IconArrowRight size={14} />
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <button
                type="button"
                className="cta cta-booking-secondary"
                onClick={() => {
                  play('click')
                  setStep(1)
                }}
              >
                <IconArrowLeft size={14} />
                <span>Back to Seat</span>
              </button>
              <button
                type="button"
                className="cta cta-booking-primary"
                onClick={handleProceedToPayment}
              >
                <span>Proceed to Simulated Checkout</span>
                <IconArrowRight size={14} />
              </button>
            </>
          )}

          {step === 3 && (
            <>
              <button
                type="button"
                className="cta cta-booking-secondary"
                disabled={isProcessing}
                onClick={() => {
                  play('click')
                  setStep(2)
                }}
              >
                <IconArrowLeft size={14} />
                <span>Back</span>
              </button>
              <button
                type="button"
                className="cta cta-booking-pay"
                disabled={isProcessing}
                onClick={handleExecutePayment}
              >
                {isProcessing ? (
                  <>
                    <span className="spinner-dots" />
                    <span>Authorizing simulated booking...</span>
                  </>
                ) : (
                  <>
                    <IconCreditCard size={15} />
                    <span>Confirm & Pay {naira(totalPrice)} (Free Demo)</span>
                  </>
                )}
              </button>
            </>
          )}

          {step === 4 && (
            <div className="confirmation-actions-row-wide">
              <button
                type="button"
                className="cta cta-view-seat-3d"
                onClick={handleViewSeatIn3D}
                title="Transition camera into stadium seat looking at main stage"
              >
                <IconEye size={15} />
                <span>VIEW SEAT IN 3D</span>
              </button>

              <button
                type="button"
                className="cta cta-download-pass"
                onClick={handleDownloadPass}
              >
                <IconDownload size={15} />
                <span>DOWNLOAD PASS</span>
              </button>

              <button
                type="button"
                className="cta cta-done-btn"
                onClick={handleClose}
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
