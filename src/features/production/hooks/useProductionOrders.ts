import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../../lib/supabase'
import type { OrderStatus } from '../../../types/database'
import { PRODUCTION_PIPELINE } from '../utils/statusConfig'

export interface ProductionOrder {
  id: string
  order_number: string
  status: OrderStatus
  channel: string
  is_urgent: boolean
  is_rework: boolean
  briefing: string | null
  thumbnail_url: string | null
  file_path: string | null
  sort_order: number
  created_at: string
  queued_at: string | null
  treatment_started_at: string | null
  treatment_ended_at: string | null
  production_queued_at: string | null
  production_started_at: string | null
  production_ended_at: string | null
  dispatched_at: string | null
  // joins
  client_nickname: string | null
  client_name: string | null
  assigned_name: string | null
  assigned_id: string | null
  // specs
  target_machine: string | null
  band_type: string | null
  plate_thickness: number | null
}

export interface HUDStats {
  filaArte: number
  emTratamento: number
  pausados: number
  filaProducao: number
  emProducao: number
  prontos: number
  atrasados: number
  totalAtivos: number
}

async function fetchOrders(hoursWindow = 72): Promise<ProductionOrder[]> {
  const since = new Date(Date.now() - hoursWindow * 60 * 60 * 1000).toISOString()

  // Faz duas queries separadas para evitar problemas com joins ambíguos e colunas opcionais
  const { data, error } = await (supabase as any)
    .from('orders')
    .select(`
      id, order_number, status, channel,
      is_urgent, is_rework, briefing, thumbnail_url, file_path,
      created_at,
      queued_at, treatment_started_at, treatment_ended_at,
      production_queued_at, production_started_at, production_ended_at, dispatched_at,
      assigned_to,
      client_id
    `)
    .in('status', PRODUCTION_PIPELINE)
    .gte('created_at', since)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[useProductionOrders] Erro na query principal:', error.message)
    return []
  }

  if (!data || data.length === 0) return []

  // Coleta IDs únicos para queries de join manual
  const clientIds   = [...new Set(data.map((r: any) => r.client_id).filter(Boolean))]
  const profileIds  = [...new Set(data.map((r: any) => r.assigned_to).filter(Boolean))]
  const orderIds    = data.map((r: any) => r.id)

  // Busca paralela dos dados relacionados
  const [clientsRes, profilesRes, specsRes] = await Promise.all([
    clientIds.length > 0
      ? (supabase as any).from('clients').select('id, nickname, company_name').in('id', clientIds)
      : Promise.resolve({ data: [], error: null }),
    profileIds.length > 0
      ? (supabase as any).from('profiles').select('id, full_name').in('id', profileIds)
      : Promise.resolve({ data: [], error: null }),
    orderIds.length > 0
      ? (supabase as any).from('order_specs').select('order_id, target_machine, band_type, plate_thickness').in('order_id', orderIds)
      : Promise.resolve({ data: [], error: null }),
  ])

  // Mapeia para lookup por ID
  const clientMap  = Object.fromEntries((clientsRes.data  ?? []).map((c: any) => [c.id, c]))
  const profileMap = Object.fromEntries((profilesRes.data ?? []).map((p: any) => [p.id, p]))
  const specMap    = Object.fromEntries((specsRes.data    ?? []).map((s: any) => [s.order_id, s]))

  return data.map((row: any) => ({
    id:                    row.id,
    order_number:          row.order_number,
    status:                row.status as OrderStatus,
    channel:               row.channel,
    is_urgent:             row.is_urgent   ?? false,
    is_rework:             row.is_rework   ?? false,
    briefing:              row.briefing    ?? null,
    thumbnail_url:         row.thumbnail_url ?? null,
    file_path:             row.file_path   ?? null,
    sort_order:            row.sort_order  ?? 0,
    created_at:            row.created_at,
    queued_at:             row.queued_at             ?? null,
    treatment_started_at:  row.treatment_started_at  ?? null,
    treatment_ended_at:    row.treatment_ended_at    ?? null,
    production_queued_at:  row.production_queued_at  ?? null,
    production_started_at: row.production_started_at ?? null,
    production_ended_at:   row.production_ended_at   ?? null,
    dispatched_at:         row.dispatched_at         ?? null,
    client_nickname:       clientMap[row.client_id]?.nickname     ?? null,
    client_name:           clientMap[row.client_id]?.company_name ?? null,
    assigned_name:         profileMap[row.assigned_to]?.full_name ?? null,
    assigned_id:           row.assigned_to ?? null,
    target_machine:        specMap[row.id]?.target_machine  ?? null,
    band_type:             specMap[row.id]?.band_type        ?? null,
    plate_thickness:       specMap[row.id]?.plate_thickness  ?? null,
  }))
}

