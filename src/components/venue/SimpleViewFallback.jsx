// src/components/venue/SimpleViewFallback.jsx
// Accessible 2D Arena & Seating Fallback for browsers or devices without WebGL support.
'use client'

import React from 'react'
import { zones, zoneList, EVENT_DETAILS } from '@/data/zones'
import { useVenue } from '@/store/useVenue'
import {
  IconFloor,
  IconStage,
  IconVip,
  IconUpperTier,
  IconScoreboard,
  IconLightbulb,
} from '@/components/common/Icons'

export default function SimpleViewFallback() {
  const activeZone = useVenue((s) => s.activeZone)
  const focusZone = useVenue((s) => s.focusZone)
  const currentZone = zones[activeZone] || zones.stage || {
    id: 'stage',
    label: 'Main Stage',
    badge: 'South End Pitch',
    blurb: 'Flagship stage with high-definition LED wall and line-array acoustics.',
  }

  return (
    <div className="simple-view-fallback">
      {/* Fallback Banner */}
      <div className="simple-view-banner">
        <span className="simple-banner-icon">
          <IconLightbulb size={16} />
        </span>
        <span className="simple-banner-text">
          <strong>SIMPLE 2D ACCESSIBLE VIEW</strong> &bull; 3D Hardware acceleration not detected or disabled. Displaying full venue map and zone details.
        </span>
      </div>

      <div className="simple-view-grid">
        {/* Interactive 2D Venue Schematic */}
        <div className="simple-schematic-card">
          <div className="simple-card-header">
            <h3>MOSHOOD ABIOLA STADIUM &bull; 2D ARENA MAP</h3>
            <span className="simple-capacity-badge">ABOUT 60,000 SEATS</span>
          </div>

          <div className="simple-svg-container">
            <svg
              viewBox="0 0 800 500"
              className="simple-arena-svg"
              role="img"
              aria-label="2D Stadium Bowl Map"
            >
              {/* Outer Oval - General Stands */}
              <ellipse
                cx="400"
                cy="250"
                rx="360"
                ry="210"
                fill="#f4efe6"
                stroke="#121212"
                strokeWidth="4"
              />
              {/* Mid Oval - Premium Tier */}
              <ellipse
                cx="400"
                cy="250"
                rx="280"
                ry="150"
                fill="#e8e0d0"
                stroke="#121212"
                strokeWidth="3"
              />
              {/* Pitch Area */}
              <rect
                x="240"
                y="170"
                width="320"
                height="160"
                rx="16"
                fill="#d8e8d0"
                stroke="#121212"
                strokeWidth="3"
              />
              {/* Main Stage (South end) */}
              <rect
                x="320"
                y="180"
                width="160"
                height="50"
                rx="4"
                fill="#121212"
                stroke="#ff6b35"
                strokeWidth="3"
                className={`svg-zone ${activeZone === 'stage' ? 'active' : ''}`}
                onClick={() => focusZone('stage')}
                style={{ cursor: 'pointer' }}
              />
              <text
                x="400"
                y="210"
                textAnchor="middle"
                fill="#ff6b35"
                fontSize="12"
                fontWeight="900"
                pointerEvents="none"
              >
                MAIN STAGE & LED WALL
              </text>

              {/* Floor FOH Area */}
              <rect
                x="330"
                y="250"
                width="140"
                height="65"
                rx="4"
                fill={activeZone === 'floor' ? '#ff6b35' : '#ffffff'}
                stroke="#121212"
                strokeWidth="2"
                className={`svg-zone ${activeZone === 'floor' ? 'active' : ''}`}
                onClick={() => focusZone('floor')}
                style={{ cursor: 'pointer' }}
              />
              <text
                x="400"
                y="288"
                textAnchor="middle"
                fill="#121212"
                fontSize="11"
                fontWeight="800"
                pointerEvents="none"
              >
                STANDING FLOOR (FOH)
              </text>

              {/* VIP Stand (West) */}
              <path
                d="M 120 200 A 280 150 0 0 1 200 130 L 250 170 A 200 100 0 0 0 180 230 Z"
                fill={activeZone === 'vip' ? '#ff6b35' : '#fffdfa'}
                stroke="#121212"
                strokeWidth="2"
                className={`svg-zone ${activeZone === 'vip' ? 'active' : ''}`}
                onClick={() => focusZone('vip')}
                style={{ cursor: 'pointer' }}
              />
              <text
                x="180"
                y="185"
                textAnchor="middle"
                fill="#121212"
                fontSize="10"
                fontWeight="800"
                pointerEvents="none"
              >
                VIP STAND
              </text>

              {/* Premium Stand (East) */}
              <path
                d="M 680 200 A 280 150 0 0 0 600 130 L 550 170 A 200 100 0 0 1 620 230 Z"
                fill={activeZone === 'premium' ? '#ff6b35' : '#fffdfa'}
                stroke="#121212"
                strokeWidth="2"
                className={`svg-zone ${activeZone === 'premium' ? 'active' : ''}`}
                onClick={() => focusZone('premium')}
                style={{ cursor: 'pointer' }}
              />
              <text
                x="620"
                y="185"
                textAnchor="middle"
                fill="#121212"
                fontSize="10"
                fontWeight="800"
                pointerEvents="none"
              >
                PREMIUM
              </text>
            </svg>
          </div>

          <div className="simple-legend">
            <span className="legend-item">
              <span className="legend-dot dot-stage" /> Main Stage
            </span>
            <span className="legend-item">
              <span className="legend-dot dot-floor" /> Standing Floor & Pitch
            </span>
            <span className="legend-item">
              <span className="legend-dot dot-vip" /> VIP Executive
            </span>
            <span className="legend-item">
              <span className="legend-dot dot-premium" /> Premium Tier
            </span>
            <span className="legend-item">
              <span className="legend-dot dot-general" /> General Seating
            </span>
          </div>
        </div>

        {/* Selected Zone Detail Card */}
        <div className="simple-detail-card">
          <div className="simple-detail-badge">{currentZone.badge || 'ZONE INFORMATION'}</div>
          <h2 className="simple-detail-title">{currentZone.label}</h2>
          <p className="simple-detail-desc">{currentZone.blurb}</p>

          <div className="simple-stats-row">
            <div className="simple-stat-box">
              <span className="stat-label">CAPACITY</span>
              <span className="stat-val">{currentZone.capacity || 'Flexible'}</span>
            </div>
            <div className="simple-stat-box">
              <span className="stat-label">PRICE / TIER</span>
              <span className="stat-val">
                {currentZone.price ? `₦${currentZone.price.toLocaleString('en-NG')}` : 'Reserved'}
              </span>
            </div>
          </div>

          <h4 className="simple-subhead">ZONE PERKS</h4>
          <ul className="simple-perks-list">
            {(currentZone.perks || ['Reserved bowl seating', 'Direct precinct access', 'Standard sightline']).map(
              (p, i) => (
                <li key={i}>{p}</li>
              )
            )}
          </ul>

          <div className="simple-zones-selector">
            <h4 className="simple-subhead">QUICK SELECT OTHER ZONES</h4>
            <div className="simple-buttons-wrap">
              {zoneList.map((z) => (
                <button
                  key={z.id}
                  className={`simple-zone-btn ${activeZone === z.id ? 'active' : ''}`}
                  onClick={() => focusZone(z.id)}
                >
                  {z.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
