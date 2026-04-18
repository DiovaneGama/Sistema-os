import { useState, useCallback, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import type { OrderStatus } from '../../../types/database'
import type { NewOrderInput, OrderSpecsInput, OrderColorInput } from '../utils/schemas'

export interface OrderListItem {
  id: string
  order_number: string
  status: OrderStatus
  channel: string
  is_urgent: boolean
  is_rework: boolean
  briefing: string | null
  thumbnail_url: string | null
  created_at: string
  client_nickname: string | null
  client_name: string | null
  assigned_name: string | null
}

export interface OrderDetail {
  id: string
  order_number: string
  status: OrderStatus
  channel: string
  is_urgent: boolean
  is_rework: boolean
  briefing: string | null
  file_path: string | null
  thumbnail_url: string | null
  created_at: string
  queued_at: string | null
  client_id: string | null
  assigned_to: string | null
  client_nickname: string | null
  client_name: string | null
  assigned_name: string | null
  specs: OrderSpecDetail | null
  colors: OrderColorDetail[]
}

export interface OrderSpecDetail {
  id: string
  service_name: string | null
  substrate: string | null
  band_type: string | null
  target_machine: string | null
  print_type: string | null
  cylinder_diameter: number | null
  gear_z: number | null
  front_and_back: boolean
  plate_thickness: number | null
  distortion_pct: number | null
  lineature: number | null
  repetitions: number | null
  rows: number | null
  has_conjugated_item: boolean
  is_pre_assembled: boolean
  network_filename: string | null
  production_filename: string | null
  camerom_id: string | null
  frozen: boolean
}

export interface OrderColorDetail {
  id: string
  color_name: string
  width_cm: number | null
  height_cm: number | null
  area_cm2: number | null
  num_sets: number
  price: number | null
  sort_order: number
}

// ── Lista de pedidos ──────────────────────────────────────────────────────────

export function useOrdersList() {
  const [orders, setOrders] = useState<OrderListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await (supabase as any)
        .from('orders')
        .select('id, order_number, status, channel, is_urgent, is_rework, briefing, thumbnail_url, created_at, client_id, assigned_to')
        .order('created_at', { ascending: false })
        .limit(200)

      if (error) throw error
      if (!data || data.length === 0) { setOrders([]); return }

      const clientIds  = [...new Set(data.map((r: any) => r.client_id).filter(Boolean))]
      const profileIds = [...new Set(data.map((r: any) => r.assigned_to).filter(Boolean))]

      const [clientsRes, profilesRes] = await Promise.all([
        clientIds.length > 0
          ? (supabase as any).from('clients').select('id, nickname, company_name').in('id', clientIds)
          : Promise.resolve({ data: [], error: null }),
        profileIds.length > 0
          ? (supabase as any).from('profiles').select('id, full_name').in('id', profileIds)
          : Promise.resolve({ data: [], error: null }),
      ])

      const clientMap  = Object.fromEntries((clientsRes.data  ?? []).map((c: any) => [c.id, c]))
      const profileMap = Object.fromEntries((profilesRes.data ?? []).map((p: any) => [p.id, p]))

      setOrders(data.map((row: any) => ({
        id: row.id,
        order_number: row.order_number,
        status: row.status,
        channel: row.channel,
        is_urgent: row.is_urgent ?? false,
        is_rework: row.is_rework ?? false,
        briefing: row.briefing ?? null,
        thumbnail_url: row.thumbnail_url ?? null,
        created_at: row.created_at,
        client_nickname: clientMap[row.client_id]?.nickname ?? null,
        client_name: clientMap[row.client_id]?.company_name ?? null,
        assigned_name: profileMap[row.assigned_to]?.full_name ?? null,
      })))
    } catch (e: any) {
      setError(e?.message ?? 'Erro ao carregar pedidos')
      setOrders([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  return { orders, loading, error, reload: load }
}

// ── Detalhe de um pedido ──────────────────────────────────────────────────────

export function useOrderDetail(orderId: string | undefined) {
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!orderId) return
    setLoading(true)
    setError(null)
    try {
      const [orderRes, specsRes, colorsRes] = await Promise.all([
        (supabase as any).from('orders').select('*').eq('id', orderId).single(),
        (supabase as any).from('order_specs').select('*').eq('order_id', orderId).maybeSingle(),
        (supabase as any).from('order_colors').select('*').eq('order_id', orderId).order('sort_order'),
      ])

      if (orderRes.error) throw orderRes.error
      const row = orderRes.data

      const clientData = row.client_id
        ? (await (supabase as any).from('clients').select('id, nickname, company_name').eq('id', row.client_id).single()).data
        : null
      const profileData = row.assigned_to
        ? (await (supabase as any).from('profiles').select('id, full_name').eq('id', row.assigned_to).single()).data
        : null

      setOrder({
        id: row.id,
        order_number: row.order_number,
        status: row.status,
        channel: row.channel,
        is_urgent: row.is_urgent ?? false,
        is_rework: row.is_rework ?? false,
        briefing: row.briefing ?? null,
        file_path: row.file_path ?? null,
        thumbnail_url: row.thumbnail_url ?? null,
        created_at: row.created_at,
        queued_at: row.queued_at ?? null,
        client_id: row.client_id ?? null,
        assigned_to: row.assigned_to ?? null,
        client_nickname: clientData?.nickname ?? null,
        client_name: clientData?.company_name ?? null,
        assigned_name: profileData?.full_name ?? null,
        specs: specsRes.data ?? null,
        colors: colorsRes.data ?? [],
      })
    } catch (e: any) {
      setError(e?.message ?? 'Erro ao carregar pedido')
    } finally {
      setLoading(false)
    }
  }, [orderId])

  useEffect(() => { load() }, [load])

  return { order, loading, error, reload: load }
}