function buildHUD(orders: ProductionOrder[]): HUDStats {
  const counts = orders.reduce(
    (acc, o) => { acc[o.status] = (acc[o.status] ?? 0) + 1; return acc },
    {} as Record<string, number>
  )

  const atrasados = orders.filter(o => {
    const ref =
      o.production_started_at ?? o.production_queued_at ??
      o.treatment_started_at  ?? o.queued_at ?? o.created_at
    return (Date.now() - new Date(ref).getTime()) / 3_600_000 > 4
  }).length

  return {
    filaArte:     counts['fila_arte']     ?? 0,
    emTratamento: counts['tratamento']    ?? 0,
    pausados:     counts['pausado']       ?? 0,
    filaProducao: counts['fila_producao'] ?? 0,
    emProducao:   counts['producao']      ?? 0,
    prontos:      counts['pronto']        ?? 0,
    atrasados,
    totalAtivos:  orders.length,
  }
}

export function useProductionOrders() {
  const [orders,  setOrders]  = useState<ProductionOrder[]>([])
  const [hud,     setHud]     = useState<HUDStats>({
    filaArte: 0, emTratamento: 0, pausados: 0,
    filaProducao: 0, emProducao: 0, prontos: 0,
    atrasados: 0, totalAtivos: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchOrders()
      setOrders(data)
      setHud(buildHUD(data))
    } catch (e: any) {
      console.error('[useProductionOrders] Erro inesperado:', e)
      setError(e?.message ?? 'Erro ao carregar a fila')
      setOrders([])
    } finally {
      setLoading(false)
    }
  }, [])

  const advanceStatus = useCallback(async (
    orderId: string,
    nextStatus: OrderStatus,
    assignedTo?: string
  ) => {
    const timestampField: Partial<Record<OrderStatus, string>> = {
      fila_arte:     'queued_at',
      tratamento:    'treatment_started_at',
      fila_producao: 'production_queued_at',
      producao:      'production_started_at',
      pronto:        'production_ended_at',
      despachado:    'dispatched_at',
    }

    const update: Record<string, unknown> = {
      status: nextStatus,
      updated_at: new Date().toISOString(),
    }

    const tsField = timestampField[nextStatus]
    if (tsField) update[tsField] = new Date().toISOString()

    if (nextStatus === 'tratamento' && assignedTo) {
      update['assigned_to'] = assignedTo
    }
    if (nextStatus === 'fila_producao') {
      update['treatment_ended_at'] = new Date().toISOString()
    }

    const { error } = await (supabase as any)
      .from('orders')
      .update(update)
      .eq('id', orderId)

    if (error) {
      console.error('Erro ao avançar status:', error.message)
      return false
    }
    return true
  }, [])

  const reorderInStatus = useCallback(async (
    reordered: { id: string; sort_order: number }[]
  ) => {
    // Atualiza otimisticamente no estado local
    setOrders(prev =>
      prev.map(o => {
        const found = reordered.find(r => r.id === o.id)
        return found ? { ...o, sort_order: found.sort_order } : o
      })
    )
    // Persiste no banco (silencioso — sort_order pode não existir ainda)
    const updates = reordered.map(({ id, sort_order }) =>
      (supabase as any).from('orders').update({ sort_order }).eq('id', id)
    )
    await Promise.allSettled(updates)
  }, [])

  useEffect(() => {
    load()

    const channel = supabase
      .channel('production-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        load()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [load])

  return { orders, hud, loading, error, advanceStatus, reorderInStatus, reload: load }
}
