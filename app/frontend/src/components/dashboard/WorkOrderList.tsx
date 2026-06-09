import type { WorkOrder } from '../../lib/workorders'
import { WorkOrderRow } from './WorkOrderRow'

// Full-width list (the deliberate exception to the equal-card grid).
export function WorkOrderList({ orders, hash }: { orders: WorkOrder[]; hash: string }) {
  if (orders.length === 0) {
    return <div className="card">No defect work orders for the current filters.</div>
  }
  return (
    <div className="wo-list">
      {orders.map((o) => (
        <WorkOrderRow key={o.className} order={o} hash={hash} />
      ))}
    </div>
  )
}
