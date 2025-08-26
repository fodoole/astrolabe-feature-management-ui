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
        // Check if user is a member of allowed Google Groups
        const isAuthorized = await checkGroupMembership(user.email)
        
        if (!isAuthorized) {
          // Redirect to unauthorized page
          return '/auth/unauthorized'
        }
        
        try {
          await syncUserWithBackend({
            name: user.name || '',
            email: user.email,
            avatar_url: user.image || null,
            provider: 'google',
            provider_id: profile?.sub || account.providerAccountId || ''
          })
        } catch (error) {
          console.error('Failed to sync user with backend:', error)
        }
      }
      return true
    },
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token
      }
      return token
    },
    async session({ session, token }) {
      if (session.user?.email) {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/users/by-email?email=${encodeURIComponent(session.user.email)}`)
          if (response.ok) {
            const userData = await response.json()
            session.user.id = userData.id
          }
        } catch (error) {
          console.error('Failed to fetch user ID for session:', error)
        }
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
