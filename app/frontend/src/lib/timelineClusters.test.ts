// Run: node app/frontend/src/lib/timelineClusters.test.ts   (Node 24 strips types)
import assert from 'node:assert'
import {
  CARD_W,
  GAP,
  computeClusters,
  nearestNeighbourGaps,
  snapZoomScale,
  sortTracksByFirstFrame,
} from './timelineClusters.ts'
import type { Track } from '../types'

function mk(id: number, frame: number, cls = 'corrosion'): Track {
  return {
    track_id: id,
    class: cls,
    first_frame: frame,
    last_frame: frame + 30,
    n_frames: 30,
    peak_conf: 0.9,
    peak_area_px: 1000,
  }
}

const encFps = 30
// mix of tight clusters and spread-out singletons (frames)
const frames = [
  10, 12, 14, 16, // tight cluster
  300, 305, // pair
  900, // lone
  1500, 1502, 1504, 1506, 1508, 1510, // dense burst
  2600, 4000, 5200, // spread singletons
]
const tracks = sortTracksByFirstFrame(frames.map((f, i) => mk(i + 1, f, i % 3 ? 'corrosion' : 'marine_growth')))

// 1. determinism
const a = computeClusters({ tracks, encFps, pxPerSec: 50, cardWidthPx: CARD_W, gapPx: GAP })
const b = computeClusters({ tracks, encFps, pxPerSec: 50, cardWidthPx: CARD_W, gapPx: GAP })
assert.deepStrictEqual(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b)), 'deterministic')

// 2. non-overlap + member conservation across a scale sweep
const scales = [5, 12, 30, 80, 200, 600, 2000]
for (const s of scales) {
  const cs = computeClusters({ tracks, encFps, pxPerSec: s, cardWidthPx: CARD_W, gapPx: GAP })
  for (let i = 1; i < cs.length; i++) {
    assert.ok(
      cs[i].posPx >= cs[i - 1].posPx + CARD_W + GAP - 1e-6,
      `non-overlap @scale=${s} between #${i - 1} and #${i}`,
    )
  }
  const total = cs.reduce((n, c) => n + c.count, 0)
  assert.strictEqual(total, tracks.length, `members conserved @scale=${s}`)
}

// 3. singleton count is monotonic non-decreasing as scale rises (pop-out, no merge-back)
let prevSingletons = -1
for (const s of scales) {
  const cs = computeClusters({ tracks, encFps, pxPerSec: s, cardWidthPx: CARD_W, gapPx: GAP })
  const singles = cs.filter((c) => c.isSingleton).length
  assert.ok(singles >= prevSingletons, `singletons monotonic @scale=${s} (${singles} >= ${prevSingletons})`)
  prevSingletons = singles
}

// 4. snap-zoom clamps
const gaps = nearestNeighbourGaps(tracks, encFps)
assert.ok(gaps.length === tracks.length, 'gaps length')
assert.strictEqual(snapZoomScale(0, CARD_W, GAP, 10, 500), 500, 'tiny gap -> clamp to maxScale')
assert.strictEqual(snapZoomScale(1000, CARD_W, GAP, 10, 500), 10, 'huge gap -> clamp to minScale')

console.log(`OK — ${tracks.length} tracks; clusters@50px/s=${a.length}; all assertions passed`)
