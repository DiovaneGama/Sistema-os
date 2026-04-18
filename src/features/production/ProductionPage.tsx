import { useState, useMemo } from 'react'
import { RefreshCw, Columns3, List } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useRole } from '../../hooks/useRole'
import { useProductionOrders } from './hooks/useProductionOrders'
import { ProductionHUD } from './components/ProductionHUD'
import { FiltersBar, type ProductionFilters } from './components/FiltersBar'
import { ProductionQueue } from './components/ProductionQueue'
import { getNextStatus } from './utils/statusConfig'
import type { OrderStatus } from '../../types/database'

export function ProductionPage() {
  const { profile } = useAuth()
  const { role } = useRole()
  const { orders, hud, loading, error, advanceStatus, reorderInStatus, reload } = useProductionOrders()

  const [filters, setFilters] = useState<ProductionFilters>({
    search: '', status: '', urgentOnly: false, reworkOnly: false,
  })
  const [viewMode, setViewMode] = useState<'columns' | 'list'>('columns')
  const [advancing, setAdvancing] = useState<string | null>(null)

  // Filtra os pedidos conforme os filtros ativos
  const filteredOrders = useMemo(() => {
    const q = filters.search.toLowerCase()
    return orders.filter(o => {
      if (filters.status && o.status !== filters.status) return false
      if (filters.urgentOnly && !o.is_urgent) return false
      if (filters.reworkOnly && !o.is_rework) return false
      if (q) {
        const haystack = [
          o.order_number,
          o.client_nickname,
          o.client_name,
          o.assigned_name,
          o.briefing,
        ].join(' ').toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [orders, filters])

  async function handleAdvance(orderId: string) {
    if (!role || !profile) return
    const order = orders.find(o => o.id === orderId)
    if (!order) return

    const next = getNextStatus(order.status, role)
    if (!next) return

    setAdvancing(orderId)
    await advanceStatus(orderId, next as OrderStatus, profile.id)
    setAdvancing(null)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Cabeçalho fixo ── */}
      <div className="shrink-0 border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Fila de Produção</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Horizonte de 72 horas · atualização em tempo real
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Alternar view */}
            <div className="flex rounded-lg border border-slate-200 overflow-hidden">
              <button
                onClick={() => setViewMode('columns')}
                className={[
                  'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors',
                  viewMode === 'columns'
                    ? 'bg-slate-800 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50',
                ].join(' ')}
              >
                <Columns3 className="h-3.5 w-3.5" />
                Colunas
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={[
                  'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors',
                  viewMode === 'list'
                    ? 'bg-slate-800 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50',
                ].join(' ')}
              >
                <List className="h-3.5 w-3.5" />
                Lista
              </button>
            </div>

            {/* Reload manual */}
            <button
              onClick={reload}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
          </div>
        </div>

        {/* HUD de KPIs */}
        <ProductionHUD stats={hud} />
      </div>

      {/* ── Área de filtros + fila ── */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {/* Barra de filtros */}
        <FiltersBar
          filters={filters}
          onChange={setFilters}
          totalShowing={filteredOrders.length}
          totalAll={orders.length}
        />

        {/* Fila */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="h-6 w-6 animate-spin text-emerald-500" />
              <p className="text-sm text-slate-400">Carregando fila...</p>
            </div>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            <p className="font-semibold">Erro ao carregar a fila</p>
            <p className="mt-1 font-mono text-xs text-red-500">{error}</p>
            <button onClick={reload} className="mt-3 text-xs text-red-600 underline hover:text-red-800">
              Tentar novamente
            </button>
          </div>
        ) : (
          <ProductionQueue
            orders={filteredOrders}
            role={role ?? 'triador'}
            onAdvance={handleAdvance}
            onReorder={reorderInStatus}
            viewMode={viewMode}
          />
        )}

        {/* Indicador de operação em andamento */}
        {advancing && (
          <div className="fixed bottom-6 right-6 flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-3 text-sm text-white shadow-lg">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Atualizando status...
          </div>
        )}
      </div>
    </div>
  )
}
