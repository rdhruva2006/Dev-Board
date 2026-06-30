'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, FolderGit2, Settings } from 'lucide-react'

const navLinks = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/projects', label: 'Projects', icon: FolderGit2 },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export default function MobileNav() {
  const pathname = usePathname()

  // Don't render mobile nav on login page or public portfolio pages
  const isLoginPage = pathname === '/login'
  const isPublicProfile = pathname.startsWith('/u/')
  if (isLoginPage || isPublicProfile) return null

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-gray-900/80 backdrop-blur-lg border-t border-gray-800/80 px-6 py-2 shadow-2xl">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navLinks.map((link) => {
          const Icon = link.icon
          const isActive = pathname === link.href

          return (
            <Link
              key={link.href}
              href={link.href}
              className="flex flex-col items-center gap-1 py-1 px-3 text-center transition-colors group select-none"
            >
              <Icon
                className={`w-5 h-5 transition-transform group-active:scale-95 ${
                  isActive ? 'text-purple-400' : 'text-gray-400 group-hover:text-gray-200'
                }`}
              />
              <span
                className={`text-[10px] font-medium transition-colors ${
                  isActive ? 'text-purple-400' : 'text-gray-500 group-hover:text-gray-300'
                }`}
              >
                {link.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
