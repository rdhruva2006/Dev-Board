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
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full border shadow-2xl cursor-pointer ${
                activeSession 
                  ? 'bg-purple-950/90 border-purple-800 text-purple-300 animate-pulse' 
                  : 'bg-gray-900/90 border-gray-800 text-gray-300 hover:text-white'
              }`}
            >
              <Timer className={`w-4 h-4 ${activeSession ? 'text-purple-400' : 'text-gray-400'}`} />
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
              className="w-72 bg-gray-900/95 border border-gray-800 rounded-2xl p-4 shadow-2xl space-y-4 backdrop-blur-md"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                <div className="flex items-center gap-2">
                  <Timer className="w-4 h-4 text-purple-400 animate-spin-slow" />
                  <span className="text-xs font-semibold text-gray-200">Dev Hour Tracker</span>
                </div>
                <button 
                  onClick={() => setIsCollapsed(true)}
                  className="p-1 hover:bg-gray-800 rounded-md text-gray-500 hover:text-gray-300 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Active / Idle Views */}
              {activeSession ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Tracking Session</p>
                    <p className="text-sm font-semibold text-white truncate mt-0.5">{activeSession.projectName}</p>
                  </div>
                  <p className="text-3xl font-mono font-bold text-purple-400">{formatDuration(elapsed)}</p>
                  <button
                    onClick={endSession}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 bg-red-950/80 hover:bg-red-900 border border-red-800/60 text-red-300 text-xs py-2 rounded-xl transition-colors disabled:opacity-50 font-bold"
                  >
                    <Square className="w-3.5 h-3.5 fill-red-300" />
                    Stop & Save Session
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Start Dev Session</p>
                  {showPicker ? (
                    <div className="space-y-2">
                      <select
                        value={selectedProjectId}
                        onChange={(e) => setSelectedProjectId(e.target.value)}
                        className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
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
                          className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs py-1.5 rounded-lg transition-colors font-semibold"
                        >
                          {loading ? 'Starting…' : 'Start'}
                        </button>
                        <button
                          onClick={() => setShowPicker(false)}
                          className="px-2.5 py-1.5 text-gray-400 hover:text-white text-xs transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowPicker(true)}
                      className="w-full flex items-center justify-center gap-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-800/40 text-purple-300 text-xs py-2 rounded-xl transition-colors font-bold"
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
      className="rounded-2xl bg-gray-900/80 border border-gray-800 p-5 flex flex-col justify-between h-full min-h-[175px]"
    >
      <div className="flex items-center gap-2 border-b border-gray-800/30 pb-2.5 mb-2">
        <Timer className="w-4 h-4 text-purple-400" />
        <h3 className="font-medium text-gray-200 text-sm">Dev Timer</h3>
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
              <p className="text-[10px] text-gray-500 uppercase font-semibold">Active: {activeSession.projectName}</p>
              <p className="text-3xl font-mono font-bold text-purple-400 mt-1">
                {formatDuration(elapsed)}
              </p>
            </div>
            <button
              onClick={endSession}
              disabled={loading}
              className="mt-3 flex items-center justify-center gap-2 bg-red-950/50 hover:bg-red-900/70 border border-red-800/50 text-red-300 text-xs px-3 py-1.5 rounded-xl transition-colors disabled:opacity-50"
            >
              <Square className="w-3 h-3 fill-red-300" />
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
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
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
                    className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs py-1.5 rounded-lg transition-colors font-semibold"
                  >
                    {loading ? 'Starting…' : 'Start'}
                  </button>
                  <button
                    onClick={() => setShowPicker(false)}
                    className="px-2 py-1.5 text-gray-400 hover:text-white text-xs transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-between">
                <p className="text-xs text-gray-500 leading-normal">
                  Log your focused coding hours directly to your shipped codebases.
                </p>
                <button
                  onClick={() => setShowPicker(true)}
                  className="mt-3 w-full flex items-center justify-center gap-1.5 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-800/40 text-purple-300 text-xs px-3 py-1.5 rounded-xl transition-colors"
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
