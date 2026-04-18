import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../../lib/supabase'

export type ReportPeriod = '7d' | '30d' | '90d' | 'all'

export interface KpiData {
  total_orders: number
  completed_orders: number    // pronto + faturamento + despachado
  rework_orders: number
  urgent_orders: number
  completion_rate: number     // %
  rework_rate: number         // %
}

export interface StatusDistItem {
  status: string
  label: string
  count: number
  color: string
}

export interface VolumeByDayItem {
  date: string      // 'DD/MM'
  criados: number
  concluidos: number
}

export interface TopClientItem {
  nickname: string
  company_name: string
  count: number
}

export interface ChannelItem {
  channel: string
  label: string
  count: number
  color: string
}

const STATUS_LABELS: Record<string, string> = {
  rascunho: 'Rascunho', fila_arte: 'Fila Arte', tratamento: 'Tratamento',
  pausado: 'Pausado', fila_producao: 'Fila Produção', producao: 'Produção',
  pronto: 'Pronto', faturamento: 'Faturamento', despachado: 'Despachado',
  devolvido: 'Devolvido', cancelado: 'Cancelado',
}

const STATUS_COLORS: Record<string, string> = {
  rascunho: '#94a3b8', fila_arte: '#a855f7', tratamento: '#3b82f6',
  pausado: '#f59e0b', fila_producao: '#f97316', producao: '#06b6d4',
  pronto: '#10b981', faturamento: '#14b8a6', despachado: '#22c55e',
  devolvido: '#ec4899', cancelado: '#ef4444',
}

const CHANNEL_LABELS: Record<string, string> = {
  email: 'E-mail', whatsapp: 'WhatsApp', balcao: 'Balcão',
  telefone: 'Telefone', orcamento: 'Orçamento', outros: 'Outros',
}

const CHANNEL_COLORS: Record<string, string> = {
  email: '#3b82f6', whatsapp: '#22c55e', balcao: '#f97316',
  telefone: '#a855f7', orcamento: '#14b8a6', outros: '#94a3b8',
}

function periodStart(period: ReportPeriod): string | null {
  if (period === 'all') return null
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

export function useReportsData(period: ReportPeriod) {
  const [kpi, setKpi] = useState<KpiData | null>(null)
  const [statusDist, setStatusDist] = useState<StatusDistItem[]>([])
  const [volumeByDay, setVolumeByDay] = useState<VolumeByDayItem[]>([])
  const [topClients, setTopClients] = useState<TopClientItem[]>([])
  const [channels, setChannels] = useState<ChannelItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const since = periodStart(period)

      // Query base com filtro de período
      let q = (supabase as any)
        .from('orders')
        .select('id, status, channel, is_urgent, is_rework, created_at, client_id')

      if (since) q = q.gte('created_at', since)

      const { data: orders, error: err } = await q
      if (err) throw err

      const rows: any[] = orders ?? []

      // ── KPIs ──────────────────────────────────────────────
      const completed = rows.filter(r => ['pronto', 'faturamento', 'despachado'].includes(r.status))
      const reworks   = rows.filter(r => r.is_rework)
      const urgents   = rows.filter(r => r.is_urgent)
      setKpi({
        total_orders:     rows.length,
        completed_orders: completed.length,
        rework_orders:    reworks.length,
        urgent_orders:    urgents.length,
        completion_rate:  rows.length > 0 ? Math.round((completed.length / rows.length) * 100) : 0,
        rework_rate:      rows.length > 0 ? Math.round((reworks.length   / rows.length) * 100) : 0,
      })

      // ── Distribuição por status ────────────────────────────
      const statusCount: Record<string, number> = {}
      rows.forEach(r => { statusCount[r.status] = (statusCount[r.status] ?? 0) + 1 })
      setStatusDist(
        Object.entries(statusCount)
          .map(([s, count]) => ({ status: s, label: STATUS_LABELS[s] ?? s, count, color: STATUS_COLORS[s] ?? '#94a3b8' }))
          .sort((a, b) => b.count - a.count)
      )

      // ── Volume por dia (últimos 14 dias ou período) ────────
      const days = period === '7d' ? 7 : period === '30d' ? 14 : period === '90d' ? 30 : 14
      const volumeMap: Record<string, { criados: number; concluidos: number }> = {}
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const key = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
        volumeMap[key] = { criados: 0, concluidos: 0 }
      }
      rows.forEach(r => {
        const key = new Date(r.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
        if (volumeMap[key]) {
          volumeMap[key].criados++
          if (['pronto', 'faturamento', 'despachado'].includes(r.status)) volumeMap[key].concluidos++
        }
      })
      setVolumeByDay(Object.entries(volumeMap).map(([date, v]) => ({ date, ...v })))

      // ── Top clientes ──────────────────────────────────────
      const clientCount: Record<string, number> = {}
      rows.forEach(r => { if (r.client_id) clientCount[r.client_id] = (clientCount[r.client_id] ?? 0) + 1 })
      const topIds = Object.entries(clientCount).sort((a, b) => b[1] - a[1]).slice(0, 7).map(([id]) => id)

      if (topIds.length > 0) {
        const { data: clients } = await (supabase as any)
          .from('clients')
          .select('id, nickname, company_name')
          .in('id', topIds)
        setTopClients(
          (clients ?? []).map((c: any) => ({
            nickname: c.nickname,
            company_name: c.company_name,
            count: clientCount[c.id] ?? 0,
          })).sort((a: any, b: any) => b.count - a.count)
        )
      } else {
        setTopClients([])
      }

      // ── Canais ────────────────────────────────────────────
      const chanCount: Record<string, number> = {}
      rows.forEach(r => { chanCount[r.channel] = (chanCount[r.channel] ?? 0) + 1 })
      setChannels(
        Object.entries(chanCount).map(([ch, count]) => ({
          channel: ch, label: CHANNEL_LABELS[ch] ?? ch, count, color: CHANNEL_COLORS[ch] ?? '#94a3b8',
        })).sort((a, b) => b.count - a.count)
      )
    } catch (e: any) {
      setError(e?.message ?? 'Erro ao carregar relatórios')
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => { load() }, [load])

  return { kpi, statusDist, volumeByDay, topClients, channels, loading, error, reload: load }
}
