// Level-of-detail clustering for the horizontal playback bar.
//
// Pure, O(n), deterministic. Recomputed ONLY when the zoom scale (pxPerSec)
// changes — pan and playback are transforms, never reclusters. Two passes:
//   1. greedy proximity grouping in pixel space (grid-independent)
//   2. mean-centred de-overlap relaxation (provably non-overlapping)
import type { Track } from '../types'

// Layout constants (one source of truth).
export const MAX_ZOOM_WINDOW_SEC = 5 // most zoomed-in window
export const CARD_W = 132 // card width (px)
export const GAP = 8 // min gap between cards (px)

export interface Cluster {
  id: string // stable across zoom: anchor (earliest) track id
  centerTime: number // mean of member times (s)
  posPx: number // de-overlapped X in content space (pre-transform)
  count: number
  members: Track[] // sorted by first_frame
  perClass: Record<string, number>
  dominantClass: string
  isSingleton: boolean
  startTime: number // earliest member time (s)
  endTime: number // latest member time (s)
}

export interface ClusterInput {
  tracks: Track[] // ALREADY filtered (non-omitted) + sorted by first_frame
  encFps: number
  pxPerSec: number
  cardWidthPx: number
  gapPx: number
}

export function sortTracksByFirstFrame(tracks: Track[]): Track[] {
  return [...tracks].sort((a, b) => a.first_frame - b.first_frame || a.track_id - b.track_id)
}

function dominantOf(perClass: Record<string, number>): string {
  let best = ''
  let bestN = -1
  for (const [c, n] of Object.entries(perClass)) {
    if (n > bestN || (n === bestN && c < best)) {
      best = c
      bestN = n
    }
  }
  return best
}

export function computeClusters(input: ClusterInput): Cluster[] {
  const { tracks, encFps, pxPerSec, cardWidthPx, gapPx } = input
  if (tracks.length === 0) return []
  const minSpacing = cardWidthPx + gapPx

  // Pass 1 — greedy grouping anchored at each group's first member.
  const groups: Track[][] = []
  let anchorPx = -Infinity
  for (const t of tracks) {
    const px = (t.first_frame / encFps) * pxPerSec
    if (groups.length === 0 || px >= anchorPx + minSpacing) {
      groups.push([t])
      anchorPx = px
    } else {
      groups[groups.length - 1].push(t)
    }
  }

  // Pass 2 — mean-centred placement with left→right de-overlap.
  const clusters: Cluster[] = []
  let prevPos = -Infinity
  for (const members of groups) {
    const times = members.map((m) => m.first_frame / encFps)
    const centerTime = times.reduce((s, x) => s + x, 0) / times.length
    let posPx = centerTime * pxPerSec
    const minPos = prevPos + minSpacing
    if (posPx < minPos) posPx = minPos
    prevPos = posPx

    const perClass: Record<string, number> = {}
    for (const m of members) perClass[m.class] = (perClass[m.class] ?? 0) + 1

    clusters.push({
      id: `c:${members[0].track_id}`,
      centerTime,
      posPx,
      count: members.length,
      members,
      perClass,
      dominantClass: dominantOf(perClass),
      isSingleton: members.length === 1,
      startTime: times[0],
      endTime: times[times.length - 1],
    })
  }
  return clusters
}

/** Per-track nearest-neighbour gap in seconds (over the sorted timeline). */
export function nearestNeighbourGaps(sortedTracks: Track[], encFps: number): number[] {
  const t = sortedTracks.map((x) => x.first_frame / encFps)
  const n = t.length
  return t.map((_, i) => {
    const left = i > 0 ? t[i] - t[i - 1] : Infinity
    const right = i < n - 1 ? t[i + 1] - t[i] : Infinity
    return Math.min(left, right)
  })
}

/** Scale (pxPerSec) at which a track of the given neighbour gap becomes a singleton. */
export function snapZoomScale(
  gapSeconds: number,
  cardWidthPx: number,
  gapPx: number,
  minScale: number,
  maxScale: number,
): number {
  const EPS = 1e-3
  const pps = (cardWidthPx + gapPx) / Math.max(gapSeconds, EPS)
  return Math.min(maxScale, Math.max(minScale, pps))
}
