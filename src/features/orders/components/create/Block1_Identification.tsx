import { useState, useRef, useEffect } from 'react'
import { Upload, X, Plus } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { block1Schema, type Block1Input, SERVICE_TYPES } from '../../utils/schemas'
import { ClientSearchInput } from '../ClientSearchInput'
import { ClientFormModal } from '../../../clients/components/ClientFormModal'
import { useClientProfile } from '../../hooks/useCreateOrder'
import { useAuth } from '../../../../hooks/useAuth'
import { supabase } from '../../../../lib/supabase'
import { BlockHeader } from './BlockHeader'
import type { ClientOption } from '../../hooks/useClients'

interface Props {
  isOpen: boolean
  validated: boolean
  enabled: boolean
  defaultValues?: Partial<Block1Input>
  initialClientLabel?: string
  thumbnail: string | null
  onToggle: () => void
  onThumbnailChange: (file: File | null, preview: string | null) => void
  onValidated: (data: Block1Input) => void
}

export function Block1_Identification({
  isOpen, validated, enabled, defaultValues, initialClientLabel, thumbnail,
  onToggle, onThumbnailChange, onValidated,
}: Props) {
  const { user } = useAuth()

  const [showClientModal, setShowClientModal] = useState(false)
  const [uploadErr, setUploadErr] = useState<string | null>(null)
  const validatedRef = useRef(false)

  const { register, watch, setValue, getValues, trigger, reset, formState: { isValid, errors } } = useForm<Block1Input>({
    resolver: zodResolver(block1Schema),
    mode: 'onBlur',
    defaultValues: { operator_id: user?.id, ...defaultValues },
  })

  // Re-aplica defaultValues quando chegam após o mount (draft restaurado)
  useEffect(() => {
    if (defaultValues && Object.keys(defaultValues).length > 0) {
      reset({ operator_id: user?.id, ...defaultValues })
    }
  }, [JSON.stringify(defaultValues)])

  const clientId = watch('client_id')
  const serviceType = watch('service_type')
  const { profile } = useClientProfile(clientId ?? null)

  // Re-aplica unit salvo quando as opções do cliente carregam
  useEffect(() => {
    const savedUnit = defaultValues?.unit
    if (savedUnit && profile?.units?.includes(savedUnit)) {
      setValue('unit', savedUnit, { shouldValidate: true })
    }
  }, [profile?.units])

  // Primeira validação: auto-avança
  useEffect(() => {
    if (isValid && !validatedRef.current) {
      validatedRef.current = true
      onValidated(getValues())
    } else if (!isValid) {
      validatedRef.current = false
    }
  }, [isValid])

  // Sincroniza dados quando campos-chave mudam com o form já válido
  useEffect(() => {
    if (isValid && validatedRef.current) {
      onValidated(getValues())
    }
  }, [serviceType, clientId])

  function handleClientChange(id: string) {
    setValue('client_id', id, { shouldValidate: true })
    setValue('unit', '', { shouldValidate: false })
    trigger('client_id')
  }

  function handleClientCreated(c: ClientOption) {
    setValue('client_id', c.id, { shouldValidate: true })
    setShowClientModal(false)
  }

  function handlePaste(e: React.ClipboardEvent) {
    const item = Array.from(e.clipboardData.items).find(i => i.type.startsWith('image/'))
    if (!item) return
    const file = item.getAsFile()
    if (!file) return
    setUploadErr(null)
    onThumbnailChange(file, URL.createObjectURL(file))
  }

  return (
    <div
      className={['bg-white rounded-xl border p-5 transition-all', enabled ? 'border-slate-200' : 'border-slate-100 opacity-50 pointer-events-none'].join(' ')}
      onPaste={handlePaste}
    >
      <BlockHeader number={1} title="Identificação Comercial" validated={validated} isOpen={isOpen} onToggle={onToggle} />

      <div className={isOpen ? 'mt-4' : 'hidden'}>
        {/* Layout: thumbnail à esquerda, todos os campos à direita */}
        <div className="flex gap-5 items-start">

          {/* Thumbnail */}
          <div className="shrink-0">
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Imagem <span className="text-red-500">*</span>
            </label>
            {thumbnail ? (
              <div className="relative inline-block">
                <img src={thumbnail} alt="preview" className="h-[225px] w-[225px] rounded-lg border border-slate-200 object-cover" />
                <button type="button" onClick={() => onThumbnailChange(null, null)}
                  className="absolute -top-2 -right-2 rounded-full bg-white border border-slate-200 p-0.5 text-slate-400 hover:text-red-500 shadow-sm transition-colors">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 h-[225px] w-[225px] rounded-lg border-2 border-dashed border-slate-200 text-slate-400">
                <Upload className="h-6 w-6" />
                <span className="text-xs text-center leading-tight px-2">Cole a imagem<br/><kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-slate-500">Ctrl+V</kbd></span>
              </div>
            )}
            {uploadErr && <p className="mt-1 text-xs text-red-600">{uploadErr}</p>}
          </div>

          {/* Campos à direita — altura fixa igual ao thumbnail, distribuídos com justify-between */}
          <div className="flex-1 flex flex-col justify-between" style={{ height: '245px' }}>
            {/* Nome do Serviço */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Nome do Serviço <span className="text-red-500">*</span>
              </label>
              <input {...register('service_name')} type="text" placeholder="Ex: Rótulo Vinho Tinto"
                className={['w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500',
                  errors.service_name ? 'border-red-300' : 'border-slate-200'].join(' ')} />
              {errors.service_name && <p className="mt-1 text-xs text-red-600">{errors.service_name.message}</p>}
            </div>

            {/* Cliente + Unidade */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Cliente <span className="text-red-500">*</span>
                </label>
                <ClientSearchInput
                  value={clientId ?? ''}
                  onChange={(id, _client) => handleClientChange(id)}
                  onCreateNew={() => setShowClientModal(true)}
                  error={errors.client_id?.message}
                  initialLabel={initialClientLabel}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Unidade <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('unit', { onChange: () => trigger('unit') })}
                  disabled={!clientId || (profile?.units ?? []).length === 0}
                  className={['w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50 disabled:text-slate-400',
                    errors.unit ? 'border-red-300' : 'border-slate-200'].join(' ')}>
                  <option value="">{!clientId ? 'Selecione um cliente' : (profile?.units ?? []).length === 0 ? 'Sem unidades cadastradas' : 'Selecione a unidade…'}</option>
                  {(profile?.units ?? []).map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
                {errors.unit && <p className="mt-1 text-xs text-red-600">{errors.unit.message}</p>}
              </div>
            </div>

            {/* Tipo de Serviço */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Tipo de Serviço <span className="text-red-500">*</span>
              </label>
              <select {...register('service_type', { onChange: () => trigger('service_type') })}
                className={['w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500',
                  errors.service_type ? 'border-red-300' : 'border-slate-200'].join(' ')}>
                <option value="">Selecione…</option>
                {SERVICE_TYPES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              {errors.service_type && <p className="mt-1 text-xs text-red-600">{errors.service_type.message}</p>}
            </div>
          </div>{/* fim campos */}
        </div>{/* fim flex */}
      </div>

      {showClientModal && (
        <ClientFormModal
          onClose={() => setShowClientModal(false)}
          onSave={async (input) => {
            const { data, error } = await (supabase as any)
              .from('clients')
              .insert({ ...input })
              .select('id, nickname, company_name, units')
              .single()
            if (error) return { ok: false, error: error.message }
            handleClientCreated({ id: data.id, nickname: data.nickname, company_name: data.company_name, unit_city: null, units: data.units ?? [] })
            return { ok: true }
          }}
        />
      )}
    </div>
  )
}
