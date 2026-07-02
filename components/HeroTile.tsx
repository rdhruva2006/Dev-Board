'use client'

import { motion } from 'framer-motion'
import { Flame, FolderGit2, Code2 } from 'lucide-react'

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
  className = '',
}: HeroTileProps) {
  return (
    <motion.section
      variants={item}
      className={`h-full p-8 relative overflow-hidden glass-panel hover:border-blue-300 hover:shadow-[0_15px_50px_-12px_rgba(37,99,235,0.15)] transition-all duration-300 ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-transparent pointer-events-none" />
      <div className="absolute -top-16 -right-16 w-56 h-56 bg-amber-100/50 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-4">
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
          Ready to build, <span className="text-blue-600">{name}</span>?
        </h2>
        <p className="text-slate-600 max-w-2xl text-sm md:text-base leading-relaxed">
          This dashboard is your central command for tracking coding metrics, managing daily learning goals, and analyzing your open-source activity. Ensure your accounts are connected to see live telemetry.
        </p>

        <div className="flex items-center gap-2 font-medium text-sm mt-4">
          <Flame className={`w-5 h-5 ${streak > 0 ? 'text-amber-500 drop-shadow-sm' : 'text-slate-300'}`} />
          <p className="text-slate-500">
            <span className="font-bold text-slate-800 text-base">{streak}</span>-DAY STREAK
          </p>
        </div>

        {(totalRepos !== undefined || topLanguage) && (
          <div className="flex flex-wrap gap-2 pt-2">
            {totalRepos !== undefined && (
              <span className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-100 text-blue-700 text-xs px-3.5 py-1.5 rounded-full font-semibold">
                <FolderGit2 className="w-3.5 h-3.5 text-blue-500" />
                {totalRepos} REPOS
              </span>
            )}
            {topLanguage && (
              <span className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-100 text-amber-700 text-xs px-3.5 py-1.5 rounded-full font-semibold uppercase">
                <Code2 className="w-3.5 h-3.5 text-amber-500" />
                {topLanguage}
              </span>
            )}
          </div>
        )}
      </div>
    </motion.section>
  )
}