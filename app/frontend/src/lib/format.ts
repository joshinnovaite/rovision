// Small display helpers.

/** snake_case class name -> "Title Case". */
export function prettyClass(c: string): string {
  return c.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase())
}

/** seconds -> "m:ss". */
export function fmtDuration(s: number): string {
  const m = Math.floor(s / 60)
  const sec = Math.round(s % 60)
  return `${m}:${String(sec).padStart(2, '0')}`
}

/** seconds (from a frame) -> "m:ss". */
export function frameToTime(frame: number, encFps: number): string {
  return fmtDuration(encFps > 0 ? frame / encFps : 0)
}
