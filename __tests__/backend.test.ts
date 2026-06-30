import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { fetchContributionGrid } from '@/lib/github'
import { generateWeeklySummary } from '@/lib/summary'
import { encrypt, decrypt } from '@/lib/crypto'
import { POST } from '@/app/api/sessions/route'

// Set mock encryption key for testing environment
process.env.ENCRYPTION_KEY = '9e1d88b48f9342898c603a11bf7cf49a2bf88e14d3f5b721865c3b1a89d4f2ea'

// Mock Supabase Server Client
vi.mock('@/lib/supabase/server', () => {
  return {
    createClient: () => ({
      auth: {
        getUser: () => Promise.resolve({ data: { user: { id: 'test-user-id' } } }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              single: () => Promise.resolve({
                data: { started_at: new Date(Date.now() - 5000).toISOString() }, // 5 seconds ago -> 0 minutes duration
              })
            })
          })
        })
      })
    })
  }
})

describe('1. Crypto Roundtrip Encryption Test', () => {
  it('should successfully encrypt and decrypt a sensitive token', () => {
    const secretToken = 'gho_githubSecretAccessToken1234567890'
    const encrypted = encrypt(secretToken)
    expect(encrypted).toContain(':') // Should have IV separator
    
    const decrypted = decrypt(encrypted)
    expect(decrypted).toBe(secretToken)
  })
})

describe('2. AI Summary Generator Shapes Test', () => {
  it('should generate proper weekly summary shapes and contain activity details', () => {
    const mockInput = {
      displayName: 'Dhruv R.',
      weeklyGoal: 15.0,
      totalSessions: 8,
      totalHours: 18.5,
      githubCommits: 45,
      githubStreak: 6,
      coursesSummary: '- TypeScript Mastery: 80% completed\n- Next.js Advanced: 45% completed',
      projectsSummary: '- DevBoard: 12.0 hours\n- Blog Template: 6.5 hours',
    }

    const result = generateWeeklySummary(mockInput)
    
    expect(result).toHaveProperty('prompt')
    expect(result).toHaveProperty('fallbackText')
    
    // Check prompt contents
    expect(result.prompt).toContain('Dhruv R.')
    expect(result.prompt).toContain('18.5 hours')
    expect(result.prompt).toContain('15 hours (MET GOAL!)')
    
    // Check fallback text contents
    expect(result.fallbackText).toContain('18.5 hours')
    expect(result.fallbackText).toContain('45 contributions')
    expect(result.fallbackText).toContain('TypeScript Mastery')
  })
})

describe('3. GitHub Event Grid Level Mapping Test', () => {
  const originalFetch = global.fetch

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('should maps git commits to levels 0-4 correctly', async () => {
    const mockEvents = [
      {
        type: 'PushEvent',
        created_at: new Date().toISOString(),
        payload: { size: 12 } // Level 4 (>10 commits)
      },
      {
        type: 'PushEvent',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        payload: { size: 4 } // Level 2 (<=5 commits)
      },
      {
        type: 'WatchEvent', // Non-push event, ignored
        created_at: new Date().toISOString(),
        payload: {}
      }
    ]

    global.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockEvents),
        headers: { get: () => null }
      } as any)
    )

    const grid = await fetchContributionGrid('test-user', 'mock-token')
    
    expect(grid).toHaveLength(35)
    // Last element (today) should be level 4 (12 commits)
    expect(grid[34]).toBe(4)
    // Second to last element (yesterday) should be level 2 (4 commits)
    expect(grid[33]).toBe(2)
    // Rest should be 0 (no activity)
    expect(grid[0]).toBe(0)
  })
})

describe('4. Session API Duration Validation Test', () => {
  it('should return 400 Bad Request if session is ended with 0 duration minutes', async () => {
    const mockReq = new NextRequest('http://localhost:3000/api/sessions', {
      method: 'POST',
      body: JSON.stringify({
        action: 'end',
        session_id: 'mock-session-uuid',
        notes: 'Brief session'
      })
    })

    const response = await POST(mockReq)
    expect(response.status).toBe(400)
    
    const body = await response.json()
    expect(body.error).toBe('Session duration must be greater than 0 minutes')
  })
})
