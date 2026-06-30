'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Home, FolderGit2, Settings } from 'lucide-react'
import LogoutButton from './LogoutButton'

const links = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/projects', label: 'Projects', icon: FolderGit2 },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar({ userName }: { userName?: string }) {
  const pathname = usePathname()

  return (
    <nav className="hidden md:flex md:flex-col md:w-20 lg:w-64 p-4 gap-2 bg-gray-900/30 border-r border-gray-800/50 min-h-screen shrink-0">
      {userName && (
        <div className="mb-6 px-3">
          <p className="text-xs text-gray-500 uppercase font-semibold">Logged in as</p>
          <p className="text-sm font-medium text-white truncate">{userName}</p>
        </div>
      )}

      <div className="space-y-1">
        {links.map((link) => {
          const Icon = link.icon
          const isActive = pathname === link.href

          return (
            <Link
              key={link.href}
              href={link.href}
              className="relative flex items-center gap-3 px-3 py-2 rounded-lg text-left overflow-hidden group transition-colors hover:text-white"
            >
              {isActive && (
                <motion.div
                  layoutId="active-pill"
                  className="absolute inset-0 bg-purple-900/40 border border-purple-800/30 rounded-lg"
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 25,
                  }}
                />
              )}

              <Icon className={`relative z-10 w-5 h-5 transition-colors ${isActive ? 'text-purple-400' : 'text-gray-400 group-hover:text-gray-200'}`} />
              <span className={`relative z-10 hidden lg:inline font-medium transition-colors ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>
                {link.label}
              </span>
            </Link>
          )
        })}
      </div>
      
      <div className="mt-auto">
        <LogoutButton />
      </div>
    </nav>
  )
}