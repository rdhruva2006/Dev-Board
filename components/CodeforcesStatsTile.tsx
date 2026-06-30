'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw, Code2, Trophy } from 'lucide-react'
import type { CodingStats, CodingProfile } from '@/types/coding'

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

const CF_RANK_COLORS: Record<string, string> = {
  newbie: 'text-gray-400',
  pupil: 'text-green-400',
  specialist: 'text-cyan-400',
  expert: 'text-blue-400',
  'candidate master': 'text-violet-400',
  master: 'text-orange-400',
  'international master': 'text-orange-400',
  grandmaster: 'text-red-400',
  'international grandmaster': 'text-red-400',
  'legendary grandmaster': 'text-red-400',
}

function getRankColor(rank: string): string {
  return CF_RANK_COLORS[rank.toLowerCase()] ?? 'text-gray-400'
}

// Mini sparkline for rating history
function RatingSparkline({ history }: { history?: { rating: number }[] }) {
  if (!history || history.length < 2) return null
  const ratings = history.map((h) => h.rating)
  const min = Math.min(...ratings)
  const max = Math.max(...ratings)
  const range = max - min || 1
  const w = 80
  const h = 24
  const points = ratings
    .map((r, i) => {
      const x = (i / (ratings.length - 1)) * w
      const y = h - ((r - min) / range) * h
      return `${x},${y}`
    })
    .join(' ')

  return (
    <svg width={w} height={h} className="opacity-70">
      <polyline
        points={points}
        fill="none"
        stroke="rgb(168,85,247)"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}

interface CodeforcesStatsTileProps {
  stats: CodingStats | null
  profile: CodingProfile | null
  ratingHistory?: { rating: number; date: string }[]
  readOnly?: boolean
}

interface SyncResponse {
  success?: boolean
  codeforces?: { success: boolean; error?: string }
  error?: string
}

export default function CodeforcesStatsTile({
  stats,
  profile,
  ratingHistory,
  readOnly = false,
}: CodeforcesStatsTileProps) {
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState<string | null>(null)

  const isConnected = !!profile?.codeforces_handle
  const hasStats = isConnected && stats?.cf_rating != null

  const handleSync = async () => {
    setSyncing(true)
    setSyncMsg(null)
    try {
      const res = await fetch('/api/coding/sync', { method: 'POST' })
      const data = (await res.json()) as SyncResponse
      if (data.codeforces?.success) {
        setSyncMsg('Synced! Refresh to see updated stats.')
      } else {
        setSyncMsg(data.codeforces?.error ?? data.error ?? 'Sync failed.')
      }
    } catch {
      setSyncMsg('Network error. Try again.')
    } finally {
      setSyncing(false)
    }
  }

  // ── Disconnected ─────────────────────────────────
  if (!isConnected) {
    return (
      <motion.div
        variants={item}
        className="relative overflow-hidden rounded-2xl bg-gray-900/80 border border-gray-800 p-5"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 to-transparent rounded-2xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <Code2 className="w-5 h-5 text-blue-400" />
            <h3 className="font-medium text-gray-200">Codeforces</h3>
          </div>
          <p className="text-sm text-gray-400 mb-2">
            {readOnly ? 'No Codeforces profile connected.' : 'Add your Codeforces handle in Settings to see your rating and problems solved.'}
          </p>
          {!readOnly && (
            <a
              href="/settings"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors mt-2"
            >
              Connect in Settings
            </a>
          )}
        </div>
      </motion.div>
    )
  }

  // ── Connected ─────────────────────────────────────
  return (
    <motion.div
      variants={item}
      className="relative overflow-hidden rounded-2xl bg-gray-900/80 border border-gray-800 p-5"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 via-transparent to-purple-900/10 rounded-2xl" />
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {stats?.cf_avatar && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={stats.cf_avatar}
                alt={profile.codeforces_handle ?? ''}
                className="w-8 h-8 rounded-full border border-gray-700"
              />
            )}
            <div>
              <p className="text-sm font-medium text-white">{profile.codeforces_handle}</p>
              {stats?.cf_rank && (
                <p className={`text-xs capitalize ${getRankColor(stats.cf_rank)}`}>
                  {stats.cf_rank}
                </p>
              )}
            </div>
          </div>
          <Code2 className="w-4 h-4 text-blue-400" />
        </div>

        {/* Stats */}
        {hasStats ? (
          <>
            <div className="flex items-end gap-3 mb-3">
              <div>
                <p className="text-2xl font-bold text-white">{stats.cf_rating}</p>
                <p className="text-xs text-gray-500">Current rating</p>
              </div>
              <div className="mb-1">
                <RatingSparkline history={ratingHistory} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="bg-gray-800/50 rounded-lg p-2 text-center">
                <p className="text-base font-semibold text-white">{stats.cf_problems_solved}</p>
                <p className="text-xs text-gray-500">Solved</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-2 text-center">
                <p className="text-base font-semibold text-white">{stats.cf_contest_count}</p>
                <p className="text-xs text-gray-500">Contests</p>
              </div>
            </div>

            <div className="text-xs text-gray-500 mb-3">
              Peak: <span className={getRankColor(stats.cf_max_rank ?? '')}>{stats.cf_max_rank}</span>{' '}
              ({stats.cf_max_rating})
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-500 mb-4">Click sync to load stats</p>
        )}

        {!readOnly && (
          <>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="inline-flex items-center gap-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white text-sm px-3 py-1.5 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing…' : 'Sync'}
            </button>

            {syncMsg && (
              <p className="mt-2 text-xs text-gray-400">{syncMsg}</p>
            )}
          </>
        )}
      </div>
    </motion.div>
  )
}
