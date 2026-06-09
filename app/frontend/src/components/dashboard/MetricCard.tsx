import type { ReactNode } from 'react'

export function MetricCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: ReactNode
  label: string
  value: ReactNode
  sub?: ReactNode
}) {
  return (
    <div className="card metric">
      <div className="label">
        {icon} {label}
      </div>
      <div className="value tnum">{value}</div>
      {sub && <div className="sub">{sub}</div>}
    </div>
  )
}
