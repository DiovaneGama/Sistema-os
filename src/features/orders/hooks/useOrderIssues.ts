import { useState, useCallback, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'

export type IssueCategory = 'erro_arquivo' | 'falta_info_tecnica' | 'duvida_montagem'
export type IssueResponsible = 'cliente' | 'supervisor'

export const CATEGORY_LABELS: Record<IssueCategory, string> = {
  erro_arquivo:       'Erro no Arquivo',
  falta_info_tecnica: 'Falta de Info Técnica',
  duvida_montagem:    'Dúvida de Montagem',
}

export const CATEGORY_COLORS: Record<IssueCategory, string> = {
  erro_arquivo:       'bg-red-100 text-red-700',
  falta_info_tecnica: 'bg-amber-100 text-amber-700',
  duvida_montagem:    'bg-blue-100 text-blue-700',
}

export const RESPONSIBLE_LABELS: Record<IssueResponsible, string> = {
  cliente:    'Aguardando Cliente',
  supervisor: 'Aguardando Supervisor',
}

export interface OrderIssueItem {
  id: string
  order_id: string
  reported_by: string
  reporter_name: string | null
  category: IssueCategory
  description: string
  responsible: IssueResponsible
  resolved: boolean
  resolved_at: string | null
  resolved_by: string | null
  resolver_name: string | null
  created_at: string
}

export interface CreateIssueInput {
  category: IssueCategory
  description: string
  responsible: IssueResponsible
}

export function useOrderIssues(orderId: string | undefined) {
  const [issues, setIssues] = useState<OrderIssueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!orderId) return
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await (supabase as any)
        .from('order_issues')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false })

      if (err) throw err
      const rows: any[] = data ?? []

      if (rows.length === 0) { setIssues([]); return }

      const profileIds = [...new Set([
        ...rows.map((r: any) => r.reported_by),
        ...rows.map((r: any) => r.resolved_by).filter(Boolean),
      ])]

      const { data: profiles } = await (supabase as any)
        .from('profiles')
        .select('id, full_name')
        .in('id', profileIds)

      const profileMap = Object.fromEntries((profiles ?? []).map((p: any) => [p.id, p.full_name]))

      setIssues(rows.map((r: any) => ({
        id:            r.id,
        order_id:      r.order_id,
        reported_by:   r.reported_by,
        reporter_name: profileMap[r.reported_by] ?? null,
        category:      r.category as IssueCategory,
        description:   r.description,
        responsible:   r.responsible as IssueResponsible,
        resolved:      r.resolved ?? false,
        resolved_at:   r.resolved_at ?? null,
        resolved_by:   r.resolved_by ?? null,
        resolver_name: r.resolved_by ? profileMap[r.resolved_by] ?? null : null,
        created_at:    r.created_at,
      })))
    } catch (e: any) {
      setError(e?.message ?? 'Erro ao carregar problemas')
    } finally {
      setLoading(false)
    }
  }, [orderId])

  useEffect(() => { load() }, [load])

  async function createIssue(
    input: CreateIssueInput,
    reportedBy: string
  ): Promise<{ ok: boolean; error?: string }> {
    const { error: err } = await (supabase as any)
      .from('order_issues')
      .insert({
        order_id:    orderId,
        reported_by: reportedBy,
        category:    input.category,
        description: input.description,
        responsible: input.responsible,
      })

    if (err) return { ok: false, error: err.message }
    await load()
    return { ok: true }
  }

  async function resolveIssue(
    issueId: string,
    resolvedBy: string
  ): Promise<{ ok: boolean; error?: string }> {
    const { error: err } = await (supabase as any)
      .from('order_issues')
      .update({
        resolved:    true,
        resolved_by: resolvedBy,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', issueId)

    if (err) return { ok: false, error: err.message }
    await load()
    return { ok: true }
  }

  const openCount = issues.filter(i => !i.resolved).length

  return { issues, openCount, loading, error, reload: load, createIssue, resolveIssue }
}
