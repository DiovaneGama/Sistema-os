import { useState, useEffect, useRef } from 'react'
import { X, AlertCircle, CheckCircle2, Plus, Trash2 } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import type { Client, ClientMachineConfig } from '../../../types/database'
import type { ClientInput } from '../hooks/useClientsFull'

const SUBSTRATE_OPTIONS = ['Metalizado', 'Transparente', 'Perolado', 'Couche', 'Leitoso', 'PET', 'PP', 'PE', 'BOPP', 'Rafia', 'Craft', 'Térmico']
const THICKNESS_OPTIONS = ['1.14', '1.70', '2.84']
const INK_OPTIONS = ['água', 'solvente', 'uv', 'flexo']
const BAND_OPTIONS = ['estreita', 'larga']
const LINEATURE_OPTIONS = [16, 27, 30, 44, 51, 54, 60, 63]

interface Props {
  client?: Client | null
  onClose: () => void
  onSave: (input: ClientInput) => Promise<{ ok: boolean; error?: string }>
}

const empty: ClientInput = {
  company_name: '',
  nickname: '',
  cnpj: null,
  unit_city: null,
  units: [],
  contact_name: null,
  email: null,
  phone: null,
  price_per_cm2: null,
  exempt_min_price: false,
  substrates: [],
  plate_thicknesses: [],
  ink_types: [],
  machines: [],
  active: true,
}

function toInput(c: Client): ClientInput {
  return {
    company_name: c.company_name,
    nickname: c.nickname,
    cnpj: c.cnpj,
    unit_city: c.unit_city,
    units: c.units ?? [],
    contact_name: c.contact_name,
    email: c.email,
    phone: c.phone,
    price_per_cm2: c.price_per_cm2,
    exempt_min_price: c.exempt_min_price ?? false,
    substrates: c.substrates ?? [],
    plate_thicknesses: c.plate_thicknesses ?? [],
    ink_types: c.ink_types ?? [],
    machines: c.machines ?? [],
    active: c.active,
  }
}

