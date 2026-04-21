import { useState, useEffect, useRef } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, ChevronRight, Save, RefreshCw, Upload, ImageOff, AlertTriangle,
} from 'lucide-react'
import { useOrderDetail, useOrderMutations } from './hooks/useOrders'
import { useRole } from '../../hooks/useRole'
import { supabase } from '../../lib/supabase'
import { STATUS_LABELS, STATUS_COLORS } from '../production/utils/statusConfig'

const CHANNEL_OPTIONS = [
  { value: 'email',     label: 'E-mail' },
  { value: 'whatsapp',  label: 'WhatsApp' },
  { value: 'balcao',    label: 'Balcão' },
  { value: 'telefone',  label: 'Telefone' },
  { value: 'orcamento', label: 'Orçamento' },
  { value: 'outros',    label: 'Outros' },
]

const PRINT_OPTIONS = [
  { value: 'interna', label: 'Interna' },
  { value: 'externa', label: 'Externa' },
]

const BAND_OPTIONS = [
  { value: 'estreita', label: 'Banda Estreita' },
  { value: 'larga',    label: 'Banda Larga' },
]

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  )
}

const INPUT = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400'
const SELECT = `${INPUT} bg-white`

export function EditOrderPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { role } = useRole()
  const { order, loading, error } = useOrderDetail(id)
  const { updateOrderFields, updateSpecFields } = useOrderMutations()

  // Identification fields
  const [briefing, setBriefing] = useState('')
  const [channel, setChannel] = useState('')
  const [isUrgent, setIsUrgent] = useState(false)
  const [isRework, setIsRework] = useState(false)

  // Thumbnail
  const [thumbFile, setThumbFile] = useState<File | null>(null)
  const [thumbPreview, setThumbPreview] = useState<string | null>(null)
  const [thumbUrl, setThumbUrl] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Specs fields
  const [substrate, setSubstrate] = useState('')
  const [bandType, setBandType] = useState('')
  const [printType, setPrintType] = useState('')
  const [plateTh, setPlateTh] = useState('')
  const [lineature, setLineature] = useState('')
  const [cylinderDiam, setCylinderDiam] = useState('')
  const [repetitions, setRepetitions] = useState('')
  const [rows, setRows] = useState('')

  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Populate form when order loads
  useEffect(() => {
    if (!order) return
    setBriefing(order.briefing ?? '')
    setChannel(order.channel ?? '')
    setIsUrgent(order.is_urgent)
    setIsRework(order.is_rework)
    setThumbUrl(order.thumbnail_url ?? null)
    if (order.specs) {
      setSubstrate(order.specs.substrate ?? '')
      setBandType(order.specs.band_type ?? '')
      setPrintType(order.specs.print_type ?? '')
      setPlateTh(order.specs.plate_thickness?.toString() ?? '')
      setLineature(order.specs.lineature?.toString() ?? '')
      setCylinderDiam(order.specs.cylinder_diameter?.toString() ?? '')
      setRepetitions(order.specs.repetitions?.toString() ?? '')
      setRows(order.specs.rows?.toString() ?? '')
    }
  }, [order])

  function handleThumbChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setSaveError('Apenas JPG e PNG são aceitos para miniatura.')
      return
    }
    setThumbFile(file)
    setThumbPreview(URL.createObjectURL(file))
  }

  async function handleSave() {
    if (!order || !id) return
    setSaving(true)
    setSaveError(null)

    try {
      // Upload thumbnail if changed
      let newThumbUrl = thumbUrl
      if (thumbFile) {
        const ext = thumbFile.type === 'image/png' ? 'png' : 'jpg'
        const path = `thumbnails/${id}.${ext}`
        const { error: upErr } = await (supabase as any).storage
          .from('order-files')
          .upload(path, thumbFile, { upsert: true, contentType: thumbFile.type })
        if (upErr) throw new Error(`Upload falhou: ${upErr.message}`)
        const { data: urlData } = (supabase as any).storage.from('order-files').getPublicUrl(path)
        newThumbUrl = urlData?.publicUrl ?? null
      }

      // Update order fields
      const r1 = await updateOrderFields(id, {
        briefing: briefing.trim() || null,
        channel,
        is_urgent: isUrgent,
        is_rework: isRework,
        thumbnail_url: newThumbUrl,
      })
      if (!r1.ok) throw new Error(r1.error)

      // Update specs if not frozen
      if (order.specs && !order.specs.frozen) {
        const r2 = await updateSpecFields(id, {
          substrate: substrate.trim() || null,
          band_type: bandType || null,
          print_type: printType || null,
          plate_thickness: plateTh ? parseFloat(plateTh) : null,
          lineature: lineature ? parseFloat(lineature) : null,
          cylinder_diameter: cylinderDiam ? parseFloat(cylinderDiam) : null,
          repetitions: repetitions ? parseInt(repetitions) : null,
          rows: rows ? parseInt(rows) : null,
        })
        if (!r2.ok) throw new Error(r2.error)
      }

      navigate(`/orders/${id}`)
    } catch (e: any) {
      setSaveError(e?.message ?? 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  // Permission check
  const canEdit = role && ['sysadmin', 'admin_master', 'gestor_pcp', 'arte_finalista'].includes(role)
    && order && !['despachado', 'cancelado'].includes(order.status)
    && !order.specs?.frozen

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-emerald-500" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <p className="text-sm text-red-600">{error ?? 'Pedido não encontrado'}</p>
        <Link to="/orders" className="text-xs text-emerald-600 underline">Voltar para Pedidos</Link>
      </div>
    )
  }

  if (!canEdit) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <AlertTriangle className="h-8 w-8 text-amber-400" />
        <p className="text-sm text-slate-600">Você não tem permissão para editar esta OS.</p>
        <Link to={`/orders/${id}`} className="text-xs text-emerald-600 underline">Voltar para a OS</Link>
      </div>
    )
  }

  const sc = STATUS_COLORS[order.status]
  const isLarga = bandType === 'larga'

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Header */}
      <div className="shrink-0 border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex items-center gap-4">
          <Link to={`/orders/${id}`}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" />
            OS #{order.order_number}
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
          <span className="text-sm font-semibold text-slate-700">Editar OS</span>
          <span className={[
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border',
            sc.bg, sc.text, sc.border,
          ].join(' ')}>
            {STATUS_LABELS[order.status]}
          </span>
          <div className="ml-auto">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {saving
                ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                : <Save className="h-3.5 w-3.5" />}
              Salvar
            </button>
          </div>
        </div>
        {saveError && (
          <p className="mt-2 text-xs text-red-500">{saveError}</p>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 max-w-2xl">

        {/* Identificação */}
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-700">Identificação</h2>
          </div>
          <div className="px-5 py-4 space-y-4">

            <Field label="Canal">
              <select value={channel} onChange={e => setChannel(e.target.value)} className={SELECT}>
                {CHANNEL_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </Field>

            <Field label="Observações">
              <textarea
                value={briefing}
                onChange={e => setBriefing(e.target.value)}
                rows={3}
                placeholder="Informações relevantes sobre o pedido..."
                className={`${INPUT} resize-none`}
              />
            </Field>

            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isUrgent}
                  onChange={e => setIsUrgent(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-400"
                />
                <span className="text-sm text-slate-700">Urgente</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRework}
                  onChange={e => setIsRework(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-400"
                />
                <span className="text-sm text-slate-700">Retrabalho</span>
              </label>
            </div>
          </div>
        </div>

        {/* Miniatura */}
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-700">Miniatura do Serviço</h2>
          </div>
          <div className="px-5 py-4 space-y-3">
            {(thumbPreview ?? thumbUrl) ? (
              <img
                src={thumbPreview ?? thumbUrl!}
                alt="Miniatura"
                className="max-h-40 rounded-lg border border-slate-100 object-contain"
              />
            ) : (
              <div className="flex items-center gap-2 text-slate-300">
                <ImageOff className="h-5 w-5" />
                <span className="text-sm">Sem miniatura</span>
              </div>
            )}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <Upload className="h-3.5 w-3.5" />
              {thumbUrl || thumbPreview ? 'Trocar miniatura' : 'Enviar miniatura'}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png"
              onChange={handleThumbChange}
              className="hidden"
            />
            <p className="text-xs text-slate-400">Apenas JPG e PNG. Recomendado: até 1 MB.</p>
          </div>
        </div>

        {/* Especificações Técnicas */}
        {order.specs && (
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-700">Especificações Técnicas</h2>
            </div>
            <div className="px-5 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Substrato">
                  <input
                    type="text"
                    value={substrate}
                    onChange={e => setSubstrate(e.target.value)}
                    className={INPUT}
                    placeholder="Ex: BOPP"
                  />
                </Field>

                <Field label="Tipo de Banda">
                  <select value={bandType} onChange={e => setBandType(e.target.value)} className={SELECT}>
                    <option value="">— Selecione —</option>
                    {BAND_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Tipo de Impressão">
                  <select value={printType} onChange={e => setPrintType(e.target.value)} className={SELECT}>
                    <option value="">— Selecione —</option>
                    {PRINT_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Espessura da Chapa (mm)">
                  <input
                    type="number"
                    value={plateTh}
                    onChange={e => setPlateTh(e.target.value)}
                    step="0.01"
                    className={INPUT}
                    placeholder="Ex: 1.14"
                  />
                </Field>

                <Field label="Lineatura (lpc)">
                  <input
                    type="number"
                    value={lineature}
                    onChange={e => setLineature(e.target.value)}
                    className={INPUT}
                    placeholder="Ex: 60"
                  />
                </Field>

                {isLarga && (
                  <>
                    <Field label="Diâmetro do Cilindro (mm)">
                      <input
                        type="number"
                        value={cylinderDiam}
                        onChange={e => setCylinderDiam(e.target.value)}
                        step="0.01"
                        className={INPUT}
                      />
                    </Field>
                    <Field label="Repetições">
                      <input
                        type="number"
                        value={repetitions}
                        onChange={e => setRepetitions(e.target.value)}
                        className={INPUT}
                      />
                    </Field>
                    <Field label="Carreiras">
                      <input
                        type="number"
                        value={rows}
                        onChange={e => setRows(e.target.value)}
                        className={INPUT}
                      />
                    </Field>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
