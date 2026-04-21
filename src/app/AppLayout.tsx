import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  Mail,
  ClipboardList,
  Users,
  Settings,
  LogOut,
  Factory,
  KeyRound,
  DollarSign,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useRole } from '../hooks/useRole'
import { supabase } from '../lib/supabase'
import { ChangePasswordModal } from '../features/dashboard/components/ChangePasswordModal'

const ROLE_LABELS: Record<string, string> = {
  sysadmin:       'SysAdmin',
  admin_master:   'Diretor',
  gestor_pcp:     'Gestor / PCP',
  comercial:      'Comercial',
  arte_finalista: 'Arte Finalista',
  clicherista:    'Clicherista',
  triador:        'Triador',
}

interface NavItem {
  to: string
  label: string
  icon: React.ElementType
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard',   label: 'Dashboard',       icon: LayoutDashboard },
  { to: '/triage',      label: 'Triagem de E-mail', icon: Mail },
  { to: '/orders',      label: 'Fila de OS', icon: ClipboardList },
  { to: '/production',  label: 'Produção',         icon: Factory },
  { to: '/clients',     label: 'Clientes',         icon: Users },
  { to: '/commissions', label: 'Comissões',        icon: DollarSign },
  { to: '/settings',    label: 'Configurações',    icon: Settings },
]

export function AppLayout() {
  const { profile, signOut } = useAuth()
  const { can } = useRole()
  const [showChangePassword, setShowChangePassword] = useState(false)

  async function handleChangeOwnPassword(password: string) {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  }

  // Filtra itens de navegação por permissão
  const role = profile?.role
  const visibleNavItems = NAV_ITEMS.filter((item) => {
    if (item.to === '/settings')    return can.manageUsers || can.manageProduction
    if (item.to === '/commissions') return ['sysadmin','admin_master','gestor_pcp','arte_finalista'].includes(role ?? '')
    return true
  })

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* ===== SIDEBAR ===== */}
      <aside className="flex flex-col w-60 shrink-0 border-r border-slate-200 bg-white">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-slate-100">
          <span className="text-xl font-bold text-slate-800 tracking-tight">ManOS</span>
          <p className="text-xs text-slate-400 mt-0.5">Gestão de Produção</p>
        </div>

        {/* Navegação */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {visibleNavItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                [
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                  isActive
                    ? 'bg-white shadow-sm border border-slate-200 text-slate-900 font-medium [border-left:3px_solid_theme(colors.emerald.500)]'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800',
                ].join(' ')
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Rodapé — usuário logado */}
        <div className="px-3 py-4 border-t border-slate-100">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-sm font-semibold">
              {profile?.full_name?.charAt(0).toUpperCase() ?? '?'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-800">
                {profile?.full_name ?? 'Carregando...'}
              </p>
              <p className="truncate text-xs text-slate-500">
                {profile?.role ? ROLE_LABELS[profile.role] : ''}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowChangePassword(true)}
            className="mt-1 flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-500 hover:bg-amber-50 hover:text-amber-600 transition-colors"
          >
            <KeyRound className="h-4 w-4" />
            Alterar Senha
          </button>
          <button
            onClick={signOut}
            className="mt-1 flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>

        {showChangePassword && (
          <ChangePasswordModal
            targetName={profile?.full_name ?? ''}
            onClose={() => setShowChangePassword(false)}
            onSave={(password) => handleChangeOwnPassword(password)}
          />
        )}
      </aside>

      {/* ===== CONTEÚDO PRINCIPAL ===== */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
