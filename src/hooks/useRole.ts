import { useAuth } from './useAuth'
import type { UserRole } from '../types/database'

// Hierarquia de papéis — índice mais alto = mais permissões
const ROLE_HIERARCHY: Record<UserRole, number> = {
  sysadmin:       6,
  admin_master:   5,
  gestor_pcp:     4,
  comercial:      3,
  arte_finalista: 2,
  triador:        1,
  clicherista:    1,
}

export function useRole() {
  const { profile } = useAuth()
  const role = profile?.role ?? null

  function hasRole(requiredRole: UserRole): boolean {
    if (!role) return false
    return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[requiredRole]
  }

  function isExactRole(r: UserRole): boolean {
    return role === r
  }

  // Permissões granulares por funcionalidade
  const can = {
    viewFinancials:    hasRole('comercial'),
    editOrders:        hasRole('arte_finalista'),
    manageProduction:  hasRole('gestor_pcp'),
    viewReports:       hasRole('gestor_pcp'),
    editCommissions:   hasRole('admin_master'),
    viewOwnCommission: !!role && role !== 'sysadmin',
    manageUsers:       isExactRole('sysadmin'),
    manageClients:       hasRole('arte_finalista'),
    advanceToProduction: hasRole('arte_finalista'),
    advanceToDispatched: hasRole('clicherista') || hasRole('gestor_pcp'),
    markScrap:           isExactRole('clicherista') || hasRole('gestor_pcp'),
  }

  function isAtLeast(requiredRole: UserRole): boolean {
    return hasRole(requiredRole)
  }

  return { role, hasRole, isExactRole, isAtLeast, can }
}
