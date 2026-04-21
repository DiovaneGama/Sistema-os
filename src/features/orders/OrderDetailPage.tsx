import { useState, useEffect, useRef } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, RefreshCw, AlertTriangle, RotateCcw, FolderOpen,
  Lock, CheckCircle2, Circle, ChevronRight, ImageOff, Pencil, XCircle,
} from 'lucide-react'
import { useOrderDetail, useOrderMutations } from './hooks/useOrders'
import { useAuth } from '../../hooks/useAuth'
import { useRole } from '../../hooks/useRole'
import { OrderIssuesPanel } from './components/OrderIssuesPanel'
import { EditOrderModal } from './components/EditOrderModal'
import {
  STATUS_LABELS,
  STATUS_COLORS,
  getNextStatus,
  getNextStatusLabel,
} from '../production/utils/statusConfig'
import type { OrderStatus } from '../../types/database'

const CHANNEL_LABELS: Record<string, string> = {
  email: 'E-mail', whatsapp: 'WhatsApp', balcao: 'Balcão',
  telefone: 'Telefone', orcamento: 'Orçamento', outros: 'Outros',
}

const BAND_LABELS: Record<string, string> = {
  larga: 'Banda Larga', estreita: 'Banda Estreita',
}

const PRINT_LABELS: Record<string, string> = {
  interna: 'Interna', externa: 'Externa',
}

// ── Timeline ─────────────────────────────────────────────────────────────────

interface TimelineEvent {
  label: string
  ts: string | null
}

