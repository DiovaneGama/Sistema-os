import { useState } from 'react'
import { X, Trash2, RefreshCw, AlertTriangle } from 'lucide-react'
import { createScrapRecord, SCRAP_REASONS, type CreateScrapInput } from '../hooks/useScrapRecords'

interface Props {
  orderId: string
  orderNumber: string
  reportedBy: string
  onClose: () => void
  onSuccess: () => void
}

export function ScrapModal({ orderId, orderNumber, reportedBy, onClose, onSuccess }: Props) {
  const [reason, setReason] = useState(SCRAP_REASONS[0].value)
  const [failureStage, setFailureStage] = useState('')
  const [lostWidth, setLostWidth] = useState('')
  const [lostHeight, setLostHeight] = useState('')
  const [financialLoss, setFinancialLoss] = useState('')
  const [requiresArtFix, setRequiresArtFix] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const area = (parseFloat(lostWidth) || 0) * (parseFloat(lostHeight) || 0)

  async function handleSubmit() {
    setError(null)
    setSaving(true)

    const input: CreateScrapInput = {
      reason,
      failure_stage:    failureStage.trim(),
      lost_width_cm:    parseFloat(lostWidth) || null,
      lost_height_cm:   parseFloat(lostHeight) || null,
      financial_loss:   parseFloat(financialLoss) || null,
      requires_art_fix: requiresArtFix,
    }

    const result = await createScrapRecord(orderId, reportedBy, input)
    setSaving(false)

    if (!result.ok) { setError(result.error ?? 'Erro ao registrar'); return }
    onSuccess()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <Trash2 className="h-4 w-4 text-red-500" />
            <h2 className="text-sm font-bold text-slate-800">Registrar Refugo</h2>
            <span className="font-mono text-xs text-slate-400">#{orderNumber}</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">

          {/* Motivo */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Motivo do Refugo <span className="text-red-400">*</span>
            </label>
            <select value={reason} onChange={e => setReason(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400">
              {SCRAP_REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>

          {/* Etapa / Máquina */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Etapa / Máquina <span className="text-slate-300 font-normal">(opcional)</span>
            </label>
            <input
              type="text"
              value={failureStage}
              onChange={e => setFailureStage(e.target.value)}
              placeholder="Ex: Lavadora Aquaflex, Mesa de Exposição"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          </div>

          {/* Dimensões */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Área Perdida (cm)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number" min={0} step={0.1}
                value={lostWidth} onChange={e => setLostWidth(e.target.value)}
                placeholder="Largura"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
              />
              <span className="text-slate-400 text-sm shrink-0">×</span>
              <input
                type="number" min={0} step={0.1}
                value={lostHeight} onChange={e => setLostHeight(e.target.value)}
                placeholder="Altura"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
              />
            </div>
            {area > 0 && (
              <p className="mt-1 text-xs text-slate-400">
                Área calculada: <strong>{area.toFixed(2)} cm²</strong>
              </p>
            )}
          </div>

          {/* Perda financeira */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Perda Financeira (R$) <span className="text-slate-300 font-normal">(opcional)</span>
            </label>
            <input
              type="number" min={0} step={0.01}
              value={financialLoss} onChange={e => setFinancialLoss(e.target.value)}
              placeholder="0,00"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          </div>

          {/* Erro de arte */}
          <label className={[
            'flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors',
            requiresArtFix
              ? 'border-amber-300 bg-amber-50'
              : 'border-slate-200 hover:bg-slate-50',
          ].join(' ')}>
            <input
              type="checkbox"
              checked={requiresArtFix}
              onChange={e => setRequiresArtFix(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded accent-amber-500"
            />
            <div>
              <p className="text-sm font-semibold text-slate-700">Erro de Arte</p>
              <p className="text-xs text-slate-400 mt-0.5">
                O problema foi causado por falha no arquivo. Isso <strong>reverterá a comissão</strong> do arte finalista desta OS.
              </p>
            </div>
          </label>

          {requiresArtFix && (
            <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">
                A comissão do arte finalista desta OS será automaticamente revertida ao salvar.
              </p>
            </div>
          )}

          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex gap-2 justify-end border-t border-slate-100 px-6 py-4">
          <button onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
            Cancelar
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors">
            {saving && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
            Registrar Refugo
          </button>
        </div>
      </div>
    </div>
  )
}
