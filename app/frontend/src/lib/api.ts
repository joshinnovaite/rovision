// Typed client for the FastAPI backend (proxied at /api by Vite in dev).
import type {
  AppConfig,
  Detection,
  Track,
  UploadResult,
  VideoMeta,
  VideoSummary,
} from '../types'

const BASE = '/api'

async function getJSON<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${url}`)
  return res.json() as Promise<T>
}

export const api = {
  config: () => getJSON<AppConfig>(`${BASE}/config`),
  videos: () => getJSON<VideoSummary[]>(`${BASE}/videos`),
  video: (hash: string) => getJSON<VideoMeta>(`${BASE}/videos/${hash}`),
  tracks: (hash: string) => getJSON<Track[]>(`${BASE}/videos/${hash}/tracks`),
  detections: (hash: string) => getJSON<Detection[]>(`${BASE}/videos/${hash}/detections`),

  /** Clip URL for a <video src>. Browser issues range requests against this. */
  clipUrl: (hash: string, variant: 'raw' | 'overlay' = 'raw') =>
    `${BASE}/videos/${hash}/clip?variant=${variant}`,

  async upload(file: File): Promise<UploadResult> {
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch(`${BASE}/upload`, { method: 'POST', body: fd })
    return res.json() as Promise<UploadResult>
  },
}
