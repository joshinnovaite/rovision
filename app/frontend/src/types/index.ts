// Shared types — mirror the backend contract (see app/backend) and the §17 bundle.

export type Severity = 'none' | 'low' | 'medium' | 'high'

export type Asset =
  | 'gold_coast_desal'
  | 'hinze'
  | 'little_nerang'
  | 'north_pine'
  | 'wivenhoe'
  | 'somerset'
  | 'generic'

/** A normalized polygon ring: [[x,y], …] with x,y in 0..1 of frame width/height. */
export type Polygon = number[][]

/** One row of GET /api/videos (library tile) and the base of VideoMeta. */
export interface VideoSummary {
  hash: string
  source_video: string
  asset: string | null
  fps: number
  enc_fps: number
  width: number
  height: number
  n_frames: number
  start_frame: number
  refine_every: number
  duration_sec: number
  flag_count: number
  max_severity: Severity
  bundle_dir: string
  processed_at: string
}

/** GET /api/videos/{hash} — summary plus the class list. */
export interface VideoMeta extends VideoSummary {
  classes: string[]
}

/** One tracked instance (GET /api/videos/{hash}/tracks). The flag/card unit. */
export interface Track {
  track_id: number
  class: string
  first_frame: number
  last_frame: number
  n_frames: number
  peak_conf: number
  peak_area_px: number | null
}

/** One per-frame detection (GET /api/videos/{hash}/detections). */
export interface Detection {
  frame: number // clip-local, 0-based
  track_id: number
  class: string
  confidence: number
  bbox: [number, number, number, number] // x0,y0,x1,y1 in source pixels
  area_px?: number // refine frames only
  coverage_frac?: number // refine frames only
  polygons?: Polygon[] // refine frames only
}

/** GET /api/config — flag/severity thresholds shared with the backend rollup. */
export interface AppConfig {
  defect_classes: string[]
  all_classes: string[]
  flag_min_n_frames: number
  flag_min_peak_area: number
  sev_medium_count: number
  sev_high_count: number
  sev_coverage_bump: number
}

export interface UploadResult {
  status: 'hit' | 'miss'
  hash: string
  video?: VideoSummary
  detail?: string
}