function CheckGroup({ label, options, selected, onChange }: {
  label: string
  options: string[]
  selected: string[]
  onChange: (v: string[]) => void
}) {
  function toggle(opt: string) {
    onChange(selected.includes(opt) ? selected.filter(s => s !== opt) : [...selected, opt])
  }
  return (
    <div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map(opt => (
          <button key={opt} type="button" onClick={() => toggle(opt)}
            className={[
              'rounded-full px-3 py-0.5 text-xs font-medium border transition-colors',
              selected.includes(opt)
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-400',
            ].join(' ')}>
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Subcomponente: entrada de unidades ────────────────────────────────────────
function UnitsInput({ values, onChange, pendingInput, onPendingChange }: {
  values: string[]
  onChange: (v: string[]) => void
  pendingInput: string
  onPendingChange: (v: string) => void
}) {
  function add(text = pendingInput) {
    const trimmed = text.trim()
    if (!trimmed || values.includes(trimmed)) return
    onChange([...values, trimmed])
    onPendingChange('')
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={pendingInput}
          onChange={e => onPendingChange(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          placeholder="Ex: São Paulo, Campinas…"
          className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <button type="button" onClick={() => add()} disabled={!pendingInput.trim()}
          className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors">
          <Plus className="h-4 w-4" />
        </button>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {values.map(u => (
            <span key={u} className="flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
              {u}
              <button type="button" onClick={() => onChange(values.filter(v => v !== u))}
                className="text-emerald-400 hover:text-red-500 transition-colors ml-0.5">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Subcomponente: linha de máquina ───────────────────────────────────────────
function MachineRow({
  machine, index, onChange, onRemove,
}: {
  machine: ClientMachineConfig
  index: number
  onChange: (m: ClientMachineConfig) => void
  onRemove: () => void
}) {
  function toggleThickness(t: string) {
    const list = machine.plate_thicknesses ?? []
    const updated = list.includes(t) ? list.filter(x => x !== t) : [...list, t]
    onChange({ ...machine, plate_thicknesses: updated })
  }

  function toggleSubstrate(s: string) {
    const list = machine.substrates ?? []
    const updated = list.includes(s) ? list.filter(x => x !== s) : [...list, s]
    onChange({ ...machine, substrates: updated })
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-slate-400">#{index + 1}</span>
        <input
          type="text"
          value={machine.name}
          onChange={e => onChange({ ...machine, name: e.target.value })}
          placeholder="Nome da máquina (ex: Nilpeter FA-3)"
          className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <button type="button" onClick={onRemove}
          className="rounded-lg p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Tipo de Banda — seleção única */}
      <div>
        <p className="text-xs font-medium text-slate-500 mb-1">Tipo de Banda <span className="text-red-500">*</span></p>
        <div className="flex gap-2">
          {BAND_OPTIONS.map(band => (
            <button key={band} type="button" onClick={() => onChange({ ...machine, band_type: band as 'larga' | 'estreita' })}
              className={[
                'rounded-full px-3 py-0.5 text-xs font-medium border transition-colors',
                machine.band_type === band
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-400',
              ].join(' ')}>
              {band === 'estreita' ? 'Banda Estreita' : 'Banda Larga'}
            </button>
          ))}
        </div>
      </div>

      {/* Lineatura — seleção única */}
      <div>
        <p className="text-xs font-medium text-slate-500 mb-1">Lineatura (lpc) <span className="text-red-500">*</span></p>
        <div className="flex flex-wrap gap-1.5">
          {LINEATURE_OPTIONS.map(lpc => (
            <button key={lpc} type="button" onClick={() => onChange({ ...machine, lineature: lpc })}
              className={[
                'rounded-full px-2.5 py-0.5 text-xs font-medium border transition-colors',
                machine.lineature === lpc
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-400',
              ].join(' ')}>
              {lpc}
            </button>
          ))}
        </div>
      </div>

      {/* Espessuras de fotopolímero */}
      <div>
        <p className="text-xs font-medium text-slate-500 mb-1">Espessura do Fotopolímero (mm)</p>
        <div className="flex flex-wrap gap-1.5">
          {THICKNESS_OPTIONS.map(t => (
            <button key={t} type="button" onClick={() => toggleThickness(t)}
              className={[
                'rounded-full px-2.5 py-0.5 text-xs font-medium border transition-colors',
                (machine.plate_thicknesses ?? []).includes(t)
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-400',
              ].join(' ')}>
              {t} mm
            </button>
          ))}
        </div>
      </div>

      {/* Substratos da máquina */}
      <div>
        <p className="text-xs font-medium text-slate-500 mb-1">Substratos</p>
        <div className="flex flex-wrap gap-1.5">
          {SUBSTRATE_OPTIONS.map(s => (
            <button key={s} type="button" onClick={() => toggleSubstrate(s)}
              className={[
                'rounded-full px-2.5 py-0.5 text-xs font-medium border transition-colors',
                (machine.substrates ?? []).includes(s)
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-400',
              ].join(' ')}>
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Modal principal ───────────────────────────────────────────────────────────
type DupState = 'idle' | 'checking' | 'duplicate' | 'ok'

async function checkDuplicate(field: 'company_name' | 'nickname', value: string, excludeId?: string): Promise<boolean> {
  if (!value.trim()) return false
  let req = (supabase as any)
    .from('clients')
    .select('id')
    .ilike(field, value.trim())
    .limit(1)
  if (excludeId) req = req.neq('id', excludeId)
  const { data } = await req
  return (data?.length ?? 0) > 0
}

export function ClientFormModal({ client, onClose, onSave }: Props) {
  const [form, setForm] = useState<ClientInput>(client ? toInput(client) : empty)
  const [saving, setSaving] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [unitInput, setUnitInput] = useState('')
  const [dupName, setDupName] = useState<DupState>('idle')
  const [dupNick, setDupNick] = useState<DupState>('idle')
  const nameTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const nickTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setForm(client ? toInput(client) : empty)
    setServerError(null)
    setDupName('idle')
    setDupNick('idle')
    setUnitInput('')
  }, [client])

  function set<K extends keyof ClientInput>(key: K, value: ClientInput[K]) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function handleNameChange(value: string) {
    set('company_name', value)
    if (nameTimer.current) clearTimeout(nameTimer.current)
    if (!value.trim()) { setDupName('idle'); return }
    setDupName('checking')
    nameTimer.current = setTimeout(async () => {
      const dup = await checkDuplicate('company_name', value, client?.id)
      setDupName(dup ? 'duplicate' : 'ok')
    }, 500)
  }

  function handleNickChange(value: string) {
    set('nickname', value)
    if (nickTimer.current) clearTimeout(nickTimer.current)
    if (!value.trim()) { setDupNick('idle'); return }
    setDupNick('checking')
    nickTimer.current = setTimeout(async () => {
      const dup = await checkDuplicate('nickname', value, client?.id)
      setDupNick(dup ? 'duplicate' : 'ok')
    }, 500)
  }

  // Máquinas
  function addMachine() {
    set('machines', [...(form.machines ?? []), { name: '', band_type: 'estreita' as const, lineature: 0, plate_thicknesses: [], substrates: [] }])
  }

  function updateMachine(index: number, m: ClientMachineConfig) {
    const updated = [...(form.machines ?? [])]
    updated[index] = m
    set('machines', updated)
  }

  function removeMachine(index: number) {
    set('machines', (form.machines ?? []).filter((_, i) => i !== index))
  }

  const hasDuplicate = dupName === 'duplicate' || dupNick === 'duplicate'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.company_name.trim() || !form.nickname.trim()) return
    if (hasDuplicate) return
    setSaving(true)
    setServerError(null)
    try {
      const pendingUnit = unitInput.trim()
      const finalForm = pendingUnit && !(form.units ?? []).includes(pendingUnit)
        ? { ...form, units: [...(form.units ?? []), pendingUnit] }
        : form
      const result = await onSave(finalForm)
      if (result.ok) {
        onClose()
      } else {
        setServerError(result.error ?? 'Erro ao salvar')
      }
    } catch (e: any) {
      setServerError(e?.message ?? 'Erro inesperado ao salvar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">

        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
          <h2 className="text-base font-bold text-slate-800">
            {client ? 'Editar Cliente' : 'Novo Cliente'}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">

          {/* Identificação */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Identificação</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">Razão Social / Nome <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input type="text" value={form.company_name} onChange={e => handleNameChange(e.target.value)}
                    required placeholder="Ex: Gráfica ABC Ltda"
                    className={['w-full rounded-lg border px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2',
                      dupName === 'duplicate' ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 focus:ring-emerald-500'].join(' ')} />
                  {dupName === 'checking' && <span className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />}
                  {dupName === 'duplicate' && <AlertCircle className="absolute right-2.5 top-2.5 h-4 w-4 text-red-500" />}
                  {dupName === 'ok' && <CheckCircle2 className="absolute right-2.5 top-2.5 h-4 w-4 text-emerald-500" />}
                </div>
                {dupName === 'duplicate' && <p className="mt-1 text-xs text-red-600">Já existe um cliente com este nome.</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Apelido <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input type="text" value={form.nickname} onChange={e => handleNickChange(e.target.value)}
                    required placeholder="Ex: ABC"
                    className={['w-full rounded-lg border px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2',
                      dupNick === 'duplicate' ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 focus:ring-emerald-500'].join(' ')} />
                  {dupNick === 'checking' && <span className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />}
                  {dupNick === 'duplicate' && <AlertCircle className="absolute right-2.5 top-2.5 h-4 w-4 text-red-500" />}
                  {dupNick === 'ok' && <CheckCircle2 className="absolute right-2.5 top-2.5 h-4 w-4 text-emerald-500" />}
                </div>
                {dupNick === 'duplicate' && <p className="mt-1 text-xs text-red-600">Já existe um cliente com este apelido.</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">CNPJ</label>
                <input type="text" value={form.cnpj ?? ''} onChange={e => set('cnpj', e.target.value || null)}
                  placeholder="00.000.000/0001-00" maxLength={18}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">Unidades (Cidades)</label>
                <UnitsInput
                  values={form.units ?? []}
                  onChange={v => set('units', v)}
                  pendingInput={unitInput}
                  onPendingChange={setUnitInput}
                />
              </div>
            </div>
          </div>

          {/* Contato */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Contato</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">Nome do Contato</label>
                <input type="text" value={form.contact_name ?? ''} onChange={e => set('contact_name', e.target.value || null)}
                  placeholder="Ex: João Silva"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">E-mail</label>
                <input type="email" value={form.email ?? ''} onChange={e => set('email', e.target.value || null)}
                  placeholder="contato@empresa.com"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Telefone</label>
                <input type="text" value={form.phone ?? ''} onChange={e => set('phone', e.target.value || null)}
                  placeholder="(11) 99999-0000"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
            </div>
          </div>

          {/* Financeiro */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Financeiro</p>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Preço por cm² (R$)</label>
              <input type="number" min={0} step={0.0001} value={form.price_per_cm2 ?? ''}
                onChange={e => set('price_per_cm2', e.target.value ? Number(e.target.value) : null)}
                placeholder="Ex: 0.0850"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.exempt_min_price ?? false}
                onChange={e => set('exempt_min_price', e.target.checked)}
                className="accent-amber-500 h-3.5 w-3.5"
              />
              <span className="text-xs text-slate-600">Isento da taxa mínima de R$ 25,00 por cor</span>
            </label>
          </div>

          {/* Máquinas */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Máquinas</p>
              <button type="button" onClick={addMachine}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:border-emerald-400 hover:text-emerald-600 transition-colors">
                <Plus className="h-3.5 w-3.5" />
                Adicionar Máquina
              </button>
            </div>

            {(form.machines ?? []).length === 0 ? (
              <p className="text-xs text-slate-400 italic">Nenhuma máquina cadastrada. Clique em "Adicionar Máquina".</p>
            ) : (
              <div className="space-y-2">
                {(form.machines ?? []).map((machine, i) => (
                  <MachineRow
                    key={i}
                    machine={machine}
                    index={i}
                    onChange={m => updateMachine(i, m)}
                    onRemove={() => removeMachine(i)}
                  />
                ))}
              </div>
            )}
          </div>

          {serverError && (
            <p className="rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-xs text-red-700">{serverError}</p>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              Cancelar
            </button>
            <button type="submit"
              disabled={saving || !form.company_name.trim() || !form.nickname.trim() || hasDuplicate || dupName === 'checking' || dupNick === 'checking'}
              className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors">
              {saving ? 'Salvando…' : client ? 'Salvar Alterações' : 'Criar Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
