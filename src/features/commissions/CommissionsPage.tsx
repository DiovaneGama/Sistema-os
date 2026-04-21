import { useState } from 'react'
import { Link } from 'react-router-dom'
import { RefreshCw, DollarSign, TrendingDown, TrendingUp, Hash } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useRole } from '../../hooks/useRole'
import {
  useCommissions,
  useArtistProfiles,
  type CommissionPeriod,
} from './hooks/useCommissions'

const PERIODS: { value: CommissionPeriod; label: string }[] = [
  { value: 'month',      label: 'Este Mês' },
  { value: 'last_month', label: 'Mês Anterior' },
  { value: '90d',        label: 'Últimos 90 dias' },
  { value: 'all',        label: 'Tudo' },
]

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

function brl(value: number | null) {
  if (value == null) return '—'
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function KpiCard({
  icon, label, value, color = 'text-slate-800',
}: { icon: React.ReactNode; label: string; value: string; color?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-1">
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  )
}

export function CommissionsPage() {
  const { profile } = useAuth()
  const { role } = useRole()
  const [period, setPeriod] = useState<CommissionPeriod>('month')
  const [filterProfile, setFilterProfile] = useState<string>('')

  const artistProfiles = useArtistProfiles()

  const { items, totals, loading, error, reload, isManager } = useCommissions(
    profile?.id ?? '',
    role ?? undefined,
    period,
    filterProfile || undefined
  )

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Header */}
      <div className="shrink-0 border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Comissões</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {isManager ? 'Comissões de arte finalistas' : 'Suas comissões por OS concluída'}
            </p>
          </div>
          <button onClick={reload} disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Período */}
          <div className="flex rounded-lg border border-slate-200 overflow-hidden">
            {PERIODS.map(p => (
              <button key={p.value} onClick={() => setPeriod(p.value)}
                className={[
                  'px-3 py-1.5 text-xs font-medium transition-colors',
                  period === p.value
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50',
                ].join(' ')}>
                {p.label}
              </button>
            ))}
          </div>

          {/* Filtro por operador — gestores apenas */}
          {isManager && artistProfiles.length > 0 && (
            <select
              value={filterProfile}
              onChange={e => setFilterProfile(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Todos os operadores</option>
              {artistProfiles.map(p => (
                <option key={p.id} value={p.id}>{p.full_name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Cards de KPI */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            icon={<DollarSign className="h-4 w-4 text-emerald-500" />}
            label="Total Bruto"
            value={brl(totals.gross)}
            color="text-emerald-700"
          />
          <KpiCard
            icon={<TrendingDown className="h-4 w-4 text-red-400" />}
            label="Revertidas"
            value={brl(totals.reversed_amount)}
            color={totals.reversed_amount > 0 ? 'text-red-600' : 'text-slate-400'}
          />
          <KpiCard
            icon={<TrendingUp className="h-4 w-4 text-emerald-600" />}
            label="Líquido"
            value={brl(totals.net)}
            color="text-slate-800"
          />
          <KpiCard
            icon={<Hash className="h-4 w-4 text-slate-400" />}
            label="OSs Comissionadas"
            value={String(totals.count)}
          />
        </div>

        {/* Tabela */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="h-6 w-6 animate-spin text-emerald-500" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <DollarSign className="h-10 w-10 text-slate-200 mb-3" />
            <p className="text-sm text-slate-400">Nenhuma comissão encontrada para o período.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Nº OS</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Cliente</th>
                  {isManager && (
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Operador</th>
                  )}
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Data</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Valor Base</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Taxa</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Comissão</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={item.id}
                    className={[
                      'border-b border-slate-50 transition-colors hover:bg-slate-50/60',
                      item.reversed ? 'opacity-60' : '',
                      i % 2 === 0 ? 'bg-white' : 'bg-slate-50/30',
                    ].join(' ')}>
                    <td className="px-4 py-3">
                      <Link to={`/orders/${item.order_id}`}
                        className="font-mono font-semibold text-emerald-600 hover:text-emerald-800 hover:underline text-xs">
                        #{item.order_number}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-700 max-w-[140px] truncate">
                      {item.client_nickname ?? item.client_name ?? '—'}
                    </td>
                    {isManager && (
                      <td className="px-4 py-3 text-slate-600">{item.operator_name}</td>
                    )}
                    <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                      {fmt(item.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      {brl(item.base_amount)}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      {item.rate != null ? `${(item.rate * 100).toFixed(2)}%` : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-700">
                      {brl(item.commission_amount)}
                    </td>
                    <td className="px-4 py-3">
                      {item.reversed ? (
                        <span
                          className="inline-flex rounded-full bg-red-100 text-red-700 px-2.5 py-0.5 text-xs font-semibold cursor-help"
                          title={item.reversed_reason ?? 'Comissão revertida'}>
                          Revertida
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-emerald-100 text-emerald-700 px-2.5 py-0.5 text-xs font-semibold">
                          Ativa
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 bg-slate-50">
                  <td colSpan={isManager ? 6 : 5}
                    className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Total do período
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-700">
                    {brl(totals.net)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
