import type { Star } from '../../data/types'
import type { TimeRange } from './TimeRangeFilter'

export function filterStarsByRange(stars: Star[], range: TimeRange, localDate: string) {
  if (range === 'all') return stars
  const prefix = range === 'today' ? localDate : range === 'month' ? localDate.slice(0, 7) : localDate.slice(0, 4)
  return stars.filter((star) => range === 'today' ? star.localDate === prefix : star.localDate.startsWith(prefix))
}
