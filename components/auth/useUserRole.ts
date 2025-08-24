'use client'

import { useSession } from 'next-auth/react'
import { GlobalRole } from './RoleGuard'

const roleHierarchy = {
  [GlobalRole.VIEWER]: 1,
  [GlobalRole.DEVELOPER]: 2,
  [GlobalRole.MANAGER]: 3,
  [GlobalRole.ADMIN]: 4
}

export function useUserRole() {
  const { data: session, status } = useSession()
  
  const userRole = session?.user?.globalRole as GlobalRole | undefined
  
  const hasPermission = (requiredRole: GlobalRole): boolean => {
    if (!userRole) return false
    
    const userLevel = roleHierarchy[userRole] || 0
    const requiredLevel = roleHierarchy[requiredRole] || 0
    
    return userLevel >= requiredLevel
  }
  
  const isAdmin = () => hasPermission(GlobalRole.ADMIN)
  const isManager = () => hasPermission(GlobalRole.MANAGER)
  const isDeveloper = () => hasPermission(GlobalRole.DEVELOPER)
  const isViewer = () => hasPermission(GlobalRole.VIEWER)
  
  return {
    userRole,
    hasPermission,
    isAdmin,
    isManager,
    isDeveloper,
    isViewer,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated'
  }
}
