import type { OrderStatus, UserRole } from '../../../types/database'

// ── Labels legíveis por status ──────────────────────────────────────────────
export const STATUS_LABELS: Record<OrderStatus, string> = {
  rascunho:       'Rascunho',
  fila_arte:      'Fila Arte Final',
  tratamento:     'Em Tratamento',
  pausado:        'Pausado',
  fila_producao:  'Fila Produção',
  producao:       'Em Produção',
  pronto:         'Pronto',
  faturamento:    'Faturamento',
  despachado:     'Despachado',
  devolvido:      'Devolvido',
  cancelado:      'Cancelado',
}

// ── Cores Tailwind por status ────────────────────────────────────────────────
export const STATUS_COLORS: Record<OrderStatus, { bg: string; text: string; border: string }> = {
  rascunho:      { bg: 'bg-slate-100',   text: 'text-slate-600',  border: 'border-slate-200' },
  fila_arte:     { bg: 'bg-blue-50',     text: 'text-blue-700',   border: 'border-blue-200'  },
  tratamento:    { bg: 'bg-violet-50',   text: 'text-violet-700', border: 'border-violet-200'},
  pausado:       { bg: 'bg-amber-50',    text: 'text-amber-700',  border: 'border-amber-200' },
  fila_producao: { bg: 'bg-orange-50',   text: 'text-orange-700', border: 'border-orange-200'},
  producao:      { bg: 'bg-emerald-50',  text: 'text-emerald-700',border: 'border-emerald-200'},
  pronto:        { bg: 'bg-green-50',    text: 'text-green-700',  border: 'border-green-200' },
  faturamento:   { bg: 'bg-teal-50',     text: 'text-teal-700',   border: 'border-teal-200'  },
  despachado:    { bg: 'bg-slate-100',   text: 'text-slate-500',  border: 'border-slate-200' },
  devolvido:     { bg: 'bg-red-50',      text: 'text-red-700',    border: 'border-red-200'   },
  cancelado:     { bg: 'bg-red-100',     text: 'text-red-800',    border: 'border-red-300'   },
}

// ── Status visíveis na fila de produção (horizonte 72h) ─────────────────────
export const PRODUCTION_PIPELINE: OrderStatus[] = [
  'fila_arte',
  'tratamento',
  'pausado',
  'fila_producao',
  'producao',
  'pronto',
]

// ── Grupos visuais da fila ───────────────────────────────────────────────────
export const PIPELINE_GROUPS: { label: string; statuses: OrderStatus[] }[] = [
  { label: 'Arte Final',  statuses: ['fila_arte', 'tratamento', 'pausado'] },
  { label: 'Produção',    statuses: ['fila_producao', 'producao'] },
  { label: 'Prontos',     statuses: ['pronto'] },
]

// ── Próximo status permitido por papel ───────────────────────────────────────
export function getNextStatus(
  current: OrderStatus,
  role: UserRole
): OrderStatus | null {
  const transitions: Partial<Record<OrderStatus, { next: OrderStatus; roles: UserRole[] }>> = {
    fila_arte:     { next: 'tratamento',    roles: ['arte_finalista', 'gestor_pcp', 'admin_master', 'sysadmin'] },
    tratamento:    { next: 'fila_producao', roles: ['arte_finalista', 'gestor_pcp', 'admin_master', 'sysadmin'] },
    fila_producao: { next: 'producao',      roles: ['clicherista',    'gestor_pcp', 'admin_master', 'sysadmin'] },
    producao:      { next: 'pronto',        roles: ['clicherista',    'gestor_pcp', 'admin_master', 'sysadmin'] },
    pronto:        { next: 'despachado',    roles: ['clicherista',    'gestor_pcp', 'admin_master', 'sysadmin'] },
  }
  const t = transitions[current]
  if (!t) return null
  if (!t.roles.includes(role)) return null
  return t.next
}

export function getNextStatusLabel(current: OrderStatus, role: UserRole): string | null {
  const next = getNextStatus(current, role)
  if (!next) return null
  const labels: Partial<Record<OrderStatus, string>> = {
    tratamento:    'Abrir para Tratamento',
    fila_producao: 'Enviar para Produção',
    producao:      'Iniciar Produção',
    pronto:        'Marcar como Pronto',
    despachado:    'Confirmar Despacho',
  }
  return labels[next] ?? STATUS_LABELS[next]
}

// ── Semáforo de tempo em fila ────────────────────────────────────────────────
export function getTimeSemaphore(hoursInQueue: number): 'green' | 'yellow' | 'red' {
  if (hoursInQueue < 2)  return 'green'
  if (hoursInQueue < 4)  return 'yellow'
  return 'red'
}

export const SEMAPHORE_CLASSES = {
  green:  { dot: 'bg-emerald-400', text: 'text-emerald-600', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  yellow: { dot: 'bg-amber-400',   text: 'text-amber-600',   badge: 'bg-amber-50 text-amber-700 border-amber-200'       },
  red:    { dot: 'bg-red-400 animate-pulse', text: 'text-red-600', badge: 'bg-red-50 text-red-700 border-red-200'       },
}

// ── Formata duração ──────────────────────────────────────────────────────────
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}min`
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}

export function minutesSince(isoDate: string | null): number {
  if (!isoDate) return 0
  return (Date.now() - new Date(isoDate).getTime()) / 60_000
}

// ── Timestamp relevante por status (para calcular tempo em fila) ─────────────
export function getStatusTimestamp(order: {
  queued_at: string | null
  treatment_started_at: string | null
  production_queued_at: string | null
  production_started_at: string | null
  status: OrderStatus
}): string | null {
  const map: Partial<Record<OrderStatus, string | null>> = {
    fila_arte:     order.queued_at,
    tratamento:    order.treatment_started_at,
    pausado:       order.treatment_started_at,
    fila_producao: order.production_queued_at,
    producao:      order.production_started_at,
    pronto:        order.production_started_at,
  }
  return map[order.status] ?? null
}
