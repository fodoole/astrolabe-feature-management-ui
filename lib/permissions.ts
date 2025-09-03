'use client'

import { useSession } from 'next-auth/react'

export interface UserPermissions {
  can_approve_production: boolean
  can_approve_staging: boolean
  can_create_flags: boolean
  can_read_only: boolean
}

export const usePermissions = (): UserPermissions & { isLoading: boolean } => {
  const { data: session, status } = useSession()
  
  const defaultPermissions: UserPermissions = {
    can_approve_production: false,
    can_approve_staging: false,
    can_create_flags: false,
    can_read_only: false,
  }
  
  if (status === 'loading') {
    return { ...defaultPermissions, isLoading: true }
  }
  
  const permissions = session?.user?.permissions || defaultPermissions
  
  return {
    ...permissions,
    isLoading: false,
  }
}

export const hasPermission = (permissions: UserPermissions, action: keyof UserPermissions): boolean => {
  return permissions[action] || false
}

export const getUserRole = (session: any): string | null => {
  return session?.user?.roles || null
}

export const isAdmin = (session: any): boolean => {
  return getUserRole(session) === 'admin'
}

export const isManager = (session: any): boolean => {
  const role = getUserRole(session)
  return role === 'admin' || role === 'manager'
}

export const isDeveloper = (session: any): boolean => {
  const role = getUserRole(session)
  return role === 'admin' || role === 'manager' || role === 'developer'
}
