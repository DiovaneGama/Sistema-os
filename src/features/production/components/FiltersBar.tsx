import { Search, SlidersHorizontal, X } from 'lucide-react'
import type { OrderStatus } from '../../../types/database'
import { STATUS_LABELS, PRODUCTION_PIPELINE } from '../utils/statusConfig'

export interface ProductionFilters {
  search: string
  status: OrderStatus | ''
  urgentOnly: boolean
  reworkOnly: boolean
}

interface Props {
  filters: ProductionFilters
  onChange: (f: ProductionFilters) => void
  totalShowing: number
  totalAll: number
}

export function FiltersBar({ filters, onChange, totalShowing, totalAll }: Props) {
  const hasActiveFilter =
    filters.search || filters.status || filters.urgentOnly || filters.reworkOnly

  function clear() {
    onChange({ search: '', status: '', urgentOnly: false, reworkOnly: false })
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Busca */}
      <div className="relative flex-1 min-w-48">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Buscar por nº, cliente ou operador..."
          value={filters.search}
          onChange={e => onChange({ ...filters, search: e.target.value })}
          className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        />
      </div>

      {/* Filtro de status */}
      <div className="flex items-center gap-1.5">
        <SlidersHorizontal className="h-4 w-4 text-slate-400 shrink-0" />
        <select
          value={filters.status}
          onChange={e => onChange({ ...filters, status: e.target.value as OrderStatus | '' })}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">Todos os status</option>
          {PRODUCTION_PIPELINE.map(s => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>

      {/* Toggles rápidos */}
      <button
        onClick={() => onChange({ ...filters, urgentOnly: !filters.urgentOnly })}
        className={[
          'rounded-lg border px-3 py-2 text-xs font-semibold transition-colors',
          filters.urgentOnly
            ? 'bg-red-600 border-red-600 text-white'
            : 'bg-white border-slate-200 text-slate-600 hover:border-red-300 hover:text-red-600',
        ].join(' ')}
      >
        ⚡ Urgentes
      </button>

      <button
        onClick={() => onChange({ ...filters, reworkOnly: !filters.reworkOnly })}
        className={[
          'rounded-lg border px-3 py-2 text-xs font-semibold transition-colors',
          filters.reworkOnly
            ? 'bg-amber-500 border-amber-500 text-white'
            : 'bg-white border-slate-200 text-slate-600 hover:border-amber-300 hover:text-amber-600',
        ].join(' ')}
      >
        🔄 Retrabalhos
      </button>

      {/* Limpar filtros */}
      {hasActiveFilter && (
        <button
          onClick={clear}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
          Limpar
        </button>
      )}

      {/* Contador */}
      <span className="ml-auto text-xs text-slate-400 whitespace-nowrap">
        {totalShowing === totalAll
          ? `${totalAll} pedidos`
          : `${totalShowing} de ${totalAll}`}
      </span>
    </div>
  )
}
