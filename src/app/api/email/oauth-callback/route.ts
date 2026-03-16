import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const tenantId = process.env.OUTLOOK_TENANT_ID
const clientId = process.env.OUTLOOK_CLIENT_ID
const clientSecret = process.env.OUTLOOK_CLIENT_SECRET
const redirectUri = process.env.OUTLOOK_REDIRECT_URI

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const error = url.searchParams.get('error')

  if (error) {
    console.error('Outlook OAuth error:', error)
    return NextResponse.redirect(`/?outlook=error`)
  }

  if (!code || !state) {
    return NextResponse.redirect(`/?outlook=missing_code`)
  }

  const userId = state.startsWith('uid:') ? state.slice(4) : null
  if (!userId) {
    return NextResponse.redirect(`/?outlook=invalid_state`)
  }

  if (!tenantId || !clientId || !clientSecret || !redirectUri) {
    console.error('Missing Outlook env configuration')
    return NextResponse.redirect(`/?outlook=server_config_error`)
  }

  try {
    const tokenResponse = await fetch(
      `https://login.microsoftonline.com/${encodeURIComponent(
        tenantId
      )}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
        }).toString(),
      }
    )

    if (!tokenResponse.ok) {
      const text = await tokenResponse.text()
      console.error('Failed to exchange Outlook code:', text)
      return NextResponse.redirect(`/?outlook=token_error`)
    }

    const tokenJson: any = await tokenResponse.json()
    const refreshToken = tokenJson.refresh_token as string | undefined
    const accessToken = tokenJson.access_token as string | undefined

    if (!refreshToken || !accessToken) {
      console.error('Outlook token response missing refresh/access token')
      return NextResponse.redirect(`/?outlook=token_missing`)
    }

    // Fetch basic profile to capture the primary email address
    let outlookEmail: string | undefined
    try {
      const meRes = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      if (meRes.ok) {
        const meJson: any = await meRes.json()
        outlookEmail =
          meJson.mail ||
          meJson.userPrincipalName ||
          undefined
      }
    } catch (profileError) {
      console.error('Failed to fetch Outlook profile:', profileError)
    }

    await db.user.update({
      where: { id: userId },
      // Cast to any so this continues to compile even if Prisma types
      // have not yet been regenerated with the new fields.
      data: {
        outlookRefreshToken: refreshToken,
        ...(outlookEmail ? { outlookEmail } : {}),
      } as any,
    })

    return NextResponse.redirect(`/?outlook=connected`)
  } catch (err) {
    console.error('Outlook OAuth callback error:', err)
    return NextResponse.redirect(`/?outlook=unexpected_error`)
  }
}

