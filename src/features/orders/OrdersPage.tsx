import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Plus, RefreshCw, Search, AlertTriangle } from 'lucide-react'
import { useOrdersList } from './hooks/useOrders'
import type { OrderStatus } from '../../types/database'

const STATUS_LABELS: Record<string, string> = {
  rascunho: 'Rascunho', fila_arte: 'Fila Arte', tratamento: 'Tratamento',
  pausado: 'Pausado', fila_producao: 'Fila Produção', producao: 'Produção',
  pronto: 'Pronto', faturamento: 'Faturamento', despachado: 'Despachado',
  devolvido: 'Devolvido', cancelado: 'Cancelado',
}

const STATUS_COLORS: Record<string, string> = {
  rascunho: 'bg-slate-100 text-slate-600',
  fila_arte: 'bg-purple-100 text-purple-700',
  tratamento: 'bg-blue-100 text-blue-700',
  pausado: 'bg-amber-100 text-amber-700',
  fila_producao: 'bg-orange-100 text-orange-700',
  producao: 'bg-cyan-100 text-cyan-700',
  pronto: 'bg-emerald-100 text-emerald-700',
  faturamento: 'bg-teal-100 text-teal-700',
  despachado: 'bg-green-100 text-green-700',
  devolvido: 'bg-pink-100 text-pink-700',
  cancelado: 'bg-red-100 text-red-600',
}

const CHANNEL_LABELS: Record<string, string> = {
  email: 'E-mail', whatsapp: 'WhatsApp', balcao: 'Balcão',
  telefone: 'Telefone', orcamento: 'Orçamento', outros: 'Outros',
}

export function OrdersPage() {
  const { orders, loading, error, reload } = useOrdersList()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('')

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return orders.filter(o => {
      if (statusFilter && o.status !== statusFilter) return false
      if (q) {
        const hay = [o.order_number, o.client_nickname, o.client_name, o.briefing].join(' ').toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [orders, search, statusFilter])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Pedidos / OS</h1>
            <p className="text-xs text-slate-400 mt-0.5">{orders.length} pedidos no sistema</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={reload} disabled={loading}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
            <Link to="/orders/new"
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors">
              <Plus className="h-3.5 w-3.5" />
              Novo Pedido
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por nº, cliente..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as OrderStatus | '')}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Todos os status</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <span className="ml-auto text-xs text-slate-400">{filtered.length} de {orders.length}</span>
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
            <p className="font-semibold">Erro ao carregar pedidos</p>
            <p className="mt-1 font-mono text-xs">{error}</p>
            <button onClick={reload} className="mt-2 text-xs underline">Tentar novamente</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-slate-400 text-sm">Nenhum pedido encontrado</p>
            <Link to="/orders/new" className="mt-3 text-xs text-emerald-600 hover:underline">+ Criar primeiro pedido</Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {['Nº OS', 'Cliente', 'Status', 'Canal', 'Briefing', 'Data', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((order, i) => (
                  <tr key={order.id}
                    className={['transition-colors hover:bg-slate-50', i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'].join(' ')}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {order.is_urgent && <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0" />}
                        {order.is_rework && <RefreshCw className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                        <span className="font-mono font-semibold text-slate-800">#{order.order_number}</span>
                      </div>
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
                    <td className="px-4 py-3 text-xs text-slate-500">{CHANNEL_LABELS[order.channel] ?? order.channel}</td>
                    <td className="px-4 py-3 text-xs text-slate-400 max-w-[200px] truncate">{order.briefing ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                      {new Date(order.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/orders/${order.id}`}
                        className="text-xs font-medium text-emerald-600 hover:text-emerald-800 hover:underline">
                        Abrir →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