// ── Operações CRUD ─────────────────────────────────────────────────────────────

export function useOrderMutations() {
  async function createOrder(input: NewOrderInput): Promise<string | null> {
    const { data, error } = await (supabase as any)
      .from('orders')
      .insert({
        client_id: input.client_id,
        channel: input.channel,
        is_urgent: input.is_urgent,
        is_rework: input.is_rework,
        briefing: input.briefing || null,
        file_path: input.file_path || null,
        status: 'fila_arte',
        queued_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (error) { console.error('[createOrder]', error.message); return null }
    return data.id
  }

  async function saveSpecs(orderId: string, input: OrderSpecsInput): Promise<boolean> {
    // Upsert (insert or update) via order_id unique constraint
    const { error } = await (supabase as any)
      .from('order_specs')
      .upsert({
        order_id: orderId,
        service_name: input.service_name,
        substrate: input.substrate || null,
        band_type: input.band_type || null,
        target_machine: input.target_machine || null,
        print_type: input.print_type || null,
        cylinder_diameter: input.cylinder_diameter || null,
        gear_z: input.gear_z || null,
        front_and_back: input.front_and_back,
        plate_thickness: input.plate_thickness || null,
        distortion_pct: input.distortion_pct || null,
        lineature: input.lineature || null,
        repetitions: input.repetitions || null,
        rows: input.rows || null,
        has_conjugated_item: input.has_conjugated_item,
        is_pre_assembled: input.is_pre_assembled,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'order_id' })

    if (error) { console.error('[saveSpecs]', error.message); return false }
    return true
  }

  async function saveNomenclature(
    orderId: string,
    fields: { network_filename?: string; production_filename?: string; camerom_id?: string }
  ): Promise<boolean> {
    const { error } = await (supabase as any)
      .from('order_specs')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('order_id', orderId)

    if (error) { console.error('[saveNomenclature]', error.message); return false }
    return true
  }

  async function replaceColors(orderId: string, colors: OrderColorInput[], pricePerCm2?: number): Promise<boolean> {
    // Delete existing and re-insert
    await (supabase as any).from('order_colors').delete().eq('order_id', orderId)

    if (colors.length === 0) return true

    const rows = colors.map((c, i) => {
      const area = (c.width_cm ?? 0) * (c.height_cm ?? 0) * (c.num_sets ?? 1)
      const price = pricePerCm2 ? area * pricePerCm2 : null
      return {
        order_id: orderId,
        color_name: c.color_name,
        width_cm: c.width_cm,
        height_cm: c.height_cm,
        area_cm2: area,
        num_sets: c.num_sets,
        price,
        sort_order: i,
      }
    })

    const { error } = await (supabase as any).from('order_colors').insert(rows)
    if (error) { console.error('[replaceColors]', error.message); return false }
    return true
  }

  return { createOrder, saveSpecs, saveNomenclature, replaceColors }
}
