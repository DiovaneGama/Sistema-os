import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Zap, RotateCcw, Upload, X, Loader2 } from 'lucide-react'
import { newOrderSchema, type NewOrderInput } from './utils/schemas'
import { useOrderMutations } from './hooks/useOrders'
import { ClientSearchInput } from './components/ClientSearchInput'
import { ClientFormModal } from '../clients/components/ClientFormModal'
import type { ClientOption } from './hooks/useClients'
import { supabase } from '../../lib/supabase'

const CHANNEL_OPTIONS = [
  { value: 'whatsapp',  label: 'WhatsApp' },
  { value: 'balcao',    label: 'Balcão' },
  { value: 'telefone',  label: 'Telefone' },
  { value: 'email',     label: 'E-mail' },
  { value: 'orcamento', label: 'Orçamento' },
  { value: 'outros',    label: 'Outros' },
] as const

export function NewOrderPage() {
  const navigate = useNavigate()
  const { createOrder } = useOrderMutations()

  const [showClientModal, setShowClientModal] = useState(false)
  const [thumbnail, setThumbnail] = useState<File | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [globalError, setGlobalError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<NewOrderInput>({
    resolver: zodResolver(newOrderSchema),
    defaultValues: {
      is_urgent: false,
      is_rework: false,
    },
  })

  const isUrgent  = watch('is_urgent')
  const isRework  = watch('is_rework')
  const clientId  = watch('client_id')

  function handleClientChange(id: string, client: ClientOption | null) {
    setValue('client_id', id, { shouldValidate: true })
  }

  function handleClientCreated(newClient: ClientOption) {
    setValue('client_id', newClient.id, { shouldValidate: true })
    setShowClientModal(false)
  }

  function handleThumbnailChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError(null)

    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      setUploadError('Apenas imagens JPG, PNG ou WebP são permitidas.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Tamanho máximo: 5 MB.')
      return
    }

    setThumbnail(file)
    setThumbnailPreview(URL.createObjectURL(file))
  }

  function removeThumbnail() {
    setThumbnail(null)
    setThumbnailPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function uploadThumbnail(orderId: string): Promise<string | null> {
    if (!thumbnail) return null
    const ext = thumbnail.name.split('.').pop()
    const path = `thumbnails/${orderId}.${ext}`
    const { error } = await (supabase as any).storage
      .from('order-files')
      .upload(path, thumbnail, { upsert: true })
    if (error) { console.error('[uploadThumbnail]', error.message); return null }
    const { data } = (supabase as any).storage.from('order-files').getPublicUrl(path)
    return data?.publicUrl ?? null
  }

  async function onSubmit(data: NewOrderInput) {
    setSubmitting(true)
    setGlobalError(null)
    try {
      const orderId = await createOrder(data)
      if (!orderId) throw new Error('Falha ao criar o pedido. Tente novamente.')

      // Upload thumbnail after order is created (we need the orderId for the path)
      if (thumbnail) {
        const thumbnailUrl = await uploadThumbnail(orderId)
        if (thumbnailUrl) {
          await (supabase as any)
            .from('orders')
            .update({ thumbnail_url: thumbnailUrl })
            .eq('id', orderId)
        }
      }

      navigate('/orders')
    } catch (e: any) {
      setGlobalError(e?.message ?? 'Erro inesperado.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b border-slate-200 bg-white px-6 py-4 flex items-center gap-4">
        <button
          onClick={() => navigate('/orders')}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-800">Novo Pedido</h1>
          <p className="text-xs text-slate-400 mt-0.5">Entrada manual de ordem de serviço</p>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl mx-auto space-y-6">

          {globalError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {globalError}
            </div>
          )}

          {/* Cliente */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-800">Cliente</h2>
            <div>
              <ClientSearchInput
                value={clientId ?? ''}
                onChange={handleClientChange}
                onCreateNew={() => setShowClientModal(true)}
                error={errors.client_id?.message}
              />
            </div>
          </div>

          {/* Canal + flags */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-800">Canal de Origem</h2>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Canal <span className="text-red-500">*</span>
              </label>
              <select
                {...register('channel')}
                className={[
                  'w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500',
                  errors.channel ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white',
                ].join(' ')}
              >
                <option value="">Selecione o canal...</option>
                {CHANNEL_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              {errors.channel && (
                <p className="mt-1 text-xs text-red-600">{errors.channel.message}</p>
              )}
            </div>

            {/* Flags */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setValue('is_urgent', !isUrgent)}
                className={[
                  'flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors',
                  isUrgent
                    ? 'border-red-300 bg-red-50 text-red-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
                ].join(' ')}
              >
                <Zap className="h-4 w-4" />
                Urgente
              </button>

              <button
                type="button"
                onClick={() => setValue('is_rework', !isRework)}
                className={[
                  'flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors',
                  isRework
                    ? 'border-amber-300 bg-amber-50 text-amber-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
                ].join(' ')}
              >
                <RotateCcw className="h-4 w-4" />
                Retrabalho
              </button>
            </div>
          </div>

          {/* Briefing */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
            <h2 className="text-sm font-bold text-slate-800">Briefing / Instruções</h2>
            <textarea
              {...register('briefing')}
              rows={4}
              placeholder="Descreva as instruções, observações ou detalhes do pedido..."
              className={[
                'w-full rounded-lg border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500',
                errors.briefing ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white',
              ].join(' ')}
            />
            {errors.briefing && (
              <p className="text-xs text-red-600">{errors.briefing.message}</p>
            )}
          </div>

          {/* Arquivo */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-800">Arquivo de Produção</h2>

            {/* Caminho de rede / link */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Caminho de Rede / Link do Arquivo <span className="text-red-500">*</span>
              </label>
              <input
                {...register('file_path')}
                type="text"
                placeholder="Ex.: \\servidor\arte\cliente\arquivo.pdf  ou  https://drive.google.com/..."
                className={[
                  'w-full rounded-lg border px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500',
                  errors.file_path ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white',
                ].join(' ')}
              />
              <p className="mt-1 text-xs text-slate-400">
                Caminho da rede local ou link de nuvem (Google Drive, Dropbox, etc.)
              </p>
              {errors.file_path && (
                <p className="mt-1 text-xs text-red-600">{errors.file_path.message}</p>
              )}
            </div>

            {/* Thumbnail */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Thumbnail / Pré-visualização
              </label>

              {thumbnailPreview ? (
                <div className="relative inline-block">
                  <img
                    src={thumbnailPreview}
                    alt="preview"
                    className="h-32 w-auto rounded-lg border border-slate-200 object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeThumbnail}
                    className="absolute -top-2 -right-2 rounded-full bg-white border border-slate-200 p-0.5 text-slate-500 hover:text-red-500 shadow-sm transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-2 w-full rounded-lg border-2 border-dashed border-slate-200 py-6 text-slate-400 hover:border-emerald-400 hover:text-emerald-600 transition-colors"
                >
                  <Upload className="h-6 w-6" />
                  <span className="text-xs font-medium">Clique para selecionar imagem</span>
                  <span className="text-xs">JPG, PNG ou WebP — máx. 5 MB</span>
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleThumbnailChange}
              />

              {uploadError && (
                <p className="mt-1 text-xs text-red-600">{uploadError}</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pb-6">
            <button
              type="button"
              onClick={() => navigate('/orders')}
              className="rounded-lg border border-slate-200 bg-white px-5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? 'Criando pedido...' : 'Criar Pedido'}
            </button>
          </div>
        </form>
      </div>

      {/* Modal de novo cliente */}
      {showClientModal && (
        <ClientFormModal
          onClose={() => setShowClientModal(false)}
          onSave={async (input) => {
            // Use the clients hook to create, then select the new client
            const { data, error } = await (supabase as any)
              .from('clients')
              .insert({
                company_name: input.company_name,
                nickname: input.nickname,
                unit_city: input.unit_city || null,
                contact_name: input.contact_name || null,
                email: input.email || null,
                phone: input.phone || null,
                price_per_cm2: input.price_per_cm2 || null,
                substrates: input.substrates,
                plate_thicknesses: input.plate_thicknesses,
                ink_types: input.ink_types,
              })
              .select('id, nickname, company_name, unit_city')
              .single()

            if (error) return { ok: false, error: error.message }

            handleClientCreated({
              id: data.id,
              nickname: data.nickname,
              company_name: data.company_name,
              unit_city: data.unit_city ?? null,
            })
            return { ok: true }
          }}
        />
      )}
    </div>
  )
}
