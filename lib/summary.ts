export interface WeeklySummaryInput {
  displayName: string
  weeklyGoal: number
  totalSessions: number
  totalHours: number
  githubCommits: number
  githubStreak: number
  coursesSummary: string
  projectsSummary: string
}

export interface WeeklySummaryOutput {
  prompt: string
  fallbackText: string
}

export function generateWeeklySummary(input: WeeklySummaryInput): WeeklySummaryOutput {
  const metGoal = input.totalHours >= input.weeklyGoal
  
  const prompt = `You are a personal developer productivity coach for ${input.displayName}.
Below is their coding activity from the last 7 days:
- Dev sessions logged: ${input.totalSessions} sessions
- Dev hours logged: ${input.totalHours} hours
- Weekly target goal: ${input.weeklyGoal} hours (${metGoal ? 'MET GOAL!' : 'Did not meet goal'})
- GitHub contributions this week: ${input.githubCommits} commits
- GitHub activity streak: ${input.githubStreak} days
- Courses progress:
${input.coursesSummary || 'No course tracking logs found.'}

- Project time allocation:
${input.projectsSummary || 'No active projects timed.'}

Please generate a concise, highly motivating weekly progress report (around 150-200 words). Include:
1. A motivational summary highlighting their key achievements.
2. A direct comment comparing their actual logged dev hours (${input.totalHours} hrs) to their target weekly goal (${input.weeklyGoal} hrs).
3. Exactly 3 highly specific, actionable suggestions for improvement (such as course progression, git commit habits, or time management).

Format the output cleanly in markdown. Use bullet points for the suggestions. Maintain a professional, encouraging, and developer-centric tone.`

  const fallbackText = `### 🌟 Weekly Progress Report (Simulated AI)

Hey **${input.displayName}**, excellent effort on the keyboard this week! Here is a summary of your activity from the past 7 days:

- **Weekly Goal**: You logged **${input.totalHours} hours** out of your **${input.weeklyGoal} hours** target. ${
    metGoal
      ? '🎉 Congratulations on hitting and crushing your target goal!'
      : 'Keep pushing! You are closer than you think. Block out just 30 mins more per day next week.'
  }
- **Git Activity**: You completed **${input.githubCommits} contributions** on GitHub. Your current streak is **${input.githubStreak} days**.
- **Course Tracker**:
${input.coursesSummary || 'Your progress is recorded across your active courses.'}

#### 💡 Actionable Coach Suggestions:
1. **Time Consistency**: Your project logs show concentration around a few days. Try spreading dev hours more evenly (e.g. 1-2 hours daily) to build sustainable habits.
2. **Commit Frequency**: Link your Git commits directly with your active dev session notes to showcase true work traceability for recruiters.
3. **Course Acceleration**: Dedicate at least one session next week entirely to completing the next 10% milestone in your highest-progress course.

*(Note: Add a free \`GEMINI_API_KEY\` to your \`.env.local\` file to connect to live AI generation).*`

  return { prompt, fallbackText }
}
