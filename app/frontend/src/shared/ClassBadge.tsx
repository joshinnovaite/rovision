import { prettyClass } from '../lib/format'

export function ClassBadge({
  className,
  isDefect,
  dimmed,
}: {
  className: string
  isDefect?: boolean
  dimmed?: boolean
}) {
  return (
    <span className={`cbadge ${isDefect ? 'defect' : ''} ${dimmed ? 'dimmed' : ''}`}>
      {prettyClass(className)}
    </span>
  )
}
