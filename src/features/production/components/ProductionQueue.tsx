import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { ProductionOrder } from '../hooks/useProductionOrders'
import type { OrderStatus, UserRole } from '../../../types/database'
import { OrderCard } from './OrderCard'
import { PIPELINE_GROUPS, STATUS_LABELS } from '../utils/statusConfig'
import { Package } from 'lucide-react'

// ── Ordenação por prioridade ─────────────────────────────────────────────────

function timeInQueueMs(o: ProductionOrder): number {
  const ref = o.production_started_at ?? o.production_queued_at ??
    o.treatment_started_at ?? o.queued_at ?? o.created_at
  return Date.now() - new Date(ref).getTime()
}

function sortByPriority(a: ProductionOrder, b: ProductionOrder): number {
  // 1. Urgentes
  if (a.is_urgent !== b.is_urgent) return a.is_urgent ? -1 : 1
  // 2. Pausados
  if ((a.status === 'pausado') !== (b.status === 'pausado'))
    return a.status === 'pausado' ? -1 : 1
  // 3. Atrasados (> 4h)
  const aLate = timeInQueueMs(a) > 4 * 3_600_000
  const bLate = timeInQueueMs(b) > 4 * 3_600_000
  if (aLate !== bLate) return aLate ? -1 : 1
  // 4. Maior tempo em fila primeiro
  return timeInQueueMs(b) - timeInQueueMs(a)
}

// ── Item arrastável ──────────────────────────────────────────────────────────
function SortableOrderCard({
  order, role, currentProfileId, onAdvance,
}: {
  order: ProductionOrder
  role: UserRole
  currentProfileId: string
  onAdvance: (id: string) => void
  viewMode?: 'columns' | 'list'
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: order.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <OrderCard
        order={order}
        role={role}
        currentProfileId={currentProfileId}
        onAdvance={onAdvance}
        onSavePrint={async () => false}
        viewMode="columns"
        isDragging={isDragging}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  )
}

// ── Coluna de grupo (Arte Final / Produção / Prontos) ─────────────────────────
function GroupColumn({
  label,
  statuses,
  orders,
  role,
  currentProfileId,
  onAdvance,
  onReorder,
}: {
  label: string
  statuses: OrderStatus[]
  orders: ProductionOrder[]
  role: UserRole
  currentProfileId: string
  onAdvance: (id: string) => void
  onReorder: (reordered: { id: string; sort_order: number }[]) => void
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const groupOrders = orders
    .filter(o => statuses.includes(o.status))
    .sort(sortByPriority)

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = groupOrders.findIndex(o => o.id === active.id)
    const newIndex = groupOrders.findIndex(o => o.id === over.id)
    const reordered = arrayMove(groupOrders, oldIndex, newIndex)

    onReorder(reordered.map((o, i) => ({ id: o.id, sort_order: i })))
  }

  return (
    <div className="flex-1 min-w-64">
      {/* Cabeçalho da coluna */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-700">{label}</h3>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500">
            {groupOrders.length}
          </span>
        </div>
        <div className="flex gap-1">
          {statuses.map(s => (
            <span key={s} className="text-xs text-slate-400">{STATUS_LABELS[s]}</span>
          )).reduce((a, b) => <>{a} · {b}</>)}
        </div>
      </div>

      {/* Lista ordenável */}
      {groupOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-10 text-center">
          <Package className="h-6 w-6 text-slate-300 mb-2" />
          <p className="text-sm text-slate-400">Nenhum pedido aqui</p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={groupOrders.map(o => o.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {groupOrders.map(order => (
                <SortableOrderCard
                  key={order.id}
                  order={order}
                  role={role}
                  currentProfileId={currentProfileId}
                  onAdvance={onAdvance}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  )
}

// ── Componente principal da fila ─────────────────────────────────────────────
interface Props {
  orders: ProductionOrder[]
  role: UserRole
  currentProfileId: string
  onAdvance: (orderId: string) => void
  onReorder: (reordered: { id: string; sort_order: number }[]) => void
  onSavePrint: (orderId: string, field: 'thumbnail_url' | 'machine_print_url' | 'color_proof_url', file: File) => Promise<boolean>
  onReload: () => void
  viewMode: 'columns' | 'list'
}

export function ProductionQueue({ orders, role, currentProfileId, onAdvance, onReorder, onSavePrint, onReload, viewMode }: Props) {
  if (viewMode === 'columns') {
    return (
      <div className="flex gap-4 overflow-x-auto pb-2">
        {PIPELINE_GROUPS.map(group => (
          <GroupColumn
            key={group.label}
            label={group.label}
            statuses={group.statuses}
            orders={orders}
            role={role}
            currentProfileId={currentProfileId}
            onAdvance={onAdvance}
            onReorder={onReorder}
          />
        ))}
      </div>
    )
  }

  // Modo lista: todos juntos, ordenados
  const sorted = [...orders].sort(sortByPriority)

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-16 text-center">
        <Package className="h-8 w-8 text-slate-300 mb-3" />
        <p className="text-sm text-slate-400">Nenhum pedido na fila no momento</p>
        <p className="text-xs text-slate-300 mt-1">Os pedidos aparecerão aqui conforme forem triados ou criados</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {sorted.map(order => (
        <OrderCard
          key={order.id}
          order={order}
          role={role}
          currentProfileId={currentProfileId}
          onAdvance={onAdvance}
          onSavePrint={onSavePrint}
          onReload={onReload}
          viewMode="list"
        />
      ))}
    </div>
  )
}
