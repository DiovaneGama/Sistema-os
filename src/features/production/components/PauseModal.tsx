import { useState, useEffect } from 'react'
import { X, PauseCircle, RefreshCw } from 'lucide-react'
import { supabase } from '../../../lib/supabase'

interface IssueTag {
  id: string
  category: string
  title: string
}

interface Props {
  orderId: string
  orderNumber: string
  reportedBy: string
  onClose: () => void
  onSuccess: () => void
}

const RESPONSIBLE_OPTIONS = [
  { value: 'cobrar_cliente',     label: 'Cobrar Cliente' },
  { value: 'acionar_supervisor', label: 'Acionar Supervisor' },
]

export function PauseModal({ orderId, orderNumber, reportedBy, onClose, onSuccess }: Props) {
  const [tags,        setTags]        = useState<IssueTag[]>([])
  const [category,    setCategory]    = useState('')
  const [title,       setTitle]       = useState('')
  const [newTitle,    setNewTitle]    = useState('')
  const [description, setDescription] = useState('')
  const [responsible, setResponsible] = useState(RESPONSIBLE_OPTIONS[0].value)
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  useEffect(() => {
    async function loadTags() {
      const { data } = await (supabase as any)
        .from('issue_tags')
        .select('id, category, title')
        .order('category')
        .order('title')
      setTags(data ?? [])
    }
    loadTags()
  }, [])

  const categories = [...new Set(tags.map(t => t.category))]
  const titlesForCategory = tags.filter(t => t.category === category).map(t => t.title)

  const effectiveTitle = title === '__new__' || !title ? newTitle.trim() : title

  async function handleSubmit() {
    if (!category.trim() || !effectiveTitle || !responsible) return
    setError(null)
    setSaving(true)

    // Salvar nova tag se for nova combinação (ignora erro de duplicata)
    const tagExists = tags.some(t => t.category === category && t.title === effectiveTitle)
    if (!tagExists) {
      await (supabase as any)
        .from('issue_tags')
        .insert({ category: category.trim(), title: effectiveTitle })
    }

    const { error: issueErr } = await (supabase as any)
      .from('order_issues')
      .insert({
        order_id:    orderId,
        reported_by: reportedBy,
        category:    category.trim(),
        title:       effectiveTitle,
        description: description.trim() || null,
        responsible,
      })

    setSaving(false)
    if (issueErr) { setError(issueErr.message); return }

    onSuccess()
    onClose()
  }

  const canSave = category.trim() && effectiveTitle && responsible

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">

        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <PauseCircle className="h-4 w-4 text-amber-500" />
            <h2 className="text-sm font-bold text-slate-800">Registrar Intercorrência</h2>
            <span className="font-mono text-xs text-slate-400">#{orderNumber}</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">

          {/* Categoria */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Categoria <span className="text-red-400">*</span>
            </label>
            <div className="flex gap-2">
              <select
                value={category}
                onChange={e => { setCategory(e.target.value); setTitle('') }}
                className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <option value="">Selecionar ou digitar...</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {!categories.includes(category) && (
                <input
                  type="text"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  placeholder="Nova categoria"
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              )}
            </div>
            {!categories.includes(category) && category && (
              <p className="mt-1 text-[10px] text-amber-600">Nova categoria — será salva automaticamente</p>
            )}
          </div>

          {/* Título */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Título / Problema <span className="text-red-400">*</span>
            </label>
            {titlesForCategory.length > 0 ? (
              <select
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <option value="">Selecionar...</option>
                {titlesForCategory.map(t => <option key={t} value={t}>{t}</option>)}
                <option value="__new__">+ Novo título...</option>
              </select>
            ) : (
              <input
                type="text"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="Ex: Arquivo fora de especificação"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            )}
            {title === '__new__' && (
              <input
                type="text"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="Digite o novo título..."
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            )}
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Descrição <span className="text-slate-300 font-normal">(opcional)</span>
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Detalhes adicionais..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          {/* Responsável */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Responsável <span className="text-red-400">*</span>
            </label>
            <div className="flex gap-2">
              {RESPONSIBLE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setResponsible(opt.value)}
                  className={[
                    'flex-1 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors',
                    responsible === opt.value
                      ? 'border-amber-400 bg-amber-50 text-amber-700'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50',
                  ].join(' ')}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        <div className="flex gap-2 justify-end border-t border-slate-100 px-6 py-4">
          <button onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !canSave}
            className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50 transition-colors"
          >
            {saving && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
            Pausar OS
          </button>
        </div>
      </div>
    </div>
  )
}
