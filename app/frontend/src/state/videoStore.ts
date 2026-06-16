// Identity + artifacts for the loaded video (changes rarely). Builds the
// render-hot lookup indices once on load so the playback loop stays cheap.
import { create } from 'zustand'
import { api } from '../lib/api'
import { setClassColors } from '../lib/classColors'
import { setAssetConfig } from '../lib/assets'
import {
  buildFrameIndex,
  buildHeldMaskIndex,
  type FrameIndex,
  type HeldMaskIndex,
} from '../lib/frameIndex'
import type { AppConfig, Detection, Domain, DomainInfo, Track, VideoMeta, VideoSummary } from '../types'
import { useSettingsStore } from './settingsStore'

const DOMAIN_KEY = 'rovision.domain'
function initialDomain(): Domain {
  try {
    return localStorage.getItem(DOMAIN_KEY) || 'subsea'
  } catch {
    return 'subsea'
  }
}

interface VideoState {
  domain: Domain
  domains: DomainInfo[]
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
  loadDomains: () => Promise<void>
  setDomain: (domain: Domain) => Promise<void>
  loadConfig: () => Promise<void>
  loadLibrary: () => Promise<void>
  load: (hash: string) => Promise<void>
  clear: () => void
}

export const useVideoStore = create<VideoState>((set, get) => ({
  domain: initialDomain(),
  domains: [],
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

  async loadDomains() {
    try {
      set({ domains: await api.domains() })
    } catch (e) {
      set({ error: String(e) })
    }
  },

  async setDomain(domain) {
    if (domain === get().domain) return
    try {
      localStorage.setItem(DOMAIN_KEY, domain)
    } catch {
      /* ignore */
    }
    useSettingsStore.getState().resetForDomain()
    get().clear()
    set({ domain, config: null, library: [] })
    await Promise.all([get().loadConfig(), get().loadLibrary()])
  },

  async loadConfig() {
    // Config is domain-scoped; only refetch when it's missing or stale.
    if (get().config?.domain === get().domain) return
    try {
      const config = await api.config(get().domain)
      setClassColors(config.colors)
      setAssetConfig(config.assets)
      set({ config })
    } catch (e) {
      set({ error: String(e) })
    }
  },

  async loadLibrary() {
    try {
      set({ library: await api.videos(get().domain) })
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
