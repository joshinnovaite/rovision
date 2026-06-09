import { useEffect, useMemo, useRef, useState } from 'react'
import { useGesture } from '@use-gesture/react'
import { Minus, Plus } from 'lucide-react'
import { useVideoStore } from '../../state/videoStore'
import { usePlaybackStore } from '../../state/playbackStore'
import { useSettingsStore } from '../../state/settingsStore'
import {
  CARD_W,
  GAP,
  MAX_ZOOM_WINDOW_SEC,
  computeClusters,
  nearestNeighbourGaps,
  sortTracksByFirstFrame,
} from '../../lib/timelineClusters'
import { isRelevantForAsset } from '../../lib/assets'
import { classColor } from '../../lib/classColors'
import { FlagCard } from './FlagCard'
import { DensityCard } from './DensityCard'
import { DensityPopover } from './DensityPopover'
import type { Track } from '../../types'

// The horizontal level-of-detail playback bar. Clusters recompute only on
// `scale` change; the content transform (pan/playback) is applied imperatively
// via a store subscription so play/scrub never re-render React.
export function PlaybackBarCard() {
  const meta = useVideoStore((s) => s.meta)
  const config = useVideoStore((s) => s.config)
  const tracks = useVideoStore((s) => s.tracks)
  const scale = usePlaybackStore((s) => s.scale)
  const mode = usePlaybackStore((s) => s.mode)
  const barWidthPx = usePlaybackStore((s) => s.barWidthPx)
  const durationSec = usePlaybackStore((s) => s.durationSec)
  const selectedTrackId = usePlaybackStore((s) => s.selectedTrackId)
  const snapToTrack = usePlaybackStore((s) => s.snapToTrack)
  const setScale = usePlaybackStore((s) => s.setScale)
  const setScaleAbout = usePlaybackStore((s) => s.setScaleAbout)
  const panBy = usePlaybackStore((s) => s.panBy)
  const seekToTime = usePlaybackStore((s) => s.seekToTime)
  const setMode = usePlaybackStore((s) => s.setMode)
  const setBarWidth = usePlaybackStore((s) => s.setBarWidth)
  const setTimelineMeta = usePlaybackStore((s) => s.setTimelineMeta)
  const asset = useSettingsStore((s) => s.asset)
  const omitted = useSettingsStore((s) => s.omittedClasses)

  const outerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const indicatorRef = useRef<HTMLDivElement>(null)
  const chevronRef = useRef<HTMLDivElement>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [popAnchor, setPopAnchor] = useState<{ cx: number; top: number } | null>(null)

  const encFps = meta?.enc_fps ?? 30
  const defectSet = useMemo(() => new Set(config?.defect_classes ?? []), [config])
  const visibleSorted = useMemo(
    () => sortTracksByFirstFrame(tracks.filter((t) => !omitted.has(t.class))),
    [tracks, omitted],
  )
  const clusters = useMemo(
    () =>
      computeClusters({
        tracks: visibleSorted,
        encFps,
        pxPerSec: scale || 1,
        cardWidthPx: CARD_W,
        gapPx: GAP,
      }),
    [visibleSorted, encFps, scale],
  )
  const gaps = useMemo(() => nearestNeighbourGaps(visibleSorted, encFps), [visibleSorted, encFps])
  const gapByTrackId = useMemo(
    () => new Map(visibleSorted.map((t, i) => [t.track_id, gaps[i]])),
    [visibleSorted, gaps],
  )

  const minScale = barWidthPx && durationSec ? barWidthPx / durationSec : 1
  const maxScale = barWidthPx ? Math.max(minScale, barWidthPx / MAX_ZOOM_WINDOW_SEC) : 1
  // terminal LOD: at full zoom, no clustering — all individuals, overlap allowed, hover lifts
  const atMaxZoom = scale > 0 && scale >= maxScale - 1e-3

  // init timeline meta + measure width
  useEffect(() => {
    if (meta) setTimelineMeta(meta.duration_sec, meta.enc_fps)
  }, [meta, setTimelineMeta])
  useEffect(() => {
    const el = outerRef.current
    if (!el) return
    const ro = new ResizeObserver((es) => setBarWidth(es[0].contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [setBarWidth])

  // imperative transform (off the React hot path): rAF-coalesced subscribe
  useEffect(() => {
    let raf = 0
    const apply = () => {
      raf = 0
      const s = usePlaybackStore.getState()
      const W = s.barWidthPx
      const t = s.currentFrame / (s.encFps || 30)
      let tx: number
      if (s.mode === 'tracked') {
        tx = W / 2 - t * s.scale
        if (indicatorRef.current) {
          indicatorRef.current.style.display = 'block'
          indicatorRef.current.style.left = `${W / 2}px`
        }
        if (chevronRef.current) chevronRef.current.style.display = 'none'
      } else {
        tx = -s.viewStartTime * s.scale
        const ix = (t - s.viewStartTime) * s.scale
        if (indicatorRef.current) {
          const vis = ix >= 0 && ix <= W
          indicatorRef.current.style.display = vis ? 'block' : 'none'
          if (vis) indicatorRef.current.style.left = `${ix}px`
        }
        if (chevronRef.current) {
          if (ix < 0) {
            chevronRef.current.style.display = 'block'
            chevronRef.current.style.left = '6px'
            chevronRef.current.textContent = '‹'
          } else if (ix > W) {
            chevronRef.current.style.display = 'block'
            chevronRef.current.style.left = `${W - 16}px`
            chevronRef.current.textContent = '›'
          } else {
            chevronRef.current.style.display = 'none'
          }
        }
      }
      if (contentRef.current) contentRef.current.style.transform = `translateX(${tx}px)`
    }
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(apply)
    }
    apply()
    const unsub = usePlaybackStore.subscribe(schedule)
    return () => {
      unsub()
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  // gestures: pinch = zoom (about cursor); wheel = scrub (tracked) / pan (static).
  // ctrl+wheel (trackpad pinch) is consumed by the pinch handler. Clamping lives
  // in the store setters; the transform reacts via the imperative subscribe above.
  useGesture(
    {
      onPinch: (state) => {
        const st = usePlaybackStore.getState()
        let memo = state.memo as { anchorPx: number; anchorTime: number } | undefined
        if (state.first || !memo) {
          const rect = outerRef.current?.getBoundingClientRect()
          const anchorPx = rect ? state.origin[0] - rect.left : st.barWidthPx / 2
          const anchorTime =
            st.mode === 'tracked'
              ? st.currentFrame / (st.encFps || 30) + (anchorPx - st.barWidthPx / 2) / (st.scale || 1)
              : st.viewStartTime + anchorPx / (st.scale || 1)
          memo = { anchorPx, anchorTime }
        }
        const next = state.offset[0]
        if (st.mode === 'tracked') setScale(next)
        else setScaleAbout(next, memo.anchorTime, memo.anchorPx)
        return memo
      },
      onWheel: (state) => {
        const event = state.event as WheelEvent
        if (event.ctrlKey) return // pinch handles ctrl+wheel
        event.preventDefault()
        const st = usePlaybackStore.getState()
        const [dx, dy] = state.delta
        const primary = Math.abs(dx) >= Math.abs(dy) ? dx : dy
        const dsec = primary / (st.scale || 1)
        if (st.mode === 'tracked') seekToTime(st.currentFrame / (st.encFps || 30) + dsec)
        else panBy(dsec)
      },
    },
    {
      target: outerRef,
      eventOptions: { passive: false },
      pinch: {
        from: () => [usePlaybackStore.getState().scale || 1, 0],
        scaleBounds: () => {
          const st = usePlaybackStore.getState()
          const W = st.barWidthPx || 1
          const dur = st.durationSec || 1
          const min = W / dur
          return { min, max: Math.max(min, W / MAX_ZOOM_WINDOW_SEC) }
        },
      },
    },
  )

  if (!meta) return null
  if (visibleSorted.length === 0) return <div className="barcard empty">No flags in view</div>

  const zoom = (factor: number) => setScale((scale || minScale) * factor)
  const onSnap = (t: Track, scaleVal: number) => {
    setScale(scaleVal)
    snapToTrack(t, encFps)
    setExpandedId(null)
    setPopAnchor(null)
  }
  const expanded = clusters.find((c) => c.id === expandedId && !c.isSingleton) ?? null

  return (
    <div className="barcard" ref={outerRef}>
      <div className="bar-rail" />
      <div className="barcard-content" ref={contentRef}>
        {visibleSorted.map((t) => (
          <span
            key={`tick-${t.track_id}`}
            className="bar-tick"
            style={{ left: (t.first_frame / encFps) * (scale || 1), background: classColor(t.class) }}
          />
        ))}
        {atMaxZoom
          ? visibleSorted.map((t) => {
              const isDefect = defectSet.has(t.class)
              const selected = t.track_id === selectedTrackId
              const dimmed =
                !selected && (!isDefect || (asset !== 'generic' && !isRelevantForAsset(asset, t.class)))
              return (
                <FlagCard
                  key={t.track_id}
                  track={t}
                  x={(t.first_frame / encFps) * scale}
                  encFps={encFps}
                  selected={selected}
                  dimmed={dimmed}
                  isDefect={isDefect}
                  protrude
                  onClick={() => snapToTrack(t, encFps)}
                />
              )
            })
          : clusters.map((c) => {
              if (c.isSingleton) {
                const t = c.members[0]
                const isDefect = defectSet.has(t.class)
                const selected = t.track_id === selectedTrackId
                const dimmed =
                  !selected && (!isDefect || (asset !== 'generic' && !isRelevantForAsset(asset, t.class)))
                return (
                  <FlagCard
                    key={c.id}
                    track={t}
                    x={c.posPx}
                    encFps={encFps}
                    selected={selected}
                    dimmed={dimmed}
                    isDefect={isDefect}
                    onClick={() => snapToTrack(t, encFps)}
                  />
                )
              }
              const hasSelected =
                selectedTrackId != null && c.members.some((m) => m.track_id === selectedTrackId)
              const anyRelevant = c.members.some(
                (m) => defectSet.has(m.class) && (asset === 'generic' || isRelevantForAsset(asset, m.class)),
              )
              return (
                <DensityCard
                  key={c.id}
                  cluster={c}
                  x={c.posPx}
                  dimmed={!hasSelected && !anyRelevant}
                  hasSelected={hasSelected}
                  onClick={(e) => {
                    if (expandedId === c.id) {
                      setExpandedId(null)
                      setPopAnchor(null)
                      return
                    }
                    const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
                    setPopAnchor({ cx: r.left + r.width / 2, top: r.top })
                    setExpandedId(c.id)
                  }}
                />
              )
            })}
        {!atMaxZoom && expanded && popAnchor && (
          <DensityPopover
            cluster={expanded}
            anchor={popAnchor}
            gapByTrackId={gapByTrackId}
            minScale={minScale}
            maxScale={maxScale}
            onSnap={onSnap}
            onClose={() => {
              setExpandedId(null)
              setPopAnchor(null)
            }}
          />
        )}
      </div>

      <div className="bar-indicator" ref={indicatorRef} />
      <div className="off-chevron" ref={chevronRef} />

      <div className="barcard-controls">
        <button
          className={`mode-toggle ${mode === 'tracked' ? 'tracked' : ''}`}
          onClick={() => setMode(mode === 'tracked' ? 'static' : 'tracked')}
          title="Indicator mode"
        >
          {mode === 'tracked' ? 'Tracked' : 'Static'}
        </button>
        <button className="iconbtn" onClick={() => zoom(1 / 1.4)} title="Zoom out">
          <Minus size={16} />
        </button>
        <button className="iconbtn" onClick={() => zoom(1.4)} title="Zoom in">
          <Plus size={16} />
        </button>
      </div>
    </div>
  )
}
