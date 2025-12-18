import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { cookies } from 'next/headers'

const ADMIN_SESSION_COOKIE = 'admin-session'

/**
 * Check if the request is authorized for admin operations.
 * Accepts any of:
 * 1. Admin session cookie (set by middleware after Basic Auth)
 * 2. NextAuth session (for users logged in via the website)
 * 3. Basic Auth header (fallback)
 */
export async function isAdminAuthorized(request: NextRequest): Promise<boolean> {
  // Check admin session cookie (set by middleware)
  const cookieStore = await cookies()
  const adminSession = cookieStore.get(ADMIN_SESSION_COOKIE)
  if (adminSession?.value === 'authenticated') {
    return true
  }

  // Check NextAuth session
  const session = await getServerSession(authOptions)
  if (session?.user) {
    return true
  }

  // Fallback: Check Basic Auth header
  const basicAuth = request.headers.get('authorization')
  if (basicAuth) {
    try {
      const authValue = basicAuth.split(' ')[1]
      if (authValue) {
        const [providedUser, providedPassword] = atob(authValue).split(':')
        const user = process.env.ADMIN_USER || 'admin'
        const password = process.env.ADMIN_PASSWORD || 'password'

        if (providedUser === user && providedPassword === password) {
          return true
        }
      }
    } catch {
      // Invalid base64 or format
    }
  }

  return false
}
