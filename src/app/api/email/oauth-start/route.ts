import { NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/api-auth'

const tenantId = process.env.OUTLOOK_TENANT_ID
const clientId = process.env.OUTLOOK_CLIENT_ID
const redirectUri = process.env.OUTLOOK_REDIRECT_URI

export async function GET(request: NextRequest) {
  const userId = await getUserId(request)
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  if (!tenantId || !clientId || !redirectUri) {
    console.error('Missing Outlook env configuration')
    return NextResponse.json(
      { success: false, error: 'Outlook integration is not configured on the server.' },
      { status: 500 }
    )
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
  // Simple state including the user id; for production you would also sign this.
  url.searchParams.set('state', `uid:${userId}`)

  return NextResponse.redirect(url.toString())
}

