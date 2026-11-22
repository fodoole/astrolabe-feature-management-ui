'use client'

import { useSession, signOut } from 'next-auth/react'
import { ReactNode, useEffect } from 'react'
import SignInPage from '@/components/sign-in-page'
import { isTokenExpired } from '@/lib/auth-utils'

interface AuthWrapperProps {
  children: ReactNode
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const { data: session, status } = useSession()
  // NextAuth's session cookie rolls forward, but the backend appJwt inside it is
  // minted once at sign-in — treat a missing/expired appJwt as signed out.
  const appJwtInvalid = !!session && (!session.appJwt || isTokenExpired(session.appJwt))

  useEffect(() => {
    if (appJwtInvalid) signOut({ callbackUrl: '/auth/signin' })
  }, [appJwtInvalid])

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!session || appJwtInvalid) {
    return <SignInPage />
  }

  return <>{children}</>
}
