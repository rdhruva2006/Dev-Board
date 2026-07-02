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
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="relative overflow-hidden glass-panel p-5 hover:border-blue-300 transition-colors"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 via-transparent to-amber-50/50" />

      <div className="relative z-10">
        <Icon className="w-6 h-6 mb-3 text-blue-600" />
        <h3 className="font-medium text-slate-900 mb-2">{course.title}</h3>
        <ProgressBar progress={course.progress} />
      </div>
    </motion.article>
  )
}