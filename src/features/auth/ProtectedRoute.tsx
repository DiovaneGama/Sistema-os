import { Navigate, Outlet } from 'react-router-dom'
import { useAuthContext } from './AuthProvider'
import type { UserRole } from '../../types/database'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  allowedRoles?: UserRole[]
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { session, profile, loading } = useAuthContext()

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  // Não autenticado → redireciona para login
  if (!session) {
    return <Navigate to="/login" replace />
  }

  // Papel não permitido → redireciona para dashboard
  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
