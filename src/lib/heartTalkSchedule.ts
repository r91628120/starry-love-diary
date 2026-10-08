import { getDeviceTimezone, toLocalDate } from '../services/localDateService'

export type HeartTalkScheduleValidation =
  | { status: 'valid'; scheduledStartAt: string; scheduledEndAt: string; scheduledTimeZone: string }
  | { status: 'past-date' | 'start-passed' | 'end-not-after-start' | 'invalid' }

const localDate = /^\d{4}-\d{2}-\d{2}$/u
const time = /^(?:[01]\d|2[0-3]):[0-5]\d$/u

function localInstant(date: string, value: string) {
  const instant = new Date(`${date}T${value}:00`)
  return Number.isNaN(instant.valueOf()) ? undefined : instant
}

/** Converts the device-local appointment fields to explicit instants before a callable is made. */
export function validateHeartTalkSchedule(scheduledLocalDate: string, startTime: string, endTime: string, now = new Date()): HeartTalkScheduleValidation {
  if (!localDate.test(scheduledLocalDate) || !time.test(startTime) || !time.test(endTime)) return { status: 'invalid' }
  if (scheduledLocalDate < toLocalDate(now)) return { status: 'past-date' }
  const start = localInstant(scheduledLocalDate, startTime)
  const end = localInstant(scheduledLocalDate, endTime)
  if (!start || !end) return { status: 'invalid' }
  if (end.valueOf() <= start.valueOf()) return { status: 'end-not-after-start' }
  if (start.valueOf() <= now.valueOf()) return { status: 'start-passed' }
  return { status: 'valid', scheduledStartAt: start.toISOString(), scheduledEndAt: end.toISOString(), scheduledTimeZone: getDeviceTimezone() }
}
