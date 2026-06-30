'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import Sidebar from '@/components/Sidebar'
import { User, ShieldAlert, Sparkles, Moon, Sun, LogOut } from 'lucide-react'

// Inline GitHub icon
function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  )
}

type TabType = 'profile' | 'accounts' | 'preferences' | 'logout'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('profile')
  const [fetching, setFetching] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState('')

  // Profile fields
  const [usernameSlug, setUsernameSlug] = useState('')
  const [fullName, setFullName] = useState('')
  const [bio, setBio] = useState('')
  const [weeklyGoal, setWeeklyGoal] = useState('10.0')

  // Accounts fields
  const [githubConnected, setGithubConnected] = useState(false)
  const [cfHandle, setCfHandle] = useState('')
  const [lcUsername, setLcUsername] = useState('')

  // Preferences fields
  const [isPublic, setIsPublic] = useState(true)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  const router = useRouter()
  const supabase = createClient()

  // Load initial settings data
  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      setFullName(user.user_metadata?.username || '')
      setDisplayName(user.user_metadata?.username || user.email || '')

      // Get profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (profile) {
        setUsernameSlug(profile.username || '')
        setBio(profile.bio || '')
        setWeeklyGoal(String(profile.weekly_goal_hours ?? '10.0'))
        setIsPublic(profile.is_public ?? true)
      } else {
        // Autofill username slug with first part of email safely
        const emailPrefix = user.email?.split('@')[0].replace(/[^a-zA-Z0-9-]/g, '').toLowerCase() || 'user'
        setUsernameSlug(emailPrefix)
      }

      // Get coding profiles
      const { data: codingProfile } = await supabase
        .from('coding_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (codingProfile) {
        setCfHandle(codingProfile.codeforces_handle || '')
        setLcUsername(codingProfile.leetcode_username || '')
      }

      // Check Github connection
      const { data: ghConn } = await supabase
        .from('github_connections')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      setGithubConnected(!!ghConn)

      // Theme toggle initialization
      const localTheme = localStorage.getItem('theme') as 'dark' | 'light' | null
      if (localTheme) {
        setTheme(localTheme)
      }

      setFetching(false)
    }
    loadData()
  }, [router, supabase])

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setMessage(null)
    setError(null)

    // Validate username slug
    const cleanSlug = usernameSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '')
    if (!cleanSlug) {
      setError('Username slug is required and can only contain lowercase letters, numbers, and hyphens.')
      setSubmitting(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Save profile
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        user_id: user.id,
        username: cleanSlug,
        bio: bio.trim() || null,
        weekly_goal_hours: parseFloat(weeklyGoal) || 10.0,
        is_public: isPublic,
      }, { onConflict: 'user_id' })

    if (profileError) {
      setError(profileError.code === '23505' ? 'Username is already taken by another developer.' : profileError.message)
      setSubmitting(false)
      return
    }

    // Save auth metadata username
    const { error: authError } = await supabase.auth.updateUser({
      data: { username: fullName.trim() }
    })

    if (authError) {
      setError(authError.message)
    } else {
      setMessage('Profile saved successfully!')
      setDisplayName(fullName.trim() || user.email || '')
      router.refresh()
    }
    setSubmitting(false)
  }

  const handleAccountsSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setMessage(null)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Save coding handles
    const { error: profileError } = await supabase
      .from('coding_profiles')
      .upsert({
        user_id: user.id,
        codeforces_handle: cfHandle.trim() || null,
        leetcode_username: lcUsername.trim() || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })

    if (profileError) {
      setError(profileError.message)
      setSubmitting(false)
      return
    }

    // Trigger sync API
    try {
      const res = await fetch('/api/coding/sync', { method: 'POST' })
      const data = await res.json()
      if (data.error) {
        setError(`Saved handles, but stats sync failed: ${data.error}`)
      } else {
        setMessage('Accounts saved and synced successfully!')
      }
    } catch {
      setError('Saved handles, but sync API is temporarily offline.')
    }
    setSubmitting(false)
  }

  const handlePreferencesSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setMessage(null)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Update profiles settings
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        user_id: user.id,
        username: usernameSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, ''),
        is_public: isPublic,
      }, { onConflict: 'user_id' })

    if (profileError) {
      setError(profileError.message)
      setSubmitting(false)
      return
    }

    // Apply and save Theme
    localStorage.setItem('theme', theme)
    if (theme === 'light') {
      document.documentElement.classList.add('light')
      document.documentElement.classList.remove('dark')
    } else {
      document.documentElement.classList.add('dark')
      document.documentElement.classList.remove('light')
    }

    setMessage('Preferences saved successfully!')
    setSubmitting(false)
  }

  const handleDeleteAllData = async () => {
    const confirmation1 = confirm(
      'WARNING: This will permanently delete all your projects, dev logs, CP profiles, and courses tracker logs. This action CANNOT be undone. Proceed?'
    )
    if (!confirmation1) return

    const confirmation2 = prompt(
      'Type "DELETE" in all capital letters to confirm account data deletion:'
    )
    if (confirmation2 !== 'DELETE') {
      alert('Verification code incorrect. Data purge aborted.')
      return
    }

    setSubmitting(true)
    setError(null)
    setMessage(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Session expired. Please log in again.')
        setSubmitting(false)
        return
      }

      // Purge everything user-scoped
      await supabase.from('courses').delete().eq('user_id', user.id)
      await supabase.from('dev_sessions').delete().eq('user_id', user.id)
      await supabase.from('projects').delete().eq('user_id', user.id)
      await supabase.from('coding_profiles').delete().eq('user_id', user.id)
      await supabase.from('coding_stats').delete().eq('user_id', user.id)
      await supabase.from('profiles').delete().eq('user_id', user.id)
      await supabase.from('github_connections').delete().eq('user_id', user.id)
      await supabase.from('github_stats').delete().eq('user_id', user.id)
      await supabase.from('weekly_summaries').delete().eq('user_id', user.id)

      setMessage('All account data purged successfully. Logging you out...')
      setTimeout(async () => {
        await supabase.auth.signOut()
        router.push('/login')
      }, 1500)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Purge failed. Please try again.')
      setSubmitting(false)
    }
  }

  const handleLogout = async () => {
    setSubmitting(true)
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (fetching) return <div className="flex min-h-screen bg-gray-950"></div>

  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <Sidebar userName={displayName} />

      <main className="flex-1 p-6 space-y-6 overflow-y-auto">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-gray-400">Configure your profile, accounts, theme preferences, and credentials.</p>
        </div>

        {/* Tab Selection */}
        <div className="flex gap-2 border-b border-gray-800/50 pb-4 overflow-x-auto">
          {(['profile', 'accounts', 'preferences', 'logout'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab)
                setMessage(null)
                setError(null)
              }}
              className={`relative px-4 py-2 text-sm font-medium transition-colors rounded-lg overflow-hidden group hover:text-white ${
                activeTab === tab ? 'text-white' : 'text-gray-400'
              }`}
            >
              {activeTab === tab && (
                <motion.div
                  layoutId="active-settings-tab"
                  className="absolute inset-0 bg-purple-900/40 border border-purple-800/30 rounded-lg"
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 25,
                  }}
                />
              )}
              <span className="relative z-10 capitalize">
                {tab === 'logout' ? 'Log Out' : tab}
              </span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="max-w-xl">
          <AnimatePresence mode="wait">
            {activeTab === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <form onSubmit={handleProfileSave} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4 shadow-xl">
                  <div className="flex items-center gap-2 text-purple-400 border-b border-gray-800 pb-2">
                    <User className="w-5 h-5" />
                    <h3 className="font-semibold text-white">Profile Details</h3>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-400">Display Name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Dhruv R."
                      className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 text-sm"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-400">Username Slug (Public URL)</label>
                    <div className="flex items-center bg-gray-950 border border-gray-800 rounded-lg overflow-hidden focus-within:border-purple-500">
                      <span className="bg-gray-900 text-gray-500 px-3 py-2 border-r border-gray-800 text-sm font-mono select-none">/u/</span>
                      <input
                        type="text"
                        value={usernameSlug}
                        onChange={(e) => setUsernameSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                        placeholder="username"
                        className="bg-transparent border-none w-full px-3 py-2 text-white focus:outline-none text-sm font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-400">Bio</label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell recruiters about yourself..."
                      className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 text-sm h-24 resize-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-400">Weekly Coding Goal (Hours)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="168"
                      value={weeklyGoal}
                      onChange={(e) => setWeeklyGoal(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 text-sm font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : 'Save Profile'}
                  </button>
                </form>
              </motion.div>
            )}

            {activeTab === 'accounts' && (
              <motion.div
                key="accounts"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <form onSubmit={handleAccountsSave} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4 shadow-xl">
                  <div className="flex items-center gap-2 text-purple-400 border-b border-gray-800 pb-2">
                    <Sparkles className="w-5 h-5" />
                    <h3 className="font-semibold text-white">Developer Integrations</h3>
                  </div>

                  {/* GitHub Connected State */}
                  <div className="flex items-center justify-between p-3 bg-gray-950/40 border border-gray-850 rounded-lg">
                    <div className="flex items-center gap-3">
                      <GitHubIcon className="w-6 h-6 text-white" />
                      <div>
                        <p className="text-sm font-medium">GitHub Account</p>
                        <p className="text-xs text-gray-500">
                          {githubConnected ? 'Linked and syncing weekly activity.' : 'Not connected yet.'}
                        </p>
                      </div>
                    </div>
                    {!githubConnected && (
                      <a
                        href="/api/auth/github"
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-md transition-colors"
                      >
                        Connect
                      </a>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-400">Codeforces Handle</label>
                    <input
                      type="text"
                      value={cfHandle}
                      onChange={(e) => setCfHandle(e.target.value)}
                      placeholder="e.g. tourist"
                      className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-400">LeetCode Username</label>
                    <input
                      type="text"
                      value={lcUsername}
                      onChange={(e) => setLcUsername(e.target.value)}
                      placeholder="e.g. neetcode"
                      className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 text-sm"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'Syncing...' : 'Save & Sync Handles'}
                  </button>
                </form>
              </motion.div>
            )}

            {activeTab === 'preferences' && (
              <motion.div
                key="preferences"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <form onSubmit={handlePreferencesSave} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4 shadow-xl">
                  <div className="flex items-center gap-2 text-purple-400 border-b border-gray-800 pb-2">
                    <Sun className="w-5 h-5" />
                    <h3 className="font-semibold text-white">App Preferences</h3>
                  </div>

                  {/* Public visibility toggle */}
                  <div className="flex items-center justify-between p-2">
                    <div>
                      <p className="text-sm font-semibold">Make Profile Public</p>
                      <p className="text-xs text-gray-500">Allow recruiters to view your profile without logging in.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsPublic(!isPublic)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isPublic ? 'bg-purple-600' : 'bg-gray-800'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          isPublic ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Dark Mode toggle */}
                  <div className="flex items-center justify-between p-2">
                    <div>
                      <p className="text-sm font-semibold">Appearance Theme</p>
                      <p className="text-xs text-gray-500">Choose between dark mode and light mode.</p>
                    </div>
                    <div className="flex bg-gray-950 border border-gray-800 p-0.5 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setTheme('dark')}
                        className={`p-1.5 rounded-md transition-colors ${theme === 'dark' ? 'bg-purple-900/50 text-purple-400' : 'text-gray-500'}`}
                      >
                        <Moon className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setTheme('light')}
                        className={`p-1.5 rounded-md transition-colors ${theme === 'light' ? 'bg-purple-900/50 text-purple-400' : 'text-gray-500'}`}
                      >
                        <Sun className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
                  >
                    Save Preferences
                  </button>
                </form>

                {/* Danger Zone for GDPR Compliance */}
                <div className="bg-red-950/20 border border-red-900/40 rounded-2xl p-6 mt-6 space-y-4">
                  <div className="flex items-center gap-2 text-red-400 border-b border-red-900/30 pb-2">
                    <ShieldAlert className="w-5 h-5 animate-pulse" />
                    <h3 className="font-semibold text-white">Danger Zone (GDPR Compliance)</h3>
                  </div>
                  <p className="text-xs text-gray-400">
                    Purge all data from DevBoard tables (projects, timed sessions, handles, AI summaries, and profile credentials) permanently.
                  </p>
                  <button
                    type="button"
                    onClick={handleDeleteAllData}
                    disabled={submitting}
                    className="w-full bg-red-900/40 hover:bg-red-800 border border-red-750 text-red-300 hover:text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    Delete All Data & Reset Account
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === 'logout' && (
              <motion.div
                key="logout"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4 shadow-xl">
                  <div className="flex items-center gap-2 text-red-400 border-b border-gray-800 pb-2">
                    <ShieldAlert className="w-5 h-5" />
                    <h3 className="font-semibold text-white">Log Out Account</h3>
                  </div>

                  <p className="text-sm text-gray-400">
                    Are you sure you want to end your current session? You will need to log back in to access your dashboard.
                  </p>

                  <button
                    onClick={handleLogout}
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 bg-red-950/40 hover:bg-red-900 border border-red-800 text-red-300 hover:text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Log Out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Status Message block */}
          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-400 text-sm mt-4 bg-red-950/30 border border-red-900/50 px-4 py-3 rounded-lg flex items-center gap-2"
            >
              <ShieldAlert className="w-4 h-4 shrink-0" /> {error}
            </motion.p>
          )}
          {message && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-green-400 text-sm mt-4 bg-green-950/30 border border-green-900/50 px-4 py-3 rounded-lg"
            >
              {message}
            </motion.p>
          )}
        </div>
      </main>
    </div>
  )
}
