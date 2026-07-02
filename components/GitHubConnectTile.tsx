'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw, CheckCircle } from 'lucide-react'
import type { GitHubConnection, GitHubStats } from '@/types/github'

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

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

interface GitHubConnectTileProps {
  connection: GitHubConnection | null
  lastSynced: string | null
}

interface SyncResponse {
  success?: boolean
  stats?: GitHubStats
  error?: string
  rateLimited?: boolean
  retryAfterMinutes?: number
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function GitHubConnectTile({
  connection,
  lastSynced,
}: GitHubConnectTileProps) {
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)
  const [syncError, setSyncError] = useState<string | null>(null)

  const handleSync = async () => {
    setSyncing(true)
    setSyncMessage(null)
    setSyncError(null)

    try {
      const res = await fetch('/api/github/sync', { method: 'POST' })
      const data = (await res.json()) as SyncResponse

      if (res.status === 429 || data.rateLimited) {
        setSyncError(data.error ?? 'Rate limited. Try again later.')
      } else if (data.error) {
        setSyncError(data.error)
      } else {
        setSyncMessage('Synced! Refresh the page to see updated stats.')
      }
    } catch {
      setSyncError('Network error. Please try again.')
    } finally {
      setSyncing(false)
    }
  }

  // ── Disconnected state ─────────────────────────────────────────
  if (!connection) {
    return (
      <motion.div
        variants={item}
        className="relative overflow-hidden glass-panel p-5 flex flex-col justify-between hover:border-amber-300 hover:shadow-md transition-all duration-300 h-full"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-2">
            <GitHubIcon className="w-4 h-4 text-slate-400 animate-pulse" />
            <h3 className="font-bold text-slate-700 text-xs font-mono uppercase tracking-wider">GitHub</h3>
          </div>
          <p className="text-xs text-slate-600 font-sans leading-relaxed">
            Connect your GitHub account to see real activity data, repos, and streaks.
          </p>
          <a
            href="/api/auth/github"
            className="inline-flex items-center gap-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 text-xs font-bold font-mono tracking-wide uppercase px-4 py-2 rounded-xl transition-all"
          >
            <GitHubIcon className="w-3.5 h-3.5" />
            Connect GitHub
          </a>
        </div>
      </motion.div>
    )
  }

  // ── Connected state ────────────────────────────────────────────
  return (
    <motion.div
      variants={item}
      className="relative overflow-hidden glass-panel p-5 flex flex-col justify-between hover:border-amber-300 hover:shadow-md transition-all duration-300 h-full"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 via-transparent to-amber-100/50 pointer-events-none" />
      <div className="relative z-10 flex flex-col justify-between h-full">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <GitHubIcon className="w-4 h-4 text-amber-500 animate-pulse" />
              <h3 className="font-bold text-slate-700 text-xs font-mono uppercase tracking-wider">GitHub</h3>
              <CheckCircle className="w-3.5 h-3.5 text-amber-500" />
            </div>
          </div>

          {/* Avatar + username */}
          <div className="flex items-center gap-3 mb-4">
            {connection.avatar_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={connection.avatar_url}
                alt={connection.github_username}
                className="w-7 h-7 rounded-full border border-slate-200 object-cover"
              />
            )}
            <div>
              <p className="font-bold text-xs text-slate-800 font-mono">
                @{connection.github_username}
              </p>
              {lastSynced && (
                <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">
                  Synced {formatRelativeTime(lastSynced)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Sync button */}
        <div className="pt-2 border-t border-slate-200">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="inline-flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 disabled:opacity-50 text-slate-700 text-xs px-3.5 py-1.5 rounded-xl transition-all font-mono uppercase tracking-wider"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing…' : 'Sync Now'}
          </button>

          {syncMessage && (
            <p className="mt-2 text-[10px] text-amber-600 font-mono">{syncMessage}</p>
          )}
          {syncError && (
            <p className="mt-2 text-[10px] text-red-600 font-mono">{syncError}</p>
          )}
        </div>
      </div>
    </motion.div>
  )
}
