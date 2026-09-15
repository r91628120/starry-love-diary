import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { footprintsAssets, todayAssets } from '../../assets/uiAssets'
import { IconButton, SoftCard } from '../../components'
import { usePersistence } from '../../data/PersistenceStateContext'
import type { MoodKey } from '../../data/types'
import { useI18n } from '../../i18n/I18nContext'
import { toLocalDate } from '../../services/localDateService'

const moodIcons: Record<MoodKey, string> = {
  flutter: todayAssets.moods.flutter,
  happy: todayAssets.moods.happy,
  peaceful: todayAssets.moods.peaceful,
  miss: todayAssets.moods.miss,
  uneasy: todayAssets.moods.uneasy,
  sad: todayAssets.moods.sad,
  rumination: todayAssets.moods.rumination,
}

function monthFromLocalDate(localDate: string) {
  const [year, month] = localDate.split('-').map(Number)
  return { year, month: month - 1 }
}

export function CalendarCard() {
  const { locale, t } = useI18n()
  const persistence = usePersistence()
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedDate = searchParams.get('date') ?? persistence?.currentLocalDate ?? toLocalDate()
  const [visibleMonth, setVisibleMonth] = useState(() => monthFromLocalDate(requestedDate))
  const [selectedDate, setSelectedDate] = useState(requestedDate)
  const [markers, setMarkers] = useState<Partial<Record<string, string>>>({})
  const calendarDays = buildCalendarDays(visibleMonth.year, visibleMonth.month)
  const monthFormatter = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' })
  const weekdayFormatter = new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' })
  const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone: 'UTC' })
  const numberFormatter = new Intl.NumberFormat(locale)
  const monthLabel = monthFormatter.format(new Date(Date.UTC(visibleMonth.year, visibleMonth.month, 1)))

  useEffect(() => {
    setSelectedDate(requestedDate)
    setVisibleMonth(monthFromLocalDate(requestedDate))
  }, [requestedDate])

  useEffect(() => {
    let active = true
    if (!persistence) {
      setMarkers({})
      return () => { active = false }
    }
    void Promise.all([
      persistence.repositories.diaries.getDiaries(),
      persistence.repositories.moods.getMoods(),
      persistence.repositories.clearRecords.list(),
      persistence.repositories.loveBoatAssessments.list(),
      persistence.repositories.loveBrainAssessments.list(),
      persistence.repositories.likeOrHabitReflections.list(),
    ]).then(([diaries, moods, clearRecords, boats, brains, reflections]) => {
      if (!active) return
      const next: Partial<Record<string, string>> = {}
      for (const record of [...clearRecords, ...boats, ...brains, ...reflections]) next[record.localDate] = footprintsAssets.clearRecordDrop
      for (const record of diaries) next[record.localDate] = footprintsAssets.diaryNotebook
      for (const record of moods) next[record.localDate] = moodIcons[record.mood]
      setMarkers(next)
    })
    return () => { active = false }
  }, [persistence, persistence?.diaryCount, persistence?.todayDiary?.updatedAt, persistence?.todayMood?.updatedAt])

  const shiftMonth = (amount: number) => {
    const date = new Date(Date.UTC(visibleMonth.year, visibleMonth.month + amount, 1))
    setVisibleMonth({ year: date.getUTCFullYear(), month: date.getUTCMonth() })
  }

  const selectDate = (localDate: string) => {
    setSelectedDate(localDate)
    const next = new URLSearchParams(searchParams)
    next.set('date', localDate)
    next.delete('entry')
    next.delete('recordId')
    setSearchParams(next, { replace: true })
  }

  return (
    <SoftCard className="footprints-calendar">
      <div className="footprints-calendar__month">
        <IconButton ariaLabel={t('footprints.calendar.previousMonth')} onClick={() => shiftMonth(-1)}><span aria-hidden="true">‹</span></IconButton>
        <div><img src={footprintsAssets.calendarIcon} alt="" aria-hidden="true" /><strong>{monthLabel}</strong></div>
        <IconButton ariaLabel={t('footprints.calendar.nextMonth')} onClick={() => shiftMonth(1)}><span aria-hidden="true">›</span></IconButton>
      </div>
      <div className="footprints-calendar__weekdays" aria-hidden="true">
        {Array.from({ length: 7 }, (_, index) => <span key={index}>{weekdayFormatter.format(new Date(Date.UTC(2021, 7, index + 1)))}</span>)}
      </div>
      <div className="footprints-calendar__grid" role="grid" aria-label={t('footprints.calendar.label', { month: monthLabel })}>
        {calendarDays.map((item, index) => {
          const marker = item.outside ? undefined : markers[item.localDate]
          const selected = !item.outside && selectedDate === item.localDate
          return (
            <button className={`calendar-day ${item.outside ? 'calendar-day--outside' : ''} ${selected ? 'calendar-day--selected' : ''}`} type="button" role="gridcell" aria-selected={selected} aria-label={t('footprints.calendar.dayLabel', { date: dateFormatter.format(item.date) })} disabled={item.outside} onClick={() => selectDate(item.localDate)} key={`${index}-${item.localDate}`}>
              <span>{numberFormatter.format(item.day)}</span>
              {marker ? <img src={marker} alt="" aria-hidden="true" /> : null}
            </button>
          )
        })}
      </div>
    </SoftCard>
  )
}

function buildCalendarDays(year: number, month: number) {
  const firstDay = new Date(Date.UTC(year, month, 1))
  const gridStart = new Date(firstDay)
  gridStart.setUTCDate(firstDay.getUTCDate() - firstDay.getUTCDay())

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart)
    date.setUTCDate(gridStart.getUTCDate() + index)
    return {
      date,
      day: date.getUTCDate(),
      localDate: date.toISOString().slice(0, 10),
      outside: date.getUTCMonth() !== month,
    }
  })
}
