import { useSettingsStore } from '../../state/settingsStore'

// Overlay display toggles: bounding boxes · masks · confidence labels.
export function OverlayToggles() {
  const showBoxes = useSettingsStore((s) => s.showBoxes)
  const showMasks = useSettingsStore((s) => s.showMasks)
  const showConfidence = useSettingsStore((s) => s.showConfidence)
  const setShowBoxes = useSettingsStore((s) => s.setShowBoxes)
  const setShowMasks = useSettingsStore((s) => s.setShowMasks)
  const setShowConfidence = useSettingsStore((s) => s.setShowConfidence)

  return (
    <div className="toolbar-group toggles">
      <label>
        <input type="checkbox" checked={showBoxes} onChange={(e) => setShowBoxes(e.target.checked)} />
        Boxes
      </label>
      <label>
        <input type="checkbox" checked={showMasks} onChange={(e) => setShowMasks(e.target.checked)} />
        Masks
      </label>
      <label>
        <input
          type="checkbox"
          checked={showConfidence}
          onChange={(e) => setShowConfidence(e.target.checked)}
        />
        Conf
      </label>
    </div>
  )
}
