import { useState } from 'react'
import { Save, X, Pencil } from 'lucide-react'
import type { SystemConfigItem } from '../hooks/useSettings'

const CONFIG_META: Record<string, { label: string; suffix?: string; type: 'number' | 'text'; step?: string }> = {
  custo_cm2_polimero:            { label: 'Custo por cm² de polímero', suffix: 'R$', type: 'number', step: '0.001' },
  teto_desconto_pct:             { label: 'Teto máximo de desconto',   suffix: '%',  type: 'number', step: '1' },
  meta_diaria_os:                { label: 'Meta diária padrão de OSs', suffix: 'OSs/dia', type: 'number', step: '1' },
  prazo_validade_orcamento_dias: { label: 'Prazo de validade do orçamento', suffix: 'dias', type: 'number', step: '1' },
  fuso_horario:                  { label: 'Fuso horário do sistema',   type: 'text' },
}

interface RowProps {
  config: SystemConfigItem
  onSave: (key: string, value: string) => Promise<{ ok: boolean; error?: string }>
}

function ConfigRow({ config, onSave }: RowProps) {
  const meta = CONFIG_META[config.key]
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(config.value)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setSaving(true)
    setError(null)
    const result = await onSave(config.key, draft)
    setSaving(false)
    if (result.ok) {
      setEditing(false)
    } else {
      setError(result.error ?? 'Erro ao salvar')
    }
  }

  function handleCancel() {
    setDraft(config.value)
    setEditing(false)
    setError(null)
  }

  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
      <td className="px-4 py-3">
        <p className="text-sm font-medium text-slate-800">{meta?.label ?? config.key}</p>
        {config.description && <p className="text-xs text-slate-400 mt-0.5">{config.description}</p>}
      </td>
      <td className="px-4 py-3 font-mono text-xs text-slate-500">{config.key}</td>
      <td className="px-4 py-3 w-48">
        {editing ? (
          <div className="flex items-center gap-1.5">
            <input
              autoFocus
              type={meta?.type ?? 'text'}
              step={meta?.step}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleCancel() }}
              className="w-24 rounded border border-emerald-400 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {meta?.suffix && <span className="text-xs text-slate-400">{meta.suffix}</span>}
          </div>
        ) : (
          <span className="text-sm font-semibold text-slate-700">
            {config.value}{meta?.suffix ? ` ${meta.suffix}` : ''}
          </span>
        )}
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </td>
      <td className="px-4 py-3 text-right">
        {editing ? (
          <div className="flex items-center justify-end gap-1">
            <button onClick={handleSave} disabled={saving}
              className="rounded-lg bg-emerald-600 p-1.5 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors">
              <Save className="h-3.5 w-3.5" />
            </button>
            <button onClick={handleCancel}
              className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-100 transition-colors">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <button onClick={() => { setDraft(config.value); setEditing(true) }}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}
      </td>
    </tr>
  )
}

interface Props {
  configs: SystemConfigItem[]
  onSave: (key: string, value: string) => Promise<{ ok: boolean; error?: string }>
}

export function SystemConfigPanel({ configs, onSave }: Props) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="text-sm font-bold text-slate-800">Parâmetros do Sistema</h2>
        <p className="text-xs text-slate-400 mt-0.5">Clique no lápis para editar um valor. Pressione Enter para salvar ou Esc para cancelar.</p>
      </div>
      {configs.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-slate-400">Nenhuma configuração encontrada.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              {['Descrição', 'Chave', 'Valor atual', ''].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {configs.map(c => <ConfigRow key={c.key} config={c} onSave={onSave} />)}
          </tbody>
        </table>
      )}
    </div>
  )
}
