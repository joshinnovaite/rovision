import { useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { AlertTriangle, Boxes, Flag, Layers, ListChecks } from 'lucide-react'
import { useVideoStore } from '../state/videoStore'
import { useSettingsStore } from '../state/settingsStore'
import { computeClassCounts, computeFlagSummary } from '../lib/severity'
import { generateWorkOrders } from '../lib/workorders'
import { classColor } from '../lib/classColors'
import { fmtDuration, prettyClass } from '../lib/format'
import { MetricCard } from '../components/dashboard/MetricCard'
import { WorkOrderList } from '../components/dashboard/WorkOrderList'
import type { Severity, Track } from '../types'

export function DashboardScreen() {
  const { hash = '' } = useParams()
  const load = useVideoStore((s) => s.load)
  const status = useVideoStore((s) => s.status)
  const meta = useVideoStore((s) => s.meta)
  const tracks = useVideoStore((s) => s.tracks)
  const config = useVideoStore((s) => s.config)
  const error = useVideoStore((s) => s.error)
  const omitted = useSettingsStore((s) => s.omittedClasses)

  useEffect(() => {
    if (hash) load(hash)
  }, [hash, load])

  if (status === 'error') {
    return <div className="screen" style={{ color: 'var(--sev-high)' }}>{error}</div>
  }
  if (!meta || !config) {
    return <div className="screen">Loading…</div>
  }

  const head = (
    <div className="screen-head">
      <h1>Inspection summary</h1>
      <div className="sub">
        {meta.source_video} · {fmtDuration(meta.duration_sec)} · {meta.n_frames} frames @{' '}
        {meta.enc_fps} fps
      </div>
    </div>
  )

  // --- inventory mode: component counts, no flags/severity/work-orders ----------
  if (config.mode === 'inventory') {
    return (
      <div className="screen">
        {head}
        <InventoryDashboard tracks={tracks} omitted={omitted} />
      </div>
    )
  }

  // --- defect mode (subsea): the original flag/severity/work-order view ---------
  return (
    <div className="screen">
      {head}
      <DefectDashboard hash={hash} />
    </div>
  )
}

function InventoryDashboard({
  tracks,
  omitted,
}: {
  tracks: Track[]
  omitted: Set<string>
}) {
  const counts = useMemo(() => computeClassCounts(tracks, omitted), [tracks, omitted])
  const total = counts.reduce((n, c) => n + c.count, 0)
  const top = counts[0]

  return (
    <>
      <div className="card-grid">
        <MetricCard
          icon={<Boxes size={14} />}
          label="Components detected"
          value={total}
          sub="tracked component instances"
        />
        <MetricCard
          icon={<Layers size={14} />}
          label="Component types"
          value={counts.length}
          sub="distinct classes present"
        />
        <MetricCard
          icon={<AlertTriangle size={14} />}
          label="Most common"
          value={<span style={{ fontSize: 'var(--fs-lg)' }}>{top ? prettyClass(top.className) : '—'}</span>}
          sub={top ? `${top.count} instances` : 'none detected'}
        />
      </div>

      <h2 className="section-title">Component breakdown</h2>
      <div className="component-breakdown">
        {counts.length === 0 && <div className="sub">No components detected.</div>}
        {counts.map((c) => (
          <div key={c.className} className="component-row">
            <span className="swatch" style={{ background: classColor(c.className) }} />
            <span style={{ flex: 1 }}>{prettyClass(c.className)}</span>
            <span className="tnum">{c.count}</span>
          </div>
        ))}
      </div>
    </>
  )
}

function DefectDashboard({ hash }: { hash: string }) {
  const meta = useVideoStore((s) => s.meta)!
  const tracks = useVideoStore((s) => s.tracks)
  const config = useVideoStore((s) => s.config)!
  const omitted = useSettingsStore((s) => s.omittedClasses)

  const frameArea = meta.width * meta.height
  const summary = useMemo(
    () => computeFlagSummary(tracks, config, frameArea, omitted),
    [tracks, config, frameArea, omitted],
  )
  const workOrders = useMemo(() => generateWorkOrders(summary.byClass), [summary])

  const defectSet = new Set(config.defect_classes)
  const defectsPresent = summary.classesPresent.filter((c) => defectSet.has(c))
  const artefactsPresent = summary.classesPresent.filter((c) => !defectSet.has(c))
  const top = summary.byClass[0]

  const sevCounts: Record<Severity, number> = { high: 0, medium: 0, low: 0, none: 0 }
  for (const o of workOrders) sevCounts[o.severity] += 1
  const sevOrder: Severity[] = ['high', 'medium', 'low']

  return (
    <>
      <div className="card-grid">
        <MetricCard
          icon={<Flag size={14} />}
          label="Total flags"
          value={summary.totalFlags}
          sub="qualifying defect instances"
        />
        <MetricCard
          icon={<Layers size={14} />}
          label="Classes detected"
          value={summary.classesPresent.length}
          sub={`${defectsPresent.length} defect · ${artefactsPresent.length} artefact`}
        />
        <MetricCard
          icon={<AlertTriangle size={14} />}
          label="Most prominent"
          value={
            <span style={{ fontSize: 'var(--fs-lg)' }}>{top ? prettyClass(top.className) : '—'}</span>
          }
          sub={top ? `${top.count} instances` : 'no defects'}
        />
        <MetricCard
          icon={<ListChecks size={14} />}
          label="Severity"
          value={
            <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {sevOrder.filter((s) => sevCounts[s] > 0).length === 0 && '—'}
              {sevOrder
                .filter((s) => sevCounts[s] > 0)
                .map((s) => (
                  <span key={s} className={`sev sev-${s}`}>
                    {sevCounts[s]} {s}
                  </span>
                ))}
            </span>
          }
          sub={`${workOrders.length} work order${workOrders.length === 1 ? '' : 's'}`}
        />
      </div>

      <h2 className="section-title">Suggested work orders</h2>
      <WorkOrderList orders={workOrders} hash={hash} />
    </>
  )
}
