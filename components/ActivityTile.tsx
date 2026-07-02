'use client'

import { motion } from 'framer-motion'

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

// Fixed mock pattern instead of random — avoids server/client mismatch
const mockActivity = [
  1, 2, 0, 3, 1, 2, 0, 1, 3, 2, 0, 1, 2, 3, 0,
  1, 2, 0, 1, 3, 2, 1, 0, 3, 2, 1, 0, 2, 3, 1,
  0, 1, 2, 3, 0,
]

interface ActivityTileProps {
  contributionGrid?: number[]
  githubUsername?: string
}

export default function ActivityTile({ contributionGrid, githubUsername }: ActivityTileProps) {
  const grid = contributionGrid && contributionGrid.length === 35 ? contributionGrid : mockActivity

  return (
    <motion.section
      variants={item}
      className="glass-panel p-5 hover:border-blue-300 hover:shadow-md transition-all duration-300 h-full flex flex-col justify-between"
    >
      <div>
        <h3 className="font-bold text-slate-700 text-xs font-mono uppercase tracking-wider mb-1">
          {githubUsername ? `@${githubUsername}'s Activity` : 'Activity'}
        </h3>
        {!contributionGrid && (
          <p className="text-[10px] text-slate-500 font-mono mb-3">Connect GitHub for real telemetry</p>
        )}
        {contributionGrid && <div className="mb-3" />}
      </div>

      <div className="grid grid-cols-7 gap-1.5 self-center mt-2">
        {grid.map((level, i) => (
          <div
            key={i}
            className={`w-5 h-5 rounded-sm ${
              level === 0
                ? 'bg-slate-100 border border-slate-200'
                : level === 1
                ? 'bg-blue-100 border border-blue-200'
                : level === 2
                ? 'bg-blue-300 border border-blue-400'
                : level === 3
                ? 'bg-blue-500 border border-blue-600'
                : 'bg-blue-600 border border-blue-700'
            }`}
          />
        ))}
      </div>
    </motion.section>
  )
}