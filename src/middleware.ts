import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Admin routes - Basic Auth
  if (pathname.startsWith('/admin')) {
    const basicAuth = req.headers.get('authorization');

    const user = process.env.ADMIN_USER || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'password';

    if (basicAuth) {
      const authValue = basicAuth.split(' ')[1];
      const [providedUser, providedPassword] = atob(authValue).split(':');

      if (providedUser === user && providedPassword === password) {
        return NextResponse.next();
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
  if (pathname.startsWith('/account')) {
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
  matcher: ['/admin/:path*', '/account/:path*'],
};
