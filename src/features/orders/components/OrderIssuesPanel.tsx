import { useState } from 'react'
import { AlertCircle, CheckCircle2, Plus, X, RefreshCw } from 'lucide-react'
import {
  useOrderIssues,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  RESPONSIBLE_LABELS,
  type IssueCategory,
  type IssueResponsible,
} from '../hooks/useOrderIssues'
import type { UserRole } from '../../../types/database'

const CATEGORY_OPTIONS: { value: IssueCategory; label: string }[] = [
  { value: 'erro_arquivo',       label: 'Erro no Arquivo' },
  { value: 'falta_info_tecnica', label: 'Falta de Info Técnica' },
  { value: 'duvida_montagem',    label: 'Dúvida de Montagem' },
]

const RESPONSIBLE_OPTIONS: { value: IssueResponsible; label: string }[] = [
  { value: 'cliente',    label: 'Aguardando Cliente' },
  { value: 'supervisor', label: 'Aguardando Supervisor' },
]

function fmt(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const CAN_MANAGE: UserRole[] = ['sysadmin', 'admin_master', 'gestor_pcp', 'arte_finalista']

interface Props {
  orderId: string
  currentProfileId: string
  currentRole: UserRole | null
  orderStatus: string
}

export function OrderIssuesPanel({ orderId, currentProfileId, currentRole, orderStatus }: Props) {
  const { issues, openCount, loading, createIssue, resolveIssue, reload } = useOrderIssues(orderId)
  const [showForm, setShowForm] = useState(false)
  const [category, setCategory] = useState<IssueCategory>('erro_arquivo')
  const [description, setDescription] = useState('')
  const [responsible, setResponsible] = useState<IssueResponsible>('cliente')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [resolvingId, setResolvingId] = useState<string | null>(null)

  const canManage = currentRole ? CAN_MANAGE.includes(currentRole) : false
  const canCreate = canManage && orderStatus === 'tratamento'

  async function handleSubmit() {
    if (!description.trim()) { setFormError('Descrição é obrigatória'); return }
    setSaving(true)
    setFormError(null)
    const result = await createIssue({ category, description: description.trim(), responsible }, currentProfileId)
    setSaving(false)
    if (!result.ok) { setFormError(result.error ?? 'Erro ao reportar'); return }
    setShowForm(false)
    setDescription('')
    setCategory('erro_arquivo')
    setResponsible('cliente')
  }

  async function handleResolve(issueId: string) {
    setResolvingId(issueId)
    await resolveIssue(issueId, currentProfileId)
    setResolvingId(null)
  }

  const title = openCount > 0
    ? `Problemas de Arte (${openCount} aberto${openCount > 1 ? 's' : ''})`
    : 'Problemas de Arte'

  return (
    <div className="rounded-xl border border-amber-200 bg-white overflow-hidden">
      {/* Header do card */}
      <div className="px-5 py-3 border-b border-amber-100 bg-amber-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className={`h-4 w-4 ${openCount > 0 ? 'text-amber-500' : 'text-slate-400'}`} />
          <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={reload} disabled={loading}
            className="p-1 rounded text-slate-400 hover:text-slate-600 transition-colors">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {canCreate && !showForm && (
            <button onClick={() => setShowForm(true)}
              className="flex items-center gap-1 rounded-lg bg-amber-500 px-2.5 py-1 text-xs font-semibold text-white hover:bg-amber-600 transition-colors">
              <Plus className="h-3 w-3" />
              Reportar Problema
            </button>
          )}
        </div>
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* Aviso — só pode criar problema em tratamento */}
        {canManage && orderStatus !== 'tratamento' && orderStatus !== 'pausado' && (
          <p className="text-xs text-slate-400 italic">
            Problemas só podem ser reportados enquanto a OS está em tratamento.
          </p>
        )}

        {/* Formulário inline */}
        {showForm && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Novo Problema</p>
              <button onClick={() => { setShowForm(false); setFormError(null) }}
                className="text-slate-400 hover:text-slate-600">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">Categoria</label>
              <select value={category} onChange={e => setCategory(e.target.value as IssueCategory)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
                {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">Descrição <span className="text-red-400">*</span></label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                placeholder="Descreva o problema encontrado..."
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">Responsável pela resolução</label>
              <select value={responsible} onChange={e => setResponsible(e.target.value as IssueResponsible)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
                {RESPONSIBLE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {formError && <p className="text-xs text-red-500">{formError}</p>}

            <div className="flex gap-2 justify-end">
              <button onClick={() => { setShowForm(false); setFormError(null) }}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 transition-colors">
                Cancelar
              </button>
              <button onClick={handleSubmit} disabled={saving}
                className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 disabled:opacity-50 transition-colors">
                {saving && <RefreshCw className="h-3 w-3 animate-spin" />}
                Reportar e Pausar OS
              </button>
            </div>
          </div>
        )}

        {/* Lista de problemas */}
        {issues.length === 0 && !showForm ? (
          <p className="text-sm text-slate-400 py-2">Nenhum problema registrado.</p>
        ) : (
          <div className="space-y-3">
            {issues.map(issue => (
              <div key={issue.id}
                className={[
                  'rounded-lg border p-3 space-y-2',
                  issue.resolved
                    ? 'border-slate-100 bg-slate-50 opacity-70'
                    : 'border-amber-200 bg-amber-50/50',
                ].join(' ')}>

                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={[
                      'inline-flex rounded-full px-2 py-0.5 text-xs font-semibold',
                      CATEGORY_COLORS[issue.category],
                    ].join(' ')}>
                      {CATEGORY_LABELS[issue.category]}
                    </span>
                    <span className="text-xs text-slate-500">
                      {RESPONSIBLE_LABELS[issue.responsible]}
                    </span>
                    {issue.resolved && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-xs font-semibold">
                        <CheckCircle2 className="h-3 w-3" />
                        Resolvido
                      </span>
                    )}
                  </div>

                  {!issue.resolved && canManage && (
                    <button
                      onClick={() => handleResolve(issue.id)}
                      disabled={resolvingId === issue.id}
                      className="shrink-0 flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                      {resolvingId === issue.id
                        ? <RefreshCw className="h-3 w-3 animate-spin" />
                        : <CheckCircle2 className="h-3 w-3" />}
                      Resolver
                    </button>
                  )}
                </div>

                <p className="text-sm text-slate-700">{issue.description}</p>

                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span>Reportado por <strong className="text-slate-600">{issue.reporter_name ?? '—'}</strong></span>
                  <span>{fmt(issue.created_at)}</span>
                  {issue.resolved && issue.resolver_name && (
                    <span>· Resolvido por <strong className="text-slate-600">{issue.resolver_name}</strong></span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
