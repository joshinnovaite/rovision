import { useMemo } from 'react'
import { useVideoStore } from '../../state/videoStore'
import { usePlaybackStore } from '../../state/playbackStore'
import { useSettingsStore } from '../../state/settingsStore'
import { heldPolygonsAt } from '../../lib/frameIndex'
import { classColor, SELECT_COLOR } from '../../lib/classColors'
import { isRelevantForAsset } from '../../lib/assets'
import { prettyClass } from '../../lib/format'
import type { Track } from '../../types'

// Boxes + held mask polygons for the current frame, drawn in a viewBox that
// matches the source pixel grid. Boxes hold from the last kept detector frame;
// masks hold from the last kept refine frame (DR-009) — neither blinks.
export function OverlayLayer() {
  const meta = useVideoStore((s) => s.meta)
  const config = useVideoStore((s) => s.config)
  const frameIndex = useVideoStore((s) => s.frameIndex)
  const heldMaskIndex = useVideoStore((s) => s.heldMaskIndex)
  const tracks = useVideoStore((s) => s.tracks)
  const currentFrame = usePlaybackStore((s) => s.currentFrame)
  const selectedTrackId = usePlaybackStore((s) => s.selectedTrackId)
  const asset = useSettingsStore((s) => s.asset)
  const omitted = useSettingsStore((s) => s.omittedClasses)
  const detectorEveryN = useSettingsStore((s) => s.detectorEveryN)
  const refineEveryN = useSettingsStore((s) => s.refineEveryN)
  const showBoxes = useSettingsStore((s) => s.showBoxes)
  const showMasks = useSettingsStore((s) => s.showMasks)
  const showConfidence = useSettingsStore((s) => s.showConfidence)

  const trackById = useMemo(() => {
    const m = new Map<number, Track>()
    for (const t of tracks) m.set(t.track_id, t)
    return m
  }, [tracks])
  const defectSet = useMemo(() => new Set(config?.defect_classes ?? []), [config])

  if (!meta || !frameIndex || !heldMaskIndex) return null
  const W = meta.width
  const H = meta.height
  const refineEvery = meta.refine_every || 10
  // label sized relative to the source resolution (scales with the video, like
  // the original burned-in overlay); haloed for legibility on busy footage.
  const labelSize = Math.max(12, Math.round(H * 0.028))

  // down-sampled lookup frames (hold between kept frames)
  const boxesFrame =
    detectorEveryN <= 1 ? currentFrame : Math.floor(currentFrame / detectorEveryN) * detectorEveryN
  const maskFrame =
    refineEveryN <= refineEvery ? currentFrame : Math.floor(currentFrame / refineEveryN) * refineEveryN

  const dets = (frameIndex.get(boxesFrame) ?? []).filter((d) => !omitted.has(d.class))
  // selected last so it paints on top
  const ordered = [...dets].sort(
    (a, b) => Number(a.track_id === selectedTrackId) - Number(b.track_id === selectedTrackId),
  )

  return (
    <svg className="overlay" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
      {ordered.map((d) => {
        const tr = trackById.get(d.track_id)
        const selected = d.track_id === selectedTrackId
        const isDefect = defectSet.has(d.class)
        const dim =
          !selected && (!isDefect || (asset !== 'generic' && !isRelevantForAsset(asset, d.class)))
        const color = classColor(d.class)
        const held = heldPolygonsAt(heldMaskIndex, d.track_id, maskFrame, tr?.last_frame ?? maskFrame)
        const [x0, y0, x1, y1] = d.bbox
        const edge = selected ? SELECT_COLOR : color
        return (
          <g key={d.track_id} opacity={dim ? 0.4 : 1}>
            {showMasks &&
              held?.map((poly, i) => (
                <polygon
                  key={i}
                  points={poly.map(([x, y]) => `${x * W},${y * H}`).join(' ')}
                  fill={selected ? SELECT_COLOR : color}
                  fillOpacity={selected ? 0.4 : 0.32}
                  stroke={edge}
                  strokeOpacity={0.95}
                  strokeWidth={selected ? 2.5 : 1.5}
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            {showBoxes && (
              <rect
                x={x0}
                y={y0}
                width={Math.max(0, x1 - x0)}
                height={Math.max(0, y1 - y0)}
                fill="none"
                stroke={edge}
                strokeWidth={selected ? 3.5 : 2}
                vectorEffect="non-scaling-stroke"
              />
            )}
            {showConfidence && (
              <text
                x={Math.max(2, x0)}
                y={Math.max(labelSize, y0 - 6)}
                fill={edge}
                fontSize={labelSize}
                fontWeight={700}
                fontFamily="Inter, system-ui, sans-serif"
                stroke="rgba(13, 20, 24, 0.7)"
                strokeWidth={Math.max(2, labelSize * 0.18)}
                strokeLinejoin="round"
                paintOrder="stroke"
              >
                #{d.track_id} {prettyClass(d.class)} {d.confidence.toFixed(2)}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
