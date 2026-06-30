export interface GitHubRepo {
  name: string
  description: string | null
  language: string | null
  stargazers_count: number
  updated_at: string
  html_url: string
}

export interface GitHubUser {
  login: string
  avatar_url: string
  name: string | null
  public_repos: number
}

export interface GitHubEvent {
  type: string
  created_at: string
  payload: {
    commits?: { sha: string }[]
    size?: number
  }
}

export interface GitHubStats {
  contributions_this_week: number
  total_repos: number
  top_language: string | null
  current_streak: number
  contribution_grid: number[]
}

export interface GitHubConnection {
  id: string
  user_id: string
  github_username: string
  access_token: string
  avatar_url: string | null
  connected_at: string
}

export interface ContributionDay {
  date: string
  level: number
}
