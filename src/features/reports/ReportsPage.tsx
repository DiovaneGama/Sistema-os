import { useState } from 'react'
import { RefreshCw, TrendingUp, CheckCircle2, AlertTriangle, Zap, BarChart3, Users } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  LineChart, Line,
} from 'recharts'
import { useReportsData, type ReportPeriod } from './hooks/useReportsData'

const PERIODS: { value: ReportPeriod; label: string }[] = [
  { value: '7d',  label: 'Últimos 7 dias' },
  { value: '30d', label: 'Últimos 30 dias' },
  { value: '90d', label: 'Últimos 90 dias' },
  { value: 'all', label: 'Todo o período' },
]

function KpiCard({ icon, label, value, sub, color = 'text-slate-800' }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; color?: string
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-1">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
    </div>
  )
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-slate-400">{icon}</span>
      <h2 className="text-sm font-bold text-slate-700">{title}</h2>
    </div>
  )
}

function EmptyChart() {
  return (
    <div className="flex items-center justify-center h-full text-xs text-slate-300">
      Sem dados para o período
    </div>
  )
}

export function ReportsPage() {
  const [period, setPeriod] = useState<ReportPeriod>('30d')
  const { kpi, statusDist, volumeByDay, topClients, channels, loading, error, reload } = useReportsData(period)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b border-slate-200 bg-white px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Relatórios & BI</h1>
          <p className="text-xs text-slate-400 mt-0.5">Visão gerencial de produção e pedidos</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Seletor de período */}
          <div className="flex rounded-lg border border-slate-200 overflow-hidden">
            {PERIODS.map(p => (
              <button key={p.value} onClick={() => setPeriod(p.value)}
                className={[
                  'px-3 py-1.5 text-xs font-medium transition-colors',
                  period === p.value ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50',
                ].join(' ')}>
                {p.label}
              </button>
            ))}
          </div>
          <button onClick={reload} disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* KPI Cards */}
        {kpi && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              icon={<TrendingUp className="h-4 w-4 text-emerald-500" />}
              label="Total de OSs"
              value={kpi.total_orders}
              sub="no período selecionado"
            />
            <KpiCard
              icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
              label="Concluídas"
              value={`${kpi.completed_orders} (${kpi.completion_rate}%)`}
              sub="pronto + faturado + despachado"
              color="text-emerald-700"
            />
            <KpiCard
              icon={<AlertTriangle className="h-4 w-4 text-amber-500" />}
              label="Retrabalhos"
              value={`${kpi.rework_orders} (${kpi.rework_rate}%)`}
              sub="OSs marcadas como retrabalho"
              color={kpi.rework_rate > 10 ? 'text-red-600' : 'text-amber-600'}
            />
            <KpiCard
              icon={<Zap className="h-4 w-4 text-red-500" />}
              label="Urgentes"
              value={kpi.urgent_orders}
              sub="pedidos com flag urgente"
              color="text-red-600"
            />
          </div>
        )}

        {loading && !kpi && (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="h-6 w-6 animate-spin text-emerald-500" />
          </div>
        )}

        {/* Gráficos — linha 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Volume por dia */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <SectionTitle icon={<BarChart3 className="h-4 w-4" />} title="Volume de OSs por dia" />
            <div className="h-52">
              {volumeByDay.length === 0 ? <EmptyChart /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={volumeByDay} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="criados"   stroke="#10b981" strokeWidth={2} dot={false} name="Criados" />
                    <Line type="monotone" dataKey="concluidos" stroke="#3b82f6" strokeWidth={2} dot={false} name="Concluídos" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Distribuição por status */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <SectionTitle icon={<BarChart3 className="h-4 w-4" />} title="OSs por status" />
            <div className="h-52">
              {statusDist.length === 0 ? <EmptyChart /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusDist} layout="vertical" margin={{ top: 0, right: 8, left: 60, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} />
                    <YAxis type="category" dataKey="label" tick={{ fontSize: 10, fill: '#64748b' }} width={60} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                    <Bar dataKey="count" name="OSs" radius={[0, 4, 4, 0]}>
                      {statusDist.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Gráficos — linha 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Top clientes */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <SectionTitle icon={<Users className="h-4 w-4" />} title="Top clientes por volume" />
            {topClients.length === 0 ? (
              <div className="h-52 flex items-center justify-center text-xs text-slate-300">Sem dados</div>
            ) : (
              <div className="space-y-2 mt-1">
                {topClients.map((c, i) => {
                  const max = topClients[0].count
                  const pct = Math.round((c.count / max) * 100)
                  return (
                    <div key={c.nickname}>
                      <div className="flex items-center justify-between mb-0.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs font-bold text-slate-400 w-4 shrink-0">#{i + 1}</span>
                          <span className="text-xs font-semibold text-slate-700 truncate">{c.nickname}</span>
                          <span className="text-xs text-slate-400 truncate hidden sm:block">{c.company_name}</span>
                        </div>
                        <span className="text-xs font-bold text-slate-600 shrink-0 ml-2">{c.count} OS{c.count !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full">
                        <div className="h-1.5 bg-emerald-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Canais */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <SectionTitle icon={<BarChart3 className="h-4 w-4" />} title="Pedidos por canal de entrada" />
            <div className="h-52">
              {channels.length === 0 ? <EmptyChart /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={channels}
                      dataKey="count"
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                    >
                      {channels.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                      formatter={(value: number, name: string) => [`${value} OSs`, name]}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
