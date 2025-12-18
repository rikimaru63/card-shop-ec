import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Cookie name for admin session
const ADMIN_SESSION_COOKIE = 'admin-session';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Admin routes (pages and API) - Basic Auth with session cookie
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    const user = process.env.ADMIN_USER || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'password';

    // Check for existing admin session cookie first
    const adminSession = req.cookies.get(ADMIN_SESSION_COOKIE);
    if (adminSession?.value === 'authenticated') {
      return NextResponse.next();
    }

    // Check Basic Auth
    const basicAuth = req.headers.get('authorization');
    if (basicAuth) {
      try {
        const authValue = basicAuth.split(' ')[1];
        const [providedUser, providedPassword] = atob(authValue).split(':');

        if (providedUser === user && providedPassword === password) {
          // Set admin session cookie for future requests
          const response = NextResponse.next();
          response.cookies.set(ADMIN_SESSION_COOKIE, 'authenticated', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24, // 24 hours
          });
          return response;
        }
      } catch {
        // Invalid base64 encoding
      }
    }

    return new NextResponse('Unauthorized', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Secure Area"',
      },
    });
  }

  // Protected routes - Require authentication
  if (pathname.startsWith('/account') || pathname.startsWith('/checkout')) {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET
    });

    if (!token) {
      const signInUrl = new URL('/auth/signin', req.url);
      signInUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*', '/account/:path*', '/checkout/:path*'],
};
