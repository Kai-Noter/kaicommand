import { getToken } from 'next-auth/jwt'
import { NextRequest, NextResponse } from 'next/server'
import { ensureDemoUser } from '@/lib/db'

/**
 * Get the current user ID from the session (JWT).
 * If no session, returns DEMO_USER_ID so the app still works for unauthenticated demo use.
 * Set REQUIRE_AUTH=true to return 401 when not logged in.
 */
export async function getUserId(request: NextRequest): Promise<string | null> {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })
    const id = (token as { id?: string })?.id ?? token?.sub
    if (id) return id
  } catch (err) {
    // If token decoding fails (e.g. missing/invalid secret), continue to demo fallback.
    console.warn('getUserId token decode failed, falling back to demo mode:', err)
  }

  if (process.env.REQUIRE_AUTH === 'true') return null
  return await ensureDemoUser()
}

/**
 * Require authentication. Returns userId or throws 401 response.
 */
export async function getRequireUserId(
  request: NextRequest
): Promise<{ userId: string; response?: never } | { userId?: never; response: NextResponse }> {
  const userId = await getUserId(request)
  if (userId) return { userId }
  return {
    response: NextResponse.json(
      { error: 'Unauthorized', success: false },
      { status: 401 }
    ),
  }
}
