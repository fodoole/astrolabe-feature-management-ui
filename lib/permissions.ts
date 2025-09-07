'use client'

import { useSession } from 'next-auth/react'
import { useMemo } from 'react'
import { normalizePermissions, hasPermission as checkNormalized } from '@/lib/permissions-normalizer'
import type { NormalizedPermissions, PermissionAction } from '@/types'
import { toast } from 'sonner'

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

// --- Normalized permission access layer (new) ---
export interface UseAccessResult {
  loading: boolean
  permissions: NormalizedPermissions | null
  can: (resource: string, action: PermissionAction, opts?: { environment?: string }) => boolean
  any: (list: Array<[string, PermissionAction, { environment?: string }?]>) => boolean
  all: (list: Array<[string, PermissionAction, { environment?: string }?]>) => boolean
  raw: any
}

export function useAccess(): UseAccessResult {
  const { data: session, status } = useSession()
  const raw = session?.user?.permissions
  const normalized = useMemo<NormalizedPermissions | null>(() => raw ? normalizePermissions(raw) : null, [raw])

  const can = (resource: string, action: PermissionAction, opts?: { environment?: string }) => {
    return checkNormalized(normalized, resource, action, opts)
  }

  const any = (list: Array<[string, PermissionAction, { environment?: string }?]>) =>
    list.some(([r, a, o]) => can(r, a, o))

  const all = (list: Array<[string, PermissionAction, { environment?: string }?]>) =>
    list.every(([r, a, o]) => can(r, a, o))

  return {
    loading: status === 'loading',
    permissions: normalized,
    can,
    any,
    all,
    raw
  }
}

// Backwards compatibility helper mapping legacy booleans to normalized checks for flags UI
export function canCreateFlag(access: UseAccessResult): boolean {
  return access.can('flags', 'create')
}
export function canApproveInEnv(access: UseAccessResult, env: string): boolean {
  // Disallow approval workflow in development environments
  if (env === 'dev' || env === 'development') {
    return false
  }
  return access.can('approvals', 'approve', { environment: env })
}

// --- Deny helper with user feedback ---
export function requirePermission(access: UseAccessResult, resource: string, action: PermissionAction, opts?: { environment?: string, silent?: boolean, label?: string }): boolean {
  const allowed = access.can(resource, action, opts)
  if (!allowed && !opts?.silent) {
    const target = opts?.environment ? `${resource} (${opts.environment})` : resource
    toast.error(`You don't have permission to ${action} ${opts?.label || target}.`)
  }
  return allowed
}

// Higher-order action wrapper
export function guardedAction<T extends (...args: any[]) => any>(access: UseAccessResult, config: { resource: string, action: PermissionAction, environment?: string, label?: string, silent?: boolean }, fn: T): (...fnArgs: Parameters<T>) => ReturnType<T> | undefined {
  return (...args: Parameters<T>) => {
    if (!requirePermission(access, config.resource, config.action, { environment: config.environment, label: config.label, silent: config.silent })) {
      return undefined
    }
    return fn(...args)
  }
}
