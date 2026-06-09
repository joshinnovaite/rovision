// Precomputed lookup structures built once per video load. Keep the 50fps render
// hot path O(1)/O(log n) — never scan the full detections array per frame.
import type { Detection, Polygon } from '../types'

/** frame (clip-local) -> detections on that frame. */
export type FrameIndex = Map<number, Detection[]>

export function buildFrameIndex(dets: Detection[]): FrameIndex {
  const idx: FrameIndex = new Map()
  for (const d of dets) {
    const arr = idx.get(d.frame)
    if (arr) arr.push(d)
    else idx.set(d.frame, [d])
  }
  return idx
}

/** Per-track change-point series of refine-frame polygons (for mask-hold). */
export interface TrackMaskSeries {
  frames: number[] // ascending refine frames where a polygon exists
  polys: Polygon[][] // polys[i] = polygons at frames[i]
}
export type HeldMaskIndex = Map<number, TrackMaskSeries>

export function buildHeldMaskIndex(dets: Detection[]): HeldMaskIndex {
  const byTrack = new Map<number, { frame: number; polys: Polygon[] }[]>()
  for (const d of dets) {
    if (!d.polygons || d.polygons.length === 0) continue
    const arr = byTrack.get(d.track_id) ?? []
    arr.push({ frame: d.frame, polys: d.polygons })
    byTrack.set(d.track_id, arr)
  }
  const index: HeldMaskIndex = new Map()
  for (const [tid, arr] of byTrack) {
    arr.sort((a, b) => a.frame - b.frame)
    index.set(tid, { frames: arr.map((x) => x.frame), polys: arr.map((x) => x.polys) })
  }
  return index
}

/** Largest i with frames[i] <= frame, or -1. */
function floorIndex(frames: number[], frame: number): number {
  let lo = 0
  let hi = frames.length - 1
  let ans = -1
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (frames[mid] <= frame) {
      ans = mid
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }
  return ans
}

/**
 * Mask-hold (DR-009): the polygons to paint for a track at `frame` are the most
 * recent refine polygons at or before `frame`. Returns null if none yet, or if
 * `frame` is past the track's last refine + holdLimit (avoid painting stale masks
 * long after the instance left).
 */
export function heldPolygonsAt(
  index: HeldMaskIndex,
  trackId: number,
  frame: number,
  lastFrame: number,
): Polygon[] | null {
  const series = index.get(trackId)
  if (!series) return null
  if (frame > lastFrame) return null
  const i = floorIndex(series.frames, frame)
  return i >= 0 ? series.polys[i] : null
}
