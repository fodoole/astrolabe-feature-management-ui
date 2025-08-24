'use client'

import React, { ReactNode } from 'react'
import { useSession } from 'next-auth/react'

export enum GlobalRole {
  ADMIN = 'admin',
  MANAGER = 'manager', 
  DEVELOPER = 'developer',
  VIEWER = 'viewer'
}

interface RoleGuardProps {
  requiredRole: GlobalRole
  children: ReactNode
  fallback?: ReactNode
}

const roleHierarchy = {
  [GlobalRole.VIEWER]: 1,
  [GlobalRole.DEVELOPER]: 2,
  [GlobalRole.MANAGER]: 3,
  [GlobalRole.ADMIN]: 4
}

function hasPermission(userRole: string | undefined, requiredRole: GlobalRole): boolean {
  if (!userRole) return false
  
  const userLevel = roleHierarchy[userRole as GlobalRole] || 0
  const requiredLevel = roleHierarchy[requiredRole] || 0
  
  return userLevel >= requiredLevel
}

export function RoleGuard({ requiredRole, children, fallback = null }: RoleGuardProps) {
  const { data: session, status } = useSession()
  
  if (status === 'loading') {
    return <div>Loading...</div>
  }
  
  if (status === 'unauthenticated') {
    return fallback
  }
  
  const userRole = session?.user?.globalRole
  
  if (!hasPermission(userRole, requiredRole)) {
    return fallback
  }
  
  return <>{children}</>
}
