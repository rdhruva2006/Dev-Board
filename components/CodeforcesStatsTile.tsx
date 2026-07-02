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
        stroke="rgb(37,99,235)"
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
        className="relative overflow-hidden glass-panel p-5 hover:border-blue-300 hover:shadow-md transition-all duration-300 h-full"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent pointer-events-none" />
        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-blue-700 font-bold text-xs bg-blue-50 border border-blue-200 px-2 py-0.5 rounded font-mono">CF</span>
              <h3 className="font-bold text-slate-700 text-xs font-mono uppercase tracking-wider">Codeforces</h3>
            </div>
          </div>
          <p className="text-xs text-slate-600 font-sans leading-relaxed">
            {readOnly ? 'No Codeforces profile connected.' : 'Add your Codeforces handle in Settings to see your rating and problems solved.'}
          </p>
          {!readOnly && (
            <a
              href="/settings"
              className="inline-flex items-center gap-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold font-mono tracking-wide uppercase px-4 py-2 rounded-xl transition-all"
            >
              Connect Profile
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
      className="relative overflow-hidden glass-panel p-5 hover:border-blue-300 hover:shadow-md transition-all duration-300 h-full"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-blue-100/50 pointer-events-none" />
      <div className="relative z-10 flex flex-col justify-between h-full">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {stats?.cf_avatar && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={stats.cf_avatar}
                  alt={profile.codeforces_handle ?? ''}
                  className="w-7 h-7 rounded-full border border-slate-200 object-cover"
                />
              )}
              <div>
                <p className="text-xs font-bold text-slate-800 font-mono">{profile.codeforces_handle}</p>
                {stats?.cf_rank && (
                  <p className={`text-[10px] uppercase font-bold font-mono ${getRankColor(stats.cf_rank)}`}>
                    {stats.cf_rank}
                  </p>
                )}
              </div>
            </div>
            <span className="text-blue-700 font-bold text-xs bg-blue-50 border border-blue-200 px-2 py-0.5 rounded font-mono">CF</span>
          </div>

          {/* Stats */}
          {hasStats ? (
            <>
              <div className="flex items-end gap-3 mb-3">
                <div>
                  <p className="text-2xl font-bold text-slate-900 font-mono">{stats.cf_rating}</p>
                  <p className="text-[10px] text-slate-500 uppercase font-mono">Current rating</p>
                </div>
                <div className="mb-1">
                  <RatingSparkline history={ratingHistory} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 text-center font-mono">
                  <p className="text-sm font-bold text-slate-800">{stats.cf_problems_solved}</p>
                  <p className="text-[9px] text-slate-500 uppercase">SOLVED</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 text-center font-mono">
                  <p className="text-sm font-bold text-slate-800">{stats.cf_contest_count}</p>
                  <p className="text-[9px] text-slate-500 uppercase">CONTESTS</p>
                </div>
              </div>

              <div className="text-[10px] text-slate-500 mb-3 font-mono">
                PEAK: <span className={`${getRankColor(stats.cf_max_rank ?? '')} font-bold`}>{stats.cf_max_rank?.toUpperCase()}</span>{' '}
                ({stats.cf_max_rating})
              </div>
            </>
          ) : (
            <p className="text-xs text-slate-500 mb-4 font-sans">Click sync to load statistics</p>
          )}
        </div>

        {!readOnly && (
          <div className="pt-2 border-t border-slate-200">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="inline-flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 disabled:opacity-50 text-slate-700 text-xs px-3.5 py-1.5 rounded-xl transition-all font-mono uppercase tracking-wider"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing…' : 'Sync'}
            </button>

            {syncMsg && (
              <p className="mt-2 text-[10px] text-slate-500 font-mono">{syncMsg}</p>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}
