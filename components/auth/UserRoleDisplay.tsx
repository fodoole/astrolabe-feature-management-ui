'use client'

import React from 'react'
import { useUserRole } from './useUserRole'

interface UserRoleDisplayProps {
  className?: string
}

export function UserRoleDisplay({ className = '' }: UserRoleDisplayProps) {
  const { userRole, isLoading } = useUserRole()
  
  if (isLoading) {
    return <span className={className}>Loading...</span>
  }
  
  if (!userRole) {
    return <span className={className}>No role assigned</span>
  }
  
  const roleColors = {
    admin: 'bg-red-100 text-red-800',
    manager: 'bg-blue-100 text-blue-800', 
    developer: 'bg-green-100 text-green-800',
    viewer: 'bg-gray-100 text-gray-800'
  }
  
  const roleColor = roleColors[userRole] || 'bg-gray-100 text-gray-800'
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleColor} ${className}`}>
      {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
    </span>
  )
}
