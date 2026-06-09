import { WorkOrderChips } from './WorkOrderChips'
import { AssetDropdown } from './AssetDropdown'
import { SpeedSelect } from './SpeedSelect'
import { OverlayToggles } from './OverlayToggles'

// Control strip between the video and the playback bar.
export function PlaybackToolbar() {
  return (
    <div className="toolbar">
      <WorkOrderChips />
      <div className="grow" />
      <OverlayToggles />
      <AssetDropdown />
      <SpeedSelect />
    </div>
  )
}
