import { useState, useCallback, useEffect } from 'react'
import { supabase, supabaseAdmin } from '../../../lib/supabase'
import type { UserRole } from '../../../types/database'

export interface SystemConfigItem {
  key: string
  value: string
  description: string | null
}

export interface ProfileItem {
  id: string
  full_name: string
  username: string | null
  role: UserRole
  daily_os_goal: number
  commission_rate: number
  operator_code: number | null
  active: boolean
  created_at: string
}

export function useSettings() {
  const [configs, setConfigs] = useState<SystemConfigItem[]>([])
  const [profiles, setProfiles] = useState<ProfileItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [configRes, profileRes] = await Promise.all([
        (supabase as any).from('system_config').select('key, value, description').order('key'),
        (supabase as any).from('profiles').select('*').order('full_name'),
      ])
      if (configRes.error) throw configRes.error
      if (profileRes.error) throw profileRes.error
      setConfigs(configRes.data ?? [])
      setProfiles(profileRes.data ?? [])
    } catch (e: any) {
      setError(e?.message ?? 'Erro ao carregar configurações')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function updateConfig(key: string, value: string): Promise<{ ok: boolean; error?: string }> {
    const { error: err } = await (supabase as any)
      .from('system_config')
      .update({ value, updated_at: new Date().toISOString() })
      .eq('key', key)
    if (err) return { ok: false, error: err.message }
    setConfigs(prev => prev.map(c => c.key === key ? { ...c, value } : c))
    return { ok: true }
  }

  async function updateProfile(
    id: string,
    fields: Partial<Pick<ProfileItem, 'role' | 'daily_os_goal' | 'commission_rate' | 'active' | 'username' | 'operator_code'>>
  ): Promise<{ ok: boolean; error?: string }> {
    const { error: err } = await (supabase as any)
      .from('profiles')
      .update(fields)
      .eq('id', id)
    if (err) return { ok: false, error: err.message }
    setProfiles(prev => prev.map(p => p.id === id ? { ...p, ...fields } : p))
    return { ok: true }
  }

  async function createUser(data: {
    full_name: string
    username: string
    password: string
    role: UserRole
    daily_os_goal: number
    commission_rate: number
  }): Promise<{ ok: boolean; error?: string }> {
    const email = `${data.username.trim().toLowerCase()}@sistema.local`

    // Cria usuário no Auth via admin client (service role — sistema interno)
    const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: data.password,
      email_confirm: true,
    })
    if (authErr || !authData.user) return { ok: false, error: authErr?.message ?? 'Erro ao criar usuário' }

    // Insere perfil
    const { data: profile, error: profileErr } = await (supabaseAdmin as any)
      .from('profiles')
      .insert({
        id: authData.user.id,
        full_name: data.full_name.trim(),
        username: data.username.trim().toLowerCase(),
        role: data.role,
        daily_os_goal: data.daily_os_goal,
        commission_rate: data.commission_rate,
        active: true,
      })
      .select()
      .single()

    if (profileErr) {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return { ok: false, error: profileErr.message }
    }

    setProfiles(prev => [...prev, profile as ProfileItem].sort((a, b) => a.full_name.localeCompare(b.full_name)))
    return { ok: true }
  }

  async function changePassword(
    targetUserId: string,
    newPassword: string,
    isSelf: boolean
  ): Promise<{ ok: boolean; error?: string }> {
    if (isSelf) {
      // Usuário alterando a própria senha — usa cliente normal
      const { error: err } = await supabase.auth.updateUser({ password: newPassword })
      if (err) return { ok: false, error: err.message }
      return { ok: true }
    }
    // Sysadmin alterando senha de outro usuário — usa admin client
    const { error: err } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, { password: newPassword })
    if (err) return { ok: false, error: err.message }
    return { ok: true }
  }

  return { configs, profiles, loading, error, reload: load, updateConfig, updateProfile, createUser, changePassword }
}
