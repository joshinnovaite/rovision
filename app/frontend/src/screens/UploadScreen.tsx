import { useRef, useState } from 'react'
import { UploadCloud } from 'lucide-react'
import { ParameterModal } from '../components/upload/ParameterModal'

// Drop a video -> parameter modal -> (cache hit) hydrate + go to dashboard.
export function UploadScreen() {
  const [file, setFile] = useState<File | null>(null)
  const [drag, setDrag] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function pick(f: File | null | undefined) {
    if (f) setFile(f)
  }

  return (
    <div className="screen">
      <div className="screen-head">
        <h1>Upload footage</h1>
        <div className="sub">
          Drop a subsea inspection clip to explore its detected defects. Processing is pre-computed —
          a previously processed clip loads instantly from cache.
        </div>
      </div>

      <div
        className={`dropzone ${drag ? 'drag' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDrag(true)
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDrag(false)
          pick(e.dataTransfer.files?.[0])
        }}
      >
        <UploadCloud size={40} style={{ color: 'var(--primary)' }} />
        <div style={{ marginTop: 12, fontWeight: 600, color: 'var(--text)' }}>
          Drop a video here, or click to choose
        </div>
        <div style={{ marginTop: 4, fontSize: 'var(--fs-sm)' }}>MP4 / MOV</div>
        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          style={{ display: 'none' }}
          onChange={(e) => pick(e.target.files?.[0])}
        />
      </div>

      {file && <ParameterModal file={file} onCancel={() => setFile(null)} />}
    </div>
  )
}
