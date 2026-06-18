import type { Scene } from '../types'

// Human labels for the segment-then-measure scene states (DR-017). Water is an
// honest binary (calm / wake-wash) off the reliable specular signal; the 3-level
// chop scale awaits better region selection (roughness is scene-contaminated).
const SKY_LABEL: Record<string, string> = {
  clear: '☀ Clear sky',
  overcast: '☁ Overcast',
  no_sky: '⛰ No open sky',
}
const WATER_LABEL: Record<string, string> = {
  calm: '🌊 Calm water',
  'wake-wash': '💨 Wake-wash',
}

export function SceneBadge({ scene }: { scene: Scene }) {
  const title = scene.metrics
    ? Object.entries(scene.metrics)
        .map(([k, v]) => `${k}=${v}`)
        .join('  ')
    : scene.method
  return (
    <span className="scene-badges" title={title}>
      <span className={`scene-chip sky-${scene.sky_state}`}>
        {SKY_LABEL[scene.sky_state] ?? scene.sky_state}
      </span>
      <span className={`scene-chip water-${scene.water_state}`}>
        {WATER_LABEL[scene.water_state] ?? scene.water_state}
      </span>
    </span>
  )
}
