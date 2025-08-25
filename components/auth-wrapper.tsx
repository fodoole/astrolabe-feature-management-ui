'use client'

import { useSession } from 'next-auth/react'
import { ReactNode } from 'react'
import SignInPage from '@/components/sign-in-page'

interface AuthWrapperProps {
  children: ReactNode
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!session) {
    return <SignInPage />
  }

  return <>{children}</>
}
