'use client'
import { motion } from 'framer-motion'

const item = {
  hidden: { opacity: 0 },
  show: { opacity: 1 },
}

export function SkeletonTile() {
  return (
    <motion.div
      variants={item}
      className="rounded-2xl bg-gray-900/80 border border-gray-800 p-5 animate-pulse"
    >
      <div className="h-4 w-24 bg-gray-800 rounded mb-4" />
      <div className="h-8 w-32 bg-gray-800 rounded mb-2" />
      <div className="h-3 w-20 bg-gray-800 rounded" />
    </motion.div>
  )
}

export function SkeletonHero() {
  return (
    <motion.div
      variants={item}
      className="md:col-span-2 rounded-2xl bg-gray-900/80 border border-gray-800 p-6 animate-pulse"
    >
      <div className="h-6 w-48 bg-gray-800 rounded mb-3" />
      <div className="h-4 w-32 bg-gray-800 rounded mb-4" />
      <div className="flex gap-2">
        <div className="h-6 w-20 bg-gray-800 rounded-full" />
        <div className="h-6 w-24 bg-gray-800 rounded-full" />
      </div>
    </motion.div>
  )
}

export function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[0, 1, 2].map((i) => (
        <SkeletonTile key={i} />
      ))}
    </div>
  )
}

export default SkeletonTile
