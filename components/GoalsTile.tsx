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
      className="relative overflow-hidden glass-panel p-5 flex flex-col justify-between hover:border-amber-300 hover:shadow-md transition-all duration-300 h-full"
    >
      {/* Background gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 via-transparent to-transparent pointer-events-none" />
      <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-100/50 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-amber-500" />
            <h3 className="font-bold text-slate-700 text-xs font-mono uppercase tracking-wider">Weekly Goal</h3>
          </div>
          <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded font-mono border ${
            isCompleted 
              ? 'bg-amber-50 border-amber-200 text-amber-700' 
              : 'bg-slate-50 border-slate-200 text-slate-500'
          }`}>
            {isCompleted ? 'Goal Met' : 'In Progress'}
          </span>
        </div>

        {/* Big hours metric */}
        <div className="space-y-1">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-mono font-bold text-slate-900">{loggedHours.toFixed(1)}</span>
            <span className="text-slate-500 font-mono text-xs">/ {weeklyGoal.toFixed(1)} HRS</span>
          </div>
          <p className="text-xs text-slate-600 font-sans leading-relaxed">
            {isCompleted 
              ? 'Incredible! You have met your goal. Keep shipping! 🚀' 
              : `Log ${(weeklyGoal - loggedHours).toFixed(1)} more hours to reach system target.`}
          </p>
        </div>
      </div>

      {/* Progress bar container */}
      <div className="mt-4 relative z-10 space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span className="font-mono text-[10px] uppercase">Telemetry</span>
          <span className="font-mono text-slate-700 font-semibold">{percent}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={`h-full rounded-full bg-gradient-to-r ${
              isCompleted ? 'from-amber-400 to-yellow-400' : 'from-blue-500 to-blue-400'
            }`}
          />
        </div>
      </div>
    </motion.section>
  )
}
