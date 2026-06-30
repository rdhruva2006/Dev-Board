'use client'

import { motion } from 'framer-motion'

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

interface HeroTileProps {
  name?: string
  streak?: number
  totalRepos?: number
  topLanguage?: string | null
  className?: string
}

export default function HeroTile({
  name = 'Zabby',
  streak = 0,
  totalRepos,
  topLanguage,
  className = 'md:col-span-2',
}: HeroTileProps) {
  return (
    <motion.section
      variants={item}
      className={`rounded-2xl p-6 relative overflow-hidden bg-gradient-to-br from-purple-900/60 via-gray-900 to-gray-950 border border-purple-800/30 ${className}`}
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent" />

      {/* Decorative glow blob */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-600/20 rounded-full blur-3xl" />

      {/* Content */}
      <div className="relative z-10">
        <h2 className="text-2xl font-semibold">
          Welcome back, {name}
        </h2>

        <p className="text-gray-400 mt-2">
          🔥 {streak}-day streak
        </p>

        {(totalRepos !== undefined || topLanguage) && (
          <div className="flex flex-wrap gap-2 mt-4">
            {totalRepos !== undefined && (
              <span className="inline-flex items-center gap-1 bg-gray-800/60 border border-gray-700 text-gray-300 text-xs px-3 py-1 rounded-full">
                🗂 {totalRepos} repos
              </span>
            )}
            {topLanguage && (
              <span className="inline-flex items-center gap-1 bg-gray-800/60 border border-gray-700 text-gray-300 text-xs px-3 py-1 rounded-full">
                💻 {topLanguage}
              </span>
            )}
          </div>
        )}
      </div>
    </motion.section>
  )
}