import { useState, useCallback, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import type { Client } from '../../../types/database'

export type ClientInput = Omit<Client, 'id' | 'created_at' | 'updated_at'>

export function useClientsFull() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const load = useCallback(async (q = '') => {
    setLoading(true)
    setError(null)
    try {
      let req = (supabase as any)
        .from('clients')
        .select('*')
        .order('company_name')

      if (q.trim()) {
        req = req.or(`company_name.ilike.%${q}%,nickname.ilike.%${q}%,contact_name.ilike.%${q}%`)
      }

      const { data, error: err } = await req
      if (err) throw err
      setClients(data ?? [])
    } catch (e: any) {
      setError(e.message ?? 'Erro ao carregar clientes')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => load(search), 250)
    return () => clearTimeout(t)
  }, [search, load])

  async function createClient(input: ClientInput): Promise<{ ok: boolean; error?: string }> {
    try {
      const { error: err } = await (supabase as any)
        .from('clients')
        .insert(input)
      if (err) return { ok: false, error: err.message }
      await load(search)
      return { ok: true }
    } catch (e: any) {
      return { ok: false, error: e?.message ?? 'Erro inesperado' }
    }
  }

  async function updateClient(id: string, input: Partial<ClientInput>): Promise<{ ok: boolean; error?: string }> {
    const { error: err } = await (supabase as any)
      .from('clients')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (err) return { ok: false, error: err.message }
    await load(search)
    return { ok: true }
  }

  async function toggleActive(id: string, active: boolean): Promise<void> {
    await (supabase as any)
      .from('clients')
      .update({ active, updated_at: new Date().toISOString() })
      .eq('id', id)
    await load(search)
  }

  return { clients, loading, error, search, setSearch, reload: () => load(search), createClient, updateClient, toggleActive }
}
