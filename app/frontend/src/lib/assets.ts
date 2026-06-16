// Asset → priority-class configuration. Drives the playback Asset dropdown:
// prioritise/filter cards, auto-jump to the top-priority class, and dim
// off-asset classes. The map is domain-scoped and comes from the backend registry
// (GET /api/config -> AppConfig.assets); `setAssetConfig` is called whenever the
// active domain's config loads.
import type { AssetConfig } from '../types'

let ASSET_MAP: Record<string, AssetConfig> = {}

export function setAssetConfig(assets: Record<string, AssetConfig>): void {
  ASSET_MAP = assets ?? {}
}

/** The asset-lens config for `asset`, or undefined if unknown. */
export function assetConfig(asset: string): AssetConfig | undefined {
  return ASSET_MAP[asset]
}

/** Asset keys for the current domain (drives the dropdown options). */
export function assetKeys(): string[] {
  return Object.keys(ASSET_MAP)
}

/** True if a class should be emphasised for the asset (empty/unknown = all). */
export function isRelevantForAsset(asset: string, className: string): boolean {
  const rc = ASSET_MAP[asset]?.relevantClasses
  return !rc || rc.length === 0 || rc.includes(className)
}
