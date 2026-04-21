import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { block3Schema, type Block3Input } from '../../utils/schemas'
import { BlockHeader } from './BlockHeader'
import type { ClientTechProfile, ClientMachine } from '../../hooks/useCreateOrder'

const DOUBLE_TAPE_OPTIONS = ['0.38', '0.50']

interface Props {
  isOpen: boolean
  validated: boolean
  enabled: boolean
  profile: ClientTechProfile | null
  selectedMachine: string
  defaultValues?: Partial<Block3Input>
  onToggle: () => void
  onValidated: (data: Block3Input) => void
}

export function Block3_Cliche({ isOpen, validated, enabled, profile, selectedMachine, defaultValues, onToggle, onValidated }: Props) {
  const validatedRef = useRef(false)
  const onValidatedRef = useRef(onValidated)
  useEffect(() => { onValidatedRef.current = onValidated }, [onValidated])
  const [showTape, setShowTape] = useState(false)

  const { register, watch, setValue, getValues, trigger, reset, formState: { isValid, errors } } = useForm<Block3Input>({
    resolver: zodResolver(block3Schema),
    mode: 'onChange',
    defaultValues,
  })

  useEffect(() => {
    if (defaultValues && Object.keys(defaultValues).length > 0) {
      reset(defaultValues, { keepDefaultValues: false })
    }
  }, [JSON.stringify(defaultValues)])

  // Re-aplica após máquina e perfil carregarem (selects de espessura/lineatura dependem deles)
  useEffect(() => {
    if (defaultValues?.plate_thickness && selectedMachine && profile?.machines?.length) {
      reset(defaultValues, { keepDefaultValues: false })
    }
  }, [selectedMachine, profile?.machines?.length])

  const machine: ClientMachine | undefined = profile?.machines.find(m => m.name === selectedMachine)
  const lineatures: number[] = machine
    ? (machine.lineature > 0 ? [machine.lineature] : (machine.lineatures ?? []))
    : []
  const thicknesses = (machine?.plate_thicknesses ?? []).length > 0
    ? (machine?.plate_thicknesses ?? [])
    : (profile?.plate_thicknesses ?? [])

  const isAutoFilled = lineatures.length === 1 && thicknesses.length === 1
  const plateVal = watch('plate_thickness')
  const lineatureVal = watch('lineature')

  // Auto-fill quando só existe uma opção
  useEffect(() => {
    if (!selectedMachine) return
    if (lineatures.length === 1)
      setValue('lineature', String(lineatures[0]), { shouldDirty: true, shouldTouch: true })
    if (thicknesses.length === 1)
      setValue('plate_thickness', thicknesses[0], { shouldDirty: true, shouldTouch: true })
  }, [selectedMachine])

  // Avança sempre que os dois campos obrigatórios estiverem preenchidos
  useEffect(() => {
    if (!plateVal || !lineatureVal) {
      validatedRef.current = false
      return
    }
    if (!validatedRef.current) {
      validatedRef.current = true
      onValidatedRef.current(getValues())
    }
  }, [plateVal, lineatureVal])

  function handleContinue() {
    validatedRef.current = true
    onValidatedRef.current(getValues())
  }

  return (
    <div className={['bg-white rounded-xl border p-5 transition-all', enabled ? 'border-slate-200' : 'border-slate-100 opacity-50 pointer-events-none'].join(' ')}>
      <BlockHeader number={3} title="Especificações do Clichê" validated={validated} isOpen={isOpen} onToggle={onToggle} />

      <div className={isOpen ? 'mt-4 space-y-4' : 'hidden'}>
        {/* Espessura */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">
            Espessura da Chapa <span className="text-red-500">*</span>
          </label>
          <select {...register('plate_thickness', {})}
            disabled={thicknesses.length === 0}
            className={['w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50 disabled:text-slate-400',
              errors.plate_thickness ? 'border-red-300' : 'border-slate-200'].join(' ')}>
            <option value="">Selecione a espessura…</option>
            {thicknesses.map(t => <option key={t} value={t}>{t} mm</option>)}
          </select>
          {errors.plate_thickness && <p className="mt-1 text-xs text-red-600">{errors.plate_thickness.message}</p>}
        </div>

        {/* Fita Dupla-face — opcional inline entre Espessura e Lineatura */}
        <div className="flex items-center gap-3 flex-wrap rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide shrink-0">Opcional</span>
          <span className="text-xs text-slate-500 shrink-0">Fita dupla-face</span>
          {DOUBLE_TAPE_OPTIONS.map(t => (
            <label key={t} className="flex items-center gap-1.5 cursor-pointer">
              <input type="radio" value={t} {...register('double_tape_mm')}
                className="accent-emerald-600 h-3.5 w-3.5" />
              <span className="text-xs text-slate-600">{t} mm</span>
            </label>
          ))}
          <button type="button" onClick={() => setValue('double_tape_mm', undefined)}
            className="text-xs text-slate-400 hover:text-red-500 transition-colors ml-1">
            limpar
          </button>
        </div>

        {/* Lineatura */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">
            Lineatura <span className="text-red-500">*</span>
          </label>
          <select {...register('lineature', {})}
            disabled={lineatures.length === 0}
            className={['w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50 disabled:text-slate-400',
              errors.lineature ? 'border-red-300' : 'border-slate-200'].join(' ')}>
            <option value="">{!selectedMachine ? 'Selecione a máquina no Bloco 2' : 'Selecione a lineatura…'}</option>
            {lineatures.map(l => <option key={l} value={String(l)}>{l} lpc</option>)}
          </select>
          {errors.lineature && <p className="mt-1 text-xs text-red-600">{errors.lineature.message}</p>}
        </div>

        {/* Botão Continuar — só aparece quando campos foram auto-preenchidos */}
        {isAutoFilled && !validated && (
          <div className="flex justify-end">
            <button type="button" onClick={handleContinue}
              className="rounded-lg bg-emerald-600 px-6 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors">
              Continuar →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