function buildTimeline(order: {
  created_at: string
  queued_at: string | null
  treatment_started_at?: string | null
  treatment_ended_at?: string | null
  production_queued_at?: string | null
  production_started_at?: string | null
  production_ended_at?: string | null
  dispatched_at?: string | null
}): TimelineEvent[] {
  return [
    { label: 'OS Criada',               ts: order.created_at },
    { label: 'Entrou na Fila',           ts: order.queued_at },
    { label: 'Tratamento Iniciado',      ts: order.treatment_started_at ?? null },
    { label: 'Tratamento Concluído',     ts: order.treatment_ended_at ?? null },
    { label: 'Fila Produção',            ts: order.production_queued_at ?? null },
    { label: 'Produção Iniciada',        ts: order.production_started_at ?? null },
    { label: 'Produção Concluída',       ts: order.production_ended_at ?? null },
    { label: 'Despachado',               ts: order.dispatched_at ?? null },
  ].filter(e => e.ts !== null)
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ── Componentes de card ───────────────────────────────────────────────────────

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100">
        <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-slate-400 uppercase tracking-wide">{label}</span>
      <span className="text-sm text-slate-800">{value ?? <span className="text-slate-300">—</span>}</span>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { role } = useRole()
  const { order, loading, error, reload } = useOrderDetail(id)
  const { updateStatus, cancelOrder } = useOrderMutations()
  const [advancing, setAdvancing] = useState(false)
  const [advanceError, setAdvanceError] = useState<string | null>(null)
  const autoAdvanced = useRef(false)
  const [editModal,   setEditModal]   = useState(false)
  const [cancelModal, setCancelModal] = useState(false)
  const [cancelMotivo, setCancelMotivo] = useState('')
  const [cancelling, setCancelling] = useState(false)

  // Arte finalista abre OS em fila_arte → avança automaticamente para tratamento
  useEffect(() => {
    if (autoAdvanced.current) return
    if (!order || !profile || role !== 'arte_finalista') return
    if (order.status !== 'fila_arte') return
    autoAdvanced.current = true
    updateStatus(order.id, 'tratamento', profile.id).then(reload)
  }, [order, profile, role])

  async function handleCancel() {
    if (!order || !cancelMotivo.trim()) return
    setCancelling(true)
    await cancelOrder(order.id, cancelMotivo.trim())
    setCancelling(false)
    setCancelModal(false)
    setCancelMotivo('')
    reload()
  }

  async function handleAdvance() {
    if (!order || !role || !profile) return
    const next = getNextStatus(order.status, role)
    if (!next) return

    setAdvancing(true)
    setAdvanceError(null)
    const result = await updateStatus(order.id, next as OrderStatus, profile.id)
    setAdvancing(false)

    if (!result.ok) {
      setAdvanceError(result.error ?? 'Erro ao avançar status')
      return
    }
    reload()
  }

  // ── Loading / erro ──────────────────────────────────────────────────────────
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
        <button onClick={() => navigate('/orders')} className="text-xs text-emerald-600 underline">
          Voltar para Pedidos
        </button>
      </div>
    )
  }

  const sc = STATUS_COLORS[order.status]
  const nextLabel = role ? getNextStatusLabel(order.status, role) : null
  const timeline = buildTimeline(order)
  const canEdit = role && ['sysadmin','admin_master','gestor_pcp','arte_finalista'].includes(role)
    && !['despachado','cancelado'].includes(order.status)
    && !order.specs?.frozen
  const canCancel = role && ['sysadmin','admin_master','gestor_pcp','arte_finalista'].includes(role)
    && !['despachado','cancelado'].includes(order.status)

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="shrink-0 border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex items-center gap-4">
          {/* Voltar */}
          <Link to="/orders"
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" />
            Pedidos
          </Link>

          <ChevronRight className="h-3.5 w-3.5 text-slate-300" />

          {/* Número da OS */}
          <span className="font-mono font-bold text-slate-800 text-base">
            #{order.order_number}
          </span>

          {/* Status */}
          <span className={[
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border',
            sc.bg, sc.text, sc.border,
          ].join(' ')}>
            {STATUS_LABELS[order.status]}
          </span>

          {/* Flags */}
          {order.is_urgent && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-xs font-semibold text-red-600">
              <AlertTriangle className="h-3 w-3" />
              Urgente
            </span>
          )}
          {order.is_rework && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs font-semibold text-amber-600">
              <RotateCcw className="h-3 w-3" />
              Retrabalho
            </span>
          )}

          {/* Botões de ação */}
          <div className="ml-auto flex items-center gap-2">
            {canEdit && (
              <button
                onClick={() => setEditModal(true)}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <Pencil className="h-3.5 w-3.5" />
                Editar OS
              </button>
            )}
            {canCancel && (
              <button
                onClick={() => setCancelModal(true)}
                className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <XCircle className="h-3.5 w-3.5" />
                Cancelar OS
              </button>
            )}
            <div className="flex flex-col items-end gap-1">
              {nextLabel && (
                <button
                  onClick={handleAdvance}
                  disabled={advancing}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                >
                  {advancing
                    ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    : <ChevronRight className="h-3.5 w-3.5" />}
                  {nextLabel}
                </button>
              )}
              {advanceError && (
                <p className="text-xs text-red-500">{advanceError}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Conteúdo ────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="flex gap-5 items-start">

          {/* ── Coluna principal ──────────────────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-4">

            {/* Miniatura + Identificação lado a lado */}
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100">
                <h2 className="text-sm font-semibold text-slate-700">Identificação</h2>
              </div>
              <div className="flex gap-0">
                {/* Miniatura — esquerda */}
                <div className="w-56 shrink-0 border-r border-slate-100 flex items-center justify-center p-4">
                  {order.thumbnail_url ? (
                    <img
                      src={order.thumbnail_url}
                      alt="Miniatura"
                      className="max-h-40 w-full rounded-lg border border-slate-100 object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-slate-300">
                      <ImageOff className="h-8 w-8" />
                      <span className="text-xs">Sem miniatura</span>
                    </div>
                  )}
                </div>

                {/* Campos — direita */}
                <div className="flex-1 px-5 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Cliente"
                      value={order.client_nickname ?? order.client_name} />
                    <Field label="Canal"
                      value={CHANNEL_LABELS[order.channel] ?? order.channel} />
                    <Field label="Responsável"
                      value={order.assigned_name} />
                    <Field label="Data de Criação"
                      value={fmt(order.created_at)} />
                    {order.briefing && (
                      <div className="col-span-2">
                        <Field label="Observações" value={order.briefing} />
                      </div>
                    )}
                    {order.file_path && (
                      <div className="col-span-2 flex items-center gap-2 mt-1">
                        <FolderOpen className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="text-xs font-mono text-slate-600 truncate">
                          {order.file_path}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Especificações Técnicas */}
            {order.specs && (
              <Card title="Especificações Técnicas">
                {order.specs.frozen && (
                  <div className="mb-4 flex items-center gap-1.5 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">
                    <Lock className="h-3.5 w-3.5" />
                    Ficha Congelada — somente leitura
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Serviço" value={order.specs.service_name} />
                  <Field label="Máquina Alvo" value={order.specs.target_machine} />
                  <Field label="Tipo de Banda"
                    value={order.specs.band_type
                      ? <span className={[
                          'inline-flex rounded-full px-2 py-0.5 text-xs font-semibold',
                          order.specs.band_type === 'larga'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-emerald-100 text-emerald-700',
                        ].join(' ')}>
                          {BAND_LABELS[order.specs.band_type] ?? order.specs.band_type}
                        </span>
                      : null}
                  />
                  <Field label="Substrato" value={order.specs.substrate} />
                  <Field label="Espessura da Chapa"
                    value={order.specs.plate_thickness != null
                      ? `${order.specs.plate_thickness} mm` : null} />
                  <Field label="Lineatura"
                    value={order.specs.lineature != null
                      ? `${order.specs.lineature} lpc` : null} />
                  <Field label="Tipo de Impressão"
                    value={order.specs.print_type
                      ? PRINT_LABELS[order.specs.print_type] ?? order.specs.print_type
                      : null} />
                  {order.specs.band_type === 'larga' && (
                    <>
                      <Field label="Cilindro"
                        value={order.specs.cylinder_diameter != null
                          ? `${order.specs.cylinder_diameter} mm` : null} />
                      <Field label="Repetições" value={order.specs.repetitions} />
                      <Field label="Carreiras" value={order.specs.rows} />
                    </>
                  )}
                  {order.specs.network_filename && (
                    <div className="col-span-2">
                      <span className="text-xs text-slate-400 uppercase tracking-wide block mb-0.5">
                        Nome de Rede
                      </span>
                      <span className="font-mono text-xs text-slate-700 break-all">
                        {order.specs.network_filename}
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Cores */}
            {order.colors.length > 0 && (
              <Card title={`Cores do Serviço (${order.colors.length})`}>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {['Cor', 'L × A (cm)', 'Área (cm²)', 'Conj.', 'Preço'].map(h => (
                        <th key={h} className="pb-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {order.colors.map(c => (
                      <tr key={c.id} className="border-b border-slate-50">
                        <td className="py-2 font-medium text-slate-800">{c.color_name}</td>
                        <td className="py-2 text-slate-600">
                          {c.width_cm != null && c.height_cm != null
                            ? `${c.width_cm} × ${c.height_cm}` : '—'}
                        </td>
                        <td className="py-2 text-slate-600">
                          {c.area_cm2 != null ? c.area_cm2.toFixed(2) : '—'}
                        </td>
                        <td className="py-2 text-slate-600">{c.num_sets}</td>
                        <td className="py-2 text-slate-600">
                          {c.price != null
                            ? c.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-slate-200">
                      <td className="pt-2 text-xs font-semibold text-slate-500 uppercase">Total</td>
                      <td />
                      <td className="pt-2 text-sm font-semibold text-slate-800">
                        {order.colors.reduce((s, c) => s + (c.area_cm2 ?? 0), 0).toFixed(2)} cm²
                      </td>
                      <td />
                      <td className="pt-2 text-sm font-semibold text-slate-800">
                        {order.colors.some(c => c.price != null)
                          ? order.colors.reduce((s, c) => s + (c.price ?? 0), 0)
                              .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                          : '—'}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </Card>
            )}
          </div>

          {/* ── Sidebar — Timeline ─────────────────────────────────────────── */}
          <div className="w-72 shrink-0 space-y-4">
            <Card title="Histórico de Status">
              <ol className="space-y-3">
                {timeline.map((event, i) => {
                  const isLast = i === timeline.length - 1
                  return (
                    <li key={event.label} className="flex items-start gap-3">
                      <div className="mt-0.5 shrink-0">
                        {isLast
                          ? <span className="flex h-4 w-4 items-center justify-center">
                              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                            </span>
                          : <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        }
                      </div>
                      <div className="min-w-0">
                        <p className={['text-sm', isLast ? 'font-semibold text-slate-800' : 'text-slate-600'].join(' ')}>
                          {event.label}
                        </p>
                        <p className="text-xs text-slate-400">{fmt(event.ts!)}</p>
                      </div>
                    </li>
                  )
                })}
                {/* Próximos passos pendentes */}
                {(['queued_at', 'treatment_started_at', 'treatment_ended_at',
                  'production_queued_at', 'production_started_at',
                  'production_ended_at', 'dispatched_at'] as const)
                  .filter(f => !(order as any)[f])
                  .slice(0, 2)
                  .map(f => {
                    const labelMap: Record<string, string> = {
                      queued_at: 'Entrou na Fila',
                      treatment_started_at: 'Tratamento Iniciado',
                      treatment_ended_at: 'Tratamento Concluído',
                      production_queued_at: 'Fila Produção',
                      production_started_at: 'Produção Iniciada',
                      production_ended_at: 'Produção Concluída',
                      dispatched_at: 'Despachado',
                    }
                    return (
                      <li key={f} className="flex items-start gap-3 opacity-35">
                        <Circle className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" />
                        <p className="text-sm text-slate-400">{labelMap[f]}</p>
                      </li>
                    )
                  })}
              </ol>
            </Card>

            {/* Problemas de Arte */}
            <OrderIssuesPanel
              orderId={order.id}
              currentProfileId={profile?.id ?? ''}
              currentRole={role}
              orderStatus={order.status}
            />
          </div>

        </div>
      </div>

      {/* Modal de edição */}
      {editModal && (
        <EditOrderModal
          order={order}
          onClose={() => setEditModal(false)}
          onSaved={() => { setEditModal(false); reload() }}
        />
      )}

      {/* Modal de cancelamento */}
      {cancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <h2 className="text-sm font-bold text-slate-800">Cancelar OS #{order.order_number}</h2>
              </div>
              <button onClick={() => { setCancelModal(false); setCancelMotivo('') }}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 transition-colors">
                <XCircle className="h-4 w-4" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <p className="text-sm text-slate-500">Esta ação é irreversível. Informe o motivo do cancelamento.</p>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Motivo <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={cancelMotivo}
                  onChange={e => setCancelMotivo(e.target.value)}
                  rows={3}
                  placeholder="Ex: Cliente desistiu do serviço, arquivo com problema crítico..."
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => { setCancelModal(false); setCancelMotivo('') }}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                  Voltar
                </button>
                <button
                  onClick={handleCancel}
                  disabled={!cancelMotivo.trim() || cancelling}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors">
                  {cancelling ? 'Cancelando...' : 'Confirmar Cancelamento'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
