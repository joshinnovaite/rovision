// Auto-generated work orders from the flag rollup. One order per defect class
// present, severity carried from the class rollup, sorted high→low.
import type { Severity, Track } from '../types'
import type { ClassRollup } from './severity'

export const ACTION_TEXT: Record<string, string> = {
  corrosion: 'Remove corrosion / surface treatment',
  coating_breakdown: 'Repair / recoat affected area',
  surface_deposit: 'Clean surface deposits / sediment removal',
  marine_growth: 'Biofouling removal (cleaning campaign)',
  trash_rack_blockage: 'Clear blockage / debris removal',
  seal_joint_degradation: 'Inspect & reseal / replace joint',
  dropped_object: 'Investigate & remove foreign object',
}

export interface WorkOrder {
  className: string
  action: string
  severity: Severity
  count: number
  instances: Track[]
  peakCoverage: number
}

const RANK: Record<Severity, number> = { none: 0, low: 1, medium: 2, high: 3 }

export function generateWorkOrders(byClass: ClassRollup[]): WorkOrder[] {
  return byClass
    .filter((c) => c.count > 0 && c.className in ACTION_TEXT)
    .map((c) => ({
      className: c.className,
      action: ACTION_TEXT[c.className] ?? `Inspect ${c.className}`,
      severity: c.severity,
      count: c.count,
      instances: c.instances,
      peakCoverage: c.peakCoverage,
    }))
    .sort((a, b) => RANK[b.severity] - RANK[a.severity] || b.count - a.count)
}
