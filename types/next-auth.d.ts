import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    accessToken?: string
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      roles?: string
      permissions?: {
        can_approve_production: boolean
        can_approve_staging: boolean
        can_create_flags: boolean
        can_read_only: boolean
      }
      google_groups?: string[]
    }
  }

  interface JWT {
    accessToken?: string
    roles?: string
    permissions?: {
      can_approve_production: boolean
      can_approve_staging: boolean
      can_create_flags: boolean
      can_read_only: boolean
    }
    google_groups?: string[]
  }
}
