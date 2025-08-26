'use client'

import { useSession } from 'next-auth/react'

export function useCurrentUser() {
  const { data: session, status } = useSession()
  
  return {
    userId: session?.user?.id || null,
    user: session?.user || null,
    isLoading: status === 'loading',
    isAuthenticated: !!session?.user?.id,
    accessToken: (session as any)?.accessToken || null,
  }
}

export function useAuthToken() {
  const { data: session } = useSession()
  return (session as any)?.accessToken || null
}

export default useCurrentUser
