import type { MouseEvent } from 'react'
import { classColor } from '../../lib/classColors'
import type { Cluster } from '../../lib/timelineClusters'

// A cluster of flags collapsed into one card (distinct styling). Click to expand
// (handled by the parent via onClick); the expansion popover is a sibling.
export function DensityCard({
  cluster,
  x,
  dimmed,
  hasSelected,
  onClick,
}: {
  cluster: Cluster
  x: number
  dimmed: boolean
  hasSelected: boolean
  onClick: (e: MouseEvent) => void
}) {
  const top = Object.entries(cluster.perClass)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
  return (
    <div
      className={`dcard ${dimmed ? 'dimmed' : ''} ${hasSelected ? 'sel' : ''}`}
      style={{ left: x, borderTopColor: classColor(cluster.dominantClass) }}
      onClick={onClick}
    >
      <div>
        <span className="dcard-count tnum">{cluster.count}</span>
        <span className="dcard-label">flags</span>
      </div>
      <div className="dcard-swatches">
        {top.map(([c, n]) => (
          <span key={c} className="swatch" style={{ background: classColor(c) }} title={`${c}: ${n}`} />
        ))}
      </div>
    </div>
  )
}
