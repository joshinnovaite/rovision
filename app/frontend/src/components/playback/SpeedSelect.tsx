import { usePlaybackStore } from '../../state/playbackStore'

const SPEEDS = [0.5, 1, 1.5, 2]

export function SpeedSelect() {
  const rate = usePlaybackStore((s) => s.playbackRate)
  const setRate = usePlaybackStore((s) => s.setPlaybackRate)
  return (
    <div className="toolbar-group">
      <label>Speed</label>
      <select value={rate} onChange={(e) => setRate(Number(e.target.value))}>
        {SPEEDS.map((s) => (
          <option key={s} value={s}>
            {s}×
          </option>
        ))}
      </select>
    </div>
  )
}
