import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchCodeforcesStats } from '@/lib/codeforces'
import { fetchLeetCodeStats } from '@/lib/leetcode'
import type { CodingProfile } from '@/types/coding'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('coding_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  const typedProfile = profile as CodingProfile | null

  if (!typedProfile?.codeforces_handle && !typedProfile?.leetcode_username) {
    return NextResponse.json({ error: 'No coding profiles connected' }, { status: 404 })
  }

  const statsUpdate: Record<string, unknown> = {
    user_id: user.id,
    last_synced_at: new Date().toISOString(),
  }

  let cfResult: { success: boolean; error?: string } = { success: false }
  let lcResult: { success: boolean; error?: string } = { success: false }

  if (typedProfile.codeforces_handle) {
    try {
      const cf = await fetchCodeforcesStats(typedProfile.codeforces_handle)
      statsUpdate.cf_rating = cf.rating
      statsUpdate.cf_max_rating = cf.maxRating
      statsUpdate.cf_rank = cf.rank
      statsUpdate.cf_max_rank = cf.maxRank
      statsUpdate.cf_problems_solved = cf.problemsSolved
      statsUpdate.cf_contest_count = cf.contestCount
      statsUpdate.cf_avatar = cf.avatar
      statsUpdate.cf_rating_history = cf.ratingHistory
      cfResult = { success: true }
    } catch (e) {
      cfResult = { success: false, error: e instanceof Error ? e.message : 'Unknown error' }
    }
  }

  if (typedProfile.leetcode_username) {
    try {
      const lc = await fetchLeetCodeStats(typedProfile.leetcode_username)
      statsUpdate.lc_total_solved = lc.totalSolved
      statsUpdate.lc_easy_solved = lc.easySolved
      statsUpdate.lc_medium_solved = lc.mediumSolved
      statsUpdate.lc_hard_solved = lc.hardSolved
      statsUpdate.lc_streak = lc.streak
      statsUpdate.lc_total_active_days = lc.totalActiveDays
      statsUpdate.lc_contest_rating = lc.contestRating
      statsUpdate.lc_contest_attended = lc.contestAttended
      statsUpdate.lc_top_percentage = lc.topPercentage
      statsUpdate.lc_avatar = lc.avatar
      lcResult = { success: true }
    } catch (e) {
      lcResult = { success: false, error: e instanceof Error ? e.message : 'Unknown error' }
    }
  }

  const { error: upsertError } = await supabase
    .from('coding_stats')
    .upsert(statsUpdate, { onConflict: 'user_id' })

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, codeforces: cfResult, leetcode: lcResult })
}
