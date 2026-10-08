import { describe, expect, it } from 'vitest'
import { validateHeartTalkSchedule } from './heartTalkSchedule'

describe('Heart Talk schedule validation', () => {
  const now = new Date('2026-10-09T12:00:00.000Z')

  it('rejects yesterday, a passed start time, and an end time that is not after the start', () => {
    expect(validateHeartTalkSchedule('2026-10-08', '20:00', '20:30', now)).toEqual({ status: 'past-date' })
    expect(validateHeartTalkSchedule('2026-10-09', '11:00', '11:30', now)).toEqual({ status: 'start-passed' })
    expect(validateHeartTalkSchedule('2026-10-10', '20:00', '20:00', now)).toEqual({ status: 'end-not-after-start' })
  })

  it('converts a valid local date and time to explicit instants', () => {
    const result = validateHeartTalkSchedule('2026-10-10', '20:00', '20:30', now)
    expect(result).toMatchObject({ status: 'valid', scheduledStartAt: expect.stringMatching(/Z$/u), scheduledEndAt: expect.stringMatching(/Z$/u), scheduledTimeZone: expect.any(String) })
  })
})
