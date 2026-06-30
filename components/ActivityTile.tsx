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
      className="rounded-2xl bg-gray-900/80 border border-gray-800 p-5"
    >
      <h3 className="font-medium mb-1">
        {githubUsername ? `@${githubUsername}'s Activity` : 'Activity'}
      </h3>
      {!contributionGrid && (
        <p className="text-xs text-gray-500 mb-3">Connect GitHub for real data</p>
      )}
      {contributionGrid && <div className="mb-3" />}

      <div className="grid grid-cols-7 gap-1.5">
        {grid.map((level, i) => (
          <div
            key={i}
            className={`w-5 h-5 rounded-sm ${
              level === 0
                ? 'bg-gray-800'
                : level === 1
                ? 'bg-purple-900'
                : level === 2
                ? 'bg-purple-600'
                : level === 3
                ? 'bg-purple-500'
                : 'bg-purple-400'
            }`}
          />
        ))}
      </div>
    </motion.section>
  )
}