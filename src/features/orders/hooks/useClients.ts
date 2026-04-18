import { useState, useCallback, useEffect, useRef } from 'react'
import { supabase } from '../../../lib/supabase'
import type { NewClientInput } from '../utils/schemas'

export interface ClientOption {
  id: string
  company_name: string
  nickname: string
  unit_city: string | null
  units: string[]
  price_per_cm2: number | null
  substrates: string[] | null
  plate_thicknesses: string[] | null
  ink_types: string[] | null
}

export function useClients() {
  const [clients, setClients] = useState<ClientOption[]>([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const search = useCallback(async (q: string) => {
    setLoading(true)
    try {
      let req = (supabase as any)
        .from('clients')
        .select('id, company_name, nickname, unit_city, units, price_per_cm2, substrates, plate_thicknesses, ink_types')
        .order('company_name')
        .limit(30)

      if (q.trim()) {
        req = req.or(`company_name.ilike.%${q}%,nickname.ilike.%${q}%`)
      }

      const { data, error } = await req
      if (error) console.error('[useClients] search error:', error.message)
      setClients(data ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(query), 250)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, search])

  async function createClient(input: NewClientInput): Promise<ClientOption | null> {
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
        substrates: input.substrates.length > 0 ? input.substrates : null,
        plate_thicknesses: input.plate_thicknesses.length > 0 ? input.plate_thicknesses : null,
        ink_types: input.ink_types.length > 0 ? input.ink_types : null,
      })
      .select('id, company_name, nickname, unit_city, units, price_per_cm2, substrates, plate_thicknesses, ink_types')
      .single()

    if (error) {
      console.error('[useClients] createClient error:', error.message)
      return null
    }
    return data
  }

  return { clients, loading, query, setQuery, createClient }
}
