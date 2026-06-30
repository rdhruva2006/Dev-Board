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
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgb(31,41,55)" strokeWidth={8} />
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
      <text x={cx} y={cy - 4} textAnchor="middle" className="fill-white text-xs font-bold" fontSize={11}>
        {total}
      </text>
      <text x={cx} y={cy + 8} textAnchor="middle" className="fill-gray-400" fontSize={8}>
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
        className="relative overflow-hidden rounded-2xl bg-gray-900/80 border border-gray-800 p-5"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-900/10 to-transparent rounded-2xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-yellow-400 font-bold text-sm">LC</span>
            <h3 className="font-medium text-gray-200">LeetCode</h3>
          </div>
          <p className="text-sm text-gray-400 mb-2">
            {readOnly ? 'No LeetCode profile connected.' : 'Add your LeetCode username in Settings to track your problem-solving progress.'}
          </p>
          {!readOnly && (
            <a
              href="/settings"
              className="inline-flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors mt-2"
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
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-900/10 via-transparent to-orange-900/10 rounded-2xl" />
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {stats?.lc_avatar && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={stats.lc_avatar}
                alt={profile.leetcode_username ?? ''}
                className="w-8 h-8 rounded-full border border-gray-700"
              />
            )}
            <div>
              <p className="text-sm font-medium text-white">{profile.leetcode_username}</p>
              <p className="text-xs text-gray-500">LeetCode</p>
            </div>
          </div>
          <span className="text-yellow-400 font-bold text-xs bg-yellow-400/10 px-2 py-0.5 rounded">LC</span>
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
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
                  <span className="text-gray-400">Easy</span>
                  <span className="font-medium text-white ml-auto">{stats.lc_easy_solved}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-yellow-400 shrink-0" />
                  <span className="text-gray-400">Medium</span>
                  <span className="font-medium text-white ml-auto">{stats.lc_medium_solved}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                  <span className="text-gray-400">Hard</span>
                  <span className="font-medium text-white ml-auto">{stats.lc_hard_solved}</span>
                </div>
              </div>
            </div>

            {/* Pills */}
            <div className="flex flex-wrap gap-2 mb-4">
              {stats.lc_streak != null && stats.lc_streak > 0 && (
                <span className="text-xs bg-orange-900/40 border border-orange-800/50 text-orange-300 px-2 py-1 rounded-full">
                  🔥 {stats.lc_streak}-day streak
                </span>
              )}
              {stats.lc_contest_rating != null && (
                <span className="text-xs bg-blue-900/40 border border-blue-800/50 text-blue-300 px-2 py-1 rounded-full">
                  🏆 {Math.round(stats.lc_contest_rating)} rating
                </span>
              )}
              {stats.lc_top_percentage != null && (
                <span className="text-xs bg-purple-900/40 border border-purple-800/50 text-purple-300 px-2 py-1 rounded-full">
                  Top {stats.lc_top_percentage.toFixed(1)}%
                </span>
              )}
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

            {syncMsg && <p className="mt-2 text-xs text-gray-400">{syncMsg}</p>}
          </>
        )}
      </div>
    </motion.div>
  )
}
