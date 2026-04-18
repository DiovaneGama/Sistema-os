import { useState } from 'react'
import { Save, X, Pencil, PowerOff, Power, ShieldCheck, UserPlus, KeyRound } from 'lucide-react'
import type { ProfileItem } from '../hooks/useSettings'
import type { UserRole } from '../../../types/database'
import { supabase } from '../../../lib/supabase'
import { InviteUserModal } from './InviteUserModal'
import { ChangePasswordModal } from './ChangePasswordModal'

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'sysadmin',       label: 'Sysadmin' },
  { value: 'admin_master',   label: 'Admin Master' },
  { value: 'gestor_pcp',     label: 'Gestor PCP' },
  { value: 'comercial',      label: 'Comercial' },
  { value: 'arte_finalista',  label: 'Arte Finalista' },
  { value: 'clicherista',    label: 'Clicherista' },
  { value: 'triador',        label: 'Triador' },
]

const ROLE_COLORS: Record<UserRole, string> = {
  sysadmin:       'bg-red-100 text-red-700',
  admin_master:   'bg-orange-100 text-orange-700',
  gestor_pcp:     'bg-purple-100 text-purple-700',
  comercial:      'bg-blue-100 text-blue-700',
  arte_finalista:  'bg-emerald-100 text-emerald-700',
  clicherista:    'bg-cyan-100 text-cyan-700',
  triador:        'bg-slate-100 text-slate-600',
}

interface RowProps {
  profile: ProfileItem
  currentUserId: string
  currentUserRole?: UserRole
  onUpdate: (id: string, fields: Partial<Pick<ProfileItem, 'role' | 'daily_os_goal' | 'commission_rate' | 'active' | 'username'>>) => Promise<{ ok: boolean; error?: string }>
  onChangePassword: (targetUserId: string, password: string, isSelf: boolean) => Promise<{ ok: boolean; error?: string }>
}

