// src/data/led.js
// Configuration for stage LED screens, scoreboard, and video playlists
// Based on PHASE4_DAYNIGHT_LED_CROWD_INTRO.md Section 3

export const ledScreens = [
  {
    id: 'main',
    label: 'Main LED wall',
    size: [32, 9],
    position: [0, 8.5, -4.9],
    mount: 'stage-main',
    playlist: 'idle',
  },
  {
    id: 'left',
    label: 'Left IMAG Wing',
    size: [9, 16],
    position: [-18.5, 9.8, -4.9],
    mount: 'stage-left',
    playlist: 'idle',
  },
  {
    id: 'right',
    label: 'Right IMAG Wing',
    size: [9, 16],
    position: [18.5, 9.8, -4.9],
    mount: 'stage-right',
    playlist: 'idle',
  },
  {
    id: 'scoreboard',
    label: 'North Scoreboard',
    size: [15, 9.4],
    mount: 'stadium-north',
    playlist: 'idle',
  },
]

export const playlists = {
  idle: [
    {
      id: 'promo',
      title: 'TM CON 2030 Keynote & Vision Reel',
      poster: '/assets/screens/center-wall-32x9.jpg',
      src: '/led/tmcon-promo.mp4',
      speaker: 'Keynote Stage',
      tag: 'FLAGSHIP PROMO',
    },
    {
      id: 'innovation',
      title: 'African Tech & Creative Ecosystem',
      poster: '/assets/screens/scoreboard-16x10.jpg',
      src: '/led/africa-tech.mp4',
      speaker: 'Ecosystem Showcase',
      tag: 'INNOVATION',
    },
    {
      id: 'media',
      title: 'Media Infrastructure & Digital Rights',
      poster: '/assets/screens/center-wall-32x9.jpg',
      src: '/led/media-tech.mp4',
      speaker: 'Industry Panel',
      tag: 'MEDIA TECH',
    },
  ],
  show: [
    {
      id: 'live-show',
      title: 'TM Live Audiovisual Showcase',
      poster: '/assets/screens/center-wall-live-32x9.jpg',
      src: '/led/live-show.mp4',
      speaker: 'Main Arena Live',
      tag: 'LIVE CONCERT',
    },
  ],
}

