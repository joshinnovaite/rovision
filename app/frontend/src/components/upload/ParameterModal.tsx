import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { api } from '../../lib/api'
import { assetKeys, assetConfig } from '../../lib/assets'
import { prettyClass } from '../../lib/format'
import { useVideoStore } from '../../state/videoStore'
import { useSettingsStore } from '../../state/settingsStore'
import type { Asset } from '../../types'

// Parameters are display-only (they re-filter / down-sample the baked data); the
// cache key is the file hash alone. On a cache hit we apply them and open the dashboard.
export function ParameterModal({ file, onCancel }: { file: File; onCancel: () => void }) {
  const navigate = useNavigate()
  const config = useVideoStore((s) => s.config)
  const loadConfig = useVideoStore((s) => s.loadConfig)
  const load = useVideoStore((s) => s.load)
  const settings = useSettingsStore()

  const [detectorEveryN, setDetectorEveryN] = useState(1)
  const [refineEveryN, setRefineEveryN] = useState(10)
  const [asset, setAsset] = useState<Asset>('generic')
  const [omitted, setOmitted] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  const classes = config?.all_classes ?? []

  function toggle(c: string) {
    const next = new Set(omitted)
    if (next.has(c)) next.delete(c)
    else next.add(c)
    setOmitted(next)
  }

  async function submit() {
    setBusy(true)
    setError(null)
    try {
      const res = await api.upload(file)
      if (res.status === 'hit' && res.video) {
        // apply the chosen view settings, then hydrate + open the dashboard
        settings.setDetectorEveryN(detectorEveryN)
        settings.setRefineEveryN(refineEveryN)
        settings.setAsset(asset)
        settings.setOmitted(omitted)
        await load(res.hash)
        navigate(`/v/${res.hash}/dashboard`)
      } else {
        setError(
          res.detail ??
            'No cached results for this video. Process it offline (Colab §17) first, then re-upload.',
        )
      }
    } catch (e) {
      setError(String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={busy ? undefined : onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Processing parameters</h2>
        <div className="sub" style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-5)' }}>
          {file.name}
        </div>

        <div className="field">
          <label>
            Detector frequency <span className="hint">— show a detection every N frames</span>
          </label>
          <input
            type="range"
            min={1}
            max={30}
            value={detectorEveryN}
            onChange={(e) => setDetectorEveryN(Number(e.target.value))}
          />
          <div className="tnum hint">every {detectorEveryN} frame{detectorEveryN > 1 ? 's' : ''}</div>
        </div>

        <div className="field">
          <label>
            SAM 2 segmentation frequency <span className="hint">— refine a mask every N frames</span>
          </label>
          <input
            type="range"
            min={10}
            max={60}
            step={5}
            value={refineEveryN}
            onChange={(e) => setRefineEveryN(Number(e.target.value))}
          />
          <div className="tnum hint">every {refineEveryN} frames</div>
        </div>

        <div className="field">
          <label>Asset</label>
          <select value={asset} onChange={(e) => setAsset(e.target.value as Asset)}>
            {assetKeys().map((a) => (
              <option key={a} value={a}>
                {assetConfig(a)?.label ?? a}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>
            Omitted classes <span className="hint">— click to exclude from flags</span>
          </label>
          <div className="chips">
            {classes.map((c) => (
              <span
                key={c}
                className={`chip ${omitted.has(c) ? 'off' : 'on'}`}
                onClick={() => toggle(c)}
              >
                {prettyClass(c)}
              </span>
            ))}
          </div>
        </div>

        {error && <div style={{ color: 'var(--sev-high)', fontSize: 'var(--fs-sm)' }}>{error}</div>}

        <div className="modal-actions">
          <button className="btn" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={submit} disabled={busy}>
            {busy ? <Loader2 size={16} className="spin" /> : null}
            {busy ? 'Processing…' : 'Process'}
          </button>
        </div>
      </div>
    </div>
  )
}
