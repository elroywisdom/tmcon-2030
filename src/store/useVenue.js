import { create } from 'zustand'

export const useVenue = create((set, get) => ({
  activeZone: null, // zone id, or null for the full-venue overview
  activePreset: 'overview', // 'overview' | 'stage' | 'floor' | 'vip' | 'upper_tier' | 'left' | 'right'
  isSeatView: false, // true when camera is placed at seat height looking at stage
  hovered: null,
  selectedSeat: null, // { zoneId, index, label }
  isBookingOpen: false,
  setIsBookingOpen: (isBookingOpen) => set({ isBookingOpen }),
  openBooking: (zoneId = null) => {
    if (zoneId) {
      set({ isBookingOpen: true, activeZone: zoneId, isSeatView: false })
    } else {
      set({ isBookingOpen: true, isSeatView: false })
    }
  },
  entered: false,
  isTouring: false,
  tourStep: 0,
  timeOfDay: 'day', // 'day' | 'night'
  crowdLevel: 'high', // 'off' | 'low' | 'medium' | 'high'
  liveShow: false,
  qualityTier: 'high', // 'high' | 'medium' | 'low' | 'simple'
  ledTrackIndex: 0,
  ledPlaying: true,
  fullscreenModal: null,
  comparisonView: null,
  setComparisonView: (comparisonView) => set({ comparisonView }),

  // Cinematic Intro state per Phase 4 Section 5
  isIntroPlaying: false,
  introPhase: 'idle', // 'idle' | 'flight' | 'lights_on' | 'completed'
  introProgress: 0,
  lightsOnProgress: 0,
  introCaption: null,
  soundEnabled: true,

  focusZone: (id) =>
    set({ activeZone: id, isTouring: false, isSeatView: false, activePreset: null }),
  reset: () =>
    set({
      activeZone: null,
      isTouring: false,
      isSeatView: false,
      activePreset: 'overview',
      selectedSeat: null,
    }),
  setPreset: (presetId) =>
    set({
      activePreset: presetId,
      activeZone: null,
      isTouring: false,
      isSeatView: false,
    }),
  setViewFromSeat: (isSeatView) => set({ isSeatView }),
  setHovered: (hovered) => set({ hovered }),
  selectSeat: (selectedSeat) => set({ selectedSeat }),
  setEntered: (entered) => set({ entered }),

  startIntro: () => {
    // Intro always flies through the night city
    set({
      isIntroPlaying: true,
      introPhase: 'flight',
      introProgress: 0,
      lightsOnProgress: 0,
      activeZone: null,
      isTouring: false,
      timeOfDay: 'night',
    })
  },
  setIntroProgress: (progress, caption) => {
    const cur = get()
    if (cur.introCaption?.title !== caption?.title) {
      set({ introProgress: progress, introCaption: caption })
    } else {
      set({ introProgress: progress })
    }
  },
  startLightsOn: () =>
    set({ introPhase: 'lights_on', introProgress: 1.0, lightsOnProgress: 0 }),
  setLightsOnProgress: (prog) => set({ lightsOnProgress: prog }),
  completeIntro: () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('tmcon_intro_seen_v1', 'true')
      } catch (e) {}
    }
    set({
      isIntroPlaying: false,
      introPhase: 'completed',
      introProgress: 1.0,
      lightsOnProgress: 1.0,
      introCaption: null,
    })
  },
  skipIntro: () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('tmcon_intro_seen_v1', 'true')
      } catch (e) {}
    }
    set({
      isIntroPlaying: false,
      introPhase: 'completed',
      introProgress: 1.0,
      lightsOnProgress: 1.0,
      introCaption: null,
      activeZone: null,
      isTouring: false,
    })
  },
  replayIntro: () => {
    get().startIntro()
  },
  setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),

  startTour: () => set({ isTouring: true, tourStep: 0, activeZone: null, selectedSeat: null }),
  stopTour: () => set({ isTouring: false, tourStep: 0, activeZone: null }),
  setTourStep: (step) => set({ tourStep: step }),
  nextTourStep: (total) => {
    const current = get().tourStep
    if (current + 1 < total) {
      set({ tourStep: current + 1 })
    } else {
      set({ isTouring: false, tourStep: 0, activeZone: null })
    }
  },
  prevTourStep: () => {
    const current = get().tourStep
    if (current > 0) {
      set({ tourStep: current - 1 })
    }
  },

  setTimeOfDay: (timeOfDay) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('tmcon_time_of_day', timeOfDay)
    }
    set({ timeOfDay })
  },
  toggleTimeOfDay: () => {
    const next = get().timeOfDay === 'day' ? 'night' : 'day'
    if (typeof window !== 'undefined') {
      localStorage.setItem('tmcon_time_of_day', next)
    }
    set({ timeOfDay: next })
  },
  setCrowdLevel: (crowdLevel) => set({ crowdLevel }),
  setQualityTier: (qualityTier) => set({ qualityTier }),
  setLedTrackIndex: (idx) => set({ ledTrackIndex: idx }),
  nextLedTrack: (total) => set((s) => ({ ledTrackIndex: (s.ledTrackIndex + 1) % total })),
  prevLedTrack: (total) => set((s) => ({ ledTrackIndex: (s.ledTrackIndex - 1 + total) % total })),
  toggleLedPlaying: () => set((s) => ({ ledPlaying: !s.ledPlaying })),
  setFullscreenModal: (fullscreenModal) => set({ fullscreenModal }),
  toggleLiveShow: () => {
    const current = get().liveShow
    // If activating live show in day mode, switch to night mode first per brief section 7
    if (!current && get().timeOfDay === 'day') {
      get().setTimeOfDay('night')
    }
    set({ liveShow: !current })
  },
}))
