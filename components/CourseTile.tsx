'use client'

import { motion } from 'framer-motion'
import { iconMap, FallbackIcon } from '@/lib/icon-map'
import ProgressBar from './ProgressBar'
import type { Course } from '@/types/course'

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

interface CourseTileProps {
  course: Course
  index: number
}

export default function CourseTile({
  course,
  index,
}: CourseTileProps) {
  const Icon =
    iconMap[course.icon_name as keyof typeof iconMap] || FallbackIcon

  return (
    <motion.article
      variants={item}
      whileHover={{
        scale: 1.02,
        boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)',
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="relative overflow-hidden rounded-2xl bg-gray-900/80 border border-gray-800 p-5"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/15 via-transparent to-blue-600/10 rounded-2xl" />

      <div className="relative z-10">
        <Icon className="w-6 h-6 mb-3 text-purple-400" />
        <h3 className="font-medium mb-2">{course.title}</h3>
        <ProgressBar progress={course.progress} />
      </div>
    </motion.article>
  )
}