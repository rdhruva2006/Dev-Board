export type ProjectStatus = 'active' | 'paused' | 'shipped'

export interface Project {
  id: string
  user_id: string
  name: string
  description: string | null
  status: 'active' | 'paused' | 'shipped'
  github_repo_url: string | null
  tech_stack: string[]
  created_at: string
}

export interface DevSession {
  id: string
  user_id: string
  project_id: string
  started_at: string
  ended_at: string | null
  duration_minutes: number | null
  notes: string | null
}

export interface DevSessionWithProject extends DevSession {
  projects: Pick<Project, 'name'>
}

export interface ProjectWithStats extends Project {
  total_hours: number
  session_count: number
}
