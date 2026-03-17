import { NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/api-auth'

const tenantId = process.env.OUTLOOK_TENANT_ID
const clientId = process.env.OUTLOOK_CLIENT_ID
const redirectUri = process.env.OUTLOOK_REDIRECT_URI

function redirectHome(query: string) {
  const base = process.env.NEXTAUTH_URL || 'https://kaicommand.vercel.app'
  return NextResponse.redirect(`${base.replace(/\/$/, '')}/?${query}`)
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request)
    if (!userId) {
      return redirectHome('outlook=sign_in_required')
    }

    if (!tenantId || !clientId || !redirectUri) {
      console.error('Missing Outlook env configuration')
      return redirectHome('outlook=server_not_configured')
    }

    const url = new URL(
      `https://login.microsoftonline.com/${encodeURIComponent(
        tenantId
      )}/oauth2/v2.0/authorize`
    )

    const scopes = [
      'offline_access',
      'openid',
      'profile',
      'email',
      'https://graph.microsoft.com/Mail.Read',
      'https://graph.microsoft.com/Mail.Send',
    ]

    url.searchParams.set('client_id', clientId)
    url.searchParams.set('response_type', 'code')
    url.searchParams.set('redirect_uri', redirectUri)
    url.searchParams.set('response_mode', 'query')
    url.searchParams.set('scope', scopes.join(' '))
    url.searchParams.set('state', `uid:${userId}`)

    return NextResponse.redirect(url.toString())
  } catch (err) {
    console.error('oauth-start error:', err)
    return redirectHome('outlook=error')
  }
}

