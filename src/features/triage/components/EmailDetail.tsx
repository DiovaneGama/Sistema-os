import { AlertTriangle, CheckCircle2, Clock, EyeOff, Plus, RotateCcw } from 'lucide-react'
import type { MockEmail, EmailStatus } from '../data/mockEmails'

const STATUS_CONFIG: Record<EmailStatus, { label: string; className: string }> = {
  novo:       { label: 'Novo',       className: 'bg-blue-100 text-blue-700' },
  em_triagem: { label: 'Em triagem', className: 'bg-amber-100 text-amber-700' },
  convertido: { label: 'Convertido', className: 'bg-emerald-100 text-emerald-700' },
  ignorado:   { label: 'Ignorado',   className: 'bg-slate-100 text-slate-500' },
}

interface Props {
  email: MockEmail
  onCreateOrder: (email: MockEmail) => void
  onStatusChange: (id: string, status: EmailStatus) => void
}

export function EmailDetail({ email, onCreateOrder, onStatusChange }: Props) {
  const st = STATUS_CONFIG[email.status]

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header do e-mail */}
      <div className="shrink-0 border-b border-slate-200 px-6 py-4">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {email.is_urgent && (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">
                  <AlertTriangle className="h-3 w-3" /> Urgente
                </span>
              )}
              <span className={['inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', st.className].join(' ')}>
                {st.label}
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-800 leading-tight">{email.subject}</h2>
          </div>
        </div>

        {/* Remetente */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600">
            {email.from_name.split(' ').map(n => n[0]).slice(0, 2).join('')}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">{email.from_name}</p>
            <p className="text-xs text-slate-400">{email.from_email}</p>
          </div>
          <p className="ml-auto text-xs text-slate-400">
            {new Date(email.received_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        {/* Dados sugeridos */}
        {(email.suggested_client || email.suggested_briefing) && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 space-y-1">
            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-2">Dados extraídos para OS</p>
            {email.suggested_client && (
              <div className="flex gap-2 text-xs">
                <span className="text-emerald-600 font-medium w-16 shrink-0">Cliente:</span>
                <span className="text-slate-700">{email.suggested_client}</span>
              </div>
            )}
            {email.suggested_briefing && (
              <div className="flex gap-2 text-xs">
                <span className="text-emerald-600 font-medium w-16 shrink-0">Briefing:</span>
                <span className="text-slate-700">{email.suggested_briefing}</span>
              </div>
            )}
            <div className="flex gap-2 text-xs">
              <span className="text-emerald-600 font-medium w-16 shrink-0">Canal:</span>
              <span className="text-slate-700 capitalize">{email.suggested_channel}</span>
            </div>
          </div>
        )}
      </div>

      {/* Corpo do e-mail */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700 leading-relaxed">
          {email.body}
        </pre>
      </div>

      {/* Ações */}
      <div className="shrink-0 border-t border-slate-200 bg-slate-50 px-6 py-3 flex items-center gap-2">
        {email.status !== 'convertido' && email.status !== 'ignorado' && (
          <>
            <button
              onClick={() => onCreateOrder(email)}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors">
              <Plus className="h-4 w-4" />
              Criar OS
            </button>
            <button
              onClick={() => onStatusChange(email.id, email.status === 'em_triagem' ? 'novo' : 'em_triagem')}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">
              <Clock className="h-4 w-4" />
              {email.status === 'em_triagem' ? 'Voltar para Novo' : 'Marcar em Triagem'}
            </button>
            <button
              onClick={() => onStatusChange(email.id, 'ignorado')}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 transition-colors ml-auto">
              <EyeOff className="h-4 w-4" />
              Ignorar
            </button>
          </>
        )}
        {(email.status === 'convertido' || email.status === 'ignorado') && (
          <button
            onClick={() => onStatusChange(email.id, 'novo')}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">
            <RotateCcw className="h-4 w-4" />
            Reabrir
          </button>
        )}
      </div>
    </div>
  )
}
