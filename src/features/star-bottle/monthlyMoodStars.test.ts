import { describe, expect, it } from 'vitest'
import type { Star } from '../../data/types'
import { selectCurrentMonthMoodStars } from './monthlyMoodStars'

function star(id: string, localDate: string, type: Star['type'] = 'mood'): Star {
  return { id, type, content: id, localDate, timezone: 'Asia/Taipei', createdAt: `${localDate}T00:00:00.000Z`, updatedAt: `${localDate}T00:00:00.000Z` }
}

describe('monthly mood hero selector', () => {
  it.each([
    ['2026-02-28', 28], ['2028-02-29', 29], ['2026-04-30', 30], ['2026-01-31', 31],
  ])('supports natural month length %s', (date, count) => {
    const yearMonth = date.slice(0, 7)
    const stars = Array.from({ length: count }, (_, index) => star(`m-${index}`, `${yearMonth}-${String(index + 1).padStart(2, '0')}`))
    expect(selectCurrentMonthMoodStars(stars, date)).toHaveLength(count)
  })

  it('filters prior, future, and clarity stars and orders without mutating input', () => {
    const input = [star('later', '2026-09-20'), star('clear', '2026-09-02', 'clear_mind'), star('prior', '2026-08-31'), star('current', '2026-09-01')]
    expect(selectCurrentMonthMoodStars(input, '2026-09-15').map((item) => item.id)).toEqual(['current', 'later'])
    expect(input.map((item) => item.id)).toEqual(['later', 'clear', 'prior', 'current'])
  })
})
