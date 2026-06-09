// Identity + artifacts for the loaded video (changes rarely). Builds the
// render-hot lookup indices once on load so the playback loop stays cheap.
import { create } from 'zustand'
import { api } from '../lib/api'
import {
  buildFrameIndex,
  buildHeldMaskIndex,
  type FrameIndex,
  type HeldMaskIndex,
} from '../lib/frameIndex'
import type { AppConfig, Detection, Track, VideoMeta, VideoSummary } from '../types'

interface VideoState {
  config: AppConfig | null
  library: VideoSummary[]
  hash: string | null
  meta: VideoMeta | null
  tracks: Track[]
  detections: Detection[]
  frameIndex: FrameIndex | null
  heldMaskIndex: HeldMaskIndex | null
  status: 'idle' | 'loading' | 'ready' | 'error'
  error: string | null
  loadConfig: () => Promise<void>
  loadLibrary: () => Promise<void>
  load: (hash: string) => Promise<void>
  clear: () => void
}

export const useVideoStore = create<VideoState>((set, get) => ({
  config: null,
  library: [],
  hash: null,
  meta: null,
  tracks: [],
  detections: [],
  frameIndex: null,
  heldMaskIndex: null,
  status: 'idle',
  error: null,

  async loadConfig() {
    if (get().config) return
    try {
      set({ config: await api.config() })
    } catch (e) {
      set({ error: String(e) })
    }
  },

  async loadLibrary() {
    try {
      set({ library: await api.videos() })
    } catch (e) {
      set({ error: String(e) })
    }
  },

  async load(hash) {
    if (get().hash === hash && get().status === 'ready') return
    set({ status: 'loading', hash, error: null })
    try {
      if (!get().config) await get().loadConfig()
      const [meta, tracks, detections] = await Promise.all([
        api.video(hash),
        api.tracks(hash),
        api.detections(hash),
      ])
      set({
        meta,
        tracks,
        detections,
        frameIndex: buildFrameIndex(detections),
        heldMaskIndex: buildHeldMaskIndex(detections),
        status: 'ready',
      })
    } catch (e) {
      set({ status: 'error', error: String(e) })
    }
  },

  clear() {
    set({
      hash: null,
      meta: null,
      tracks: [],
      detections: [],
      frameIndex: null,
      heldMaskIndex: null,
      status: 'idle',
    })
  },
}))
