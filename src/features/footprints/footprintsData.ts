import type { DiaryEntry, MoodKey, MoodRecord, ScoreAward } from '../../data/types'

export interface MonthlyFootprintStats {
  diaryCount: number
  moodDayCount: number
  topMood?: MoodKey
  monthlyScore: number
}

export interface RecentFootprintEntry {
  id: string
  recordId: string
  type: 'diary' | 'mood' | 'clear'
  sourceType?: 'clear_record' | 'love_boat_code' | 'love_brain_assessment' | 'like_or_habit'
  localDate: string
  occurredAt: string
  summary: string
  mood?: MoodKey
}

export const RECENT_DIARY_SUMMARY_LIMIT = 20

export function normalizeRecentDiarySummary(content: string) {
  return content.replace(/\s+/gu, ' ').trim()
}

export function getRecentDiarySummary(content: string) {
  const normalized = normalizeRecentDiarySummary(content)
  const characters = Array.from(normalized)
  return {
    normalized,
    isLong: characters.length > RECENT_DIARY_SUMMARY_LIMIT,
    collapsed: `${characters.slice(0, RECENT_DIARY_SUMMARY_LIMIT).join('')}…`,
  }
}

export function deriveMonthlyFootprintStats(localDate: string, diaries: DiaryEntry[], moods: MoodRecord[], awards: ScoreAward[]): MonthlyFootprintStats {
  const month = localDate.slice(0, 7)
  const inMonth = (value: { localDate: string }) => value.localDate.slice(0, 7) === month
  const monthlyMoods = moods.filter(inMonth)
  const moodDays = new Set(monthlyMoods.map((record) => record.localDate))
  const counts = new Map<MoodKey, number>()
  const latest = new Map<MoodKey, string>()

  for (const record of monthlyMoods) {
    counts.set(record.mood, (counts.get(record.mood) ?? 0) + 1)
    const occurrence = record.localDate + '|' + record.updatedAt
    if (occurrence > (latest.get(record.mood) ?? '')) latest.set(record.mood, occurrence)
  }

  const topMood = [...counts.keys()].sort((left, right) => {
    const countDifference = (counts.get(right) ?? 0) - (counts.get(left) ?? 0)
    return countDifference || (latest.get(right) ?? '').localeCompare(latest.get(left) ?? '')
  })[0]

  return {
    diaryCount: diaries.filter(inMonth).length,
    moodDayCount: moodDays.size,
    topMood,
    monthlyScore: awards.filter(inMonth).reduce((total, award) => total + award.points, 0),
  }
}

export function sortRecentFootprints(entries: RecentFootprintEntry[]) {
  return [...entries].sort((left, right) => right.localDate.localeCompare(left.localDate) || right.occurredAt.localeCompare(left.occurredAt) || right.id.localeCompare(left.id))
}
