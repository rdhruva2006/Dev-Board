'use client'

import { useState } from 'react'
import { Link2, Check } from 'lucide-react'

export default function CopyProfileLink() {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* silent */
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-xs font-semibold border border-gray-700 transition-colors shadow-sm cursor-pointer"
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-green-400" />
          <span>Copied!</span>
        </>
      ) : (
        <>
          <Link2 className="w-3.5 h-3.5 text-purple-400" />
          <span>Copy profile link</span>
        </>
      )}
    </button>
  )
}
