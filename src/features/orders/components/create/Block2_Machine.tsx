import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { block2Schema, type Block2Input } from '../../utils/schemas'
import { BlockHeader } from './BlockHeader'
import type { ClientTechProfile } from '../../hooks/useCreateOrder'

interface Props {
  isOpen: boolean
  validated: boolean
  enabled: boolean
  profile: ClientTechProfile | null
  serviceType?: string
  defaultValues?: Partial<Block2Input>
  onToggle: () => void
  onValidated: (data: Block2Input) => void
  onInvalidated?: () => void
}

export function Block2_Machine({ isOpen, validated, enabled, profile, serviceType, defaultValues, onToggle, onValidated, onInvalidated }: Props) {
  const validatedRef = useRef(false)
  const [showExitDir, setShowExitDir] = useState(false)
  const [showConjugated, setShowConjugated] = useState(false)
  const [showAssemblyType, setShowAssemblyType] = useState(false)
  const [hasCameron, setHasCameron] = useState(false)
  const [isInternalPrint, setIsInternalPrint] = useState(false)

  const { register, watch, setValue, getValues, formState: { isValid, errors } } = useForm<Block2Input>({
    resolver: zodResolver(block2Schema),
    mode: 'onChange',
    defaultValues,
  })

  const bandType = watch('band_type')
  const selectedMachine = watch('target_machine')
  const substrateValue = watch('substrate')
  const machine = profile?.machines.find(m => m.name === selectedMachine)

  const hasSubstrateOptions = (machine?.substrates ?? []).length > 0
  const blockedByMontagem = serviceType === 'montagem' && bandType === 'larga'

  // Quando máquina muda: força band_type correto e reseta substrato
  useEffect(() => {
    // Sempre reseta para evitar valores stale de máquina anterior
    setValue('band_type', '' as any, { shouldValidate: false })
    setValue('substrate', '', { shouldValidate: false })
    if (!machine) return
    const bt = (machine.band_type ?? machine.band_types?.[0]) as 'larga' | 'estreita' | undefined
    if (bt) setValue('band_type', bt, { shouldValidate: true, shouldDirty: true, shouldTouch: true })
  }, [selectedMachine])

  // Bloqueia quando montagem + banda larga
  useEffect(() => {
    if (blockedByMontagem && validatedRef.current) {
      validatedRef.current = false
      onInvalidated?.()
    }
  }, [blockedByMontagem])

  // Avança quando todos os campos obrigatórios estão preenchidos
  useEffect(() => {
    if (blockedByMontagem) { validatedRef.current = false; return }
    const substrateOk = !hasSubstrateOptions || !!substrateValue
    const canValidate = !!selectedMachine && !!bandType && substrateOk
    if (canValidate && !validatedRef.current) {
      validatedRef.current = true
      onValidated(getValues())
    } else if (!canValidate) {
      validatedRef.current = false
    }
  }, [selectedMachine, bandType, substrateValue, blockedByMontagem])

  return (
    <div className={['bg-white rounded-xl border p-5 transition-all', enabled ? 'border-slate-200' : 'border-slate-100 opacity-50 pointer-events-none'].join(' ')}>
      <BlockHeader number={2} title="Dados de Máquina" validated={validated} isOpen={isOpen} onToggle={onToggle} />

      <div className={isOpen ? 'mt-4 space-y-4' : 'hidden'}>
        {/* Máquina Alvo */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">
            Máquina Alvo <span className="text-red-500">*</span>
          </label>
          <select {...register('target_machine')}
            disabled={!profile || profile.machines.length === 0}
            className={['w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50 disabled:text-slate-400',
              errors.target_machine ? 'border-red-300' : 'border-slate-200'].join(' ')}>
            <option value="">{!profile ? 'Selecione um cliente no Bloco 1' : 'Selecione a máquina…'}</option>
            {(profile?.machines ?? []).map(m => (
              <option key={m.name} value={m.name}>{m.name}</option>
            ))}
          </select>
          {errors.target_machine && <p className="mt-1 text-xs text-red-600">{errors.target_machine.message}</p>}
        </div>

        {/* Alerta: montagem não permite banda larga */}
        {blockedByMontagem && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            O serviço <strong>Montagem</strong> não é compatível com máquinas de <strong>Banda Larga</strong>. Selecione uma máquina de Banda Estreita para continuar.
          </div>
        )}

        {/* Tipo de Banda + Opcionais na mesma linha */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Tipo de Banda</span>
            {bandType ? (
              <span className={['inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold',
                bandType === 'larga' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'].join(' ')}>
                {bandType === 'larga' ? 'Banda Larga' : 'Banda Estreita'}
              </span>
            ) : (
              <span className="text-xs text-slate-400 italic">—</span>
            )}
            <input type="hidden" {...register('band_type')} />
          </div>

          {/* Sentido de saída inline — só Banda Estreita */}
          {bandType === 'estreita' && (() => {
            const exitDir = watch('exit_direction')
            return (
              <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Opcionais</span>
                <span className="text-xs text-slate-500">Sentido:</span>
                {(['cabeca', 'pe'] as const).map(dir => (
                  <button key={dir} type="button"
                    onClick={() => setValue('exit_direction', exitDir === dir ? undefined : dir, { shouldValidate: true })}
                    className={['rounded-full px-2.5 py-0.5 text-xs font-medium border transition-colors',
                      exitDir === dir
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-400'].join(' ')}>
                    {dir === 'cabeca' ? '↑ Cabeça' : '↓ Pé'}
                  </button>
                ))}
              </div>
            )
          })()}
        </div>

        {/* Substrato / Material */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">
            Substrato / Material <span className="text-red-500">*</span>
          </label>
          <select {...register('substrate', { onChange: () => {} })}
            disabled={!selectedMachine || (machine?.substrates ?? []).length === 0}
            className={['w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50 disabled:text-slate-400',
              errors.substrate ? 'border-red-300' : 'border-slate-200'].join(' ')}>
            <option value="">{!selectedMachine ? 'Selecione a máquina primeiro' : (machine?.substrates ?? []).length === 0 ? 'Sem substratos cadastrados' : 'Selecione o substrato…'}</option>
            {(machine?.substrates ?? []).map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {errors.substrate && <p className="mt-1 text-xs text-red-600">{errors.substrate.message}</p>}
        </div>

        {/* Campos exclusivos de Banda Larga */}
        {bandType === 'larga' && (
          <>
            {/* Opcionais em linha — visíveis antes dos obrigatórios */}
            <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2.5 flex flex-wrap items-start gap-x-4 gap-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide shrink-0 mt-0.5">Opcionais</span>

              {/* Cameron */}
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input type="checkbox" checked={hasCameron}
                  onChange={e => { setHasCameron(e.target.checked); setValue('has_cameron', e.target.checked || undefined) }}
                  className="accent-emerald-600 h-3.5 w-3.5" />
                <span className="text-xs text-slate-600">Cameron</span>
              </label>

              {/* Impressão Interna */}
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input type="checkbox" checked={isInternalPrint}
                  onChange={e => { setIsInternalPrint(e.target.checked); setValue('is_internal_print', e.target.checked || undefined) }}
                  className="accent-emerald-600 h-3.5 w-3.5" />
                <span className="text-xs text-slate-600">Impressão Interna</span>
              </label>

              {/* Conjugado */}
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input type="checkbox" checked={showConjugated}
                  onChange={e => { setShowConjugated(e.target.checked); setValue('has_conjugated', e.target.checked || undefined) }}
                  className="accent-emerald-600 h-3.5 w-3.5" />
                <span className="text-xs text-slate-600">Conjugado</span>
              </label>

              {/* Tipo de montagem — expande inline quando conjugado marcado */}
              {showConjugated && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-slate-500">Tipo:</span>
                  {([
                    { value: 'boca_boca', label: 'Boca c/ Boca' },
                    { value: 'pe_pe',     label: 'Pé c/ Pé' },
                    { value: 'pe_boca',   label: 'Pé c/ Boca' },
                  ] as const).map(opt => (
                    <label key={opt.value} className="flex items-center gap-1 cursor-pointer">
                      <input type="radio" value={opt.value} {...register('assembly_type')} className="accent-emerald-600 h-3.5 w-3.5" />
                      <span className="text-xs text-slate-600">{opt.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Cilindro, Passo, Pistas, Repetições */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Cilindro (mm) <span className="text-red-500">*</span>
                </label>
                <input type="number" min={0} step={0.1} placeholder="Ex: 406.40"
                  {...register('cilindro_mm', { valueAsNumber: true })}
                  className={['w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500',
                    errors.cilindro_mm ? 'border-red-300' : 'border-slate-200'].join(' ')} />
                {errors.cilindro_mm && <p className="mt-1 text-xs text-red-600">{errors.cilindro_mm.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Passo (mm) <span className="text-red-500">*</span>
                </label>
                <input type="number" min={0} step={0.01} placeholder="Ex: 203.20"
                  {...register('passo_larga_mm', { valueAsNumber: true })}
                  className={['w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500',
                    errors.passo_larga_mm ? 'border-red-300' : 'border-slate-200'].join(' ')} />
                {errors.passo_larga_mm && <p className="mt-1 text-xs text-red-600">{errors.passo_larga_mm.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Qtd. Pistas <span className="text-red-500">*</span>
                </label>
                <input type="number" min={1} step={1} placeholder="Ex: 3"
                  {...register('pistas_larga', { valueAsNumber: true })}
                  className={['w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500',
                    errors.pistas_larga ? 'border-red-300' : 'border-slate-200'].join(' ')} />
                {errors.pistas_larga && <p className="mt-1 text-xs text-red-600">{errors.pistas_larga.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Qtd. Repetições <span className="text-red-500">*</span>
                </label>
                <input type="number" min={1} step={1} placeholder="Ex: 6"
                  {...register('repeticoes_larga', { valueAsNumber: true })}
                  className={['w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500',
                    errors.repeticoes_larga ? 'border-red-300' : 'border-slate-200'].join(' ')} />
                {errors.repeticoes_larga && <p className="mt-1 text-xs text-red-600">{errors.repeticoes_larga.message}</p>}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
