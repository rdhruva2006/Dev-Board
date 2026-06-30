'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { AlertOctagon, ArrowLeft, RefreshCw, Sparkles } from 'lucide-react'
import Link from 'next/link'

export default function DebugSentryPage() {
  const [crashed, setCrashed] = useState(false)

  const triggerError = () => {
    setCrashed(true)
    setTimeout(() => {
      throw new Error('DevBoard Test Error: Sentry Capture Verification')
    }, 500)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 text-white p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl text-center space-y-6 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-red-900/10 via-transparent to-transparent pointer-events-none" />
        
        <div className="w-16 h-16 rounded-2xl bg-red-950/30 border border-red-900/40 flex items-center justify-center mx-auto shadow-inner">
          <AlertOctagon className="w-8 h-8 text-red-500" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold tracking-tight text-white">Sentry Debug Console</h1>
          <p className="text-sm text-gray-400">
            Click the button below to trigger a simulated Javascript runtime error. This error will bubble up to demonstrate Sentry error-tracking ingestion.
          </p>
        </div>

        <div className="bg-gray-950/60 border border-gray-850 rounded-xl p-4 text-left font-mono text-xs text-red-400 space-y-1">
          <p className="text-gray-500">// Stack trace simulator</p>
          <p>Error: DevBoard Test Error</p>
          <p className="pl-4">at debug-sentry/page.tsx:L12</p>
          <p className="pl-4">at triggerError (page.tsx:11)</p>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <button
            onClick={triggerError}
            disabled={crashed}
            className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-medium px-4 py-2.5 rounded-lg text-sm transition-colors shadow-lg shadow-red-900/10"
          >
            {crashed ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Throwing Error...
              </>
            ) : (
              'Trigger Test Runtime Error'
            )}
          </button>
          
          <Link
            href="/dashboard"
            className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium px-4 py-2.5 rounded-lg text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
