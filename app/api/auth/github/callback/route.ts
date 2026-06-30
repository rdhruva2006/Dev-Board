import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchGitHubStats, GitHubRateLimitError } from '@/lib/github'
import { encrypt } from '@/lib/crypto'
import type { GitHubUser } from '@/types/github'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(new URL('/dashboard?github=error', request.url))
  }

  const { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GITHUB_REDIRECT_URI } = process.env

  if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET || !GITHUB_REDIRECT_URI) {
    return NextResponse.redirect(new URL('/dashboard?github=error', request.url))
  }

  // Exchange code for access token
  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: GITHUB_CLIENT_ID,
      client_secret: GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: GITHUB_REDIRECT_URI,
    }),
  })

  const tokenData = (await tokenRes.json()) as {
    access_token?: string
    error?: string
  }

  if (!tokenData.access_token) {
    return NextResponse.redirect(new URL('/dashboard?github=error', request.url))
  }

  const accessToken = tokenData.access_token

  // Fetch GitHub user profile
  const profileRes = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github+json',
    },
  })

  if (!profileRes.ok) {
    return NextResponse.redirect(new URL('/dashboard?github=error', request.url))
  }

  const profile = (await profileRes.json()) as GitHubUser

  // Get authenticated Supabase user
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Upsert into github_connections
  const { error: upsertError } = await supabase
    .from('github_connections')
    .upsert(
      {
        user_id: user.id,
        github_username: profile.login,
        access_token: encrypt(accessToken),
        avatar_url: profile.avatar_url,
        connected_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )

  if (upsertError) {
    console.error('Failed to save GitHub connection:', upsertError)
    return NextResponse.redirect(new URL('/dashboard?github=error', request.url))
  }

  // Trigger initial stats sync
  try {
    const stats = await fetchGitHubStats(profile.login, accessToken)
    await supabase.from('github_stats').upsert(
      {
        user_id: user.id,
        ...stats,
        last_synced_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )
  } catch (e) {
    // Non-fatal — user can sync manually
    if (!(e instanceof GitHubRateLimitError)) {
      console.error('Initial GitHub stats sync failed:', e)
    }
  }

  return NextResponse.redirect(new URL('/dashboard?github=connected', request.url))
}
