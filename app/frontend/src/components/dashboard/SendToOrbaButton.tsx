import { useEffect, useState } from 'react'
import { Send, Check, AlertTriangle } from 'lucide-react'
import type { WorkOrder } from '../../lib/workorders'
import type { OrbaResult } from '../../types'
import { api } from '../../lib/api'

// The deliberate "push these into the CMMS" demo moment. Files the current video's
// findings to Orba as Service Requests (one per finding, severity 'none' skipped by
// the backend). Disabled after a successful send for this video so re-running the
// dashboard (findings recompute live) can't file duplicate SRs.
type State = 'idle' | 'sending' | 'sent' | 'error'

export function SendToOrbaButton({
  orders,
  videoId,
  hash,
}: {
  orders: WorkOrder[]
  videoId?: string
  hash: string
}) {
  const [state, setState] = useState<State>('idle')
  const [results, setResults] = useState<OrbaResult[]>([])
  const [error, setError] = useState<string>('')

  // Reset when the video changes — "already sent" is per-video.
  useEffect(() => {
    setState('idle')
    setResults([])
    setError('')
  }, [hash])

  const fileable = orders.filter((o) => o.severity !== 'none').length

  async function send() {
    setState('sending')
    setError('')
    try {
      const res = await api.sendToOrba({ findings: orders, videoId })
      setResults(res)
      const failed = res.filter((r) => !r.ok)
      setState(failed.length ? 'error' : 'sent')
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setState('error')
    }
  }

  const filed = results.filter((r) => r.ok && r.srticknum)
  const failed = results.filter((r) => !r.ok)

  return (
    <div className="orba-bar">
      <button
        className="btn btn-primary"
        onClick={send}
        disabled={state === 'sending' || state === 'sent' || fileable === 0}
      >
        {state === 'sent' ? <Check size={14} /> : <Send size={14} />}
        {state === 'sending'
          ? 'Sending…'
          : state === 'sent'
            ? 'Sent to Orba'
            : `Send to Orba (${fileable})`}
      </button>

      {state === 'sent' && (
        <span className="orba-status ok">
          Filed {filed.length} service request{filed.length === 1 ? '' : 's'}
          {filed.length ? `: ${filed.map((r) => r.srticknum).join(', ')}` : ''}
        </span>
      )}

      {state === 'error' && (
        <span className="orba-status err">
          <AlertTriangle size={13} style={{ verticalAlign: '-2px', marginRight: 4 }} />
          {error ||
            (failed.length
              ? `${failed.length} failed: ${failed
                  .map((r) => `${r.className} (${r.error ?? r.status})`)
                  .join('; ')}`
              : 'Send failed')}
        </span>
      )}
    </div>
  )
}
