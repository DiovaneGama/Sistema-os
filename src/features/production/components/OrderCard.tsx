import { GripVertical, AlertTriangle, RefreshCw, ArrowRight, User, Cpu } from 'lucide-react'
import type { ProductionOrder } from '../hooks/useProductionOrders'
import type { UserRole } from '../../../types/database'
import { StatusBadge } from './StatusBadge'
import { TimerBadge } from './TimerBadge'
import { getNextStatusLabel, getStatusTimestamp } from '../utils/statusConfig'

interface Props {
  order: ProductionOrder
  role: UserRole
  onAdvance: (orderId: string) => void
  isDragging?: boolean
  dragHandleProps?: Record<string, unknown>
}

export function OrderCard({ order, role, onAdvance, isDragging, dragHandleProps }: Props) {
  const nextLabel   = getNextStatusLabel(order.status, role)
  const tsForTimer  = getStatusTimestamp(order)
  const isPaused    = order.status === 'pausado'

  return (
    <div
      className={[
        'group bg-white rounded-xl border transition-shadow',
        isDragging
          ? 'shadow-lg border-emerald-300 rotate-1'
          : 'border-slate-200 hover:border-slate-300 hover:shadow-sm',
        order.is_urgent ? 'border-l-4 border-l-red-400' : '',
        order.is_rework ? 'border-l-4 border-l-amber-400' : '',
      ].join(' ')}
    >
      <div className="flex items-start gap-3 p-4">
        {/* Drag handle */}
        <button
          className="mt-0.5 shrink-0 cursor-grab touch-none text-slate-300 hover:text-slate-500 active:cursor-grabbing"
          {...dragHandleProps}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {/* Thumbnail ou placeholder */}
        <div className="shrink-0 h-12 w-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
          {order.thumbnail_url ? (
            <img src={order.thumbnail_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-xs text-slate-400 font-mono">
              {order.order_number.slice(-3)}
            </span>
          )}
        </div>

        {/* Conteúdo principal */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              {/* Número e badges de flag */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-sm font-semibold text-slate-800">
                  #{order.order_number}
                </span>
                {order.is_urgent && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                    <AlertTriangle className="h-3 w-3" /> Urgente
                  </span>
                )}
                {order.is_rework && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                    <RefreshCw className="h-3 w-3" /> Retrabalho
                  </span>
                )}
              </div>

              {/* Cliente */}
              <p className="mt-0.5 truncate text-sm font-medium text-slate-700">
                {order.client_nickname ?? order.client_name ?? '—'}
              </p>

              {/* Briefing resumido */}
              {order.briefing && (
                <p className="mt-0.5 truncate text-xs text-slate-400">{order.briefing}</p>
              )}
            </div>

            {/* Status badge */}
            <StatusBadge status={order.status} size="sm" />
          </div>

          {/* Linha de metadados */}
          <div className="mt-2 flex items-center gap-3 flex-wrap">
            <TimerBadge sinceIso={tsForTimer} paused={isPaused} />

            {order.assigned_name && (
              <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                <User className="h-3 w-3" />
                {order.assigned_name}
              </span>
            )}

            {order.target_machine && (
              <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                <Cpu className="h-3 w-3" />
                {order.target_machine}
                {order.plate_thickness ? ` · ${order.plate_thickness}mm` : ''}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Botão de avanço de status */}
      {nextLabel && (
        <div className="border-t border-slate-100 px-4 py-2.5">
          <button
            onClick={() => onAdvance(order.id)}
            className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
          >
            <ArrowRight className="h-3.5 w-3.5" />
            {nextLabel}
          </button>
        </div>
      )}
    </div>
  )
}
