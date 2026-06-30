import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateWeeklySummary } from '@/lib/summary'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Rate limit check: wait at least 60 minutes between summary generations
  const { data: lastSummary } = await supabase
    .from('weekly_summaries')
    .select('created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (lastSummary) {
    const minutesSinceLast = (Date.now() - new Date(lastSummary.created_at).getTime()) / 60000
    if (minutesSinceLast < 60) {
      return NextResponse.json(
        { error: 'Please wait before regenerating' }, 
        { status: 429 }
      )
    }
  }

  const apiKey = process.env.GEMINI_API_KEY
  const anthropicKey = process.env.ANTHROPIC_API_KEY

  // 1. Gather all activity context from last 7 days
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

  // Fetch profiles for goal hours
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  const weeklyGoal = profile?.weekly_goal_hours ?? 10.0
  const displayName = user.user_metadata?.username || user.email || 'Developer'

  // Fetch dev sessions
  const { data: sessions } = await supabase
    .from('dev_sessions')
    .select('duration_minutes, notes, projects(name)')
    .eq('user_id', user.id)
    .gte('started_at', oneWeekAgo.toISOString())

  // Fetch GitHub stats
  const { data: githubStats } = await supabase
    .from('github_stats')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  // Fetch course list
  const { data: courses } = await supabase
    .from('courses')
    .select('title, progress')
    .eq('user_id', user.id)

  // 2. Aggregate statistics
  const totalSessions = sessions?.length ?? 0
  const totalMinutes = (sessions || []).reduce((acc, s) => acc + (s.duration_minutes || 0), 0)
  const totalHours = parseFloat((totalMinutes / 60).toFixed(1))

  // Project hour breakdown
  const projectBreakdown: Record<string, number> = {}
  ;(sessions || []).forEach(s => {
    const projName = (s.projects as any)?.name || 'Unknown Project'
    const hours = (s.duration_minutes || 0) / 60
    projectBreakdown[projName] = (projectBreakdown[projName] || 0) + hours
  })

  const projectsSummary = Object.entries(projectBreakdown)
    .map(([name, hrs]) => `- **${name}**: ${hrs.toFixed(1)} hours`)
    .join('\n')

  const coursesSummary = (courses || [])
    .map(c => `- **${c.title}**: ${c.progress}% completed`)
    .join('\n')

  const githubCommits = githubStats?.contributions_this_week ?? 0
  const githubStreak = githubStats?.current_streak ?? 0

  // 3. Formulate AI Prompt & Fallback using pure library helper
  const { prompt, fallbackText } = generateWeeklySummary({
    displayName,
    weeklyGoal,
    totalSessions,
    totalHours,
    githubCommits,
    githubStreak,
    coursesSummary,
    projectsSummary,
  })

  let generatedText = ''

  if (apiKey) {
    // Call Gemini API (Free tier from Google AI Studio)
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 800,
            },
          }),
        }
      )

      if (!response.ok) {
        throw new Error(`Gemini API responded with status ${response.status}`)
      }

      const resJson = await response.json()
      const text = resJson.candidates?.[0]?.content?.parts?.[0]?.text
      if (text) {
        generatedText = text
      } else {
        throw new Error('Gemini API returned an empty candidate list.')
      }
    } catch (e) {
      console.error('Gemini error:', e)
      return NextResponse.json({ error: 'Failed calling Gemini API.' }, { status: 500 })
    }
  } else if (anthropicKey) {
    // Alternative: call Claude API if configured
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }],
        }),
      })

      if (response.ok) {
        const resJson = await response.json()
        generatedText = resJson.content?.[0]?.text || ''
      }
    } catch (e) {
      console.error('Claude API error:', e)
    }
  }

  // Fallback Mockup Generator if no keys are set
  if (!generatedText) {
    generatedText = fallbackText
  }

  // Save generated summary to Supabase
  const { data: savedSummary, error: saveError } = await supabase
    .from('weekly_summaries')
    .insert({
      user_id: user.id,
      summary: generatedText,
    })
    .select()
    .single()

  if (saveError) {
    return NextResponse.json({ error: `Summary generated, but database write failed: ${saveError.message}` }, { status: 500 })
  }

  return NextResponse.json({ summary: savedSummary })
}
