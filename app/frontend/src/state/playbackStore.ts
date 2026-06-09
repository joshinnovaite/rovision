// Hot-path playback state + the horizontal-timeline view slice.
// The <video> element owns currentTime; currentFrame is a derived mirror written
// by the rAF loop. The bar transform is computed from (currentFrame, scale, mode,
// viewStartTime) and applied IMPERATIVELY by PlaybackBarCard — never via a React
// subscription on the hot path. All scale/pan clamping lives here (one source).
import { create } from 'zustand'
import { MAX_ZOOM_WINDOW_SEC } from '../lib/timelineClusters'
import type { Track } from '../types'

export type IndicatorMode = 'tracked' | 'static'

interface PlaybackState {
  // --- hot ---
  currentFrame: number
  isPlaying: boolean
  selectedTrackId: number | null
  videoEl: HTMLVideoElement | null

  // --- timeline view (changes on gesture/button/resize, not per frame) ---
  scale: number // pxPerSec
  mode: IndicatorMode
  viewStartTime: number // seconds; left edge of the window (static mode)
  barWidthPx: number
  durationSec: number
  encFps: number
  playbackRate: number

  setVideoEl: (el: HTMLVideoElement | null) => void
  setFrame: (f: number) => void
  setPlaying: (p: boolean) => void
  selectTrack: (id: number | null) => void
  seekToFrame: (frame: number, encFps: number) => void
  seekToTime: (sec: number) => void
  snapToTrack: (track: Track, encFps: number) => void

  setScale: (s: number) => void
  setScaleAbout: (s: number, anchorTime: number, anchorPx: number) => void
  panBy: (deltaSec: number) => void
  setViewStartTime: (t: number) => void
  setMode: (m: IndicatorMode) => void
  setBarWidth: (w: number) => void
  setTimelineMeta: (durationSec: number, encFps: number) => void
  setPlaybackRate: (r: number) => void

  reset: () => void
}

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x))

function bounds(barWidthPx: number, durationSec: number) {
  const W = barWidthPx || 1
  const dur = durationSec || 1
  const min = W / dur // whole clip fits
  const max = Math.max(min, W / MAX_ZOOM_WINDOW_SEC) // ~5s window (>= min)
  return { min, max }
}

function clampView(t: number, s: { barWidthPx: number; scale: number; durationSec: number }): number {
  const W = s.barWidthPx || 1
  const scale = s.scale || 1
  const windowSec = W / scale
  return clamp(t, 0, Math.max(0, s.durationSec - windowSec))
}

export const usePlaybackStore = create<PlaybackState>((set, get) => ({
  currentFrame: 0,
  isPlaying: false,
  selectedTrackId: null,
  videoEl: null,

  scale: 0, // initialised to minScale once width + duration are known
  mode: 'tracked',
  viewStartTime: 0,
  barWidthPx: 0,
  durationSec: 0,
  encFps: 30,
  playbackRate: 1,

  setVideoEl: (el) => {
    if (el) el.playbackRate = get().playbackRate
    set({ videoEl: el })
  },
  setFrame: (f) => {
    if (f !== get().currentFrame) set({ currentFrame: f })
  },
  setPlaying: (p) => set({ isPlaying: p }),
  selectTrack: (id) => set({ selectedTrackId: id }),

  seekToFrame: (frame, encFps) => {
    const v = get().videoEl
    if (v && encFps > 0) v.currentTime = frame / encFps
  },
  seekToTime: (sec) => {
    const v = get().videoEl
    if (v) v.currentTime = Math.max(0, sec)
  },
  snapToTrack: (track, encFps) => {
    set({ selectedTrackId: track.track_id })
    const v = get().videoEl
    if (v && encFps > 0) v.currentTime = track.first_frame / encFps
  },

  setScale: (s) => {
    const st = get()
    const { min, max } = bounds(st.barWidthPx, st.durationSec)
    set({ scale: clamp(s, min, max) })
  },
  setScaleAbout: (s, anchorTime, anchorPx) => {
    const st = get()
    const { min, max } = bounds(st.barWidthPx, st.durationSec)
    const scale = clamp(s, min, max)
    const viewStartTime = clampView(anchorTime - anchorPx / scale, { ...st, scale })
    set({ scale, viewStartTime })
  },
  panBy: (deltaSec) => set((st) => ({ viewStartTime: clampView(st.viewStartTime + deltaSec, st) })),
  setViewStartTime: (t) => set((st) => ({ viewStartTime: clampView(t, st) })),

  setMode: (m) => {
    const st = get()
    if (m === 'static' && st.mode === 'tracked') {
      // seed the window so the indicator stays where it visually was (centre),
      // then it's free to leave as playback continues
      const curTime = st.currentFrame / (st.encFps || 30)
      const halfWindowSec = st.barWidthPx / 2 / (st.scale || 1)
      set({ mode: 'static', viewStartTime: clampView(curTime - halfWindowSec, st) })
    } else {
      set({ mode: m })
    }
  },

  setBarWidth: (w) =>
    set((st) => {
      const { min, max } = bounds(w, st.durationSec)
      const scale = st.scale > 0 ? clamp(st.scale, min, max) : min
      return { barWidthPx: w, scale, viewStartTime: clampView(st.viewStartTime, { ...st, barWidthPx: w, scale }) }
    }),
  setTimelineMeta: (durationSec, encFps) =>
    set((st) => {
      const { min, max } = bounds(st.barWidthPx, durationSec)
      const scale = st.scale > 0 ? clamp(st.scale, min, max) : min
      return { durationSec, encFps, scale }
    }),
  setPlaybackRate: (r) => {
    const v = get().videoEl
    if (v) v.playbackRate = r
    set({ playbackRate: r })
  },

  // NB: does NOT clear videoEl — that's owned by VideoStage's mount/unmount.
  // Clearing it here would race with VideoStage's setVideoEl (child effects run
  // before this parent effect) and freeze the frame-sync loop.
  reset: () =>
    set({
      currentFrame: 0,
      isPlaying: false,
      selectedTrackId: null,
      scale: 0,
      mode: 'tracked',
      viewStartTime: 0,
    }),
}))
