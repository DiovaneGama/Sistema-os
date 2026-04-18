import type { OrderStatus } from '../../../types/database'
import { STATUS_LABELS, STATUS_COLORS } from '../utils/statusConfig'

interface Props {
  status: OrderStatus
  size?: 'sm' | 'md'
}

export function StatusBadge({ status, size = 'md' }: Props) {
  const { bg, text, border } = STATUS_COLORS[status]
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
  return (
    <span className={`inline-flex items-center rounded-full border font-medium ${bg} ${text} ${border} ${sizeClass}`}>
      {STATUS_LABELS[status]}
    </span>
  )
}
