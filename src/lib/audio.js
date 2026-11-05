// src/lib/audio.js
// Audio engine using Howler for ambient event music and UI sfx.
// Playlist: Alan Walker & Avicii - Wake Me Up

export const TRACKS = [
  {
    id: 'alan-walker',
    title: 'Alan Walker',
    label: 'ALAN WALKER',
    src: '/audio/alan-walker.mp3',
  },
  {
    id: 'avicii',
    title: 'Avicii - Wake Me Up',
    label: 'AVICII - WAKE ME UP',
    src: '/audio/avicii-wake-me-up.mp3',
  },
]

let HowlClass = null
let HowlerLib = null
let sfx = null
let currentHowl = null
let currentTrackIdx = 0
let listeners = new Set()
let isInitialized = false

function notifyListeners() {
  const current = TRACKS[currentTrackIdx]
  listeners.forEach((fn) => fn(current, currentTrackIdx))
}

export function subscribeTrack(fn) {
  listeners.add(fn)
  fn(TRACKS[currentTrackIdx], currentTrackIdx)
  return () => listeners.delete(fn)
}

export function getCurrentTrack() {
  return TRACKS[currentTrackIdx]
}

export async function initAudio() {
  if (isInitialized) return
  isInitialized = true

  const mod = await import('howler')
  const lib = mod.default ?? mod
  HowlClass = lib.Howl
  HowlerLib = lib.Howler

  sfx = {
    whoosh: new HowlClass({
      src: ['/audio/whoosh.mp3', '/audio/whoosh.m4a', '/audio/whoosh.wav'],
      volume: 0.45,
    }),
    click: new HowlClass({
      src: ['/audio/click.mp3', '/audio/click.m4a', '/audio/click.wav'],
      volume: 0.35,
    }),
  }

  playTrackIndex(0)
}

export function playTrackIndex(idx) {
  if (!HowlClass) return
  currentTrackIdx = (idx + TRACKS.length) % TRACKS.length

  if (currentHowl) {
    currentHowl.stop()
    currentHowl.unload()
    currentHowl = null
  }

  const track = TRACKS[currentTrackIdx]
  currentHowl = new HowlClass({
    src: [track.src],
    html5: true, // HTML5 Audio stream for long MP3 tracks
    volume: 0.42,
    loop: false,
    onend: () => {
      // Auto-advance to next track in playlist when finished
      nextTrack()
    },
  })

  currentHowl.play()
  notifyListeners()
}

export function nextTrack() {
  playTrackIndex(currentTrackIdx + 1)
}

export function prevTrack() {
  playTrackIndex(currentTrackIdx - 1)
}

export const play = (name) => {
  sfx?.[name]?.play()
}

export const setMuted = (muted) => {
  if (HowlerLib) {
    HowlerLib.mute(muted)
  }
}
