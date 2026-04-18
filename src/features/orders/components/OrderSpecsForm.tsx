import { useFormContext, Controller } from 'react-hook-form'
import type { OrderSpecsInput } from '../utils/schemas'

const MACHINES_LARGA  = ['ML-1', 'ML-2', 'ML-3', 'Nilpeter', 'Mark Andy']
const MACHINES_ESTREITA = ['ME-1', 'ME-2', 'Etirama', 'Gallus']
const SUBSTRATES = ['Metalizado', 'Transparente', 'BOPP', 'Papel Couché', 'PVC', 'Poliamida', 'Kraft']
const THICKNESSES = ['0.76', '1.14', '1.70', '2.54', '2.84']
const LINEATURES  = [42, 48, 54, 60, 63, 70, 80]

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}

function Input({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${className}`}
    />
  )
}

function Select({ children, className = '', ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${className}`}
    >
      {children}
    </select>
  )
}

function Toggle({ label, name }: { label: string; name: keyof OrderSpecsInput }) {
  const { register, watch } = useFormContext<OrderSpecsInput>()
  const val = watch(name) as boolean
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <div className={['relative h-5 w-9 rounded-full transition-colors', val ? 'bg-emerald-500' : 'bg-slate-200'].join(' ')}>
        <div className={['absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform', val ? 'translate-x-4' : 'translate-x-0.5'].join(' ')} />
        <input {...register(name)} type="checkbox" className="sr-only" />
      </div>
      <span className="text-sm text-slate-700">{label}</span>
    </label>
  )
}

export function OrderSpecsForm({ frozen }: { frozen?: boolean }) {
  const { register, control, watch, formState: { errors } } = useFormContext<OrderSpecsInput>()
  const bandType = watch('band_type')
  const isDisabled = frozen

  return (
    <fieldset disabled={isDisabled} className={isDisabled ? 'opacity-60 pointer-events-none' : ''}>
      <div className="space-y-5">
        {/* Identificação */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nome do Serviço *" error={errors.service_name?.message}>
            <Input {...register('service_name')} placeholder="Ex: Alimentos Oliveira" />
          </Field>
          <Field label="Substrato">
            <Controller name="substrate" control={control} render={({ field }) => (
              <Select {...field} value={field.value ?? ''}>
                <option value="">Selecionar...</option>
                {SUBSTRATES.map(s => <option key={s} value={s}>{s}</option>)}
              </Select>
            )} />
          </Field>
        </div>

        {/* Máquina */}
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-3">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Máquina</h4>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tipo de banda">
              <Controller name="band_type" control={control} render={({ field }) => (
                <Select {...field} value={field.value ?? ''}>
                  <option value="">Selecionar...</option>
                  <option value="larga">Larga</option>
                  <option value="estreita">Estreita</option>
                </Select>
              )} />
            </Field>
            <Field label="Máquina alvo">
              <Controller name="target_machine" control={control} render={({ field }) => (
                <Select {...field} value={field.value ?? ''}>
                  <option value="">Selecionar...</option>
                  {(bandType === 'larga' ? MACHINES_LARGA : bandType === 'estreita' ? MACHINES_ESTREITA : [...MACHINES_LARGA, ...MACHINES_ESTREITA])
                    .map(m => <option key={m} value={m}>{m}</option>)}
                </Select>
              )} />
            </Field>
            <Field label="Tipo de impressão">
              <Controller name="print_type" control={control} render={({ field }) => (
                <Select {...field} value={field.value ?? ''}>
                  <option value="">Selecionar...</option>
                  <option value="interna">Interna</option>
                  <option value="externa">Externa</option>
                </Select>
              )} />
            </Field>
            {bandType === 'larga' && (
              <Field label="Diâmetro do cilindro (mm)">
                <Input {...register('cylinder_diameter')} type="number" step="0.01" placeholder="0.00" />
              </Field>
            )}
            {bandType === 'estreita' && (
              <Field label="Z da engrenagem">
                <Input {...register('gear_z')} type="number" placeholder="Z" />
              </Field>
            )}
          </div>
          <div className="flex gap-4 flex-wrap pt-1">
            <Toggle label="Frente e verso" name="front_and_back" />
          </div>
        </div>

        {/* Clichê */}
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-3">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Clichê</h4>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Espessura (mm)">
              <Controller name="plate_thickness" control={control} render={({ field }) => (
                <Select {...field} value={field.value ?? ''}>
                  <option value="">Selecionar...</option>
                  {THICKNESSES.map(t => <option key={t} value={t}>{t}</option>)}
                </Select>
              )} />
            </Field>
            <Field label="Distorção (%)">
              <Input {...register('distortion_pct')} type="number" step="0.01" placeholder="0.00" />
            </Field>
            <Field label="Lineatura (lpcm)">
              <Controller name="lineature" control={control} render={({ field }) => (
                <Select {...field} value={field.value ?? ''}>
                  <option value="">Selecionar...</option>
                  {LINEATURES.map(l => <option key={l} value={l}>{l}</option>)}
                </Select>
              )} />
            </Field>
          </div>
        </div>

        {/* Layout */}
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-3">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Layout</h4>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Repetições">
              <Input {...register('repetitions')} type="number" placeholder="0" />
            </Field>
            <Field label="Linhas">
              <Input {...register('rows')} type="number" placeholder="0" />
            </Field>
          </div>
          <div className="flex gap-4 flex-wrap pt-1">
            <Toggle label="Tem item conjugado" name="has_conjugated_item" />
            <Toggle label="Arquivo pré-montado" name="is_pre_assembled" />
          </div>
        </div>
      </div>
    </fieldset>
  )
}
