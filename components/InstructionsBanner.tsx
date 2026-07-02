"use client"

import { useState } from 'react'
import { ChevronDown, ChevronUp, Terminal, Timer, Trophy, Brain } from 'lucide-react'

export default function InstructionsBanner() {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <div className="relative overflow-hidden glass-panel bg-blue-50/30 transition-all duration-300">
      {/* Decorative corner glow */}
      <div className="absolute -top-12 -right-12 w-24 h-24 bg-blue-400/10 rounded-full blur-xl pointer-events-none" />
      
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/60 transition-colors duration-200 select-none"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 bg-blue-100 border border-blue-200 text-blue-600 rounded-lg">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight text-blue-800">
              System Directives & Quick Start
            </h3>
            <p className="text-xs text-slate-500 font-sans hidden sm:block mt-0.5">
              Read these operating guidelines to synchronize your developer workspace metrics.
            </p>
          </div>
        </div>
        <button className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-200/50 transition-colors">
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isOpen && (
        <div className="px-5 pb-5 pt-2 border-t border-blue-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 font-sans animate-fadeIn">
          {/* Card 1: Session Timer */}
          <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 hover:border-blue-300 hover:shadow-sm transition-all duration-300">
            <div className="flex items-center gap-2 text-blue-600">
              <Timer className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">1. Session Timer</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-500">
              Log your active code hours automatically. Toggle the floating widget in the bottom-right corner of the screen to track dev sessions.
            </p>
          </div>

          {/* Card 2: GitHub Connection */}
          <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 hover:border-amber-400 hover:shadow-sm transition-all duration-300">
            <div className="flex items-center gap-2 text-amber-500">
              <GitHubIcon className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">2. GitHub Connection</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-500">
              Link your GitHub account using OAuth. This populates your 35-day contribution calendar, tracks repository metrics, and active streaks.
            </p>
          </div>

          {/* Card 3: Platform Sync */}
          <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 hover:border-indigo-400 hover:shadow-sm transition-all duration-300">
            <div className="flex items-center gap-2 text-indigo-500">
              <Trophy className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">3. Platform Sync</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-500">
              Input your LeetCode and Codeforces handles in the <span className="text-indigo-500 font-mono text-[11px] bg-indigo-50 px-1 rounded">Settings</span> menu to pull challenge solve counts and contest ratings automatically.
            </p>
          </div>

          {/* Card 4: AI Progress Diagnostics */}
          <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 hover:border-blue-400 hover:shadow-sm transition-all duration-300">
            <div className="flex items-center gap-2 text-blue-500">
              <Brain className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">4. AI Diagnostics</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-500">
              Generate summarized performance diagnostics. Use the AI Summary widget in the grid to synthesize weekly coding metrics using Gemini.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  )
}
