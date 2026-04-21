import { useAuth } from '../../hooks/useAuth'
import { useRole } from '../../hooks/useRole'
import { ClipboardList, TrendingUp, AlertTriangle, PauseCircle, Mail, Plus } from 'lucide-react'

export function DashboardPage() {
  const { profile } = useAuth()
  const { can } = useRole()

  return (
    <div className="p-6 space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">
            Olá, {profile?.full_name?.split(' ')[0]} 👋
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>

        {/* Ações rápidas */}
        <div className="flex gap-2">
          <a
            href="/triage"
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Mail className="h-4 w-4" />
            Ir para Triagem
          </a>
          <a
            href="/orders/new"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-sm text-white hover:bg-emerald-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Criar OS
          </a>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Comissão */}
        {can.viewOwnCommission && (
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-1">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">
              Minha Comissão
            </p>
            <p className="text-2xl font-bold text-slate-800">R$ 0,00</p>
            <p className="text-xs text-slate-400">Hoje: R$ 0,00</p>
            <a href="/commissions" className="text-xs text-emerald-600 hover:underline">
              Ver extrato →
            </a>
          </div>
        )}

        {/* Volume do dia */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-1">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">
              Meu Volume Hoje
            </p>
          </div>
          <p className="text-2xl font-bold text-slate-800">0 OSs</p>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
            <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '0%' }} />
          </div>
          <p className="text-xs text-slate-400">Meta: {profile?.daily_os_goal ?? 10} OSs/dia</p>
        </div>

        {/* Termômetro de qualidade */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-1">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">
              Retrabalhos
            </p>
          </div>
          <p className="text-2xl font-bold text-slate-800">0</p>
          <p className="text-xs text-slate-400">Erros de arte retornados hoje</p>
        </div>

        {/* Pausados */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-1">
          <div className="flex items-center gap-2">
            <PauseCircle className="h-4 w-4 text-slate-400" />
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">
              Aguardando Cliente
            </p>
          </div>
          <p className="text-2xl font-bold text-slate-800">0</p>
          <p className="text-xs text-slate-400">Pedidos pausados por pendência</p>
        </div>
      </div>

      {/* Fila de trabalho */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-slate-500" />
          <h2 className="text-sm font-semibold text-slate-700">Fila de Trabalho</h2>
        </div>
        <div className="px-5 py-12 text-center">
          <p className="text-sm text-slate-400">Nenhum pedido na fila no momento.</p>
          <p className="text-xs text-slate-300 mt-1">
            Pedidos aparecerão aqui assim que forem criados ou triados.
          </p>
        </div>
      </div>
    </div>
  )
}
