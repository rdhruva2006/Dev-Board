'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Home, FolderGit2, Settings, Terminal } from 'lucide-react'
import LogoutButton from './LogoutButton'

const links = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/projects', label: 'Projects', icon: FolderGit2 },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar({ userName }: { userName?: string }) {
  const pathname = usePathname()

  return (
    <nav className="hidden md:flex md:flex-col md:w-20 lg:w-64 p-4 gap-2 bg-white/80 backdrop-blur-xl border-r border-slate-200 min-h-screen shrink-0 relative z-20">
      <div className="flex items-center gap-2 px-2 mb-8 mt-2">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 shrink-0">
          <Terminal className="w-5 h-5 animate-pulse" />
        </div>
        <span className="hidden lg:block font-extrabold text-slate-900 font-sans uppercase tracking-wider text-sm">
          DevBoard <span className="text-blue-500">//</span> HUD
        </span>
      </div>

      {userName && (
        <div className="mb-6 px-3 hidden lg:block">
          <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest font-mono">
            System Node // User
          </p>
          <p className="text-xs font-bold text-blue-600 font-mono truncate mt-0.5">{userName.toUpperCase()}</p>
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
              className="relative flex items-center gap-3 px-3 py-2.5 rounded-lg overflow-hidden group transition-colors"
            >
              {isActive && (
                <motion.div
                  layoutId="active-pill"
                  className="absolute inset-0 bg-blue-50 border border-blue-200 rounded-lg shadow-sm"
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                />
              )}

              <Icon
                className={`relative z-10 w-5 h-5 transition-colors ${
                  isActive ? 'text-blue-600' : 'text-slate-500 group-hover:text-slate-900'
                }`}
              />
              <span
                className={`relative z-10 hidden lg:inline text-xs font-bold font-mono uppercase tracking-wider transition-colors ${
                  isActive ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-900'
                }`}
              >
                {link.label}
              </span>
            </Link>
          )
        })}
      </div>

      <div className="mt-auto pt-4 border-t border-slate-200">
        <LogoutButton />
      </div>
    </nav>
  )
}