import type { CodeforcesUser, CodeforcesSubmission, CodeforcesContest, CodeforcesStats } from '@/types/coding'

const CF_API = 'https://codeforces.com/api'

interface CFResponse<T> {
  status: 'OK' | 'FAILED'
  result: T
  comment?: string
}

async function cfFetch<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${CF_API}/${endpoint}`, {
    next: { revalidate: 0 }, // Always fresh when called from sync
  })

  if (!res.ok) {
    throw new Error(`Codeforces API error: ${res.status}`)
  }

  const json = await res.json() as CFResponse<T>

  if (json.status === 'FAILED') {
    throw new Error(`Codeforces error: ${json.comment ?? 'Unknown error'}`)
  }

  return json.result
}

export async function fetchCFUser(handle: string): Promise<CodeforcesUser> {
  const users = await cfFetch<CodeforcesUser[]>(`user.info?handles=${encodeURIComponent(handle)}`)
  if (!users[0]) throw new Error(`Codeforces user '${handle}' not found`)
  return users[0]
}

export async function fetchCFSubmissions(handle: string): Promise<CodeforcesSubmission[]> {
  return cfFetch<CodeforcesSubmission[]>(
    `user.status?handle=${encodeURIComponent(handle)}&from=1&count=1000`
  )
}

export async function fetchCFContests(handle: string): Promise<CodeforcesContest[]> {
  return cfFetch<CodeforcesContest[]>(`user.rating?handle=${encodeURIComponent(handle)}`)
}

export async function fetchCodeforcesStats(handle: string): Promise<CodeforcesStats> {
  const [user, submissions, contests] = await Promise.all([
    fetchCFUser(handle),
    fetchCFSubmissions(handle),
    fetchCFContests(handle),
  ])

  // Count unique accepted problems
  const solvedSet = new Set<string>()
  for (const sub of submissions) {
    if (sub.verdict === 'OK') {
      const key = `${sub.contestId ?? 'practice'}_${sub.problem.index}_${sub.problem.name}`
      solvedSet.add(key)
    }
  }

  // Last 10 contests for sparkline
  const ratingHistory = contests.slice(-10).map((c) => ({
    rating: c.newRating,
    date: new Date(c.ratingUpdateTimeSeconds * 1000).toISOString(),
  }))

  return {
    handle: user.handle,
    rating: user.rating,
    maxRating: user.maxRating,
    rank: user.rank,
    maxRank: user.maxRank,
    avatar: user.avatar,
    problemsSolved: solvedSet.size,
    contestCount: contests.length,
    ratingHistory,
  }
}
