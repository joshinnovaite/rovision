import { ClassBadge } from '../../shared/ClassBadge'
import { classColor } from '../../lib/classColors'
import { frameToTime } from '../../lib/format'
import type { Track } from '../../types'

// One tracked instance, attached to the horizontal bar at its first-seen time.
// `x` is the de-overlapped content-space X (px). `protrude` enables the max-zoom
// hover lift (deck-of-cards).
export function FlagCard({
  track,
  x,
  encFps,
  selected,
  dimmed,
  isDefect,
  protrude,
  onClick,
}: {
  track: Track
  x: number
  encFps: number
  selected: boolean
  dimmed: boolean
  isDefect: boolean
  protrude?: boolean
  onClick: () => void
}) {
  return (
    <div
      className={`hcard ${selected ? 'sel' : ''} ${dimmed ? 'dimmed' : ''} ${protrude ? 'protrude' : ''}`}
      style={{ left: x, borderTopColor: classColor(track.class) }}
      onClick={onClick}
    >
      <ClassBadge className={track.class} isDefect={isDefect} />
      <div className="hcard-meta tnum">
        #{track.track_id} · {frameToTime(track.first_frame, encFps)}
      </div>
    </div>
  )
}
