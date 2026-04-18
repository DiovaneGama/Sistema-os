import { useState } from 'react'
import { RefreshCw, Settings2, Users } from 'lucide-react'
import { useSettings } from './hooks/useSettings'
import { SystemConfigPanel } from './components/SystemConfigPanel'
import { UsersPanel } from './components/UsersPanel'
import { useAuth } from '../../hooks/useAuth'

const TABS = [
  { id: 'config', label: 'Parâmetros', icon: <Settings2 className="h-4 w-4" /> },
  { id: 'users',  label: 'Usuários',   icon: <Users className="h-4 w-4" /> },
] as const

type Tab = typeof TABS[number]['id']

export function SettingsPage() {
  const [tab, setTab] = useState<Tab>('config')
  const { profile } = useAuth()
  const { configs, profiles, loading, error, reload, updateConfig, updateProfile, createUser, changePassword } = useSettings()

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b border-slate-200 bg-white px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Configurações</h1>
          <p className="text-xs text-slate-400 mt-0.5">Parâmetros do sistema e gerenciamento de usuários</p>
        </div>
        <button onClick={reload} disabled={loading}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      {/* Tabs */}
      <div className="shrink-0 flex gap-1 border-b border-slate-200 bg-white px-6">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={[
              'flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
              tab === t.id
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-700',
            ].join(' ')}>
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="h-6 w-6 animate-spin text-emerald-500" />
          </div>
        ) : (
          <>
            {tab === 'config' && (
              <SystemConfigPanel configs={configs} onSave={updateConfig} />
            )}
            {tab === 'users' && (
              <UsersPanel
                profiles={profiles}
                currentUserId={profile?.id ?? ''}
                currentUserRole={profile?.role}
                onUpdate={updateProfile}
                onCreate={createUser}
                onChangePassword={changePassword}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}
