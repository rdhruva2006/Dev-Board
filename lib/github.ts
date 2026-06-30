import type { GitHubRepo, GitHubEvent, GitHubStats, GitHubUser } from '@/types/github'

const GITHUB_API = 'https://api.github.com'

function authHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
}

export class GitHubRateLimitError extends Error {
  retryAfterMinutes: number
  constructor(retryAfterSeconds: number) {
    const minutes = Math.ceil(retryAfterSeconds / 60)
    super(`GitHub rate limited. Try again in ${minutes} minute${minutes !== 1 ? 's' : ''}.`)
    this.name = 'GitHubRateLimitError'
    this.retryAfterMinutes = minutes
  }
}

async function safeFetch<T>(url: string, token: string): Promise<T> {
  const res = await fetch(url, { headers: authHeaders(token) })

  if (res.status === 403 || res.status === 429) {
    const retryAfter = parseInt(res.headers.get('Retry-After') ?? '3600', 10)
    throw new GitHubRateLimitError(retryAfter)
  }

  if (!res.ok) {
    throw new Error(`GitHub API error ${res.status}: ${res.statusText}`)
  }

  return res.json() as Promise<T>
}

export async function fetchGitHubRepos(token: string): Promise<GitHubRepo[]> {
  return safeFetch<GitHubRepo[]>(
    `${GITHUB_API}/user/repos?sort=updated&per_page=10&type=owner`,
    token
  )
}

export async function fetchContributionGrid(
  username: string,
  token: string
): Promise<number[]> {
  const events = await safeFetch<GitHubEvent[]>(
    `${GITHUB_API}/users/${username}/events?per_page=100`,
    token
  )

  // Build a map of date -> commit count for last 35 days
  const now = new Date()
  const dayMap: Map<string, number> = new Map()

  // Initialise all 35 days with 0
  for (let i = 34; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    dayMap.set(d.toISOString().slice(0, 10), 0)
  }

  for (const event of events) {
    if (event.type !== 'PushEvent') continue
    const date = event.created_at.slice(0, 10)
    if (!dayMap.has(date)) continue
    const commits = event.payload.commits?.length ?? event.payload.size ?? 1
    dayMap.set(date, (dayMap.get(date) ?? 0) + commits)
  }

  // Convert commit counts to levels 0-4
  return Array.from(dayMap.values()).map((count) => {
    if (count === 0) return 0
    if (count <= 2) return 1
    if (count <= 5) return 2
    if (count <= 10) return 3
    return 4
  })
}

export async function fetchGitHubStats(
  username: string,
  token: string
): Promise<GitHubStats> {
  const [repos, events, user] = await Promise.all([
    fetchGitHubRepos(token),
    safeFetch<GitHubEvent[]>(`${GITHUB_API}/users/${username}/events?per_page=100`, token),
    safeFetch<GitHubUser>(`${GITHUB_API}/user`, token),
  ])

  // Top language
  const langCounts: Record<string, number> = {}
  for (const repo of repos) {
    if (repo.language) {
      langCounts[repo.language] = (langCounts[repo.language] ?? 0) + 1
    }
  }
  const top_language =
    Object.entries(langCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

  // Contributions this week
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
  const contributions_this_week = events
    .filter(
      (e) => e.type === 'PushEvent' && new Date(e.created_at) >= oneWeekAgo
    )
    .reduce((sum, e) => sum + (e.payload.commits?.length ?? e.payload.size ?? 1), 0)

  // Current streak — walk backwards from today
  const now = new Date()
  const dayActivity: Map<string, boolean> = new Map()
  for (const event of events) {
    if (event.type !== 'PushEvent') continue
    dayActivity.set(event.created_at.slice(0, 10), true)
  }

  let current_streak = 0
  for (let i = 0; i < 365; i++) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().slice(0, 10)
    if (dayActivity.get(dateStr)) {
      current_streak++
    } else if (i > 0) {
      // Allow today to have no commits yet without breaking streak
      break
    }
  }

  // Contribution grid (35 days)
  const contribution_grid = await fetchContributionGrid(username, token)

  return {
    contributions_this_week,
    total_repos: user.public_repos,
    top_language,
    current_streak,
    contribution_grid,
  }
}
