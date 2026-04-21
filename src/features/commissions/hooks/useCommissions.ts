import { useState, useCallback, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import type { UserRole } from '../../../types/database'

export type CommissionPeriod = 'month' | 'last_month' | '90d' | 'all'

export interface CommissionItem {
  id: string
  order_id: string
  order_number: string
  client_nickname: string | null
  client_name: string | null
  operator_name: string
  created_at: string
  base_amount: number | null
  rate: number | null
  commission_amount: number | null
  reversed: boolean
  reversed_reason: string | null
}

export interface CommissionTotals {
  gross: number
  reversed_amount: number
  net: number
  count: number
}

export interface ArtistProfile {
  id: string
  full_name: string
}

function periodStart(period: CommissionPeriod): string | null {
  const now = new Date()
  if (period === 'month') {
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  }
  if (period === 'last_month') {
    return new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
  }
  if (period === '90d') {
    const d = new Date()
    d.setDate(d.getDate() - 90)
    return d.toISOString()
  }
  return null
}

function periodEnd(period: CommissionPeriod): string | null {
  const now = new Date()
  if (period === 'last_month') {
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  }
  return null
}

export function useCommissions(
  currentProfileId: string,
  currentRole: UserRole | undefined,
  period: CommissionPeriod,
  filterProfileId?: string
) {
  const [items, setItems] = useState<CommissionItem[]>([])
  const [totals, setTotals] = useState<CommissionTotals>({ gross: 0, reversed_amount: 0, net: 0, count: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isManager = currentRole && ['sysadmin', 'admin_master', 'gestor_pcp'].includes(currentRole)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const since = periodStart(period)
      const until = periodEnd(period)

      let q = (supabase as any)
        .from('commissions')
        .select('id, order_id, profile_id, stage, base_amount, rate, commission_amount, reversed, reversed_reason, created_at')
        .order('created_at', { ascending: false })

      // arte_finalista só vê as próprias
      if (!isManager) {
        q = q.eq('profile_id', currentProfileId)
      } else if (filterProfileId) {
        q = q.eq('profile_id', filterProfileId)
      }

      if (since) q = q.gte('created_at', since)
      if (until) q = q.lt('created_at', until)

      const { data: rows, error: err } = await q
      if (err) throw err
      if (!rows || rows.length === 0) {
        setItems([])
        setTotals({ gross: 0, reversed_amount: 0, net: 0, count: 0 })
        return
      }

      // Joins manuais
      const orderIds   = [...new Set(rows.map((r: any) => r.order_id))]
      const profileIds = [...new Set(rows.map((r: any) => r.profile_id))]

      const [ordersRes, profilesRes] = await Promise.all([
        (supabase as any)
          .from('orders')
          .select('id, order_number, client_id')
          .in('id', orderIds),
        (supabase as any)
          .from('profiles')
          .select('id, full_name')
          .in('id', profileIds),
      ])

      const clientIds = [...new Set((ordersRes.data ?? []).map((o: any) => o.client_id).filter(Boolean))]
      const clientsRes = clientIds.length > 0
        ? await (supabase as any).from('clients').select('id, nickname, company_name').in('id', clientIds)
        : { data: [] }

      const orderMap   = Object.fromEntries((ordersRes.data  ?? []).map((o: any) => [o.id, o]))
      const profileMap = Object.fromEntries((profilesRes.data ?? []).map((p: any) => [p.id, p]))
      const clientMap  = Object.fromEntries((clientsRes.data  ?? []).map((c: any) => [c.id, c]))

      const mapped: CommissionItem[] = rows.map((r: any) => {
        const order   = orderMap[r.order_id]
        const client  = order?.client_id ? clientMap[order.client_id] : null
        const profile = profileMap[r.profile_id]
        return {
          id:               r.id,
          order_id:         r.order_id,
          order_number:     order?.order_number ?? '—',
          client_nickname:  client?.nickname    ?? null,
          client_name:      client?.company_name ?? null,
          operator_name:    profile?.full_name  ?? '—',
          created_at:       r.created_at,
          base_amount:      r.base_amount,
          rate:             r.rate,
          commission_amount: r.commission_amount,
          reversed:         r.reversed ?? false,
          reversed_reason:  r.reversed_reason ?? null,
        }
      })

      setItems(mapped)

      const gross    = mapped.filter(i => !i.reversed).reduce((s, i) => s + (i.commission_amount ?? 0), 0)
      const reverted = mapped.filter(i => i.reversed).reduce((s, i) => s + (i.commission_amount ?? 0), 0)
      setTotals({
        gross,
        reversed_amount: reverted,
        net: gross - reverted,
        count: mapped.filter(i => !i.reversed).length,
      })
    } catch (e: any) {
      setError(e?.message ?? 'Erro ao carregar comissões')
    } finally {
      setLoading(false)
    }
  }, [currentProfileId, currentRole, period, filterProfileId, isManager])

  useEffect(() => { load() }, [load])

  return { items, totals, loading, error, reload: load, isManager: !!isManager }
}

export function useArtistProfiles() {
  const [profiles, setProfiles] = useState<ArtistProfile[]>([])

  useEffect(() => {
    ;(supabase as any)
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'arte_finalista')
      .eq('active', true)
      .order('full_name')
      .then(({ data }: any) => setProfiles(data ?? []))
  }, [])

  return profiles
}
