import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X, Building2, ChevronDown, ChevronUp } from 'lucide-react'
import { newClientSchema, type NewClientInput } from '../utils/schemas'
import { useClients } from '../hooks/useClients'
import type { ClientOption } from '../hooks/useClients'

const SUBSTRATE_OPTIONS = ['Metalizado', 'Transparente', 'BOPP', 'Papel', 'PVC', 'Poliamida', 'Kraft']
const THICKNESS_OPTIONS = ['0.76', '1.14', '1.70', '2.54', '2.84']
const INK_OPTIONS = ['Água', 'Solvente', 'UV', 'Base água', 'Energia']

interface Props {
  onClose: () => void
  onCreated: (client: ClientOption) => void
}

function CheckChip({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={[
        'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
        checked
          ? 'bg-emerald-600 border-emerald-600 text-white'
          : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-400',
      ].join(' ')}
    >
      {label}
    </button>
  )
}

export function NewClientModal({ onClose, onCreated }: Props) {
  const { createClient } = useClients()
  const [saving, setSaving] = useState(false)
  const [showTechnical, setShowTechnical] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, control, handleSubmit, setValue, watch, formState: { errors } } = useForm<NewClientInput>({
    resolver: zodResolver(newClientSchema),
    defaultValues: {
      substrates: [],
      plate_thicknesses: [],
      ink_types: [],
    },
  })

  const substrates     = watch('substrates')
  const thicknesses    = watch('plate_thicknesses')
  const inkTypes       = watch('ink_types')

  function toggleArray(field: 'substrates' | 'plate_thicknesses' | 'ink_types', value: string) {
    const current = field === 'substrates' ? substrates : field === 'plate_thicknesses' ? thicknesses : inkTypes
    const updated = current.includes(value) ? current.filter(v => v !== value) : [...current, value]
    setValue(field, updated)
  }

  async function onSubmit(data: NewClientInput) {
    setSaving(true)
    setServerError(null)
    const result = await createClient(data)
    setSaving(false)
    if (!result) { setServerError('Erro ao salvar cliente. Tente novamente.'); return }
    onCreated(result)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
              <Building2 className="h-4 w-4 text-emerald-700" />
            </div>
            <h2 className="text-base font-semibold text-slate-800">Novo Cliente</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto">
          <div className="px-6 py-4 space-y-4">
            {/* Comercial */}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">Razão Social *</label>
                <input {...register('company_name')} placeholder="Ex: Indústria Têxtil S.A."
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                {errors.company_name && <p className="mt-1 text-xs text-red-600">{errors.company_name.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Apelido *</label>
                <input {...register('nickname')} placeholder="Ex: Etitec"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                {errors.nickname && <p className="mt-1 text-xs text-red-600">{errors.nickname.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Cidade / Filial</label>
                <input {...register('unit_city')} placeholder="Ex: São Paulo"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Contato</label>
                <input {...register('contact_name')} placeholder="Nome"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">E-mail</label>
                <input {...register('email')} type="email" placeholder="contato@empresa.com.br"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Telefone</label>
                <input {...register('phone')} placeholder="(00) 90000-0000"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Preço por cm² (R$)</label>
                <Controller name="price_per_cm2" control={control} render={({ field }) => (
                  <input {...field} type="number" step="0.0001" placeholder="0,0000"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                )} />
              </div>
            </div>

            {/* Perfil técnico (expansível) */}
            <button
              type="button"
              onClick={() => setShowTechnical(v => !v)}
              className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <span>Perfil técnico</span>
              {showTechnical ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {showTechnical && (
              <div className="space-y-3 pl-1">
                <div>
                  <p className="text-xs font-medium text-slate-600 mb-2">Substratos</p>
                  <div className="flex flex-wrap gap-2">
                    {SUBSTRATE_OPTIONS.map(s => (
                      <CheckChip key={s} label={s} checked={substrates.includes(s)} onToggle={() => toggleArray('substrates', s)} />
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-600 mb-2">Espessuras de clichê (mm)</p>
                  <div className="flex flex-wrap gap-2">
                    {THICKNESS_OPTIONS.map(t => (
                      <CheckChip key={t} label={t} checked={thicknesses.includes(t)} onToggle={() => toggleArray('plate_thicknesses', t)} />
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-600 mb-2">Tipos de tinta</p>
                  <div className="flex flex-wrap gap-2">
                    {INK_OPTIONS.map(i => (
                      <CheckChip key={i} label={i} checked={inkTypes.includes(i)} onToggle={() => toggleArray('ink_types', i)} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {serverError && (
              <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">{serverError}</p>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2">
            <button type="button" onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 transition-colors">
              {saving ? 'Salvando...' : 'Cadastrar Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
