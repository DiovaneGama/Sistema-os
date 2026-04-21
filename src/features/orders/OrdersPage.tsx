import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, RefreshCw, Search, X, UserCheck, UserPlus, EyeOff, Eye } from 'lucide-react'
import { useOrdersList } from './hooks/useOrders'
import { useOrderMutations } from './hooks/useOrders'
import { useOperators } from './hooks/useCreateOrder'
import { useAuth } from '../../hooks/useAuth'
import { useRole } from '../../hooks/useRole'
import type { OrderStatus } from '../../types/database'

const STATUS_COLORS: Record<string, string> = {
  rascunho:     'bg-slate-100 text-slate-600',
  fila_arte:    'bg-purple-100 text-purple-700',
  cancelado:    'bg-red-100 text-red-600',
}

const STATUS_LABELS: Record<string, string> = {
  rascunho:  'Rascunho',
  fila_arte: 'Fila Arte',
  cancelado: 'Cancelado',
}

type ActionModal =
  | { type: 'cancel';   orderId: string }
  | { type: 'delegate'; orderId: string }
  | null

export function OrdersPage() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { hasRole } = useRole()
  const { orders, loading, error, reload } = useOrdersList()
  const { updateStatus, cancelOrder } = useOrderMutations()
  const operators = useOperators()

  const [search, setSearch]               = useState('')
  const [statusFilter, setStatusFilter]   = useState<'fila_arte' | 'rascunho' | ''>('')
  const [showCancelled, setShowCancelled] = useState(false)
  const [modal, setModal]                 = useState<ActionModal>(null)
  const [cancelReason, setCancelReason]   = useState('')
  const [delegateTo, setDelegateTo]       = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError]     = useState<string | null>(null)

  const isGestor = hasRole('gestor_pcp')

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    const baseStatuses = showCancelled
      ? ['cancelado']
      : statusFilter
        ? [statusFilter]
        : ['fila_arte', 'rascunho']

    return orders.filter(o => {
      if (!baseStatuses.includes(o.status)) return false
      if (q) {
        const hay = [o.order_number, o.client_nickname, o.client_name, o.service_name, o.briefing].join(' ').toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [orders, search, statusFilter, showCancelled])

  async function handleCapturar(orderId: string) {
    if (!profile?.id) return
    setActionLoading(true)
    const { ok, error } = await updateStatus(orderId, 'tratamento' as OrderStatus, profile.id)
    setActionLoading(false)
    if (!ok) { setActionError(error ?? 'Erro ao capturar OS'); return }
    reload()
    navigate(`/orders/${orderId}`)
  }

  async function handleDelegate() {
    if (modal?.type !== 'delegate' || !delegateTo) return
    setActionLoading(true)
    const { ok, error } = await updateStatus(modal.orderId, 'tratamento' as OrderStatus, delegateTo)
    setActionLoading(false)
    if (!ok) { setActionError(error ?? 'Erro ao delegar OS'); return }
    setModal(null)
    setDelegateTo('')
    reload()
  }

  async function handleCancel() {
    if (modal?.type !== 'cancel' || !cancelReason.trim()) return
    setActionLoading(true)
    const { ok, error } = await cancelOrder(modal.orderId, cancelReason.trim())
    setActionLoading(false)
    if (!ok) { setActionError(error ?? 'Erro ao cancelar OS'); return }
    setModal(null)
    setCancelReason('')
    reload()
  }

  function closeModal() {
    setModal(null)
    setCancelReason('')
    setDelegateTo('')
    setActionError(null)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Fila de OS</h1>
            <p className="text-xs text-slate-400 mt-0.5">Lista de OS geradas no sistema</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={reload} disabled={loading}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-base font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors">
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
            <Link to="/orders/new"
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-12 py-4 text-lg font-semibold text-white hover:bg-emerald-700 transition-colors">
              <Plus className="h-5 w-5" />
              Criar OS
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por nº, cliente, serviço..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {!showCancelled && (
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as 'fila_arte' | 'rascunho' | '')}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Todos</option>
              <option value="fila_arte">Fila Arte</option>
              <option value="rascunho">Rascunho</option>
            </select>
          )}

          <button
            onClick={() => { setShowCancelled(v => !v); setStatusFilter('') }}
            className={[
              'flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
              showCancelled
                ? 'border-red-300 bg-red-50 text-red-700 hover:bg-red-100'
                : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50',
            ].join(' ')}
          >
            {showCancelled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            {showCancelled ? 'Ocultar canceladas' : 'Ver OS canceladas'}
          </button>

          <span className="ml-auto text-xs text-slate-400">{filtered.length} OS</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="h-6 w-6 animate-spin text-emerald-500" />
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            <p className="font-semibold">Erro ao carregar OS</p>
            <p className="mt-1 font-mono text-xs">{error}</p>
            <button onClick={reload} className="mt-2 text-xs underline">Tentar novamente</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-slate-400 text-sm">
              {showCancelled ? 'Nenhuma OS cancelada' : 'Nenhuma OS na fila'}
            </p>
            {!showCancelled && (
              <Link to="/orders/new" className="mt-3 text-xs text-emerald-600 hover:underline">+ Criar primeira OS</Link>
            )}
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {['Nº OS', 'Serviço', 'Cliente', 'Status', 'Data', 'Responsável', 'Ações'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((order, i) => (
                  <tr key={order.id}
                    className={['transition-colors hover:bg-slate-50', i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'].join(' ')}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-mono font-semibold text-slate-800">#{order.order_number}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700 truncate max-w-[160px]">
                      {order.service_name ?? <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800 truncate max-w-[140px]">
                        {order.client_nickname ?? order.client_name ?? '—'}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={['inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold', STATUS_COLORS[order.status] ?? 'bg-slate-100 text-slate-600'].join(' ')}>
                        {STATUS_LABELS[order.status] ?? order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                      {new Date(order.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 truncate max-w-[120px]">
                      {order.assigned_name ?? <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {order.status === 'rascunho' ? (
                        <Link to="/orders/new"
                          className="text-xs font-medium text-amber-600 hover:text-amber-800 hover:underline">
                          Continuar OS →
                        </Link>
                      ) : order.status === 'cancelado' ? (
                        <span className="text-xs text-slate-300">—</span>
                      ) : (
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => handleCapturar(order.id)}
                            disabled={actionLoading}
                            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors whitespace-nowrap"
                          >
                            <UserCheck className="h-3.5 w-3.5" />
                            Capturar e Tratar
                          </button>

                          {isGestor && (
                            <button
                              onClick={() => { setModal({ type: 'delegate', orderId: order.id }); setActionError(null) }}
                              disabled={actionLoading}
                              className="flex items-center gap-1.5 rounded-lg border border-blue-300 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-50 transition-colors whitespace-nowrap"
                            >
                              <UserPlus className="h-3.5 w-3.5" />
                              Delegar
                            </button>
                          )}

                          <button
                            onClick={() => { setModal({ type: 'cancel', orderId: order.id }); setActionError(null) }}
                            disabled={actionLoading}
                            className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                            Cancelar
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal — Cancelar OS */}
      {modal?.type === 'cancel' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-800">Cancelar OS</h2>
            <p className="text-sm text-slate-500">Informe o motivo do cancelamento. Esta ação não pode ser desfeita.</p>
            <textarea
              rows={3}
              placeholder="Motivo do cancelamento..."
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-400"
            />
            {actionError && <p className="text-xs text-red-600">{actionError}</p>}
            <div className="flex justify-end gap-2">
              <button onClick={closeModal} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
                Voltar
              </button>
              <button
                onClick={handleCancel}
                disabled={actionLoading || !cancelReason.trim()}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading ? 'Cancelando...' : 'Confirmar cancelamento'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal — Delegar OS */}
      {modal?.type === 'delegate' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-800">Delegar OS</h2>
            <p className="text-sm text-slate-500">Selecione o operador responsável por tratar esta OS.</p>
            <select
              value={delegateTo}
              onChange={e => setDelegateTo(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">Selecione o operador...</option>
              {operators.map(op => (
                <option key={op.id} value={op.id}>{op.full_name}</option>
              ))}
            </select>
            {actionError && <p className="text-xs text-red-600">{actionError}</p>}
            <div className="flex justify-end gap-2">
              <button onClick={closeModal} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
                Voltar
              </button>
              <button
                onClick={handleDelegate}
                disabled={actionLoading || !delegateTo}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {actionLoading ? 'Delegando...' : 'Delegar OS'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
