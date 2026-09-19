import type { Star } from '../../data/types'

export function selectCurrentMonthMoodStars(stars: Star[], currentLocalDate: string): Star[] {
  const month = currentLocalDate.slice(0, 7)
  return stars
    .filter((star) => star.type === 'mood' && star.localDate.slice(0, 7) === month)
    .slice()
    .sort((left, right) => left.localDate.localeCompare(right.localDate) || left.id.localeCompare(right.id))
}
