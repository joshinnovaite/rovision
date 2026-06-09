import { Outlet } from 'react-router-dom'
import { Sidebar } from './sidebar/Sidebar'

// Layout shell: persistent left sidebar + routed main panel.
export function AppShell() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'var(--sidebar-w) 1fr', height: '100%' }}>
      <div style={{ borderRight: '1px solid var(--border)', background: 'var(--surface)' }}>
        <Sidebar />
      </div>
      <main style={{ overflow: 'auto' }}>
        <Outlet />
      </main>
    </div>
  )
}
