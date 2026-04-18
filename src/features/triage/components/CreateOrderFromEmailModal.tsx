import { useState } from 'react'
import { X, AlertTriangle } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import type { MockEmail } from '../data/mockEmails'

interface Props {
  email: MockEmail
  onClose: () => void
  onCreated: (emailId: string) => void
}

const CHANNEL_OPTIONS = [
  { value: 'email',     label: 'E-mail' },
  { value: 'whatsapp',  label: 'WhatsApp' },
  { value: 'balcao',    label: 'Balcão' },
  { value: 'telefone',  label: 'Telefone' },
  { value: 'orcamento', label: 'Orçamento' },
  { value: 'outros',    label: 'Outros' },
]

export function CreateOrderFromEmailModal({ email, onClose, onCreated }: Props) {
  const [briefing, setBriefing] = useState(email.suggested_briefing ?? '')
  const [channel, setChannel] = useState(email.suggested_channel)
  const [isUrgent, setIsUrgent] = useState(email.is_urgent)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      // Busca o cliente pelo nickname sugerido
      let clientId: string | null = null
      if (email.suggested_client) {
        const { data } = await (supabase as any)
          .from('clients')
          .select('id')
          .ilike('nickname', email.suggested_client)
          .limit(1)
          .single()
        clientId = data?.id ?? null
      }

      const { data, error: err } = await (supabase as any)
        .from('orders')
        .insert({
          client_id: clientId,
          channel,
          is_urgent: isUrgent,
          is_rework: false,
          briefing: briefing || null,
          status: 'fila_arte',
          queued_at: new Date().toISOString(),
        })
        .select('id')
        .single()

      if (err) throw err

      onCreated(email.id)
    } catch (e: any) {
      setError(e?.message ?? 'Erro ao criar OS')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-bold text-slate-800">Criar OS a partir do e-mail</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Origem */}
        <div className="px-6 pt-4">
          <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-xs text-slate-500 space-y-1">
            <p><span className="font-semibold text-slate-700">De:</span> {email.from_name} &lt;{email.from_email}&gt;</p>
            <p><span className="font-semibold text-slate-700">Assunto:</span> {email.subject}</p>
            {email.suggested_client && (
              <p><span className="font-semibold text-slate-700">Cliente:</span> {email.suggested_client}</p>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* Briefing */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Briefing</label>
            <textarea
              rows={3}
              value={briefing}
              onChange={e => setBriefing(e.target.value)}
              placeholder="Descreva o que foi solicitado..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          {/* Canal + Urgente */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-600 mb-1">Canal de entrada</label>
              <select
                value={channel}
                onChange={e => setChannel(e.target.value as any)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                {CHANNEL_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 cursor-pointer pb-2">
                <input
                  type="checkbox"
                  checked={isUrgent}
                  onChange={e => setIsUrgent(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-red-500 focus:ring-red-400"
                />
                <span className="flex items-center gap-1 text-sm font-medium text-slate-700">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  Urgente
                </span>
              </label>
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-xs text-red-700">{error}</p>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-1 border-t border-slate-100">
            <button type="button" onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors">
              {saving ? 'Criando OS…' : 'Confirmar e Criar OS'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
