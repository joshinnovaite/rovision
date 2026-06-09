// View-time filters/transforms. None of these refetch — they re-filter the
// already-loaded data: omittedClasses (live), asset (priorities/dimming),
// detector/refine frequency (display-only down-sampling).
import { create } from 'zustand'
import type { Asset } from '../types'

interface SettingsState {
  asset: Asset
  omittedClasses: Set<string>
  detectorEveryN: number
  refineEveryN: number
  // overlay display toggles
  showBoxes: boolean
  showMasks: boolean
  showConfidence: boolean
  setAsset: (a: Asset) => void
  toggleClass: (c: string) => void
  setOmitted: (s: Set<string>) => void
  setDetectorEveryN: (n: number) => void
  setRefineEveryN: (n: number) => void
  setShowBoxes: (v: boolean) => void
  setShowMasks: (v: boolean) => void
  setShowConfidence: (v: boolean) => void
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  asset: 'generic',
  omittedClasses: new Set(),
  detectorEveryN: 1,
  refineEveryN: 10,
  showBoxes: true,
  showMasks: true,
  showConfidence: true,

  setAsset: (asset) => set({ asset }),
  toggleClass: (c) => {
    const s = new Set(get().omittedClasses)
    if (s.has(c)) s.delete(c)
    else s.add(c)
    set({ omittedClasses: s })
  },
  setOmitted: (omittedClasses) => set({ omittedClasses }),
  setDetectorEveryN: (detectorEveryN) => set({ detectorEveryN }),
  setRefineEveryN: (refineEveryN) => set({ refineEveryN }),
  setShowBoxes: (showBoxes) => set({ showBoxes }),
  setShowMasks: (showMasks) => set({ showMasks }),
  setShowConfidence: (showConfidence) => set({ showConfidence }),
}))
