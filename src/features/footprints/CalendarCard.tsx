import { useState } from 'react'
import { footprintsAssets, todayAssets } from '../../assets/uiAssets'
import { IconButton, SoftCard } from '../../components'
import { useI18n } from '../../i18n/I18nContext'
import type { TranslationKey } from '../../i18n/messages'

const weekdays: TranslationKey[] = [
  'footprints.calendar.weekday.sun', 'footprints.calendar.weekday.mon', 'footprints.calendar.weekday.tue',
  'footprints.calendar.weekday.wed', 'footprints.calendar.weekday.thu', 'footprints.calendar.weekday.fri', 'footprints.calendar.weekday.sat',
]

const calendarDays = [
  ...[26, 27, 28, 29, 30, 31].map((day) => ({ day, outside: true })),
  ...Array.from({ length: 31 }, (_, index) => ({ day: index + 1, outside: false })),
  ...[1, 2, 3, 4, 5].map((day) => ({ day, outside: true })),
]

const markers: Partial<Record<number, string>> = {
  3: todayAssets.moods.happy,
  8: todayAssets.moods.flutter,
  10: todayAssets.moods.miss,
  12: todayAssets.moods.rumination,
  16: footprintsAssets.clearRecordDrop,
  17: todayAssets.moods.flutter,
  18: footprintsAssets.clearRecordDrop,
  20: todayAssets.moods.peaceful,
  23: todayAssets.moods.miss,
}

const monthLabels: TranslationKey[] = [
  'footprints.calendar.month.july2026',
  'footprints.calendar.month.august2026',
  'footprints.calendar.month.september2026',
]

export function CalendarCard() {
  const { t } = useI18n()
  const [monthIndex, setMonthIndex] = useState(1)
  const [selectedDay, setSelectedDay] = useState(23)

  return (
    <SoftCard className="footprints-calendar">
      <div className="footprints-calendar__month">
        <IconButton ariaLabel={t('footprints.calendar.previousMonth')} onClick={() => setMonthIndex((value) => Math.max(0, value - 1))}><span aria-hidden="true">‹</span></IconButton>
        <div><img src={footprintsAssets.calendarIcon} alt="" aria-hidden="true" /><strong>{t(monthLabels[monthIndex])}</strong></div>
        <IconButton ariaLabel={t('footprints.calendar.nextMonth')} onClick={() => setMonthIndex((value) => Math.min(monthLabels.length - 1, value + 1))}><span aria-hidden="true">›</span></IconButton>
      </div>
      <div className="footprints-calendar__weekdays" aria-hidden="true">
        {weekdays.map((weekday) => <span key={weekday}>{t(weekday)}</span>)}
      </div>
      <div className="footprints-calendar__grid" role="grid" aria-label={t('footprints.calendar.label')}>
        {calendarDays.map((item, index) => {
          const marker = item.outside ? undefined : markers[item.day]
          const selected = !item.outside && selectedDay === item.day
          return (
            <button className={`calendar-day ${item.outside ? 'calendar-day--outside' : ''} ${selected ? 'calendar-day--selected' : ''}`} type="button" role="gridcell" aria-selected={selected} aria-label={t('footprints.calendar.dayLabel', { day: item.day })} disabled={item.outside} onClick={() => setSelectedDay(item.day)} key={`${index}-${item.day}`}>
              <span>{item.day}</span>
              {marker ? <img src={marker} alt="" aria-hidden="true" /> : null}
            </button>
          )
        })}
      </div>
    </SoftCard>
  )
}
