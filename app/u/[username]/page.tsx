import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ArrowRight, Trophy, BookOpen, Clock, Activity, Code, ExternalLink, Calendar, Hourglass } from 'lucide-react'
import CopyProfileLink from '@/components/CopyProfileLink'

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  )
}

interface RouteParams {
  params: Promise<{ username: string }>
}

export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
  const { username } = await params
  const cleanUsername = decodeURIComponent(username).toLowerCase()
  
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('username', cleanUsername)
    .maybeSingle()

  let avatarUrl = '/og-image.png'
  if (profile) {
    const { data: connection } = await supabase
      .from('github_connections')
      .select('avatar_url')
      .eq('user_id', profile.user_id)
      .maybeSingle()
    if (connection?.avatar_url) {
      avatarUrl = connection.avatar_url
    }
  }

  return {
    title: `${cleanUsername} | DevBoard Profile`,
    description: `Explore ${cleanUsername}'s real-time coding achievements, GitHub contributions, developer hours, and active projects on DevBoard.`,
    openGraph: {
      title: `${cleanUsername} - Developer Board`,
      description: `Explore ${cleanUsername}'s real-time coding achievements, GitHub contributions, developer hours, and active projects on DevBoard.`,
      type: 'profile',
      images: [
        {
          url: avatarUrl,
          width: 1200,
          height: 630,
          alt: `${cleanUsername}'s DevBoard Profile`,
        }
      ]
    }
  }
}

// Pure SVG donut ring for static LeetCode solved progress
function StaticDonutRing({
  easy,
  medium,
  hard,
  total,
}: {
  easy: number
  medium: number
  hard: number
  total: number
}) {
  const r = 28
  const cx = 36
  const cy = 36
  const circumference = 2 * Math.PI * r
  const sum = easy + medium + hard || 1

  const easyPct = easy / sum
  const medPct = medium / sum
  const hardPct = hard / sum

  const easyDash = easyPct * circumference
  const medDash = medPct * circumference
  const hardDash = hardPct * circumference

  const easyOffset = 0
  const medOffset = -easyDash
  const hardOffset = -(easyDash + medDash)

  return (
    <svg width={72} height={72} className="shrink-0">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgb(31,41,55)" strokeWidth={8} />
      <circle
        cx={cx} cy={cy} r={r} fill="none"
        stroke="rgb(74,222,128)" strokeWidth={8}
        strokeDasharray={`${easyDash} ${circumference - easyDash}`}
        strokeDashoffset={easyOffset}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      <circle
        cx={cx} cy={cy} r={r} fill="none"
        stroke="rgb(250,204,21)" strokeWidth={8}
        strokeDasharray={`${medDash} ${circumference - medDash}`}
        strokeDashoffset={medOffset}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      <circle
        cx={cx} cy={cy} r={r} fill="none"
        stroke="rgb(248,113,113)" strokeWidth={8}
        strokeDasharray={`${hardDash} ${circumference - hardDash}`}
        strokeDashoffset={hardOffset}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      <text x={cx} y={cy - 4} textAnchor="middle" className="fill-white text-xs font-bold font-sans" fontSize={11}>
        {total}
      </text>
      <text x={cx} y={cy + 8} textAnchor="middle" className="fill-gray-400 font-sans" fontSize={8}>
        solved
      </text>
    </svg>
  )
}

