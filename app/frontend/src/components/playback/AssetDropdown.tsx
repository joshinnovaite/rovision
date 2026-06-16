import { assetKeys, assetConfig } from '../../lib/assets'
import { useVideoStore } from '../../state/videoStore'
import { usePlaybackStore } from '../../state/playbackStore'
import { useSettingsStore } from '../../state/settingsStore'
import { computeFlagSummary } from '../../lib/severity'
import type { Asset } from '../../types'

// Changing the asset re-prioritises/dims the cards + overlay (handled where they
// read `asset`) and auto-jumps to the asset's top-priority class (or the most
// prominent defect for the generic lens).
export function AssetDropdown() {
  const meta = useVideoStore((s) => s.meta)
  const tracks = useVideoStore((s) => s.tracks)
  const config = useVideoStore((s) => s.config)
  const asset = useSettingsStore((s) => s.asset)
  const setAsset = useSettingsStore((s) => s.setAsset)
  const omitted = useSettingsStore((s) => s.omittedClasses)
  const snapToTrack = usePlaybackStore((s) => s.snapToTrack)

  function onChange(a: Asset) {
    setAsset(a)
    if (!meta || !config) return
    let targetClass = assetConfig(a)?.topPriority ?? null
    if (!targetClass) {
      const summary = computeFlagSummary(tracks, config, meta.width * meta.height, omitted)
      targetClass = summary.byClass[0]?.className ?? null
    }
    if (!targetClass) return
    const candidates = tracks
      .filter((t) => t.class === targetClass)
      .sort((a2, b2) => a2.first_frame - b2.first_frame)
    if (candidates[0]) snapToTrack(candidates[0], meta.enc_fps)
  }

  return (
    <div className="asset-bar">
      <label>Asset lens</label>
      <select value={asset} onChange={(e) => onChange(e.target.value as Asset)}>
        {assetKeys().map((a) => (
          <option key={a} value={a}>
            {assetConfig(a)?.label ?? a}
          </option>
        ))}
      </select>
    </div>
  )
}
