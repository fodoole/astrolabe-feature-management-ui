'use client'

import { useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { isTokenExpired } from '@/lib/auth-utils'

interface AuthTokenMonitorProps {
  children: React.ReactNode
}

export function AuthTokenMonitor({ children }: AuthTokenMonitorProps) {
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status !== 'authenticated' || !session?.appJwt) {
      return
    }

    const checkTokenExpiration = () => {
      if (session.appJwt && isTokenExpired(session.appJwt)) {
        console.log('JWT token expired, signing out user')
        signOut({ callbackUrl: '/auth/signin' })
      }
    }

    checkTokenExpiration()

    const interval = setInterval(checkTokenExpiration, 60000)

    return () => clearInterval(interval)
  }, [session, status])

  return <>{children}</>
}
