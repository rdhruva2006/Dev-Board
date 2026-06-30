import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { DevSession } from '@/types/project'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

  const { data, error } = await supabase
    .from('dev_sessions')
    .select('*, projects(name)')
    .eq('user_id', user.id)
    .gte('started_at', oneWeekAgo.toISOString())
    .order('started_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ sessions: data })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json() as {
    action: 'start' | 'end'
    project_id?: string
    session_id?: string
    notes?: string
  }

  if (body.action === 'start') {
    if (!body.project_id) {
      return NextResponse.json({ error: 'project_id required to start session' }, { status: 400 })
    }
    const { data, error } = await supabase
      .from('dev_sessions')
      .insert({
        user_id: user.id,
        project_id: body.project_id,
        started_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ session: data as DevSession }, { status: 201 })
  }

  if (body.action === 'end') {
    if (!body.session_id) {
      return NextResponse.json({ error: 'session_id required to end session' }, { status: 400 })
    }
    // Fetch the session to calculate duration
    const { data: existing } = await supabase
      .from('dev_sessions')
      .select('started_at')
      .eq('id', body.session_id)
      .eq('user_id', user.id)
      .single()

    const endedAt = new Date()
    const startedAt = existing ? new Date(existing.started_at) : endedAt
    const duration_minutes = Math.round((endedAt.getTime() - startedAt.getTime()) / 60000)

    if (duration_minutes <= 0) {
      return NextResponse.json({ error: 'Session duration must be greater than 0 minutes' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('dev_sessions')
      .update({
        ended_at: endedAt.toISOString(),
        duration_minutes,
        notes: body.notes ?? null,
      })
      .eq('id', body.session_id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ session: data as DevSession })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
