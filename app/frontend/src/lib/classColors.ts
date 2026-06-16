// Stable colour per class for the overlay (mask fill + box stroke) and timeline dots.
// The palette is domain-scoped and comes from the backend registry (GET /api/config
// -> AppConfig.colors); `setClassColors` is called whenever the active domain's
// config loads, so call sites keep using the plain `classColor(name)` lookup.
let COLORS: Record<string, string> = {}

export function setClassColors(colors: Record<string, string>): void {
  COLORS = colors ?? {}
}

export function classColor(className: string): string {
  return COLORS[className] ?? '#0e9aa7'
}

// Designated selection highlight — a hot magenta absent from the natural class
// palette and the teal UI accent, so a selected box/mask is unmistakable against
// underwater footage. Keep in sync with --select in tokens.css.
export const SELECT_COLOR = '#ff2d9b'
