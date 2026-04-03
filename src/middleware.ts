import { auth } from '@/lib/auth'

export default auth((req) => {
  if (!req.auth && req.nextUrl.pathname.startsWith('/canvas')) {
    return Response.redirect(new URL('/', req.url))
  }
})

export const config = { matcher: ['/canvas/:path*'] }
