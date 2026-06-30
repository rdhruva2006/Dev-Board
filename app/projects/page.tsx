'use client'

import { useState, useEffect, useOptimistic, startTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FolderGit2, Plus, ExternalLink, Calendar, Hourglass, Trash2, Edit2, CheckCircle2, Play, Pause, Trophy, X } from 'lucide-react'

// Inline GitHub mark SVG — lucide-react v1.x removed the Github icon
function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  )
}

import { createClient } from '@/lib/supabase/client'
import Sidebar from '@/components/Sidebar'
import SessionTimer from '@/components/SessionTimer'
import type { ProjectWithStats, ProjectStatus } from '@/types/project'
import { createProject, updateProject, deleteProject } from '@/app/actions/projects'

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [displayName, setDisplayName] = useState<string | undefined>(undefined)
  const [showModal, setShowModal] = useState(false)
  const [editingProject, setEditingProject] = useState<ProjectWithStats | null>(null)
  
  // React 19 Optimistic state for projects
  const [optimisticProjects, setOptimisticProjects] = useOptimistic<
    ProjectWithStats[],
    | { type: 'add'; project: ProjectWithStats }
    | { type: 'edit'; project: ProjectWithStats }
    | { type: 'delete'; id: string }
  >(projects, (state, action) => {
    switch (action.type) {
      case 'add':
        return [action.project, ...state]
      case 'edit':
        return state.map((p) => (p.id === action.project.id ? action.project : p))
      case 'delete':
        return state.filter((p) => p.id !== action.id)
      default:
        return state
    }
  })

  // Form fields
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<ProjectStatus>('active')
  const [githubUrl, setGithubUrl] = useState('')
  const [techStackInput, setTechStackInput] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const supabase = createClient()

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects')
      const data = await res.json()
      if (data.projects) {
        setProjects(data.projects)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setDisplayName(user.user_metadata?.username || user.email)
      }
      fetchProjects()
    }
    loadUser()
  }, [])

  const openAddModal = () => {
    setEditingProject(null)
    setName('')
    setDescription('')
    setStatus('active')
    setGithubUrl('')
    setTechStackInput('')
    setFormError(null)
    setShowModal(true)
  }

  const openEditModal = (project: ProjectWithStats) => {
    setEditingProject(project)
    setName(project.name)
    setDescription(project.description || '')
    setStatus(project.status)
    setGithubUrl(project.github_repo_url || '')
    setTechStackInput(project.tech_stack.join(', '))
    setFormError(null)
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project? All associated development sessions will be lost.')) return
    
    // Optimistic Delete
    startTransition(async () => {
      setOptimisticProjects({ type: 'delete', id })
      try {
        await deleteProject(id)
        setProjects((prev) => prev.filter((p) => p.id !== id))
      } catch (e) {
        alert(e instanceof Error ? e.message : 'Failed to delete project')
        fetchProjects() // Rollback
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setFormError('Project name is required')
      return
    }

    setSubmitting(true)
    setFormError(null)

    const tech_stack = techStackInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0)

    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      status,
      github_repo_url: githubUrl.trim() || null,
      tech_stack,
    }

    if (editingProject) {
      // Optimistic Edit
      const optProject: ProjectWithStats = {
        ...editingProject,
        name: payload.name,
        description: payload.description,
        status: payload.status,
        github_repo_url: payload.github_repo_url,
        tech_stack: payload.tech_stack,
      }

      startTransition(async () => {
        setOptimisticProjects({ type: 'edit', project: optProject })
        setShowModal(false)
        try {
          const updated = await updateProject(editingProject.id, payload)
          const withStats: ProjectWithStats = {
            ...updated,
            total_hours: editingProject.total_hours,
            session_count: editingProject.session_count,
          }
          setProjects((prev) => prev.map((p) => (p.id === editingProject.id ? withStats : p)))
        } catch (e) {
          alert(e instanceof Error ? e.message : 'Failed to edit project')
          fetchProjects() // Rollback
        } finally {
          setSubmitting(false)
        }
      })
    } else {
      // Optimistic Add
      const tempId = `temp-${Math.random()}`
      const optProject: ProjectWithStats = {
        id: tempId,
        user_id: '',
        name: payload.name,
        description: payload.description,
        status: payload.status,
        github_repo_url: payload.github_repo_url,
        tech_stack: payload.tech_stack,
        created_at: new Date().toISOString(),
        total_hours: 0,
        session_count: 0,
      }

      startTransition(async () => {
        setOptimisticProjects({ type: 'add', project: optProject })
        setShowModal(false)
        try {
          const created = await createProject(payload)
          const withStats: ProjectWithStats = {
            ...created,
            total_hours: 0,
            session_count: 0,
          }
          setProjects((prev) => [withStats, ...prev])
        } catch (e) {
          setFormError(e instanceof Error ? e.message : 'Failed to create project')
          fetchProjects() // Rollback
        } finally {
          setSubmitting(false)
        }
      })
    }
  }

  const getStatusBadge = (s: ProjectStatus) => {
    switch (s) {
      case 'active':
        return (
          <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400">
            <Play className="w-3 h-3 fill-current" /> Active
          </span>
        )
      case 'paused':
        return (
          <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400">
            <Pause className="w-3 h-3 fill-current" /> Paused
          </span>
        )
      case 'shipped':
        return (
          <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <CheckCircle2 className="w-3 h-3 fill-current" /> Shipped
          </span>
        )
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <Sidebar userName={displayName} />

      <main className="flex-1 p-6 space-y-6 overflow-y-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Project Tracker</h1>
            <p className="text-sm text-gray-400">Manage your builds, log your dev hours, and track shipping metrics.</p>
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-medium px-4 py-2 rounded-lg transition-colors shadow-lg shadow-purple-600/10 self-start md:self-auto"
          >
            <Plus className="w-4 h-4" /> Add Project
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
          {/* Projects List */}
          <div className="xl:col-span-2 space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[0, 1].map(i => (
                  <div key={i} className="h-44 bg-gray-900 border border-gray-800 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : optimisticProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-16 text-center rounded-2xl bg-gray-900/40 border border-gray-800 border-dashed">
                <FolderGit2 className="w-12 h-12 text-gray-600 mb-4" />
                <p className="text-lg font-medium text-gray-300 mb-1">No projects tracked yet</p>
                <p className="text-sm text-gray-500 max-w-sm mb-4">
                  Add your first coding project, linking its GitHub repository, to start logging development hours.
                </p>
                <button
                  onClick={openAddModal}
                  className="bg-purple-600/20 hover:bg-purple-600/30 border border-purple-800/50 text-purple-300 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  Create Project
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {optimisticProjects.map((project, index) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative overflow-hidden rounded-2xl bg-gray-900/80 border border-gray-800 p-5 group hover:border-gray-700/80 transition-all shadow-md hover:shadow-xl"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg text-white group-hover:text-purple-400 transition-colors">
                            {project.name}
                          </h3>
                          {getStatusBadge(project.status)}
                        </div>
                        {project.description && (
                          <p className="text-sm text-gray-400 line-clamp-2 max-w-xl">
                            {project.description}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditModal(project)}
                          className="p-1.5 text-gray-400 hover:text-white rounded-md bg-gray-800/50 hover:bg-gray-800 transition-colors"
                          title="Edit Project"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(project.id)}
                          className="p-1.5 text-gray-400 hover:text-red-400 rounded-md bg-gray-800/50 hover:bg-gray-850 transition-colors"
                          title="Delete Project"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Stats Section */}
                    <div className="grid grid-cols-3 gap-2 my-4 bg-gray-950/40 border border-gray-850 rounded-xl p-3">
                      <div className="text-center border-r border-gray-850">
                        <p className="text-lg font-mono font-bold text-purple-400">{project.total_hours}h</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Total Logged</p>
                      </div>
                      <div className="text-center border-r border-gray-850">
                        <p className="text-lg font-mono font-bold text-white">{project.session_count}</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Sessions</p>
                      </div>
                      <div className="text-center flex flex-col items-center justify-center">
                        {project.github_repo_url ? (
                          <a
                            href={project.github_repo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-blue-400 hover:underline hover:text-blue-300 font-medium transition-colors"
                          >
                            <GitHubIcon className="w-3.5 h-3.5 text-white" /> Codebase
                          </a>
                        ) : (
                          <span className="text-[11px] text-gray-600">Local Only</span>
                        )}
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mt-0.5">Repo</p>
                      </div>
                    </div>

                    {/* Tech Stack Tags */}
                    {project.tech_stack.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {project.tech_stack.map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] font-medium px-2 py-0.5 rounded bg-gray-800/80 text-gray-300 border border-gray-700/30"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Dev Timer & Overall Tracker Stats */}
          <div className="space-y-6">
            <SessionTimer />

            {/* Quick Metrics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-2xl bg-gray-900 border border-gray-800 p-5 space-y-4"
            >
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-400" /> Track Overview
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-gray-850 pb-2">
                  <span className="text-sm text-gray-400">Total Projects</span>
                  <span className="font-semibold font-mono text-white">{optimisticProjects.length}</span>
                </div>
                <div className="flex items-center justify-between border-b border-gray-850 pb-2">
                  <span className="text-sm text-gray-400">Total Logged Time</span>
                  <span className="font-semibold font-mono text-purple-400">
                    {optimisticProjects.reduce((acc, p) => acc + p.total_hours, 0).toFixed(1)} hrs
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-gray-850 pb-2">
                  <span className="text-sm text-gray-400">Total Sessions</span>
                  <span className="font-semibold font-mono text-white">
                    {optimisticProjects.reduce((acc, p) => acc + p.session_count, 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Shipped Projects</span>
                  <span className="font-semibold font-mono text-green-400">
                    {optimisticProjects.filter(p => p.status === 'shipped').length}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Create / Edit Project Modal */}
        <AnimatePresence>
          {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              {/* Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowModal(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />

              {/* Modal Container */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative z-10 w-full max-w-lg bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl space-y-4"
              >
                <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                  <h2 className="text-lg font-semibold text-white">
                    {editingProject ? 'Edit Project' : 'New Project'}
                  </h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-1 hover:bg-gray-800 text-gray-400 hover:text-white rounded-md transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Project Name *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Portfolio Website"
                      className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Description
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="What is this project about?"
                      className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-sm h-20 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">
                        Status
                      </label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                        className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-sm"
                      >
                        <option value="active">Active</option>
                        <option value="paused">Paused</option>
                        <option value="shipped">Shipped</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">
                        GitHub Repository URL
                      </label>
                      <input
                        type="url"
                        value={githubUrl}
                        onChange={(e) => setGithubUrl(e.target.value)}
                        placeholder="https://github.com/..."
                        className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Tech Stack (comma-separated tags)
                    </label>
                    <input
                      type="text"
                      value={techStackInput}
                      onChange={(e) => setTechStackInput(e.target.value)}
                      placeholder="Next.js, Tailwind, Supabase"
                      className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-sm"
                    />
                  </div>

                  {formError && (
                    <p className="text-red-400 text-xs mt-1">{formError}</p>
                  )}

                  <div className="flex justify-end gap-3 border-t border-gray-800 pt-3 mt-4">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-5 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
                    >
                      {submitting ? 'Saving...' : 'Save Project'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
