import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { CARD_W, GAP, snapZoomScale, type Cluster } from '../../lib/timelineClusters'
import { classColor } from '../../lib/classColors'
import { fmtDuration, prettyClass } from '../../lib/format'
import type { Track } from '../../types'

// Expanded cluster breakdown with snap-to-zoom links. Rendered in a portal so it
// escapes the bar card's `overflow: hidden`; positioned (fixed) just above the
// clicked card via `anchor` (its viewport centre-x and top).
export function DensityPopover({
  cluster,
  anchor,
  gapByTrackId,
  minScale,
  maxScale,
  onSnap,
  onClose,
}: {
  cluster: Cluster
  anchor: { cx: number; top: number }
  gapByTrackId: Map<number, number>
  minScale: number
  maxScale: number
  onSnap: (track: Track, scale: number) => void
  onClose: () => void
}) {
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const el = e.target as HTMLElement
      if (!el.closest('.density-pop') && !el.closest('.dcard')) onClose()
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [onClose])

  const members = cluster.members
  const dominant = cluster.dominantClass
  const firstDominant = members
    .filter((m) => m.class === dominant)
    .sort((a, b) => a.first_frame - b.first_frame)[0]
  const largest = [...members].sort((a, b) => (b.peak_area_px ?? 0) - (a.peak_area_px ?? 0))[0]
  const densest = [...members].sort(
    (a, b) => (gapByTrackId.get(a.track_id) ?? Infinity) - (gapByTrackId.get(b.track_id) ?? Infinity),
  )[0]
  const perClass = Object.entries(cluster.perClass).sort((a, b) => b[1] - a[1])

  const snap = (t: Track) => {
    const g = gapByTrackId.get(t.track_id) ?? Infinity
    onSnap(t, snapZoomScale(g, CARD_W, GAP, minScale, maxScale))
  }

  return createPortal(
    <div
      className="density-pop"
      style={{ left: anchor.cx, bottom: window.innerHeight - anchor.top + 10 }}
    >
      <h4>
        {cluster.count} flags · {fmtDuration(cluster.startTime)}–{fmtDuration(cluster.endTime)}
      </h4>
      {perClass.map(([c, n]) => (
        <div className="dp-row" key={c}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="swatch" style={{ background: classColor(c) }} /> {prettyClass(c)}
          </span>
          <span className="tnum">{n}</span>
        </div>
      ))}
      <div className="dp-snaps">
        {firstDominant && (
          <button className="snap-link" onClick={() => snap(firstDominant)}>
            Snap to first {prettyClass(dominant)}
          </button>
        )}
        {largest && (
          <button className="snap-link" onClick={() => snap(largest)}>
            Snap to largest {prettyClass(largest.class)} coverage
          </button>
        )}
        {densest && (
          <button className="snap-link" onClick={() => snap(densest)}>
            Snap to densest point
          </button>
        )}
      </div>
    </div>,
    document.body,
  )
}
