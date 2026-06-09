import { useMemo } from 'react'
import { useVideoStore } from '../../state/videoStore'
import { usePlaybackStore } from '../../state/playbackStore'
import { useSettingsStore } from '../../state/settingsStore'
import { computeFlagSummary } from '../../lib/severity'
import { generateWorkOrders } from '../../lib/workorders'
import { SeverityPill } from '../../shared/SeverityPill'
import { prettyClass } from '../../lib/format'

// Lighter work-order surface on playback: click a chip to jump to that defect's
// first instance.
export function WorkOrderChips() {
  const meta = useVideoStore((s) => s.meta)
  const tracks = useVideoStore((s) => s.tracks)
  const config = useVideoStore((s) => s.config)
  const omitted = useSettingsStore((s) => s.omittedClasses)
  const snapToTrack = usePlaybackStore((s) => s.snapToTrack)

  const orders = useMemo(() => {
    if (!meta || !config) return []
    const summary = computeFlagSummary(tracks, config, meta.width * meta.height, omitted)
    return generateWorkOrders(summary.byClass)
  }, [meta, config, tracks, omitted])

  if (!meta || orders.length === 0) return null

  return (
    <div className="wo-chips">
      {orders.map((o) => (
        <span
          key={o.className}
          className="wo-chip"
          onClick={() => o.instances[0] && snapToTrack(o.instances[0], meta.enc_fps)}
          title={o.action}
        >
          {prettyClass(o.className)}
          <SeverityPill severity={o.severity} />
        </span>
      ))}
    </div>
  )
}
