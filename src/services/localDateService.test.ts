import { describe, expect, it } from 'vitest'
import { toLocalDate } from './localDateService'

describe('toLocalDate', () => {
  it.each([
    ['2026-09-09T22:00:00.000Z', '2026-09-10'],
    ['2026-09-09T16:05:00.000Z', '2026-09-10'],
    ['2026-09-10T15:59:00.000Z', '2026-09-10'],
    ['2026-09-10T16:01:00.000Z', '2026-09-11'],
  ])('uses Asia/Taipei calendar date for %s', (timestamp, expected) => {
    expect(toLocalDate(new Date(timestamp), 'Asia/Taipei')).toBe(expected)
  })

  it('uses the requested device timezone rather than the UTC calendar date', () => {
    const instant = new Date('2026-09-29T16:01:00.000Z')

    expect(toLocalDate(instant, 'Asia/Taipei')).toBe('2026-09-30')
    expect(toLocalDate(instant, 'Asia/Tokyo')).toBe('2026-09-30')
    expect(toLocalDate(instant, 'America/Los_Angeles')).toBe('2026-09-29')
  })
})
