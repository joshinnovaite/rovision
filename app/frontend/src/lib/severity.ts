// Flag qualification + severity — the TS mirror of the backend's rollup.py.
// Runs live so omitted-classes / asset filters apply without a refetch.
import type { AppConfig, Severity, Track } from '../types'

const SEVERITY_RANK: Record<Severity, number> = { none: 0, low: 1, medium: 2, high: 3 }

export function isFlag(t: Track, cfg: AppConfig): boolean {
  if (!cfg.defect_classes.includes(t.class)) return false
  const peakArea = t.peak_area_px ?? 0
  return t.n_frames >= cfg.flag_min_n_frames || peakArea >= cfg.flag_min_peak_area
}

export function peakCoverage(t: Track, frameArea: number): number {
  const peakArea = t.peak_area_px ?? 0
  return frameArea > 0 ? peakArea / frameArea : 0
}

export function severityForCount(count: number, hasBig: boolean, cfg: AppConfig): Severity {
  if (count <= 0) return 'none'
  let tier: Severity =
    count >= cfg.sev_high_count ? 'high' : count >= cfg.sev_medium_count ? 'medium' : 'low'
  if (hasBig) tier = ({ low: 'medium', medium: 'high', high: 'high' } as const)[tier]
  return tier
}

export interface ClassRollup {
  className: string
  count: number
  severity: Severity
  instances: Track[]
  peakCoverage: number
}

export interface FlagSummary {
  flags: Track[]
  byClass: ClassRollup[] // defect classes only, sorted by severity desc then count
  totalFlags: number
  maxSeverity: Severity
  classesPresent: string[] // all classes (defect + artefact) seen, after omit filter
}

export interface ClassCount {
  className: string
  count: number
}

/** Per-class instance counts (inventory mode), excluding omitted classes,
 * sorted by count desc. Used where there are no flags/severity to roll up. */
export function computeClassCounts(
  tracks: Track[],
  omitted: Set<string> = new Set(),
): ClassCount[] {
  const counts = new Map<string, number>()
  for (const t of tracks) {
    if (omitted.has(t.class)) continue
    counts.set(t.class, (counts.get(t.class) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([className, count]) => ({ className, count }))
    .sort((a, b) => b.count - a.count)
}

/** Compute the live flag summary, excluding omitted classes. */
export function computeFlagSummary(
  tracks: Track[],
  cfg: AppConfig,
  frameArea: number,
  omitted: Set<string> = new Set(),
): FlagSummary {
  const kept = tracks.filter((t) => !omitted.has(t.class))
  const flags = kept.filter((t) => isFlag(t, cfg))

  const groups = new Map<string, Track[]>()
  for (const t of flags) {
    const g = groups.get(t.class) ?? []
    g.push(t)
    groups.set(t.class, g)
  }

  const byClass: ClassRollup[] = []
  let maxRank = 0
  let maxSeverity: Severity = 'none'
  for (const [className, instances] of groups) {
    const cov = Math.max(...instances.map((t) => peakCoverage(t, frameArea)))
    const hasBig = cov >= cfg.sev_coverage_bump
    const severity = severityForCount(instances.length, hasBig, cfg)
    byClass.push({ className, count: instances.length, severity, instances, peakCoverage: cov })
    if (SEVERITY_RANK[severity] > maxRank) {
      maxRank = SEVERITY_RANK[severity]
      maxSeverity = severity
    }
  }
  byClass.sort(
    (a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity] || b.count - a.count,
  )

  return {
    flags,
    byClass,
    totalFlags: flags.length,
    maxSeverity,
    classesPresent: [...new Set(kept.map((t) => t.class))],
  }
}
