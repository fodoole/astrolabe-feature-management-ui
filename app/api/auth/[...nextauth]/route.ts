import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import type { NextAuthOptions } from 'next-auth'
import type { User as NextAuthUser } from 'next-auth'

// Extend the NextAuth User type to include our custom properties

import { syncUserWithBackend } from '@/lib/user-sync'
import jwtLib from 'jsonwebtoken'

declare module 'next-auth' {
  interface Session {
    appJwt?: string;
    accessToken?: string;
    user: {
      id?: string;
      roles?: string;
      permissions?: any;
      google_groups?: string[];
      [key: string]: any;
    };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60,// 7 days (in seconds)
    updateAge: 24 * 60 * 60,// Update session every 24 hours
  },
  jwt: {
    maxAge: 7 * 24 * 60 * 60,// JWT expires in 7 days to match session duration
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
          // Store the original Google ID for reference
          const providerUserId = user.id;

          // Sync user with backend and get our application's user ID
          const syncedUser = await syncUserWithBackend({
            name: user.name || '',
            email: user.email,
            avatar_url: user.image || null,
            provider: 'google',
            provider_id: profile?.sub || account.providerAccountId || '',
            google_groups: userGroups,
            userId: user.id,
          });

          // Replace user.id with our backend's user ID if available
          if (syncedUser?.id) {
            // Store backend ID
            // We'll track the provider ID in the JWT token later
            user.id = syncedUser.id; // Replace with backend ID
          } else {
            // No backend user ID returned, keep the provider ID
          }
        } catch (error) {
          console.error('User sync failed:', error);
        }
      }
      return true
    },
    async jwt({ token, account, user }) {
      // Only on initial sign-in will account be present
      if (account && user?.email && user.id) {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
        const SHARED_SECRET = process.env.APP_JWT_SECRET;
        if (!SHARED_SECRET) {
          throw new Error('APP_JWT_SECRET must be configured in environment variables.');
        }
        const assertionJwt = jwtLib.sign({
          email: user.email,
          id: user.id,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 5 * 60,
        }, SHARED_SECRET, { algorithm: 'HS256' })
        // Fetch user roles from backend
        const res = await fetch(`${backendUrl}/api/v1/users/me/roles`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${assertionJwt}`,
            'Content-Type': 'application/json',
          },
        })
        if (!res.ok) {
          const errorText = await res.text()
          console.error('Fetch roles failed', res.status, errorText)
          return token
        }

        const userWithRoles = await res.json()

        // Use the ID from the user object (which should now be the backend ID)
        token.id = user.id

        // If the backend response contains an ID, use that as well (double check)
        if (userWithRoles.id) {
          token.id = userWithRoles.id
        }

        // Store the provider ID for reference (from account)
        token.providerUserId = account.providerAccountId

        // Store other user data
        token.roles = userWithRoles.global_role
        token.permissions = userWithRoles.permissions
        token.google_groups = userWithRoles.google_groups
        // User roles and permissions loaded
        try {
          const sessionJwt = jwtLib.sign(
            {
              id: token.id, // Use the token ID which should be the backend ID now
              email: user.email,
              global_role: userWithRoles.global_role,
              permissions: userWithRoles.permissions,
            },
            SHARED_SECRET,
            {
              algorithm: 'HS256',
              expiresIn: '7d',
              issuer: 'astrolabe-ui',
              audience: 'astrolabe-api', // Use the expected audience for your backend API
            }
          )
          token.appJwt = sessionJwt
        } catch (jwtError) {
          throw jwtError;
        }
      }
      // JWT processing complete
      return token
    },

    async session({ session, token }) {
      session.appJwt = token.appJwt as string | undefined
      session.accessToken = token.appJwt as string | undefined

      if (session.user) {
        // Set the backend user ID as the primary ID
        session.user.id = token.id as string | undefined
        // Set other user properties
        session.user.roles = token.roles as string | undefined
        session.user.permissions = token.permissions as any
        session.user.google_groups = token.google_groups as string[] | undefined
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
