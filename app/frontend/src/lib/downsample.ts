// Display-only down-sampling for the frequency sliders. We can show FEWER baked
// detections, never more — so these just re-quantize the already-baked cadence.

/** Detector: show a box only on frames that are multiples of detectorEveryN. */
export function keepDetectorFrame(frame: number, detectorEveryN: number): boolean {
  return detectorEveryN <= 1 || frame % detectorEveryN === 0
}

/**
 * SAM 2 refine: the native cadence is `refineEvery` (e.g. 10). A slider value of
 * `refineEveryN` keeps a refine frame only if its refine-index is a multiple of
 * the (rounded-up) factor; dropped refines simply let the held mask persist longer.
 */
export function keepRefineFrame(frame: number, refineEvery: number, refineEveryN: number): boolean {
  if (refineEveryN <= refineEvery) return true
  const factor = Math.max(1, Math.round(refineEveryN / refineEvery))
  const refineIndex = Math.round(frame / refineEvery)
  return refineIndex % factor === 0
}
