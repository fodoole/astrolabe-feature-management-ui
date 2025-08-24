import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id?: string
      name?: string | null
      email?: string | null
      image?: string | null
      globalRole?: string
    }
    accessToken?: string
  }

  interface User {
    globalRole?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string
    globalRole?: string
  }
}
