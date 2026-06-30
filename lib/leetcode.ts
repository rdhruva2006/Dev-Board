import type { LeetCodeStats } from '@/types/coding'

const LC_GRAPHQL = 'https://leetcode.com/graphql'

const LC_HEADERS = {
  'Content-Type': 'application/json',
  'User-Agent': 'Mozilla/5.0 (compatible; devboard/1.0)',
  'Referer': 'https://leetcode.com',
}

async function lcQuery<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const res = await fetch(LC_GRAPHQL, {
    method: 'POST',
    headers: LC_HEADERS,
    body: JSON.stringify({ query, variables }),
    next: { revalidate: 0 },
  })

  if (!res.ok) {
    throw new Error(`LeetCode API error: ${res.status}`)
  }

  const json = await res.json() as { data: T; errors?: { message: string }[] }

  if (json.errors?.length) {
    throw new Error(`LeetCode GraphQL error: ${json.errors[0]?.message}`)
  }

  return json.data
}

const PROBLEMS_QUERY = `
  query userProblemsSolved($username: String!) {
    matchedUser(username: $username) {
      profile {
        userAvatar
      }
      submitStatsGlobal {
        acSubmissionNum {
          difficulty
          count
        }
      }
    }
  }
`

const CALENDAR_QUERY = `
  query userCalendar($username: String!, $year: Int) {
    matchedUser(username: $username) {
      userCalendar(year: $year) {
        streak
        totalActiveDays
      }
    }
  }
`

const CONTEST_QUERY = `
  query userContest($username: String!) {
    userContestRanking(username: $username) {
      attendedContestsCount
      rating
      topPercentage
    }
  }
`

interface LCProblemsData {
  matchedUser: {
    profile: { userAvatar: string }
    submitStatsGlobal: {
      acSubmissionNum: { difficulty: string; count: number }[]
    }
  } | null
}

interface LCCalendarData {
  matchedUser: {
    userCalendar: {
      streak: number
      totalActiveDays: number
    }
  } | null
}

interface LCContestData {
  userContestRanking: {
    attendedContestsCount: number
    rating: number
    topPercentage: number
  } | null
}

export async function fetchLeetCodeStats(username: string): Promise<LeetCodeStats> {
  const currentYear = new Date().getFullYear()

  const [problemsData, calendarData, contestData] = await Promise.all([
    lcQuery<LCProblemsData>(PROBLEMS_QUERY, { username }),
    lcQuery<LCCalendarData>(CALENDAR_QUERY, { username, year: currentYear }),
    lcQuery<LCContestData>(CONTEST_QUERY, { username }).catch(() => ({ userContestRanking: null })),
  ])

  if (!problemsData.matchedUser) {
    throw new Error(`LeetCode user '${username}' not found`)
  }

  const acStats = problemsData.matchedUser.submitStatsGlobal.acSubmissionNum
  const getCount = (difficulty: string) =>
    acStats.find((s) => s.difficulty === difficulty)?.count ?? 0

  return {
    username,
    totalSolved: getCount('All'),
    easySolved: getCount('Easy'),
    mediumSolved: getCount('Medium'),
    hardSolved: getCount('Hard'),
    streak: calendarData.matchedUser?.userCalendar.streak ?? 0,
    totalActiveDays: calendarData.matchedUser?.userCalendar.totalActiveDays ?? 0,
    contestRating: contestData.userContestRanking?.rating ?? null,
    contestAttended: contestData.userContestRanking?.attendedContestsCount ?? null,
    topPercentage: contestData.userContestRanking?.topPercentage ?? null,
    avatar: problemsData.matchedUser.profile.userAvatar ?? null,
  }
}
