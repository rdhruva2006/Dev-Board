'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, RefreshCw, AlertCircle, Quote } from 'lucide-react'

interface SummaryData {
  id: string
  summary: string
  created_at: string
}

interface GenerateResponse {
  summary?: SummaryData
  error?: string
}

// Lightweight, type-safe markdown renderer for basic formatting: headers, lists, and bold text
function CustomMarkdown({ text }: { text: string }) {
  const lines = text.split('\n')
  return (
    <div className="space-y-2.5 text-sm text-gray-300">
      {lines.map((line, idx) => {
        const trimmed = line.trim()
        if (!trimmed) return <div key={idx} className="h-2" />

        // Header ###
        if (trimmed.startsWith('###')) {
          return (
            <h4 key={idx} className="text-base font-semibold text-purple-400 mt-4 mb-2">
              {trimmed.substring(3).trim()}
            </h4>
          )
        }
        // Header ####
        if (trimmed.startsWith('####')) {
          return (
            <h5 key={idx} className="text-sm font-semibold text-gray-200 mt-3 mb-1">
              {trimmed.substring(4).trim()}
            </h5>
          )
        }
        // Bullets - or *
        if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
          const content = trimmed.substring(1).trim()
          return (
            <li key={idx} className="list-none pl-5 relative before:content-['•'] before:absolute before:left-1 before:text-purple-500 before:font-bold">
              {renderBoldText(content)}
            </li>
          )
        }
        // Numbered lists 1. 2.
        if (/^\d+\./.test(trimmed)) {
          const match = trimmed.match(/^(\d+\.)(.*)/)
          const num = match ? match[1] : ''
          const content = match ? match[2].trim() : trimmed
          return (
            <li key={idx} className="list-none pl-6 relative">
              <span className="absolute left-0 text-purple-400 font-mono font-bold text-xs top-0.5">{num}</span>
              {renderBoldText(content)}
            </li>
          )
        }

        // Standard Paragraph
        return <p key={idx} className="leading-relaxed">{renderBoldText(trimmed)}</p>
      })}
    </div>
  )
}

// Helper to parse **bold** text inline
function renderBoldText(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  return parts.map((part, i) => (i % 2 === 1 ? <strong key={i} className="text-white font-semibold">{part}</strong> : part))
}

export default function AISummaryTile({ className = 'md:col-span-2 lg:col-span-3' }: { className?: string }) {
  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchLatestSummary = async () => {
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('weekly_summaries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (data) {
        setSummary(data as SummaryData)
      }
    } catch {
      setError('Could not connect to database.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLatestSummary()
  }, [])

  const handleGenerate = async () => {
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch('/api/summary/generate', { method: 'POST' })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else if (data.summary) {
        setSummary(data.summary)
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className={`${className} rounded-2xl bg-gray-900 border border-gray-800 p-6 animate-pulse space-y-4`}>
        <div className="h-4 w-48 bg-gray-800 rounded" />
        <div className="space-y-2">
          <div className="h-3 w-full bg-gray-800/50 rounded" />
          <div className="h-3 w-5/6 bg-gray-800/50 rounded" />
          <div className="h-3 w-4/5 bg-gray-800/50 rounded" />
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-2xl bg-gray-900/80 border border-gray-800 p-6 group shadow-xl ${className}`}
    >
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-transparent to-purple-800/5 pointer-events-none" />

      <div className="relative z-10 flex flex-col h-full justify-between gap-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800/50 pb-3">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <div>
              <h3 className="font-semibold text-white">AI Weekly Summary</h3>
              <p className="text-xs text-gray-500">Weekly developer productivity coaching & goal tracking</p>
            </div>
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-2 bg-purple-600/10 hover:bg-purple-600/20 border border-purple-800/50 disabled:opacity-50 text-purple-300 text-xs font-medium px-3.5 py-1.5 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
            {generating ? 'Analyzing…' : summary ? 'Update Report' : 'Generate Report'}
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 min-h-[120px]">
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 text-red-400 text-sm bg-red-950/20 border border-red-900/30 p-3 rounded-lg"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            {!error && summary ? (
              <motion.div
                key={summary.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="relative bg-gray-950/20 rounded-xl border border-gray-850/50 p-4"
              >
                <Quote className="absolute top-2 right-4 w-8 h-8 text-gray-800/40 pointer-events-none" />
                <CustomMarkdown text={summary.summary} />
                <p className="text-[10px] text-gray-500 font-mono mt-4 text-right">
                  Generated on {new Date(summary.created_at).toLocaleDateString()}
                </p>
              </motion.div>
            ) : (
              !error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-gray-850 rounded-xl"
                >
                  <Sparkles className="w-8 h-8 text-gray-700 mb-3" />
                  <p className="text-sm text-gray-300 font-medium mb-1">No reports compiled yet</p>
                  <p className="text-xs text-gray-500 max-w-sm">
                    Generate your weekly developer report to get code feedback, streak reviews, and goals tracking.
                  </p>
                </motion.div>
              )
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}
