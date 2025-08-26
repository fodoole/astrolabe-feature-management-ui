'use client'

import { getSession } from 'next-auth/react'

export async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }

  if (typeof window !== 'undefined') {
    try {
      const session = await getSession()
      const accessToken = (session as any)?.accessToken
      
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`
      }
    } catch (error) {
      console.warn('Failed to get auth session:', error)
    }
  }

  return headers
}
