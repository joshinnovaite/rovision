// Stable colour per class for the overlay (mask fill + box stroke) and timeline dots.
const COLORS: Record<string, string> = {
  // defects
  corrosion: '#e5733a',
  coating_breakdown: '#d4a017',
  surface_deposit: '#a07e4b',
  marine_growth: '#2e9e5b',
  trash_rack_blockage: '#c0392b',
  seal_joint_degradation: '#8e44ad',
  dropped_object: '#e74c3c',
  // artefacts (cooler / muted)
  pipework: '#5d6d7e',
  ladder: '#7f8c8d',
  outlet_inlet: '#34708a',
  valve_mixer: '#16a085',
  fish: '#2980b9',
  coral: '#c2569b',
  seagrass: '#27ae60',
  rov_manipulator: '#95a5a6',
}

export function classColor(className: string): string {
  return COLORS[className] ?? '#0e9aa7'
}

// Designated selection highlight — a hot magenta absent from the natural class
// palette and the teal UI accent, so a selected box/mask is unmistakable against
// underwater footage. Keep in sync with --select in tokens.css.
export const SELECT_COLOR = '#ff2d9b'
