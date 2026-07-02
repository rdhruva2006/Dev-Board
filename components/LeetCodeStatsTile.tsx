'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw } from 'lucide-react'
import type { CodingStats, CodingProfile } from '@/types/coding'

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

// Pure SVG donut ring — no chart library needed
function DonutRing({
  easy,
  medium,
  hard,
  total,
}: {
  easy: number
  medium: number
  hard: number
  total: number
}) {
  const r = 28
  const cx = 36
  const cy = 36
  const circumference = 2 * Math.PI * r
  const sum = easy + medium + hard || 1

  const easyPct = easy / sum
  const medPct = medium / sum
  const hardPct = hard / sum

  const easyDash = easyPct * circumference
  const medDash = medPct * circumference
  const hardDash = hardPct * circumference

  // Rotate so easy starts at top
  const easyOffset = 0
  const medOffset = -easyDash
  const hardOffset = -(easyDash + medDash)

  return (
    <svg width={72} height={72} className="shrink-0">
      {/* Background ring */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgb(241,245,249)" strokeWidth={8} />
      {/* Easy */}
      <circle
        cx={cx} cy={cy} r={r} fill="none"
        stroke="rgb(74,222,128)" strokeWidth={8}
        strokeDasharray={`${easyDash} ${circumference - easyDash}`}
        strokeDashoffset={easyOffset}
        transform={`rotate(-90 ${cx} ${cy})`}
        strokeLinecap="butt"
      />
      {/* Medium */}
      <circle
        cx={cx} cy={cy} r={r} fill="none"
        stroke="rgb(250,204,21)" strokeWidth={8}
        strokeDasharray={`${medDash} ${circumference - medDash}`}
        strokeDashoffset={medOffset}
        transform={`rotate(-90 ${cx} ${cy})`}
        strokeLinecap="butt"
      />
      {/* Hard */}
      <circle
        cx={cx} cy={cy} r={r} fill="none"
        stroke="rgb(248,113,113)" strokeWidth={8}
        strokeDasharray={`${hardDash} ${circumference - hardDash}`}
        strokeDashoffset={hardOffset}
        transform={`rotate(-90 ${cx} ${cy})`}
        strokeLinecap="butt"
      />
      {/* Centre text */}
      <text x={cx} y={cy - 4} textAnchor="middle" className="fill-slate-900 text-xs font-bold" fontSize={11}>
        {total}
      </text>
      <text x={cx} y={cy + 8} textAnchor="middle" className="fill-slate-500" fontSize={8}>
        solved
      </text>
    </svg>
  )
}

interface LeetCodeStatsTileProps {
  stats: CodingStats | null
  profile: CodingProfile | null
  readOnly?: boolean
}

interface SyncResponse {
  success?: boolean
  leetcode?: { success: boolean; error?: string }
  error?: string
}

export default function LeetCodeStatsTile({
  stats,
  profile,
  readOnly = false,
}: LeetCodeStatsTileProps) {
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState<string | null>(null)

  const isConnected = !!profile?.leetcode_username
  const hasStats = isConnected && stats?.lc_total_solved != null

  const handleSync = async () => {
    setSyncing(true)
    setSyncMsg(null)
    try {
      const res = await fetch('/api/coding/sync', { method: 'POST' })
      const data = (await res.json()) as SyncResponse
      if (data.leetcode?.success) {
        setSyncMsg('Synced! Refresh to see updated stats.')
      } else {
        setSyncMsg(data.leetcode?.error ?? data.error ?? 'Sync failed.')
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
        className="relative overflow-hidden glass-panel p-5 hover:border-amber-300 hover:shadow-md transition-all duration-300 h-full"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 to-transparent pointer-events-none" />
        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-amber-700 font-bold text-xs bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-mono">LC</span>
              <h3 className="font-bold text-slate-700 text-xs font-mono uppercase tracking-wider">LeetCode</h3>
            </div>
          </div>
          <p className="text-xs text-slate-600 font-sans leading-relaxed">
            {readOnly ? 'No LeetCode profile connected.' : 'Add your LeetCode username in Settings to track your problem-solving progress.'}
          </p>
          {!readOnly && (
            <a
              href="/settings"
              className="inline-flex items-center gap-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 text-xs font-bold font-mono tracking-wide uppercase px-4 py-2 rounded-xl transition-all"
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
      className="relative overflow-hidden glass-panel p-5 hover:border-amber-300 hover:shadow-md transition-all duration-300 h-full"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 via-transparent to-orange-50/50 pointer-events-none" />
      <div className="relative z-10 flex flex-col justify-between h-full">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {stats?.lc_avatar && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={stats.lc_avatar}
                  alt={profile.leetcode_username ?? ''}
                  className="w-7 h-7 rounded-full border border-slate-200 object-cover"
                />
              )}
              <div>
                <p className="text-xs font-bold text-slate-800 font-mono">{profile.leetcode_username}</p>
                <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">LeetCode</p>
              </div>
            </div>
            <span className="text-amber-700 font-bold text-xs bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-mono">LC</span>
          </div>

          {hasStats ? (
            <>
              {/* Donut + breakdown */}
              <div className="flex items-center gap-4 mb-4">
                <DonutRing
                  easy={stats.lc_easy_solved ?? 0}
                  medium={stats.lc_medium_solved ?? 0}
                  hard={stats.lc_hard_solved ?? 0}
                  total={stats.lc_total_solved ?? 0}
                />
                <div className="space-y-1 text-xs font-mono flex-1">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    <span className="text-slate-600">EASY</span>
                    <span className="font-bold text-slate-800 ml-auto">{stats.lc_easy_solved}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0" />
                    <span className="text-slate-600">MEDIUM</span>
                    <span className="font-bold text-slate-800 ml-auto">{stats.lc_medium_solved}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                    <span className="text-slate-600">HARD</span>
                    <span className="font-bold text-slate-800 ml-auto">{stats.lc_hard_solved}</span>
                  </div>
                </div>
              </div>

              {/* Pills */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {stats.lc_streak != null && stats.lc_streak > 0 && (
                  <span className="text-[10px] bg-orange-50 border border-orange-200 text-orange-700 px-2.5 py-1 rounded-xl font-mono uppercase tracking-wide">
                    🔥 {stats.lc_streak} STREAK
                  </span>
                )}
                {stats.lc_contest_rating != null && (
                  <span className="text-[10px] bg-blue-50 border border-blue-200 text-blue-700 px-2.5 py-1 rounded-xl font-mono uppercase tracking-wide">
                    🏆 {Math.round(stats.lc_contest_rating)} RATING
                  </span>
                )}
                {stats.lc_top_percentage != null && (
                  <span className="text-[10px] bg-purple-50 border border-purple-200 text-purple-700 px-2.5 py-1 rounded-xl font-mono uppercase tracking-wide">
                    TOP {stats.lc_top_percentage.toFixed(1)}%
                  </span>
                )}
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

            {syncMsg && <p className="mt-2 text-[10px] text-slate-500 font-mono">{syncMsg}</p>}
          </div>
        )}
      </div>
    </motion.div>
  )
}
