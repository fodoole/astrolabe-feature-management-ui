'use client'

import React from 'react'
import { RoleGuard, GlobalRole } from './RoleGuard'

interface RoleBasedButtonProps {
  requiredRole: GlobalRole
  children: React.ReactNode
  className?: string
  onClick?: () => void
  disabled?: boolean
}

export function RoleBasedButton({ 
  requiredRole, 
  children, 
  className = '', 
  onClick, 
  disabled = false 
}: RoleBasedButtonProps) {
  return (
    <RoleGuard 
      requiredRole={requiredRole}
      fallback={null}
    >
      <button
        className={className}
        onClick={onClick}
        disabled={disabled}
      >
        {children}
      </button>
    </RoleGuard>
  )
}
