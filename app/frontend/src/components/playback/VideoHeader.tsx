import { useMemo } from 'react'
import { useVideoStore } from '../../state/videoStore'
import { useSettingsStore } from '../../state/settingsStore'
import { computeClassCounts, computeFlagSummary } from '../../lib/severity'
import { fmtDuration } from '../../lib/format'
import { SceneBadge } from '../../shared/SceneBadge'

export function VideoHeader() {
  const meta = useVideoStore((s) => s.meta)
  const tracks = useVideoStore((s) => s.tracks)
  const config = useVideoStore((s) => s.config)
  const omitted = useSettingsStore((s) => s.omittedClasses)

  const inventory = config?.mode === 'inventory'
  const tally = useMemo(() => {
    if (!meta || !config) return 0
    if (inventory) return computeClassCounts(tracks, omitted).reduce((n, c) => n + c.count, 0)
    return computeFlagSummary(tracks, config, meta.width * meta.height, omitted).totalFlags
  }, [meta, config, tracks, omitted, inventory])

  if (!meta) return null
  return (
    <div className="video-header">
      <h1>{meta.source_video}</h1>
      <div className="meta tnum">
        {fmtDuration(meta.duration_sec)} · {meta.n_frames} frames @ {meta.enc_fps} fps ·{' '}
        {meta.width}×{meta.height} · {tally} {inventory ? 'components' : 'flags'}
      </div>
      {meta.scene && <SceneBadge scene={meta.scene} />}
    </div>
  )
}
