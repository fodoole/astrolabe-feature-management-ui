import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import type { NextAuthOptions } from 'next-auth'
import { checkGroupMembership } from '@/lib/google-groups'
import { syncUserWithBackend } from '@/lib/user-sync'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days (in seconds)
    updateAge: 24 * 60 * 60,   // Update session every 24 hours
  },
  jwt: {
    maxAge: 12 * 60 * 60, // JWT expires in 12 hours
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google' && user.email) {
        const { getUserGoogleGroups } = await import('@/lib/google-groups')
        const userGroups = await getUserGoogleGroups(user.email)
        
        const isAuthorized = userGroups.length > 0
        
        if (!isAuthorized) {
          return '/auth/unauthorized'
        }
        
        try {
          await syncUserWithBackend({
            name: user.name || '',
            email: user.email,
            avatar_url: user.image || null,
            provider: 'google',
            provider_id: profile?.sub || account.providerAccountId || '',
            google_groups: userGroups
          })
        } catch (error) {
          console.error('Failed to sync user with backend:', error)
        }
      }
      return true
    },
    async jwt({ token, account, profile, user }) {
      if (account) {
        token.accessToken = account.access_token
        
        if (user?.email) {
          try {
            const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
            const response = await fetch(`${backendUrl}/api/v1/users/me/roles`, {
              headers: {
                'Authorization': `Bearer ${token.accessToken}`,
                'Content-Type': 'application/json',
              },
            })
            
            if (response.ok) {
              const userWithRoles = await response.json()
              token.roles = userWithRoles.global_role
              token.permissions = userWithRoles.permissions
              token.google_groups = userWithRoles.google_groups
            }
          } catch (error) {
            console.error('Failed to fetch user roles:', error)
          }
        }
      }
      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string
      if (session.user) {
        session.user.roles = token.roles as string
        session.user.permissions = token.permissions as any
        session.user.google_groups = token.google_groups as string[]
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/unauthorized',
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
