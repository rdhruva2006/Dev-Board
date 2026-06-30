export interface CodeforcesUser {
  handle: string
  rank: string
  rating: number
  maxRank: string
  maxRating: number
  avatar: string
  titlePhoto: string
  contribution: number
  friendOfCount: number
  lastOnlineTimeSeconds: number
  registrationTimeSeconds: number
}

export interface CodeforcesSubmission {
  id: number
  contestId?: number
  creationTimeSeconds: number
  problem: {
    contestId?: number
    index: string
    name: string
    rating?: number
    tags: string[]
  }
  verdict: string
  programmingLanguage: string
}

export interface CodeforcesContest {
  contestId: number
  contestName: string
  handle: string
  rank: number
  ratingUpdateTimeSeconds: number
  oldRating: number
  newRating: number
}

export interface CodeforcesStats {
  handle: string
  rating: number
  maxRating: number
  rank: string
  maxRank: string
  avatar: string
  problemsSolved: number
  contestCount: number
  ratingHistory: { rating: number; date: string }[]
}

export interface LeetCodeDifficultyStat {
  difficulty: string
  count: number
}

export interface LeetCodeStats {
  username: string
  totalSolved: number
  easySolved: number
  mediumSolved: number
  hardSolved: number
  streak: number
  totalActiveDays: number
  contestRating: number | null
  contestAttended: number | null
  topPercentage: number | null
  avatar: string | null
}

export interface CodingProfile {
  user_id: string
  codeforces_handle: string | null
  leetcode_username: string | null
  updated_at: string
}

export interface CodingStats {
  user_id: string
  cf_rating: number | null
  cf_max_rating: number | null
  cf_rank: string | null
  cf_max_rank: string | null
  cf_problems_solved: number | null
  cf_contest_count: number | null
  cf_avatar: string | null
  cf_rating_history: { rating: number; date: string }[] | null
  lc_total_solved: number | null
  lc_easy_solved: number | null
  lc_medium_solved: number | null
  lc_hard_solved: number | null
  lc_streak: number | null
  lc_total_active_days: number | null
  lc_contest_rating: number | null
  lc_contest_attended: number | null
  lc_top_percentage: number | null
  lc_avatar: string | null
  last_synced_at: string
}
