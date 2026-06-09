import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { WorkOrder } from '../../lib/workorders'
import { SeverityPill } from '../../shared/SeverityPill'
import { frameToTime, prettyClass } from '../../lib/format'
import { useVideoStore } from '../../state/videoStore'

// Compact row that expands to its contributing instances (each jumps to playback).
export function WorkOrderRow({ order, hash }: { order: WorkOrder; hash: string }) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const encFps = useVideoStore((s) => s.meta?.enc_fps ?? 30)

  const jump = (trackId: number) => navigate(`/v/${hash}/playback?select=${trackId}`)

  return (
    <div className="wo-row">
      <button className="wo-head" onClick={() => setOpen((o) => !o)}>
        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        <span className="title">{order.action}</span>
        <span className="grow" />
        <span className="tnum" style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-sm)' }}>
          {order.count} instance{order.count > 1 ? 's' : ''}
        </span>
        <SeverityPill severity={order.severity} />
      </button>
      {open && (
        <div className="wo-body">
          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-faint)', margin: '6px 0' }}>
            {prettyClass(order.className)} · peak coverage {(order.peakCoverage * 100).toFixed(1)}%
          </div>
          {order.instances.map((t) => (
            <div className="wo-inst" key={t.track_id}>
              <span>
                #{t.track_id} · first seen {frameToTime(t.first_frame, encFps)} · {t.n_frames} frames
              </span>
              <span className="link" onClick={() => jump(t.track_id)}>
                Jump to playback →
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
