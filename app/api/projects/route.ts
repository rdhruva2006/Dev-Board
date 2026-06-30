import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Project } from '@/types/project'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (projectsError) return NextResponse.json({ error: projectsError.message }, { status: 500 })

  const { data: sessions, error: sessionsError } = await supabase
    .from('dev_sessions')
    .select('project_id, duration_minutes')
    .eq('user_id', user.id)

  if (sessionsError) return NextResponse.json({ error: sessionsError.message }, { status: 500 })

  const projectsWithStats = (projects as Project[]).map(project => {
    const projectSessions = (sessions || []).filter(s => s.project_id === project.id)
    const session_count = projectSessions.length
    const totalMinutes = projectSessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0)
    const total_hours = parseFloat((totalMinutes / 60).toFixed(1))

    return {
      ...project,
      total_hours,
      session_count
    }
  })

  return NextResponse.json({ projects: projectsWithStats })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json() as {
    name: string
    description?: string
    github_repo_url?: string
    tech_stack?: string[]
    status?: 'active' | 'paused' | 'shipped'
  }

  if (!body.name?.trim()) {
    return NextResponse.json({ error: 'Project name is required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('projects')
    .insert({
      user_id: user.id,
      name: body.name.trim(),
      description: body.description ?? null,
      github_repo_url: body.github_repo_url ?? null,
      tech_stack: body.tech_stack ?? [],
      status: body.status ?? 'active',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ project: data as Project }, { status: 201 })
}
