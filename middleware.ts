import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const userRole = token?.globalRole as string
    
    const adminRoutes = ['/admin', '/users/manage']
    const managerRoutes = ['/teams/create', '/approvals']
    const developerRoutes = ['/feature-flags/create']
    
    const pathname = req.nextUrl.pathname
    
    if (adminRoutes.some(route => pathname.startsWith(route))) {
      if (userRole !== 'admin') {
        return NextResponse.redirect(new URL('/unauthorized', req.url))
      }
    }
    
    if (managerRoutes.some(route => pathname.startsWith(route))) {
      if (!['admin', 'manager'].includes(userRole)) {
        return NextResponse.redirect(new URL('/unauthorized', req.url))
      }
    }
    
    if (developerRoutes.some(route => pathname.startsWith(route))) {
      if (!['admin', 'manager', 'developer'].includes(userRole)) {
        return NextResponse.redirect(new URL('/unauthorized', req.url))
      }
    }
    
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    }
  }
)

export const config = {
  matcher: [
    '/admin/:path*',
    '/users/manage/:path*',
    '/teams/create/:path*',
    '/approvals/:path*',
    '/feature-flags/create/:path*'
  ]
}
