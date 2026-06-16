import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  ChevronDown,
  ChevronRight,
  Film,
  LayoutDashboard,
  PlaySquare,
  Upload,
} from 'lucide-react'
import { useVideoStore } from '../../state/videoStore'

// Persistent left rail, two states:
//   (a) no video loaded  -> New upload + Video library
//   (b) video loaded     -> New upload + section nav (Dashboard/Playback) + Video library
// A domain toggle at the top scopes the whole rail (taxonomy + library) to one domain.
export function Sidebar() {
  const navigate = useNavigate()
  const hash = useVideoStore((s) => s.hash)
  const meta = useVideoStore((s) => s.meta)
  const library = useVideoStore((s) => s.library)
  const config = useVideoStore((s) => s.config)
  const domain = useVideoStore((s) => s.domain)
  const domains = useVideoStore((s) => s.domains)
  const loadDomains = useVideoStore((s) => s.loadDomains)
  const loadConfig = useVideoStore((s) => s.loadConfig)
  const setDomain = useVideoStore((s) => s.setDomain)
  const loadLibrary = useVideoStore((s) => s.loadLibrary)
  const load = useVideoStore((s) => s.load)
  const [libOpen, setLibOpen] = useState(false)

  useEffect(() => {
    loadDomains()
    loadConfig()
    loadLibrary()
  }, [loadDomains, loadConfig, loadLibrary])

  const hasVideo = !!meta
  const inventory = config?.mode === 'inventory'

  async function openVideo(h: string) {
    await load(h)
    navigate(`/v/${h}/dashboard`)
  }

  async function onChangeDomain(d: string) {
    if (d === domain) return
    await setDomain(d) // clears the loaded video + refetches config/library
    navigate('/upload')
  }

  return (
    <aside className="sidebar">
      <div className="brand">Rovision</div>

      {domains.length > 1 && (
        <div className="domain-toggle" role="group" aria-label="Domain">
          {domains.map((d) => (
            <button
              key={d.key}
              className={`domain-btn ${d.key === domain ? 'active' : ''}`}
              onClick={() => onChangeDomain(d.key)}
              title={d.label}
            >
              {d.label}
            </button>
          ))}
        </div>
      )}

      <NavLink to="/upload" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <Upload size={18} /> New upload
      </NavLink>

      {hasVideo && (
        <>
          <div className="nav-label" title={meta!.source_video}>
            {meta!.source_video}
          </div>
          <NavLink
            to={`/v/${hash}/dashboard`}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <LayoutDashboard size={18} /> Dashboard
          </NavLink>
          <NavLink
            to={`/v/${hash}/playback`}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <PlaySquare size={18} /> Playback
          </NavLink>
        </>
      )}

      <div style={{ marginTop: 'auto' }}>
        <button className="nav-item" style={{ width: '100%' }} onClick={() => setLibOpen((o) => !o)}>
          <Film size={18} />
          <span style={{ flex: 1 }}>Video library</span>
          {libOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
        {libOpen && (
          <div style={{ paddingLeft: 6 }}>
            {library.length === 0 && (
              <div className="lib-item" style={{ color: 'var(--text-faint)', cursor: 'default' }}>
                No videos yet
              </div>
            )}
            {library.map((v) => (
              <div
                key={v.hash}
                className={`lib-item ${v.hash === hash ? 'active' : ''}`}
                onClick={() => openVideo(v.hash)}
              >
                <div style={{ fontWeight: 600, fontSize: 'var(--fs-sm)' }}>{v.source_video}</div>
                {!inventory && (
                  <div className="tnum" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
                    {v.flag_count} flags · {v.max_severity}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  )
}
