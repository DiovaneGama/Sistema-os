import { Layers, Wand2, PauseCircle, Hammer, CheckCircle2, AlertTriangle } from 'lucide-react'
import type { HUDStats } from '../hooks/useProductionOrders'

interface HUDCardProps {
  icon: React.ElementType
  label: string
  value: number
  color: string
  iconColor: string
  alert?: boolean
}

function HUDCard({ icon: Icon, label, value, color, iconColor, alert }: HUDCardProps) {
  return (
    <div className={`bg-white rounded-xl border ${alert && value > 0 ? 'border-red-200' : 'border-slate-200'} p-4 flex items-center gap-4`}>
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${color}`}>
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </div>
      <div>
        <p className="text-xs text-slate-500 font-medium">{label}</p>
        <p className={`text-2xl font-bold ${alert && value > 0 ? 'text-red-600' : 'text-slate-800'}`}>
          {value}
        </p>
      </div>
    </div>
  )
}

interface Props {
  stats: HUDStats
}

export function ProductionHUD({ stats }: Props) {
  return (
    <div className="space-y-3">
      {/* Linha 1: pipeline principal */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <HUDCard
          icon={Layers}
          label="Fila Arte Final"
          value={stats.filaArte}
          color="bg-blue-50"
          iconColor="text-blue-600"
        />
        <HUDCard
          icon={Wand2}
          label="Em Tratamento"
          value={stats.emTratamento}
          color="bg-violet-50"
          iconColor="text-violet-600"
        />
        <HUDCard
          icon={PauseCircle}
          label="Pausados"
          value={stats.pausados}
          color="bg-amber-50"
          iconColor="text-amber-600"
          alert
        />
        <HUDCard
          icon={Layers}
          label="Fila Produção"
          value={stats.filaProducao}
          color="bg-orange-50"
          iconColor="text-orange-600"
        />
        <HUDCard
          icon={Hammer}
          label="Em Produção"
          value={stats.emProducao}
          color="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <HUDCard
          icon={CheckCircle2}
          label="Prontos"
          value={stats.prontos}
          color="bg-green-50"
          iconColor="text-green-600"
        />
      </div>

      {/* Linha 2: resumo / alertas */}
      <div className="flex items-center gap-4 px-1">
        <span className="text-sm text-slate-500">
          <span className="font-semibold text-slate-700">{stats.totalAtivos}</span> OSs ativas
        </span>
        {stats.atrasados > 0 && (
          <span className="flex items-center gap-1.5 text-sm font-medium text-red-600">
            <AlertTriangle className="h-4 w-4" />
            {stats.atrasados} {stats.atrasados === 1 ? 'pedido atrasado' : 'pedidos atrasados'} (&gt; 4h)
          </span>
        )}
        {stats.pausados > 0 && (
          <span className="flex items-center gap-1.5 text-sm text-amber-600">
            <PauseCircle className="h-4 w-4" />
            {stats.pausados} aguardando cliente
          </span>
        )}
      </div>
    </div>
  )
}
