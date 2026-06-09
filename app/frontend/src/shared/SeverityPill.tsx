import type { Severity } from '../types'

export function SeverityPill({ severity }: { severity: Severity }) {
  return <span className={`sev sev-${severity}`}>{severity}</span>
}