export default async function PublicProfilePage({ params }: RouteParams) {
  const { username } = await params
  const cleanUsername = decodeURIComponent(username).toLowerCase()

  const supabase = await createClient()

  // 1. Resolve profile by username
  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', cleanUsername)
    .maybeSingle()

  if (profileErr || !profile) {
    redirect('/login') // fallback to login or trigger notfound
  }

  // 2. Check visibility
  if (!profile.is_public) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 text-white p-6">
        <div className="text-center max-w-md bg-gray-900 border border-gray-800 p-8 rounded-2xl shadow-xl space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-900/20 border border-red-800/40 flex items-center justify-center mx-auto">
            <Clock className="w-6 h-6 text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-white">Private Profile</h2>
          <p className="text-sm text-gray-400">
            The developer has set their DevBoard profile to private. Reach out directly to request access.
          </p>
          <a
            href="/"
            className="inline-block bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
          >
            Go to DevBoard
          </a>
        </div>
      </div>
    )
  }

  const userId = profile.user_id
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

  // 3. Fetch all profile data
  const [
    { data: githubConnection },
    { data: githubStats },
    { data: codingStats },
    { data: projects },
    { data: sessions }
  ] = await Promise.all([
    supabase.from('github_connections').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('github_stats').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('coding_stats').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('projects').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    supabase.from('dev_sessions').select('duration_minutes').eq('user_id', userId).gte('started_at', oneWeekAgo.toISOString())
  ])

  // Get stats
  const displayName = githubConnection?.github_username || cleanUsername
  const avatarUrl = githubConnection?.avatar_url || null
  const bio = profile.bio || 'This developer hasn\'t written a bio yet.'
  const totalCommits = githubStats?.contributions_this_week ?? 0
  const leetcodeSolved = codingStats?.lc_total_solved ?? 0
  const cfRating = codingStats?.cf_rating ?? 0

  // Calculate dev hours
  const totalMinutes = (sessions || []).reduce((sum, s) => sum + (s.duration_minutes || 0), 0)
  const hoursCodedThisWeek = parseFloat((totalMinutes / 60).toFixed(1))

  // Shipped projects (top 3)
  const shippedProjects = (projects || [])
    .filter(p => p.status === 'shipped')
    .slice(0, 3)

  // 35 days activity grid
  const activityGrid = githubStats?.contribution_grid || Array.from({ length: 35 }, () => 0)

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 md:p-8 flex items-center justify-center selection:bg-purple-500/30 selection:text-purple-200">
      <div className="w-full max-w-2xl bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden shadow-2xl space-y-6 pb-6">
        
        {/* Banner Decoration */}
        <div className="h-28 bg-gradient-to-r from-purple-900 via-indigo-900 to-gray-900 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-900/90" />
          <div className="absolute top-4 right-4 flex gap-2">
            <CopyProfileLink />
          </div>
        </div>

        {/* Top: Avatar, Name, Bio */}
        <div className="px-6 md:px-8 -mt-16 relative z-10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="relative">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-24 h-24 rounded-2xl border-4 border-gray-900 bg-gray-850 object-cover shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl border-4 border-gray-900 bg-gray-800 flex items-center justify-center text-white text-3xl font-bold uppercase shadow-lg">
                  {displayName.substring(0, 2)}
                </div>
              )}
            </div>

            {githubConnection?.github_username && (
              <a
                href={`https://github.com/${githubConnection.github_username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white hover:bg-gray-200 text-gray-950 text-xs font-bold px-4 py-2 rounded-xl transition-colors shadow"
              >
                <GitHubIcon className="w-4 h-4" />
                <span>Connect on GitHub</span>
              </a>
            )}
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight capitalize">{displayName}</h1>
            <p className="text-sm text-gray-400 leading-relaxed font-sans">{bio}</p>
          </div>
        </div>

        <div className="px-6 md:px-8 border-t border-gray-800/60 pt-6 space-y-6">
          {/* Stats Row: 4 Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-gray-950 border border-gray-850 p-3 rounded-2xl text-center">
              <span className="block text-xl font-bold font-mono text-purple-400">{totalCommits}</span>
              <span className="text-[10px] text-gray-500 uppercase font-semibold">Weekly Commits</span>
            </div>
            <div className="bg-gray-950 border border-gray-850 p-3 rounded-2xl text-center">
              <span className="block text-xl font-bold font-mono text-emerald-400">{hoursCodedThisWeek}h</span>
              <span className="text-[10px] text-gray-500 uppercase font-semibold">Dev Hours</span>
            </div>
            <div className="bg-gray-950 border border-gray-850 p-3 rounded-2xl text-center">
              <span className="block text-xl font-bold font-mono text-yellow-400">{leetcodeSolved}</span>
              <span className="text-[10px] text-gray-500 uppercase font-semibold">LC Solved</span>
            </div>
            <div className="bg-gray-950 border border-gray-850 p-3 rounded-2xl text-center">
              <span className="block text-xl font-bold font-mono text-blue-400">{cfRating || '—'}</span>
              <span className="text-[10px] text-gray-500 uppercase font-semibold">CF Rating</span>
            </div>
          </div>

          {/* Activity Graph: contribution grid (read-only) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span className="font-semibold">GitHub Commits (Last 35 Days)</span>
              <span>Less • • • • More</span>
            </div>
            <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start bg-gray-950 p-3 rounded-2xl border border-gray-850">
              {activityGrid.map((level: number, i: number) => (
                <div
                  key={i}
                  className={`w-3.5 h-3.5 rounded-sm shrink-0 ${
                    level === 0 ? 'bg-gray-850' :
                    level === 1 ? 'bg-purple-900/60' :
                    level === 2 ? 'bg-purple-700/80' :
                    level === 3 ? 'bg-purple-500' :
                    'bg-purple-400'
                  }`}
                  title={`${level} level commits`}
                />
              ))}
            </div>
          </div>

          {/* LeetCode Donut Card (read-only) */}
          {codingStats?.lc_total_solved != null && codingStats.lc_total_solved > 0 && (
            <div className="bg-gray-950/60 border border-gray-850 p-4 rounded-2xl flex items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <StaticDonutRing
                  easy={codingStats.lc_easy_solved ?? 0}
                  medium={codingStats.lc_medium_solved ?? 0}
                  hard={codingStats.lc_hard_solved ?? 0}
                  total={codingStats.lc_total_solved ?? 0}
                />
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-white">LeetCode Metrics</h4>
                  <p className="text-xs text-gray-500">Problem solving distributions across difficulties</p>
                </div>
              </div>
              <div className="hidden sm:flex gap-4 text-xs">
                <div className="text-center">
                  <span className="block text-green-400 font-bold font-mono">{codingStats.lc_easy_solved}</span>
                  <span className="text-[10px] text-gray-500 uppercase">Easy</span>
                </div>
                <div className="text-center">
                  <span className="block text-yellow-400 font-bold font-mono">{codingStats.lc_medium_solved}</span>
                  <span className="text-[10px] text-gray-500 uppercase">Medium</span>
                </div>
                <div className="text-center">
                  <span className="block text-red-400 font-bold font-mono">{codingStats.lc_hard_solved}</span>
                  <span className="text-[10px] text-gray-500 uppercase">Hard</span>
                </div>
              </div>
            </div>
          )}

          {/* Projects section: 3 most recent shipped */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-300">Shipped Projects</h3>
            {shippedProjects.length === 0 ? (
              <p className="text-xs text-gray-500 italic bg-gray-950 p-4 rounded-2xl border border-gray-850 text-center">
                No shipped projects linked to this profile.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {shippedProjects.map((p) => (
                  <div key={p.id} className="bg-gray-950 border border-gray-850 p-4 rounded-2xl flex flex-col justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-white truncate">{p.name}</h4>
                      {p.description && (
                        <p className="text-xs text-gray-400 line-clamp-2 mt-1">{p.description}</p>
                      )}
                    </div>
                    {p.tech_stack && p.tech_stack.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {p.tech_stack.map((tag: string) => (
                          <span key={tag} className="text-[9px] bg-gray-900 border border-gray-800 text-gray-400 px-1.5 py-0.5 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    {p.github_repo_url && (
                      <a
                        href={p.github_repo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-medium mt-1 w-fit"
                      >
                        <span>Source Code</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="px-6 md:px-8 border-t border-gray-800/40 pt-4 flex items-center justify-between text-[11px] text-gray-600">
          <p>© {new Date().getFullYear()} {displayName}</p>
          <a
            href="/"
            className="hover:underline font-semibold text-purple-400 hover:text-purple-300"
          >
            Built with DevBoard
          </a>
        </footer>

      </div>
    </div>
  )
}
