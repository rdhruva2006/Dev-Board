import { describe, it, expect } from 'vitest'
import type { CodeforcesSubmission, CodeforcesContest } from '@/types/coding'

// Helper function that matches the logic in fetchCodeforcesStats
function calculateSolvedProblems(submissions: CodeforcesSubmission[]): number {
  const solvedSet = new Set<string>()
  for (const sub of submissions) {
    if (sub.verdict === 'OK') {
      const key = `${sub.contestId ?? 'practice'}_${sub.problem.index}_${sub.problem.name}`
      solvedSet.add(key)
    }
  }
  return solvedSet.size
}

// Helper function that matches ratingHistory mapping
function getRatingHistory(contests: CodeforcesContest[]): { rating: number; date: string }[] {
  return contests.slice(-10).map((c) => ({
    rating: c.newRating,
    date: new Date(c.ratingUpdateTimeSeconds * 1000).toISOString(),
  }))
}

describe('Codeforces Statistics Calculator', () => {
  it('should count only unique submissions with verdict OK', () => {
    const submissions: CodeforcesSubmission[] = [
      {
        id: 1,
        creationTimeSeconds: 1000,
        verdict: 'OK',
        programmingLanguage: 'C++',
        problem: { contestId: 100, index: 'A', name: 'Watermelon', tags: ['math'] },
      },
      // Duplicate submission
      {
        id: 2,
        creationTimeSeconds: 2000,
        verdict: 'OK',
        programmingLanguage: 'C++',
        problem: { contestId: 100, index: 'A', name: 'Watermelon', tags: ['math'] },
      },
      // Wrong answer submission
      {
        id: 3,
        creationTimeSeconds: 3000,
        verdict: 'WRONG_ANSWER',
        programmingLanguage: 'C++',
        problem: { contestId: 100, index: 'B', name: 'Before an Exam', tags: ['greedy'] },
      },
      // New OK submission
      {
        id: 4,
        creationTimeSeconds: 4000,
        verdict: 'OK',
        programmingLanguage: 'Python',
        problem: { contestId: 100, index: 'B', name: 'Before an Exam', tags: ['greedy'] },
      },
    ]

    const solvedCount = calculateSolvedProblems(submissions)
    expect(solvedCount).toBe(2) // Watermelon and Before an Exam
  })

  it('should handle practice submissions (missing contestId) correctly', () => {
    const submissions: CodeforcesSubmission[] = [
      {
        id: 5,
        creationTimeSeconds: 5000,
        verdict: 'OK',
        programmingLanguage: 'Java',
        problem: { index: 'C', name: 'Registration System', tags: ['hashing'] },
      },
    ]

    const solvedCount = calculateSolvedProblems(submissions)
    expect(solvedCount).toBe(1)
  })

  it('should correctly format and return the last 10 contest ratings', () => {
    const contests: CodeforcesContest[] = Array.from({ length: 15 }, (_, i) => ({
      contestId: i + 1,
      contestName: `Contest ${i + 1}`,
      handle: 'tourist',
      rank: 10 - i,
      ratingUpdateTimeSeconds: 1700000000 + i * 86400,
      oldRating: 1500 + i * 50,
      newRating: 1500 + (i + 1) * 50,
    }))

    const ratingHistory = getRatingHistory(contests)
    
    expect(ratingHistory.length).toBe(10)
    expect(ratingHistory[0]?.rating).toBe(1800) // index 5 of array
    expect(ratingHistory[9]?.rating).toBe(2250) // index 14 of array (newest)
    expect(ratingHistory[9]?.date).toBe(new Date((1700000000 + 14 * 86400) * 1000).toISOString())
  })
})