function ProfileRow({ profile, currentUserId, currentUserRole, onUpdate, onChangePassword }: RowProps) {
  const [editing, setEditing] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [role, setRole] = useState<UserRole>(profile.role)
  const [goal, setGoal] = useState(String(profile.daily_os_goal))
  const [rate, setRate] = useState(String((profile.commission_rate * 100).toFixed(2)))
  const [username, setUsername] = useState(profile.username ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isSelf = profile.id === currentUserId
  const canChangePassword = isSelf || currentUserRole === 'sysadmin'

  async function handleSave() {
    setSaving(true)
    setError(null)
    const trimmed = username.trim().toLowerCase()
    const result = await onUpdate(profile.id, {
      role,
      daily_os_goal: parseInt(goal) || 10,
      commission_rate: (parseFloat(rate) || 0) / 100,
      username: trimmed || null,
    })
    setSaving(false)
    if (result.ok) setEditing(false)
    else setError(result.error ?? 'Erro ao salvar')
  }

  function handleCancel() {
    setRole(profile.role)
    setGoal(String(profile.daily_os_goal))
    setRate(String((profile.commission_rate * 100).toFixed(2)))
    setUsername(profile.username ?? '')
    setEditing(false)
    setError(null)
  }

  async function handleToggleActive() {
    await onUpdate(profile.id, { active: !profile.active })
  }

  return (
    <tr className={['border-b border-slate-100 transition-colors hover:bg-slate-50/50', !profile.active ? 'opacity-50' : ''].join(' ')}>
      {/* Usuário */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
            {profile.full_name.split(' ').map(n => n[0]).slice(0, 2).join('')}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold text-slate-800">{profile.full_name}</p>
              {isSelf && <span className="text-xs text-emerald-600 font-medium">(você)</span>}
            </div>
            <p className="text-xs text-slate-400">{profile.active ? 'Ativo' : 'Inativo'}</p>
          </div>
        </div>
      </td>

      {/* Login */}
      <td className="px-4 py-3">
        {editing ? (
          <input
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="usuario"
            autoCapitalize="none"
            className="w-28 rounded border border-slate-200 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        ) : (
          <span className="text-xs font-mono text-slate-600">{profile.username ?? <span className="text-slate-300 italic">não definido</span>}</span>
        )}
      </td>

      {/* Papel */}
      <td className="px-4 py-3">
        {editing ? (
          <select value={role} onChange={e => setRole(e.target.value as UserRole)}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500">
            {ROLE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        ) : (
          <span className={['inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold', ROLE_COLORS[profile.role]].join(' ')}>
            <ShieldCheck className="h-3 w-3" />
            {ROLE_OPTIONS.find(o => o.value === profile.role)?.label ?? profile.role}
          </span>
        )}
      </td>

      {/* Meta diária */}
      <td className="px-4 py-3">
        {editing ? (
          <input type="number" min={1} max={100} value={goal} onChange={e => setGoal(e.target.value)}
            className="w-16 rounded border border-slate-200 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        ) : (
          <span className="text-sm text-slate-700">{profile.daily_os_goal} OSs/dia</span>
        )}
      </td>

      {/* Comissão */}
      <td className="px-4 py-3">
        {editing ? (
          <div className="flex items-center gap-1">
            <input type="number" min={0} max={100} step={0.01} value={rate} onChange={e => setRate(e.target.value)}
              className="w-16 rounded border border-slate-200 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            <span className="text-xs text-slate-400">%</span>
          </div>
        ) : (
          <span className="text-sm text-slate-700">{(profile.commission_rate * 100).toFixed(2)}%</span>
        )}
      </td>

      {/* Ações */}
      <td className="px-4 py-3 text-right">
        {error && <p className="text-xs text-red-500 mb-1">{error}</p>}
        <div className="flex items-center justify-end gap-1">
          {editing ? (
            <>
              <button onClick={handleSave} disabled={saving}
                className="rounded-lg bg-emerald-600 p-1.5 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                <Save className="h-3.5 w-3.5" />
              </button>
              <button onClick={handleCancel}
                className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-100 transition-colors">
                <X className="h-3.5 w-3.5" />
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setEditing(true)} title="Editar"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
                <Pencil className="h-3.5 w-3.5" />
              </button>
              {canChangePassword && (
                <button onClick={() => setShowChangePassword(true)} title="Redefinir senha"
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-amber-50 hover:text-amber-600 transition-colors">
                  <KeyRound className="h-3.5 w-3.5" />
                </button>
              )}
              {!isSelf && (
                <button onClick={handleToggleActive}
                  title={profile.active ? 'Desativar usuário' : 'Reativar usuário'}
                  className={[
                    'rounded-lg p-1.5 transition-colors',
                    profile.active
                      ? 'text-slate-400 hover:bg-red-50 hover:text-red-500'
                      : 'text-emerald-500 hover:bg-emerald-50',
                  ].join(' ')}>
                  {profile.active ? <PowerOff className="h-3.5 w-3.5" /> : <Power className="h-3.5 w-3.5" />}
                </button>
              )}
            </>
          )}

        {showChangePassword && (
          <ChangePasswordModal
            targetName={profile.full_name}
            onClose={() => setShowChangePassword(false)}
            onSave={(password) => onChangePassword(profile.id, password, isSelf)}
          />
        )}
        </div>
      </td>
    </tr>
  )
}

interface Props {
  profiles: ProfileItem[]
  currentUserId: string
  currentUserRole?: UserRole
  onUpdate: (id: string, fields: Partial<Pick<ProfileItem, 'role' | 'daily_os_goal' | 'commission_rate' | 'active' | 'username'>>) => Promise<{ ok: boolean; error?: string }>
  onCreate: (data: { full_name: string; username: string; password: string; role: UserRole; daily_os_goal: number; commission_rate: number }) => Promise<{ ok: boolean; error?: string }>
  onChangePassword: (targetUserId: string, password: string, isSelf: boolean) => Promise<{ ok: boolean; error?: string }>
}

export function UsersPanel({ profiles, currentUserId, currentUserRole, onUpdate, onCreate, onChangePassword }: Props) {
  const [showInvite, setShowInvite] = useState(false)
  const isSysadmin = currentUserRole === 'sysadmin'

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-800">Usuários e Permissões</h2>
          <p className="text-xs text-slate-400 mt-0.5">Gerencie papéis, metas e comissões de cada usuário.</p>
        </div>
        {isSysadmin && (
          <button onClick={() => setShowInvite(true)}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors">
            <UserPlus className="h-3.5 w-3.5" />
            Novo Usuário
          </button>
        )}
      </div>

      {showInvite && (
        <InviteUserModal
          onClose={() => setShowInvite(false)}
          onSave={onCreate}
        />
      )}
      {profiles.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-slate-400">Nenhum usuário encontrado.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              {['Usuário', 'Login', 'Papel', 'Meta diária', 'Comissão', ''].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {profiles.map(p => (
              <ProfileRow key={p.id} profile={p} currentUserId={currentUserId} currentUserRole={currentUserRole} onUpdate={onUpdate} onChangePassword={onChangePassword} />
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
