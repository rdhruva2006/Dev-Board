'use client'
import { motion } from 'framer-motion'

export default function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
      <motion.div
        className="h-full rounded-full bg-amber-400"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: progress / 100 }}
        style={{ originX: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
    </div>
  )
}