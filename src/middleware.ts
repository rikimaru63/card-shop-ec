
import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  // Only apply Basic Auth to /admin routes
  if (req.nextUrl.pathname.startsWith('/admin')) {
    const basicAuth = req.headers.get('authorization');
    
    // Get credentials from environment variables with defaults
    const user = process.env.ADMIN_USER || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'password';

    if (basicAuth) {
      const authValue = basicAuth.split(' ')[1];
      const [providedUser, providedPassword] = atob(authValue).split(':');

      if (providedUser === user && providedPassword === password) {
        return NextResponse.next();
      }
    }

    // If authentication fails, request it
    return new NextResponse('Unauthorized', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Secure Area"',
      },
    });
  }

  // For all other routes, do nothing
  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*',
};
