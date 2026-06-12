import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { shouldCompleteOrigin } from '@/lib/security/origin-guard';

// Cookie name for admin session
const ADMIN_SESSION_COOKIE = 'admin-session';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Server Action リクエスト時に Origin ヘッダーが欠落していた場合、自サイト Origin で補完する。
  // 背景: Coolify/Traefik 経由で一部地域 (アジア CDN edge 等) の顧客から Origin が剥がれた
  // POST が届き、Next.js が "Missing origin header from a forwarded Server Actions request."
  // で reject していた (ブルネイ顧客 / リピーター顧客 Adrian の Confirm Order 無反応の原因)。
  //
  // 補完してよいかの判定は shouldCompleteOrigin (src/lib/security/origin-guard.ts) に集約。
  // session cookie (SameSite=lax) があり、かつ「明確なクロスサイトの証拠」が無い場合に補完する。
  // Referer / Sec-Fetch-Site が欠落 (= プロキシ剥がし) のケースでも正規顧客を弾かない。
  // 本質的には Coolify/Traefik 側で Origin header の forward を修正すべき (別途検討)。
  if (req.method === 'POST' && req.headers.get('next-action') && !req.headers.get('origin')) {
    const hasSessionCookie = Boolean(
      req.cookies.get('next-auth.session-token') ||
      req.cookies.get('__Secure-next-auth.session-token') ||
      req.cookies.get(ADMIN_SESSION_COOKIE)
    );

    const expectedOrigin = req.nextUrl.origin;

    if (
      shouldCompleteOrigin({
        hasSessionCookie,
        referer: req.headers.get('referer'),
        secFetchSite: req.headers.get('sec-fetch-site'),
        expectedOrigin,
      })
    ) {
      // 補完が発動したことを記録 (異常頻度＝攻撃兆候の検知 + 正規顧客の Origin 剥がし把握用)。
      // 補完は session cookie 有り + 明確なクロスサイト証拠なしのリクエストに限られる。
      console.warn('[origin-guard] completing missing Origin for Server Action', {
        path: req.nextUrl.pathname,
        secFetchSite: req.headers.get('sec-fetch-site'),
        hasReferer: Boolean(req.headers.get('referer')),
        ua: req.headers.get('user-agent'),
      });
      const headers = new Headers(req.headers);
      headers.set('origin', expectedOrigin);
      return NextResponse.next({ request: { headers } });
    }
  }

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
  // 静的アセット系を除く全パスを対象にする。理由:
  // (1) Server Action の Origin 補完ロジックを全ページで効かせるため。
  // (2) 既存の /admin / /account / /checkout 認証ロジックは pathname.startsWith で
  //     条件分岐しているため、対象外のパスは早期 return されパフォーマンス影響は無視できる。
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
