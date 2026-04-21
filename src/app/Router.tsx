import { lazy, Suspense, Component } from 'react'
import type { ReactNode } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { AuthProvider } from '../features/auth/AuthProvider'
import { ProtectedRoute } from '../features/auth/ProtectedRoute'
import { AppLayout } from './AppLayout'
import { LoginPage } from '../features/auth/LoginPage'

// Lazy loading por feature (code splitting automático)
const DashboardPage  = lazy(() => import('../features/dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })))
const OrdersPage     = lazy(() => import('../features/orders/OrdersPage').then(m => ({ default: m.OrdersPage })))
const TriagePage     = lazy(() => import('../features/triage/TriagePage').then(m => ({ default: m.TriagePage })))
const ProductionPage = lazy(() => import('../features/production/ProductionPage').then(m => ({ default: m.ProductionPage })))
const ClientsPage    = lazy(() => import('../features/clients/ClientsPage').then(m => ({ default: m.ClientsPage })))
const ReportsPage    = lazy(() => import('../features/reports/ReportsPage').then(m => ({ default: m.ReportsPage })))
const SettingsPage       = lazy(() => import('../features/dashboard/SettingsPage').then(m => ({ default: m.SettingsPage })))
const OrderDetailPage    = lazy(() => import('../features/orders/OrderDetailPage').then(m => ({ default: m.OrderDetailPage })))
const CommissionsPage    = lazy(() => import('../features/commissions/CommissionsPage').then(m => ({ default: m.CommissionsPage })))
// import direto temporário para diagnóstico
import { CreateOrderPage } from '../features/orders/CreateOrderPage'

class ErrorBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  state = { error: null }
  static getDerivedStateFromError(e: Error) { return { error: e.message } }
  render() {
    if (this.state.error) return (
      <div className="p-8 text-red-600 font-mono text-sm whitespace-pre-wrap">
        ERRO AO CARREGAR PÁGINA:{'\n'}{this.state.error}
      </div>
    )
    return this.props.children
  }
}

function PageLoader() {
  return (
    <div className="flex h-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
    </div>
  )
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Rota pública */}
          <Route path="/login" element={<LoginPage />} />

          {/* Rotas protegidas — qualquer usuário autenticado */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />

              <Route path="/dashboard" element={
                <Suspense fallback={<PageLoader />}><DashboardPage /></Suspense>
              } />

              <Route path="/orders" element={
                <Suspense fallback={<PageLoader />}><OrdersPage /></Suspense>
              } />

              <Route path="/orders/new" element={
                <ErrorBoundary>
                  <CreateOrderPage />
                </ErrorBoundary>
              } />


              <Route path="/orders/:id" element={
                <Suspense fallback={<PageLoader />}><OrderDetailPage /></Suspense>
              } />

              <Route path="/triage" element={
                <Suspense fallback={<PageLoader />}><TriagePage /></Suspense>
              } />

              <Route path="/production" element={
                <Suspense fallback={<PageLoader />}><ProductionPage /></Suspense>
              } />

              <Route path="/clients" element={
                <Suspense fallback={<PageLoader />}><ClientsPage /></Suspense>
              } />

              {/* Comissões — arte_finalista + gestores */}
              <Route element={<ProtectedRoute allowedRoles={['sysadmin', 'admin_master', 'gestor_pcp', 'arte_finalista']} />}>
                <Route path="/commissions" element={
                  <Suspense fallback={<PageLoader />}><CommissionsPage /></Suspense>
                } />
              </Route>

              {/* Relatórios — apenas gestores e acima */}
              <Route element={<ProtectedRoute allowedRoles={['sysadmin', 'admin_master', 'gestor_pcp']} />}>
                <Route path="/reports" element={
                  <Suspense fallback={<PageLoader />}><ReportsPage /></Suspense>
                } />
              </Route>

              {/* Configurações — sysadmin + admin_master */}
              <Route element={<ProtectedRoute allowedRoles={['sysadmin', 'admin_master']} />}>
                <Route path="/settings" element={
                  <Suspense fallback={<PageLoader />}><SettingsPage /></Suspense>
                } />
              </Route>
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
