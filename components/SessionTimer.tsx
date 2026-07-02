'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Timer, Square, Plus, Play, ChevronDown, ChevronUp, X } from 'lucide-react'
import type { Project } from '@/types/project'

interface ActiveSession {
  id: string
  startedAt: Date
  projectName: string
}

interface StartSessionResponse {
  session?: { id: string }
  error?: string
}

interface ProjectsResponse {
  projects?: Project[]
  error?: string
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function SessionTimer({ floating = false }: { floating?: boolean }) {
  const [projects, setProjects] = useState<Project[]>([])
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)

  // Check auth state to avoid rendering floating bar for guests/public pages
  useEffect(() => {
    async function checkAuth() {
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        setAuthenticated(!!user)
      } catch {
        setAuthenticated(false)
      }
    }
    checkAuth()
  }, [])

  // Sync handler from active session queries
  const checkActiveSession = useCallback(async () => {
    try {
      const res = await fetch('/api/sessions')
      if (!res.ok) return
      const data = await res.json()
      if (data.sessions) {
        const active = data.sessions.find((s: any) => !s.ended_at)
        if (active) {
          setActiveSession({
            id: active.id,
            startedAt: new Date(active.started_at),
            projectName: active.projects?.name ?? 'Project',
          })
          setElapsed(Date.now() - new Date(active.started_at).getTime())
          return
        }
      }
      setActiveSession(null)
    } catch {
      /* silent */
    }
  }, [])

  // Load initial active session and active projects
  useEffect(() => {
    if (!authenticated) return

    fetch('/api/projects')
      .then((r) => r.json())
      .then((data: ProjectsResponse) => {
        if (data.projects) {
          setProjects(data.projects.filter((p) => p.status === 'active'))
        }
      })
      .catch(() => {})

    checkActiveSession()
  }, [authenticated, checkActiveSession])

  // Custom Event Listener to sync state across timer instances
  useEffect(() => {
    const handleSync = () => {
      checkActiveSession()
    }
    window.addEventListener('session-status-changed', handleSync)
    return () => window.removeEventListener('session-status-changed', handleSync)
  }, [checkActiveSession])

  // Ticking interval
  useEffect(() => {
    if (!activeSession) return
    const interval = setInterval(() => {
      setElapsed(Date.now() - activeSession.startedAt.getTime())
    }, 1000)
    return () => clearInterval(interval)
  }, [activeSession])

  const startSession = useCallback(async () => {
    if (!selectedProjectId) return
    setLoading(true)
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start', project_id: selectedProjectId }),
      })
      const data = (await res.json()) as StartSessionResponse
      if (data.session) {
        const project = projects.find((p) => p.id === selectedProjectId)
        setActiveSession({
          id: data.session.id,
          startedAt: new Date(),
          projectName: project?.name ?? 'Project',
        })
        setElapsed(0)
        setShowPicker(false)
        setIsCollapsed(true)
        window.dispatchEvent(new CustomEvent('session-status-changed'))
      }
    } catch { 
      /* silent */ 
    } finally {
      setLoading(false)
    }
  }, [selectedProjectId, projects])

  const endSession = useCallback(async () => {
    if (!activeSession) return
    setLoading(true)
    try {
      await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'end', session_id: activeSession.id }),
      })
      setActiveSession(null)
      setElapsed(0)
      window.dispatchEvent(new CustomEvent('session-status-changed'))
    } catch { 
      /* silent */ 
    } finally {
      setLoading(false)
    }
  }, [activeSession])

  // Do not render floating widget if not authenticated
  if (floating && !authenticated) {
    return null
  }

  // Floating render logic
  if (floating) {
    return (
      <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40 select-none">
        <AnimatePresence mode="wait">
          {isCollapsed ? (
            <motion.button
              key="collapsed"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={() => setIsCollapsed(false)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full border shadow-lg cursor-pointer backdrop-blur-xl ${
                activeSession 
                  ? 'bg-blue-50/90 border-blue-300 text-blue-700 animate-pulse' 
                  : 'bg-white/90 border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <Timer className={`w-4 h-4 ${activeSession ? 'text-blue-600' : 'text-slate-500'}`} />
              <span className="text-xs font-semibold font-mono">
                {activeSession ? formatDuration(elapsed) : 'Timer'}
              </span>
            </motion.button>
          ) : (
            <motion.div
              key="expanded"
              initial={{ y: 20, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 20, opacity: 0, scale: 0.95 }}
              className="w-72 bg-white/95 border border-slate-200 rounded-2xl p-4 shadow-xl space-y-4 backdrop-blur-xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <Timer className="w-4 h-4 text-blue-500 animate-pulse" />
                  <span className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wider">Dev Hour Tracker</span>
                </div>
                <button 
                  onClick={() => setIsCollapsed(true)}
                  className="p-1 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Active / Idle Views */}
              {activeSession ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-[9px] uppercase font-bold text-slate-500 tracking-widest font-mono">Tracking Session</p>
                    <p className="text-sm font-semibold text-slate-900 truncate mt-0.5">{activeSession.projectName}</p>
                  </div>
                  <p className="text-3xl font-mono font-bold text-blue-600">{formatDuration(elapsed)}</p>
                  <button
                    onClick={endSession}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-xs py-2 rounded-xl transition-colors disabled:opacity-50 font-bold font-mono tracking-wide uppercase"
                  >
                    <Square className="w-3.5 h-3.5 fill-red-600" />
                    Stop Session
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-[9px] uppercase font-bold text-slate-500 tracking-widest font-mono">Start Dev Session</p>
                  {showPicker ? (
                    <div className="space-y-2">
                      <select
                        value={selectedProjectId}
                        onChange={(e) => setSelectedProjectId(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                      >
                        <option value="">Select active project…</option>
                        {projects.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      <div className="flex gap-2">
                        <button
                          onClick={startSession}
                          disabled={!selectedProjectId || loading}
                          className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs py-1.5 rounded-lg transition-colors font-semibold border border-blue-600"
                        >
                          {loading ? 'Starting…' : 'Start'}
                        </button>
                        <button
                          onClick={() => setShowPicker(false)}
                          className="px-2.5 py-1.5 text-slate-500 hover:text-slate-900 text-xs transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowPicker(true)}
                      className="w-full flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs py-2 rounded-xl transition-colors font-bold uppercase tracking-wide font-mono"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Choose Project
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  // Standard inline tile render (Dashboard/Projects page)
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel p-5 flex flex-col justify-between h-full min-h-[175px] hover:border-blue-300 hover:shadow-md transition-all duration-300"
    >
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2.5 mb-2">
        <Timer className="w-4 h-4 text-blue-500 animate-pulse" />
        <h3 className="font-bold text-blue-700 text-xs font-mono uppercase tracking-wider">Dev Timer</h3>
      </div>

      <AnimatePresence mode="wait">
        {activeSession ? (
          <motion.div
            key="active"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col justify-between"
          >
            <div>
              <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest font-mono">Active: {activeSession.projectName}</p>
              <p className="text-3xl font-mono font-bold text-blue-600 mt-1">
                {formatDuration(elapsed)}
              </p>
            </div>
            <button
              onClick={endSession}
              disabled={loading}
              className="mt-3 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-xs px-3 py-1.5 rounded-xl transition-colors disabled:opacity-50 font-bold font-mono tracking-wide uppercase"
            >
              <Square className="w-3 h-3 fill-red-500" />
              Stop Session
            </button>
          </motion.div>
        ) : (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col justify-between">
            {showPicker ? (
              <div className="space-y-2 mt-1">
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select a project…</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button
                    onClick={startSession}
                    disabled={!selectedProjectId || loading}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs py-1.5 rounded-lg transition-colors font-semibold border border-blue-600"
                  >
                    {loading ? 'Starting…' : 'Start'}
                  </button>
                  <button
                    onClick={() => setShowPicker(false)}
                    className="px-2 py-1.5 text-slate-500 hover:text-slate-800 text-xs transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-between">
                <p className="text-xs text-slate-600 leading-normal font-sans">
                  Log your focused coding hours directly to your shipped codebases.
                </p>
                <button
                  onClick={() => setShowPicker(true)}
                  className="mt-3 w-full flex items-center justify-center gap-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs px-3 py-1.5 rounded-xl transition-colors font-bold font-mono uppercase tracking-wide"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Start Timer
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
