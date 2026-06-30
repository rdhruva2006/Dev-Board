import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchGitHubStats, GitHubRateLimitError } from '@/lib/github'
import { decrypt } from '@/lib/crypto'
import type { GitHubConnection } from '@/types/github'

export async function POST() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch GitHub connection for this user
  const { data: connection, error: connError } = await supabase
    .from('github_connections')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (connError || !connection) {
    return NextResponse.json(
      { error: 'No GitHub connection found. Please connect GitHub first.' },
      { status: 404 }
    )
  }

  const { github_username, access_token } = connection as GitHubConnection

  try {
    const decryptedToken = decrypt(access_token)
    const stats = await fetchGitHubStats(github_username, decryptedToken)

    const { error: upsertError } = await supabase
      .from('github_stats')
      .upsert(
        {
          user_id: user.id,
          ...stats,
          last_synced_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )

    if (upsertError) {
      console.error('Failed to upsert github_stats:', upsertError)
      return NextResponse.json(
        { error: 'Failed to save stats' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, stats })
  } catch (e) {
    if (e instanceof GitHubRateLimitError) {
      return NextResponse.json(
        {
          error: e.message,
          rateLimited: true,
          retryAfterMinutes: e.retryAfterMinutes,
        },
        { status: 429 }
      )
    }

    console.error('GitHub sync error:', e)
    return NextResponse.json(
      { error: 'Failed to fetch GitHub stats' },
      { status: 500 }
    )
  }
}
