import { useState } from 'react'
import { Loader2, X } from 'lucide-react'
import type { Block1Input, Block2Input, Block3Input } from '../../utils/schemas'
import type { MontageValues } from './MontagePanel'
import { useRole } from '../../../../hooks/useRole'
import { useOperators } from '../../hooks/useCreateOrder'

interface Props {
  orderNumber: string
  clientNickname: string
  block1: Block1Input
  block2: Block2Input
  block3: Block3Input
  colors: string[]
  montage?: MontageValues | null
  operatorId?: string
  submitting: boolean
  onEdit: () => void
  onConfirm: (operatorId?: string) => void
}

const SERVICE_LABELS: Record<string, string> = {
  fechamento: 'Fechamento de Arquivo',
  montagem: 'Montagem',
  reposicao: 'Reposição',
  regravacao: 'Regravação',
}

function Row({ label, value }: { label: string; value: string }) {
  if (!value) return null
  return (
    <div className="flex justify-between py-1.5 border-b border-slate-100 last:border-0">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-xs font-medium text-slate-800 text-right max-w-[60%]">{value}</span>
    </div>
  )
}

export function ConfirmOrderModal({ orderNumber, clientNickname, block1, block2, block3, colors, montage, submitting, onEdit, onConfirm }: Props) {
  const { isAtLeast } = useRole()
  const canDelegate = isAtLeast('gestor_pcp')
  const operators = useOperators()
  const [selectedOperator, setSelectedOperator] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-emerald-50">
          <div>
            <h2 className="text-base font-bold text-slate-800">Revisar e Confirmar OS</h2>
            <p className="text-xs text-emerald-700 font-mono mt-0.5">OS #{orderNumber}</p>
          </div>
          <button onClick={onEdit} className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-slate-600 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 max-h-[60vh] overflow-y-auto space-y-4">
          {/* Identificação */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Identificação</p>
            <Row label="Cliente" value={clientNickname} />
            <Row label="Substrato" value={block2.substrate} />
            <Row label="Tipo de Serviço" value={SERVICE_LABELS[block1.service_type] ?? block1.service_type} />
            <Row label="Nome do Serviço" value={block1.service_name} />
          </div>

          {/* Máquina */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Máquina</p>
            <Row label="Máquina" value={block2.target_machine} />
            <Row label="Tipo de Banda" value={block2.band_type === 'estreita' ? 'Banda Estreita' : 'Banda Larga'} />
            {block2.exit_direction && (
              <Row label="Sentido de Saída" value={block2.exit_direction === 'cabeca' ? '↑ Cabeça' : '↓ Pé'} />
            )}
          </div>

          {/* Clichê */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Clichê</p>
            <Row label="Espessura" value={`${block3.plate_thickness} mm`} />
            <Row label="Lineatura" value={`${block3.lineature} lpc`} />
            {block3.double_tape_mm && <Row label="Fita Dupla-face" value={`${block3.double_tape_mm} mm`} />}
          </div>

          {/* Cores */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Cores ({colors.length})</p>
            <p className="text-xs font-medium text-slate-700">{colors.join(' · ')}</p>
          </div>

          {/* Operador — apenas gestores+ */}
          {canDelegate && (
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Delegação</p>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Operador Responsável</label>
              <select
                value={selectedOperator}
                onChange={e => setSelectedOperator(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Sem delegação (minha responsabilidade)</option>
                {operators.map(o => <option key={o.id} value={o.id}>{o.full_name}</option>)}
              </select>
            </div>
          )}

          {/* Montagem */}
          {montage && (
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Montagem</p>
              <Row label="Z" value={String(montage.gear_z)} />
              <Row label="Pi" value={String(montage.pi_value)} />
              <Row label="Redução" value={`${montage.reduction_mm} mm`} />
              <Row label="Repetições" value={String(montage.repeticoes)} />
              <Row label="Pistas" value={String(montage.pistas)} />
              {montage.gap_pistas > 0 && <Row label="Gap Pistas" value={`${montage.gap_pistas} mm`} />}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-5 py-4 border-t border-slate-100 bg-slate-50">
          <button onClick={onEdit} disabled={submitting}
            className="flex-1 rounded-lg border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition-colors">
            Editar
          </button>
          <button onClick={() => onConfirm(selectedOperator || undefined)} disabled={submitting}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors">
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting ? 'Gerando…' : 'Confirmar e Gerar OS'}
          </button>
        </div>
      </div>
    </div>
  )
}
