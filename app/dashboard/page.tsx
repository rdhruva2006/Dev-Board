import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

import Sidebar from '@/components/Sidebar'
import HeroTile from '@/components/HeroTile'
import ActivityTile from '@/components/ActivityTile'
import GitHubConnectTile from '@/components/GitHubConnectTile'
import CodeforcesStatsTile from '@/components/CodeforcesStatsTile'
import LeetCodeStatsTile from '@/components/LeetCodeStatsTile'
import AISummaryTile from '@/components/AISummaryTile'
import CourseGrid from '@/components/CourseGrid'
import GoalsTile from '@/components/GoalsTile'
import SessionTimer from '@/components/SessionTimer'
import BentoGrid from '@/components/BentoGrid'
import InstructionsBanner from '@/components/InstructionsBanner'

import type { GitHubConnection } from '@/types/github'
import type { CodingProfile, CodingStats } from '@/types/coding'

interface GitHubStatsRow {
  contributions_this_week: number
  total_repos: number
  top_language: string | null
  current_streak: number
  contribution_grid: number[] | null
  last_synced_at: string
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const displayName = user.user_metadata?.username ?? user.email

  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

  // Fetch all parallel data
  const [
    { data: connection },
    { data: githubStats },
    { data: codingProfile },
    { data: codingStats },
    { data: profile },
    { data: sessions },
  ] = await Promise.all([
    supabase
      .from('github_connections')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('github_stats')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('coding_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('coding_stats')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('dev_sessions')
      .select('duration_minutes')
      .eq('user_id', user.id)
      .gte('started_at', oneWeekAgo.toISOString()),
  ])

  const typedConnection = connection as GitHubConnection | null
  const typedStats = githubStats as GitHubStatsRow | null
  const typedProfile = codingProfile as CodingProfile | null
  const typedCodingStats = codingStats as CodingStats | null

  // Calculate metrics for GoalsTile
  const totalMinutes = (sessions || []).reduce((acc, s) => acc + (s.duration_minutes || 0), 0)
  const loggedHours = parseFloat((totalMinutes / 60).toFixed(1))
  const weeklyGoal = profile?.weekly_goal_hours ?? 10.0

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 relative overflow-hidden">
      {/* Ambient background glow blobs */}
      <div className="absolute top-[10%] left-[20%] w-[35rem] h-[35rem] rounded-full bg-blue-300/30 blur-[120px] pointer-events-none animate-pulse-slow-1" />
      <div className="absolute bottom-[15%] right-[10%] w-[30rem] h-[30rem] rounded-full bg-amber-300/30 blur-[100px] pointer-events-none animate-pulse-slow-2" />

      <Sidebar userName={displayName} />

      <main className="flex-1 p-6 space-y-6 overflow-y-auto pb-24 md:pb-6 relative z-10 max-w-7xl mx-auto w-full">
        {/* Premium Dashboard Header */}
        <div className="space-y-1.5 font-sans border-b border-slate-200 pb-5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-blue-50 border border-blue-200 text-blue-700 font-bold px-2 py-0.5 rounded-full uppercase tracking-widest font-mono">
              Workspace Active
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 font-sans">
            Welcome back, {displayName.split(' ')[0]}
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-sans leading-relaxed max-w-2xl">
            Track your coding metrics, analyze your GitHub activity, and stay on top of your daily goals in one unified workspace.
          </p>
        </div>

        {/* User Directives / Instructions Banner */}
        <InstructionsBanner />

        {/* Bento Grid */}
        <BentoGrid>
          {/* Row 1: HeroTile */}
          <div className="col-span-1 md:col-span-2 lg:col-span-3 order-1 lg:order-1">
            <HeroTile
              name={displayName}
              streak={typedStats?.current_streak}
              totalRepos={typedStats?.total_repos}
              topLanguage={typedStats?.top_language}
            />
          </div>

          {/* Row 2: GitHubConnectTile | DevTimerTile (SessionTimer) | GoalsTile */}
          <div className="col-span-1 md:col-span-1 lg:col-span-1 order-5 md:order-2 lg:order-2">
            <GitHubConnectTile
              connection={typedConnection}
              lastSynced={typedStats?.last_synced_at ?? null}
            />
          </div>
          <div className="col-span-1 md:col-span-1 lg:col-span-1 order-3 md:order-3 lg:order-3">
            <SessionTimer floating={false} />
          </div>
          <div className="col-span-1 md:col-span-1 lg:col-span-1 order-4 md:order-4 lg:order-4">
            <GoalsTile 
              loggedHours={loggedHours} 
              weeklyGoal={weeklyGoal} 
            />
          </div>

          {/* Row 3: ActivityTile (2/3) | LeetCodeStatsTile (1/3) */}
          <div className="col-span-1 md:col-span-2 lg:col-span-2 order-7 md:order-5 lg:order-5">
            <ActivityTile
              contributionGrid={typedStats?.contribution_grid ?? undefined}
              githubUsername={typedConnection?.github_username}
            />
          </div>
          <div className="col-span-1 md:col-span-1 lg:col-span-1 order-6 md:order-6 lg:order-6">
            <LeetCodeStatsTile
              stats={typedCodingStats}
              profile={typedProfile}
            />
          </div>

          {/* Row 4: CodeforcesStatsTile (1/3) | AISummaryTile (2/3) */}
          <div className="col-span-1 md:col-span-1 lg:col-span-1 order-8 md:order-7 lg:order-7">
            <CodeforcesStatsTile
              stats={typedCodingStats}
              profile={typedProfile}
              ratingHistory={typedCodingStats?.cf_rating_history || undefined}
            />
          </div>
          <div className="col-span-1 md:col-span-1 lg:col-span-2 order-2 md:order-8 lg:order-8">
            <AISummaryTile />
          </div>

          {/* Row 5: CourseGrid (full width) */}
          <div className="col-span-1 md:col-span-2 lg:col-span-3 order-9 md:order-9 lg:order-9 space-y-3">
            <h2 className="text-xl font-semibold text-slate-900">Your Courses</h2>
            <Suspense fallback={<div className="text-gray-500 text-sm">Loading courses…</div>}>
              <CourseGrid />
            </Suspense>
          </div>
        </BentoGrid>
      </main>
    </div>
  )
}
