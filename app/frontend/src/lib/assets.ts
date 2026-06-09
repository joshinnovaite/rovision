// Asset → priority-class configuration. Drives the playback Asset dropdown:
// prioritise/filter cards, auto-jump to the top-priority class, and dim
// off-asset classes. (concrete cracking/spalling is intentionally absent — no class.)
import type { Asset } from '../types'

export interface AssetConfig {
  label: string
  /** Classes considered relevant for this asset (others get dimmed). */
  relevantClasses: string[]
  /** Auto-jump target on selection; null = "most prominent defect". */
  topPriority: string | null
}

export const ASSET_CONFIG: Record<Asset, AssetConfig> = {
  gold_coast_desal: {
    label: 'Gold Coast Desalination',
    relevantClasses: [
      'marine_growth', 'trash_rack_blockage', 'surface_deposit',
      'corrosion', 'coating_breakdown', 'dropped_object',
    ],
    topPriority: 'marine_growth',
  },
  hinze: {
    label: 'Hinze Dam',
    relevantClasses: [
      'corrosion', 'coating_breakdown', 'trash_rack_blockage',
      'seal_joint_degradation', 'surface_deposit',
    ],
    topPriority: 'corrosion',
  },
  little_nerang: {
    label: 'Little Nerang Dam',
    relevantClasses: ['trash_rack_blockage', 'surface_deposit', 'marine_growth', 'corrosion'],
    topPriority: 'trash_rack_blockage',
  },
  north_pine: {
    label: 'North Pine Dam',
    relevantClasses: ['trash_rack_blockage', 'corrosion', 'coating_breakdown'],
    topPriority: 'trash_rack_blockage',
  },
  wivenhoe: {
    label: 'Wivenhoe Dam',
    relevantClasses: ['dropped_object', 'surface_deposit', 'corrosion', 'seal_joint_degradation'],
    topPriority: 'dropped_object',
  },
  somerset: {
    label: 'Somerset Dam',
    relevantClasses: ['corrosion', 'surface_deposit', 'marine_growth'],
    topPriority: 'corrosion',
  },
  generic: {
    label: 'Generic / unspecified',
    relevantClasses: [], // empty = all defects relevant
    topPriority: null, // most prominent defect
  },
}

export const ASSETS = Object.keys(ASSET_CONFIG) as Asset[]

/** True if a class should be emphasised for the asset (empty relevant = all). */
export function isRelevantForAsset(asset: Asset, className: string): boolean {
  const rc = ASSET_CONFIG[asset].relevantClasses
  return rc.length === 0 || rc.includes(className)
}
