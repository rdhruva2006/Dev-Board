'use client'

import { motion } from 'framer-motion'
import { Target, Award, Sparkles } from 'lucide-react'

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

interface GoalsTileProps {
  loggedHours: number
  weeklyGoal: number
}

export default function GoalsTile({ loggedHours = 0, weeklyGoal = 10 }: GoalsTileProps) {
  const percent = Math.min(100, Math.round((loggedHours / (weeklyGoal || 1)) * 100))
  const isCompleted = loggedHours >= weeklyGoal

  return (
    <motion.section
      variants={item}
      className="relative overflow-hidden rounded-2xl bg-gray-900/80 border border-gray-800 p-5 flex flex-col justify-between"
    >
      {/* Background gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/10 via-transparent to-transparent pointer-events-none" />
      <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-400" />
            <h3 className="font-medium text-gray-200 text-sm">Weekly Goal</h3>
          </div>
          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
            isCompleted 
              ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-400' 
              : 'bg-gray-850 border border-gray-850 text-gray-400'
          }`}>
            {isCompleted ? 'Goal Met' : 'In Progress'}
          </span>
        </div>

        {/* Big hours metric */}
        <div className="space-y-1">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-mono font-bold text-white">{loggedHours.toFixed(1)}</span>
            <span className="text-gray-500 text-sm">/ {weeklyGoal.toFixed(1)} hrs</span>
          </div>
          <p className="text-xs text-gray-400">
            {isCompleted 
              ? 'Incredible! You have met your goal. Keep shipping! 🚀' 
              : `Logged ${(weeklyGoal - loggedHours).toFixed(1)} more hours to reach your goal.`}
          </p>
        </div>
      </div>

      {/* Progress bar container */}
      <div className="mt-4 relative z-10 space-y-2">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Completion</span>
          <span className="font-mono text-gray-300">{percent}%</span>
        </div>
        <div className="w-full bg-gray-950 rounded-full h-2 overflow-hidden border border-gray-850">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={`h-full rounded-full bg-gradient-to-r ${
              isCompleted ? 'from-emerald-500 to-teal-400' : 'from-purple-500 to-indigo-400'
            }`}
          />
        </div>
      </div>
    </motion.section>
  )
}
