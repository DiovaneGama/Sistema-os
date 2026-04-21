import { useState, useRef, useEffect, useCallback } from 'react'
import {
  GripVertical, AlertTriangle, RefreshCw, ArrowRight,
  Trash2, Copy, ChevronRight, MoreHorizontal, Check, ImageOff,
  Clock, Settings2, Pencil, ClipboardPaste, PauseCircle,
  History, RotateCcw, XCircle, X, User, ZoomIn,
} from 'lucide-react'
import type { ProductionOrder } from '../hooks/useProductionOrders'
import type { UserRole } from '../../../types/database'
import { TimerBadge } from './TimerBadge'
import { getNextStatusLabel, getStatusTimestamp, STATUS_LABELS, STATUS_COLORS } from '../utils/statusConfig'

function timeInQueueMs(order: ProductionOrder): number {
  const ref = order.production_started_at ?? order.production_queued_at ??
    order.treatment_started_at ?? order.queued_at ?? order.created_at
  return Date.now() - new Date(ref).getTime()
}
import { ScrapModal } from './ScrapModal'
import { PauseModal } from './PauseModal'
import { getColorHex } from '../../orders/utils/pantoneColors'
import { useOrderDetail, useOrderMutations } from '../../orders/hooks/useOrders'
import { EditOrderModal } from '../../orders/components/EditOrderModal'
import { supabase } from '../../../lib/supabase'

function EditOrderWrapper({ orderId, onClose, onSaved }: { orderId: string; onClose: () => void; onSaved: () => void }) {
  const { order, loading } = useOrderDetail(orderId)
  if (loading) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="rounded-xl bg-white p-6 text-sm text-slate-500 flex items-center gap-2">
        <RefreshCw className="h-4 w-4 animate-spin" /> Carregando...
      </div>
    </div>
  )
  if (!order) return null
  return <EditOrderModal order={order} onClose={onClose} onSaved={onSaved} />
}

// ── Modal de Histórico ────────────────────────────────────────────────────────

interface AuditEntry {
  id: string
  action: string
  old_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null
  changed_by: string | null
  changed_at: string
  table_name: string
}

