// Typed client for the FastAPI backend (proxied at /api by Vite in dev).
import type {
  AppConfig,
  Detection,
  DomainInfo,
  OrbaResult,
  Track,
  UploadResult,
  VideoMeta,
  VideoSummary,
} from '../types'
import type { WorkOrder } from './workorders'

const BASE = '/api'

async function getJSON<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${url}`)
  return res.json() as Promise<T>
}

export const api = {
  domains: () => getJSON<DomainInfo[]>(`${BASE}/domains`),
  config: (domain?: string) =>
    getJSON<AppConfig>(domain ? `${BASE}/config?domain=${domain}` : `${BASE}/config`),
  videos: (domain?: string) =>
    getJSON<VideoSummary[]>(domain ? `${BASE}/videos?domain=${domain}` : `${BASE}/videos`),
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

  /** File the current video's findings to Orba as Service Requests (one per
   * finding). The backend holds the Orba URL/secret/assetnum; we just send the
   * findings. Throws on a misconfigured/unreachable backend (e.g. 503). */
  async sendToOrba(body: { findings: WorkOrder[]; videoId?: string }): Promise<OrbaResult[]> {
    const res = await fetch(`${BASE}/orba/service-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      let detail = `${res.status} ${res.statusText}`
      try {
        const j = await res.json()
        if (j?.detail) detail = j.detail
      } catch {
        /* non-JSON error body */
      }
      throw new Error(detail)
    }
    const json = (await res.json()) as { results: OrbaResult[] }
    return json.results
  },
}