function HistoryModal({ order, onClose }: { order: ProductionOrder; onClose: () => void }) {
  const [logs, setLogs] = useState<AuditEntry[]>([])
  const [profiles, setProfiles] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await (supabase as any)
        .from('audit_logs')
        .select('id, action, old_data, new_data, changed_by, changed_at, table_name')
        .eq('record_id', order.id)
        .order('changed_at', { ascending: false })
      const entries: AuditEntry[] = data ?? []
      setLogs(entries)

      const ids = [...new Set(entries.map((e: AuditEntry) => e.changed_by).filter(Boolean))]
      if (ids.length > 0) {
        const { data: pData } = await (supabase as any)
          .from('profiles')
          .select('id, full_name')
          .in('id', ids)
        const map: Record<string, string> = {}
        ;(pData ?? []).forEach((p: any) => { map[p.id] = p.full_name })
        setProfiles(map)
      }
      setLoading(false)
    }
    load()
  }, [order.id])

  function describeChange(entry: AuditEntry): string {
    if (entry.action === 'INSERT') return 'OS registrada no sistema'
    if (entry.action === 'DELETE') return 'Registro removido'

    const old = entry.old_data   // pode ser null (trigger antigo não salvava OLD em UPDATE)
    const nw  = entry.new_data ?? {}

    // Sem old_data não conseguimos comparar — mostra apenas status atual
    if (!old) {
      const s = nw['status'] as string | undefined
      return s ? `Etapa: ${STATUS_LABELS[s as keyof typeof STATUS_LABELS] ?? s}` : 'Dados atualizados'
    }

    // Com old_data disponível (após correção do trigger): compara campo a campo
    const LABELS: Record<string, (o: unknown, n: unknown) => string> = {
      status:              (o, n) => `Etapa: ${STATUS_LABELS[o as keyof typeof STATUS_LABELS] ?? o} → ${STATUS_LABELS[n as keyof typeof STATUS_LABELS] ?? n}`,
      assigned_to:         (o, n) => o !== n ? (n ? 'Responsável atribuído' : 'Responsável removido') : '',
      is_urgent:           (o, n) => o !== n ? (n ? 'Marcada como Urgente' : 'Urgência removida') : '',
      is_rework:           (o, n) => o !== n ? (n ? 'Marcada como Retrabalho' : 'Retrabalho removido') : '',
      briefing:            (o, n) => o !== n ? 'Observações alteradas' : '',
      thumbnail_url:       (o, n) => o !== n ? 'Miniatura atualizada' : '',
      cancellation_reason: (o, n) => o !== n && n ? 'OS cancelada' : '',
      client_id:           (o, n) => o !== n ? 'Cliente alterado' : '',
    }

    const messages: string[] = []
    for (const [key, fn] of Object.entries(LABELS)) {
      const msg = fn(old[key], nw[key])
      if (msg) messages.push(msg)
    }

    if (messages.length === 0) return 'Dados atualizados'
    return messages.join(' · ')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 shrink-0">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-slate-500" />
            <h2 className="text-sm font-bold text-slate-800">Histórico — OS #{order.order_number}</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-sm text-slate-400 gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" /> Carregando...
            </div>
          ) : logs.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Nenhum registro encontrado.</p>
          ) : logs.map(entry => (
            <div key={entry.id} className="flex gap-3 text-sm">
              <div className="shrink-0 mt-0.5 h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center">
                <User className="h-3.5 w-3.5 text-slate-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-700">{describeChange(entry)}</p>
                <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                  <span>{profiles[entry.changed_by ?? ''] ?? 'Sistema'}</span>
                  <span>·</span>
                  <span>{new Date(entry.changed_at).toLocaleString('pt-BR')}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Modal Voltar Processo ─────────────────────────────────────────────────────

function RevertModal({ order, onClose, onDone }: { order: ProductionOrder; onClose: () => void; onDone: () => void }) {
  const { advanceStatus } = useProductionOrderActions()
  const [loading, setLoading] = useState(false)

  async function handleRevert() {
    setLoading(true)
    await advanceStatus(order.id, 'tratamento')
    setLoading(false)
    onDone()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4 text-amber-500" />
            <h2 className="text-sm font-bold text-slate-800">Voltar Processo — OS #{order.order_number}</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-slate-500">
            A OS voltará para <strong className="text-violet-700">Em Tratamento</strong>. Use quando o status foi avançado acidentalmente.
          </p>
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              Cancelar
            </button>
            <button onClick={handleRevert} disabled={loading} className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50 transition-colors">
              {loading ? 'Voltando...' : 'Confirmar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Modal Cancelar OS ─────────────────────────────────────────────────────────

function CancelModal({ order, onClose, onDone }: { order: ProductionOrder; onClose: () => void; onDone: () => void }) {
  const { cancelOrder } = useOrderMutations()
  const [motivo, setMotivo] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleCancel() {
    if (!motivo.trim()) return
    setLoading(true)
    await cancelOrder(order.id, motivo.trim())
    setLoading(false)
    onDone()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-500" />
            <h2 className="text-sm font-bold text-slate-800">Cancelar OS #{order.order_number}</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-slate-500">Esta ação é irreversível. Informe o motivo do cancelamento.</p>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Motivo <span className="text-red-500">*</span>
            </label>
            <textarea
              value={motivo}
              onChange={e => setMotivo(e.target.value)}
              rows={3}
              placeholder="Ex: Cliente desistiu do serviço, arquivo com problema crítico..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              Voltar
            </button>
            <button onClick={handleCancel} disabled={!motivo.trim() || loading}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors">
              {loading ? 'Cancelando...' : 'Confirmar Cancelamento'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Hook de ações de produção (revert) ───────────────────────────────────────

function useProductionOrderActions() {
  async function advanceStatus(orderId: string, nextStatus: string) {
    const timestampField: Record<string, string> = {
      tratamento: 'treatment_started_at',
    }
    const update: Record<string, unknown> = {
      status: nextStatus,
      updated_at: new Date().toISOString(),
    }
    const tsField = timestampField[nextStatus]
    if (tsField) update[tsField] = new Date().toISOString()
    await (supabase as any).from('orders').update(update).eq('id', orderId)
  }
  return { advanceStatus }
}

interface Props {
  order: ProductionOrder
  role: UserRole
  currentProfileId: string
  onAdvance: (orderId: string) => void
  onSavePrint: (orderId: string, field: 'thumbnail_url' | 'machine_print_url' | 'color_proof_url', file: File) => Promise<boolean>
  onReload: () => void
  viewMode?: 'columns' | 'list'
  isDragging?: boolean
  dragHandleProps?: Record<string, unknown>
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

function ColorDot({ name }: { name: string }) {
  const hex = getColorHex(name)
  return (
    <span
      className="inline-block h-3.5 w-3.5 rounded-full border border-slate-300 shrink-0"
      style={{ backgroundColor: hex ?? '#94a3b8' }}
    />
  )
}

function ImageViewModal({ label, src, onClose }: { label: string; src: string; onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-3xl w-full rounded-2xl bg-white shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <span className="text-sm font-semibold text-slate-700">{label}</span>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-4 flex items-center justify-center bg-slate-50 min-h-64">
          <img src={src} alt={label} className="max-h-[70vh] max-w-full object-contain rounded-lg" />
        </div>
      </div>
    </div>
  )
}

function EditableImageSlot({
  label, src, onPaste, naLabel,
}: {
  label: string
  src?: string | null
  onPaste: (file: File) => void
  naLabel?: string
}) {
  const [active,    setActive]    = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [preview,   setPreview]   = useState<string | null>(src ?? null)
  const [hint,      setHint]      = useState(false)
  const [hovered,   setHovered]   = useState(false)
  const [lightbox,  setLightbox]  = useState(false)
  const slotRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setPreview(src ?? null) }, [src])

  const handlePaste = useCallback((e: ClipboardEvent) => {
    if (!active) return
    const items = e.clipboardData?.items
    if (!items) return
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (!file) continue
        setPreview(URL.createObjectURL(file))
        setHint(true)
        setSaving(true)
        setTimeout(() => setHint(false), 2000)
        onPaste(file)
        setSaving(false)
        break
      }
    }
  }, [active, onPaste])

  useEffect(() => {
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [handlePaste])

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (slotRef.current && !slotRef.current.contains(e.target as Node))
        setActive(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function handleClick() {
    if (preview) {
      setLightbox(true)
    } else {
      setActive(true)
    }
  }

  return (
    <>
      <div className="flex flex-col gap-1.5" ref={slotRef}>
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
        <div
          onClick={handleClick}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className={[
            'relative w-28 h-20 rounded-lg border overflow-hidden flex items-center justify-center cursor-pointer transition-all',
            active && !preview
              ? 'border-emerald-400 ring-2 ring-emerald-200 bg-emerald-50'
              : 'border-slate-200 bg-slate-50 hover:border-slate-300',
          ].join(' ')}
        >
          {preview ? (
            <img
              src={preview}
              alt={label}
              className={[
                'h-full w-full object-cover transition-transform duration-200',
                hovered ? 'scale-110' : 'scale-100',
              ].join(' ')}
            />
          ) : naLabel ? (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
              {naLabel}
            </span>
          ) : (
            <ImageOff className="h-5 w-5 text-slate-200" />
          )}

          {/* Overlay de hover com lupa (só quando tem imagem) */}
          {preview && (
            <div className={[
              'absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/30 transition-opacity duration-200 pointer-events-none',
              hovered ? 'opacity-100' : 'opacity-0',
            ].join(' ')}>
              <ZoomIn className="h-5 w-5 text-white drop-shadow" />
              <span className="text-[9px] font-semibold text-white leading-tight text-center px-1">
                Clique para ampliar
              </span>
            </div>
          )}

          {/* Hint Ctrl+V (só quando sem imagem e ativo) */}
          {!preview && (
            <div className="absolute inset-0 flex items-end justify-center pb-1.5 pointer-events-none">
              <span className={[
                'flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold transition-all',
                hint
                  ? 'bg-emerald-500 text-white'
                  : active
                  ? 'bg-black/30 text-white'
                  : 'opacity-0',
              ].join(' ')}>
                <ClipboardPaste className="h-2.5 w-2.5" />
                {hint ? 'Colado!' : saving ? '...' : 'Ctrl+V'}
              </span>
            </div>
          )}
        </div>

        {preview && (
          <button
            onClick={() => { setPreview(null); setActive(true) }}
            className="text-[10px] text-slate-400 hover:text-red-500 transition-colors leading-none text-center"
          >
            Alterar
          </button>
        )}
      </div>

      {lightbox && preview && (
        <ImageViewModal label={label} src={preview} onClose={() => setLightbox(false)} />
      )}
    </>
  )
}

// ── Modo lista ───────────────────────────────────────────────────────────────

function ListCard({ order, role, currentProfileId, onAdvance, onSavePrint, onReload }: Omit<Props, 'viewMode' | 'isDragging' | 'dragHandleProps'>) {
  const [showScrap,    setShowScrap]    = useState(false)
  const [showPause,    setShowPause]    = useState(false)
  const [copied,       setCopied]       = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [editing,      setEditing]      = useState(false)
  const [showHistory,  setShowHistory]  = useState(false)
  const [showRevert,   setShowRevert]   = useState(false)
  const [showCancel,   setShowCancel]   = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)

  const canScrap  = order.status === 'producao' &&
    ['clicherista', 'gestor_pcp', 'admin_master', 'sysadmin'].includes(role)
  const nextLabel = getNextStatusLabel(order.status, role)
  const sc        = STATUS_COLORS[order.status]

  const missingPrintsList = ['producao', 'fila_producao'].includes(order.status) ? [
    !order.thumbnail_url                              && 'Print Serviço',
    !order.machine_print_url                          && 'Print Máquina',
    (!order.color_proof_url && !order.no_color_proof) && 'Prova de Cores',
  ].filter(Boolean) as string[] : []
  const missingPrints = missingPrintsList.length > 0

  const isLate = timeInQueueMs(order) > 4 * 3_600_000
  const accentBorder = isLate                    ? 'border-l-red-500'
    : order.is_urgent                            ? 'border-l-orange-600'
    : order.status === 'pausado'                 ? 'border-l-yellow-400'
    :                                              'border-l-emerald-500'

  function copyFilename() {
    if (!order.network_filename) return
    navigator.clipboard.writeText(order.network_filename)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node))
        setShowDropdown(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  return (
    <div className={`bg-white rounded-xl border border-slate-200 border-l-4 ${accentBorder} hover:shadow-sm transition-shadow`}>

      {/* ── Cabeçalho ── */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 border-b border-slate-100">
        <span className="font-mono font-bold text-sm bg-indigo-700 text-white px-2.5 py-0.5 rounded shrink-0">
          OS: {order.order_number}
        </span>

        <span className="font-semibold text-slate-800 text-sm truncate">
          {order.client_nickname ?? order.client_name ?? '—'}
        </span>
        {order.service_name && (
          <>
            <span className="text-slate-300 shrink-0">|</span>
            <span className="text-slate-500 text-sm truncate">
              {order.service_name}
            </span>
          </>
        )}
        <span className="flex-1" />

        {order.is_urgent && (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 border border-red-200 px-2 py-0.5 text-xs font-semibold text-red-700 shrink-0">
            <AlertTriangle className="h-3 w-3" /> Urgente
          </span>
        )}
        {order.is_rework && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-200 px-2 py-0.5 text-xs font-semibold text-amber-700 shrink-0">
            <RefreshCw className="h-3 w-3" /> Retrabalho
          </span>
        )}

        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold shrink-0 ${sc.bg} ${sc.text} ${sc.border}`}>
          {STATUS_LABELS[order.status]}
        </span>
      </div>

      {/* ── Corpo ── */}
      <div className="flex items-stretch">

        {/* Imagens */}
        <div className="flex items-center gap-3 px-4 py-3 shrink-0 border-r border-slate-100">
          <EditableImageSlot
            label="Print Serviço"
            src={order.thumbnail_url}
            onPaste={f => onSavePrint(order.id, 'thumbnail_url', f)}
          />
          <EditableImageSlot
            label="Print Máquina"
            src={order.machine_print_url}
            onPaste={f => onSavePrint(order.id, 'machine_print_url', f)}
          />
          <EditableImageSlot
            label="Prova de Cores"
            src={order.color_proof_url}
            onPaste={f => onSavePrint(order.id, 'color_proof_url', f)}
            naLabel={order.no_color_proof ? 'N/A' : undefined}
          />
        </div>

        {/* Informações */}
        <div className="flex-1 px-4 py-3 space-y-2 min-w-0">
          {missingPrints && (
            <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              <span className="text-xs text-amber-700 font-medium">
                Obrigatório para avançar: {missingPrintsList.join(', ')}
              </span>
            </div>
          )}

          {/* Nome do arquivo */}
          <div className="flex items-center gap-2">
            {order.network_filename ? (
              <>
                <span className="font-mono text-sm text-slate-700 truncate">
                  {order.network_filename}
                </span>
                <button onClick={copyFilename} className="shrink-0 text-slate-400 hover:text-slate-600 transition-colors" title="Copiar">
                  {copied
                    ? <Check className="h-3.5 w-3.5 text-emerald-500" />
                    : <Copy className="h-3.5 w-3.5" />}
                </button>
              </>
            ) : (
              <span className="text-sm text-slate-300 italic">Sem nome de arquivo</span>
            )}
          </div>

          {/* Jogos / Cores / Cor / Op */}
          <div className="flex items-center gap-4 text-sm text-slate-500 flex-wrap">
            <span>Jogos: <b className="text-slate-700">{order.repetitions ?? 1}</b></span>
            <span>Cores: <b className="text-slate-700">{order.colors_count}</b></span>
            {order.first_color_name && (
              <span className="flex items-center gap-1.5">
                <ColorDot name={order.first_color_name} />
                <b className="text-slate-700">{order.first_color_name}</b>
              </span>
            )}
            {order.assigned_name && (
              <span>Op: <b className="text-slate-700">{order.assigned_name}</b></span>
            )}
          </div>

          {/* Timestamps */}
          <div className="flex items-center gap-5 text-xs text-slate-400 flex-wrap">
            {order.treatment_started_at && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Trat: {fmt(order.treatment_started_at)}
              </span>
            )}
            {order.production_started_at && (
              <span className="flex items-center gap-1">
                <Settings2 className="h-3 w-3" />
                Máq: {fmt(order.production_started_at)}
              </span>
            )}
          </div>
        </div>

        {/* Ações */}
        <div className="flex flex-col items-center justify-between border-l border-slate-100 px-2.5 py-3 shrink-0">
          {nextLabel ? (
            <button
              onClick={() => !missingPrints && onAdvance(order.id)}
              disabled={missingPrints}
              className={[
                'p-2 rounded-lg transition-colors',
                missingPrints
                  ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                  : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700',
              ].join(' ')}
              title={missingPrints
                ? `Obrigatório: ${missingPrintsList.join(', ')}`
                : `Avançar para: ${nextLabel}`}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          ) : (
            <span className="p-2 text-slate-200 cursor-default">
              <ChevronRight className="h-5 w-5" />
            </span>
          )}

          <button
            onClick={() => setEditing(true)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            title="Editar OS"
          >
            <Pencil className="h-4 w-4" />
          </button>

          <div className="relative" ref={dropRef}>
            <button
              onClick={() => setShowDropdown(v => !v)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>

            {showDropdown && (
              <div className="absolute right-0 bottom-full mb-1 z-50 w-56 rounded-xl border border-slate-200 bg-white shadow-lg py-1">
                <button
                  onClick={() => { setShowHistory(true); setShowDropdown(false) }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <History className="h-3.5 w-3.5 text-slate-400" />
                  <span className="flex-1 text-left">Histórico</span>
                  <User className="h-3 w-3 text-slate-300" />
                </button>

                {['tratamento', 'fila_producao', 'producao'].includes(order.status) && (
                  <button
                    onClick={() => { setShowPause(true); setShowDropdown(false) }}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-amber-700 hover:bg-amber-50 transition-colors"
                  >
                    <PauseCircle className="h-3.5 w-3.5" />
                    <span className="flex-1 text-left">Registrar Intercorrência</span>
                  </button>
                )}

                <button
                  onClick={() => { setShowRevert(true); setShowDropdown(false) }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-amber-700 hover:bg-amber-50 transition-colors"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span className="flex-1 text-left">Voltar Processo</span>
                  <User className="h-3 w-3 text-amber-300" />
                </button>

                {canScrap && (
                  <button
                    onClick={() => { setShowScrap(true); setShowDropdown(false) }}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-orange-700 hover:bg-orange-50 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span className="flex-1 text-left">Registrar Refugo</span>
                    <User className="h-3 w-3 text-orange-300" />
                  </button>
                )}

                <div className="my-1 border-t border-slate-100" />

                <button
                  onClick={() => { setShowCancel(true); setShowDropdown(false) }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  <span className="flex-1 text-left">Cancelar OS</span>
                  <User className="h-3 w-3 text-red-300" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showScrap && (
        <ScrapModal
          orderId={order.id}
          orderNumber={order.order_number}
          reportedBy={currentProfileId}
          onClose={() => setShowScrap(false)}
          onSuccess={() => { setShowScrap(false); onReload() }}
        />
      )}

      {showPause && (
        <PauseModal
          orderId={order.id}
          orderNumber={order.order_number}
          reportedBy={currentProfileId}
          onClose={() => setShowPause(false)}
          onSuccess={() => { setShowPause(false); onReload() }}
        />
      )}

      {editing && (
        <EditOrderWrapper
          orderId={order.id}
          onClose={() => setEditing(false)}
          onSaved={() => { setEditing(false); onReload() }}
        />
      )}

      {showHistory && (
        <HistoryModal order={order} onClose={() => setShowHistory(false)} />
      )}

      {showRevert && (
        <RevertModal
          order={order}
          onClose={() => setShowRevert(false)}
          onDone={() => { setShowRevert(false); onReload() }}
        />
      )}

      {showCancel && (
        <CancelModal
          order={order}
          onClose={() => setShowCancel(false)}
          onDone={() => setShowCancel(false)}
        />
      )}
    </div>
  )
}

// ── Modo colunas (card compacto) ─────────────────────────────────────────────

function CompactCard({ order, role, currentProfileId, onAdvance, isDragging, dragHandleProps, onReload }: Props) {
  const [showScrap, setShowScrap] = useState(false)
  const [showPause, setShowPause] = useState(false)
  const nextLabel  = getNextStatusLabel(order.status, role)
  const tsForTimer = getStatusTimestamp(order)
  const isPaused   = order.status === 'pausado'
  const canScrap   = order.status === 'producao' &&
    ['clicherista', 'gestor_pcp', 'admin_master', 'sysadmin'].includes(role)

  return (
    <div className={[
      'bg-white rounded-xl border transition-shadow',
      isDragging ? 'shadow-lg border-emerald-300 rotate-1' : 'border-slate-200 hover:border-slate-300 hover:shadow-sm',
      order.is_urgent ? 'border-l-4 border-l-red-400' : '',
      order.is_rework ? 'border-l-4 border-l-amber-400' : '',
    ].join(' ')}>
      <div className="flex items-start gap-3 p-4">
        <button className="mt-0.5 shrink-0 cursor-grab touch-none text-slate-300 hover:text-slate-500 active:cursor-grabbing" {...dragHandleProps}>
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="shrink-0 h-12 w-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
          {order.thumbnail_url
            ? <img src={order.thumbnail_url} alt="" className="h-full w-full object-cover" />
            : <span className="text-xs text-slate-400 font-mono">{order.order_number.slice(-3)}</span>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-sm font-semibold text-slate-800">#{order.order_number}</span>
                {order.is_urgent && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                    <AlertTriangle className="h-3 w-3" /> Urgente
                  </span>
                )}
                {order.is_rework && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                    <RefreshCw className="h-3 w-3" /> Retrabalho
                  </span>
                )}
              </div>
              <p className="mt-0.5 truncate text-sm font-medium text-slate-700">
                {order.client_nickname ?? order.client_name ?? '—'}
              </p>
              {order.briefing && (
                <p className="mt-0.5 truncate text-xs text-slate-400">{order.briefing}</p>
              )}
            </div>
            <span className={`inline-flex items-center rounded-full border text-xs font-medium px-2 py-0.5 ${STATUS_COLORS[order.status].bg} ${STATUS_COLORS[order.status].text} ${STATUS_COLORS[order.status].border}`}>
              {STATUS_LABELS[order.status]}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-3 flex-wrap">
            <TimerBadge sinceIso={tsForTimer} paused={isPaused} />
            {order.assigned_name && <span className="text-xs text-slate-500">{order.assigned_name}</span>}
            {order.target_machine && (
              <span className="text-xs text-slate-500">
                {order.target_machine}{order.plate_thickness ? ` · ${order.plate_thickness}mm` : ''}
              </span>
            )}
          </div>
        </div>
      </div>

      {(nextLabel || canScrap || ['tratamento', 'fila_producao', 'producao'].includes(order.status)) && (
        <div className="border-t border-slate-100 px-4 py-2.5 flex items-center justify-between gap-2 flex-wrap">
          {nextLabel ? (
            <button onClick={() => onAdvance(order.id)}
              className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors">
              <ArrowRight className="h-3.5 w-3.5" />
              {nextLabel}
            </button>
          ) : <span />}
          <div className="flex items-center gap-2">
            {['tratamento', 'fila_producao', 'producao'].includes(order.status) && (
              <button onClick={() => setShowPause(true)}
                className="flex items-center gap-1 text-xs font-semibold text-amber-600 hover:text-amber-800 transition-colors">
                <PauseCircle className="h-3 w-3" />
                Pausar
              </button>
            )}
            {canScrap && (
              <button onClick={() => setShowScrap(true)}
                className="flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-700 transition-colors">
                <Trash2 className="h-3 w-3" />
                Refugo
              </button>
            )}
          </div>
        </div>
      )}

      {showScrap && (
        <ScrapModal
          orderId={order.id}
          orderNumber={order.order_number}
          reportedBy={currentProfileId}
          onClose={() => setShowScrap(false)}
          onSuccess={() => { setShowScrap(false); onReload?.() }}
        />
      )}

      {showPause && (
        <PauseModal
          orderId={order.id}
          orderNumber={order.order_number}
          reportedBy={currentProfileId}
          onClose={() => setShowPause(false)}
          onSuccess={() => { setShowPause(false); onReload?.() }}
        />
      )}
    </div>
  )
}

// ── Export ───────────────────────────────────────────────────────────────────

export function OrderCard(props: Props) {
  if (props.viewMode === 'columns') return <CompactCard {...props} />
  return <ListCard {...props} onSavePrint={props.onSavePrint} onReload={props.onReload} />
}
