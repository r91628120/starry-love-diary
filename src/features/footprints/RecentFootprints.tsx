import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { footprintsAssets, todayAssets } from '../../assets/uiAssets'
import { SecondaryButton, SectionHeader } from '../../components'
import { usePersistence } from '../../data/PersistenceStateContext'
import type { MoodKey } from '../../data/types'
import { useI18n } from '../../i18n/I18nContext'
import type { TranslationKey } from '../../i18n/messages'
import { getRecentDiarySummary, sortRecentFootprints, type RecentFootprintEntry } from './footprintsData'

const moodIcons: Record<MoodKey, string> = {
  flutter: todayAssets.moods.flutter,
  happy: todayAssets.moods.happy,
  peaceful: todayAssets.moods.peaceful,
  miss: todayAssets.moods.miss,
  uneasy: todayAssets.moods.uneasy,
  sad: todayAssets.moods.sad,
  rumination: todayAssets.moods.rumination,
}

export function RecentFootprints({ search }: { search: string }) {
  const { locale, t } = useI18n()
  const persistence = usePersistence()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [entries, setEntries] = useState<RecentFootprintEntry[]>([])
  const [showAll, setShowAll] = useState(false)
  const [expandedDiaryIds, setExpandedDiaryIds] = useState<Set<string>>(() => new Set())
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(() => new Set())
  const [touchedMonths, setTouchedMonths] = useState<Set<string>>(() => new Set())
  const [expandedYears, setExpandedYears] = useState<Set<string>>(() => new Set())
  const [touchedYears, setTouchedYears] = useState<Set<string>>(() => new Set())
  const dateFormatter = new Intl.DateTimeFormat(locale, { month: '2-digit', day: '2-digit', timeZone: 'UTC' })
  const weekdayFormatter = new Intl.DateTimeFormat(locale, { weekday: 'long', timeZone: 'UTC' })

  useEffect(() => {
    let active = true
    if (!persistence) {
      setEntries([])
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
      setEntries(sortRecentFootprints([
        ...diaries.map((record) => ({ id: `diary:${record.id}`, recordId: record.id, type: 'diary' as const, localDate: record.localDate, occurredAt: record.updatedAt, summary: record.title?.trim() || record.content })),
        ...moods.map((record) => ({ id: `mood:${record.id}`, recordId: record.id, type: 'mood' as const, localDate: record.localDate, occurredAt: record.updatedAt, summary: t(`today.mood.${record.mood}` as TranslationKey), mood: record.mood })),
        ...clearRecords.map((record) => ({ id: `clear_record:${record.id}`, recordId: record.id, type: 'clear' as const, sourceType: 'clear_record' as const, localDate: record.localDate, occurredAt: record.completedAt, summary: record.triggerText || record.facts || t('clear.history.clearRecord') })),
        ...boats.filter((record) => record.status === 'completed').map((record) => ({ id: `love_boat_code:${record.id}`, recordId: record.id, type: 'clear' as const, sourceType: 'love_boat_code' as const, localDate: record.localDate, occurredAt: record.completedAt ?? record.updatedAt, summary: t('clear.history.loveBoat') })),
        ...brains.filter((record) => record.status === 'completed').map((record) => ({ id: `love_brain_assessment:${record.id}`, recordId: record.id, type: 'clear' as const, sourceType: 'love_brain_assessment' as const, localDate: record.localDate, occurredAt: record.completedAt ?? record.updatedAt, summary: t('clear.history.loveBrain') })),
        ...reflections.filter((record) => record.status === 'completed').map((record) => ({ id: `like_or_habit:${record.id}`, recordId: record.id, type: 'clear' as const, sourceType: 'like_or_habit' as const, localDate: record.localDate, occurredAt: record.completedAt ?? record.updatedAt, summary: t('clear.history.likeOrHabit') })),
      ]))
    })
    return () => { active = false }
  }, [persistence, persistence?.diaryCount, persistence?.todayDiary?.updatedAt, persistence?.todayMood?.updatedAt, t])

  const query = search.trim().toLocaleLowerCase(locale)
  const visibleEntries = entries.filter((entry) => {
    const typeLabel = t(`footprints.type.${entry.type}` as TranslationKey)
    return `${entry.localDate} ${typeLabel} ${entry.summary}`.toLocaleLowerCase(locale).includes(query)
  })
  const displayedEntries = showAll ? visibleEntries : visibleEntries.slice(0, 3)
  const groups = groupFootprintsByYearMonth(visibleEntries)
  const searchActive = query.length > 0
  const selectedRecordId = searchParams.get('recordId')
  const selectedEntry = entries.find((entry) => entry.recordId === selectedRecordId)

  const openEntry = (entry: RecentFootprintEntry) => {
    if (entry.type === 'clear' && entry.sourceType) {
      navigate(`/clear?sourceType=${entry.sourceType}&recordId=${encodeURIComponent(entry.recordId)}`)
      return
    }
    navigate(`/footprints?date=${entry.localDate}&entry=${entry.type}&recordId=${encodeURIComponent(entry.recordId)}`)
  }

  return (
    <section className="recent-footprints">
      <SectionHeader title={t('footprints.recentFootprints')} icon={<img src={footprintsAssets.mainIcon} alt="" aria-hidden="true" />} />
      {selectedEntry ? <article className="recent-footprints__detail" aria-label={t('footprints.recent.detail')}>
        <time dateTime={selectedEntry.localDate}>{dateFormatter.format(new Date(`${selectedEntry.localDate}T00:00:00Z`))}</time>
        <strong>{t(`footprints.type.${selectedEntry.type}` as TranslationKey)}</strong>
        <p>{selectedEntry.summary}</p>
      </article> : null}
      <div className="recent-footprints__list">
        {!showAll ? <FootprintRows entries={displayedEntries} dateFormatter={dateFormatter} weekdayFormatter={weekdayFormatter} expandedDiaryIds={expandedDiaryIds} setExpandedDiaryIds={setExpandedDiaryIds} openEntry={openEntry} t={t} /> : null}
        {showAll ? <div className="recent-footprints__year-groups">{groups.map((yearGroup, yearIndex) => {
          const yearExpanded = searchActive || (touchedYears.has(yearGroup.year) ? expandedYears.has(yearGroup.year) : yearIndex === 0)
          const yearId = `footprint-year-${yearGroup.year}`
          return <section className="recent-footprints__year-group" key={yearGroup.year}>
            <button type="button" className="recent-footprints__year-toggle" aria-expanded={yearExpanded} aria-controls={yearId} aria-label={t(yearExpanded ? 'footprints.recent.group.collapse' : 'footprints.recent.group.expand', { label: yearGroup.year })} onClick={() => {
              setTouchedYears((current) => new Set(current).add(yearGroup.year))
              setExpandedYears((current) => toggleSet(current, yearGroup.year, !yearExpanded))
            }}><span aria-hidden="true">{yearExpanded ? '▼' : '▶'}</span><strong>{yearGroup.year}</strong></button>
            {yearExpanded ? <div id={yearId} className="recent-footprints__year-content">{yearGroup.months.map((monthGroup, monthIndex) => {
              const monthExpanded = searchActive || (touchedMonths.has(monthGroup.key) ? expandedMonths.has(monthGroup.key) : yearIndex === 0 && monthIndex === 0)
              const monthId = `footprint-month-${monthGroup.key}`
              return <section className="recent-footprints__month-group" key={monthGroup.key}>
                <button type="button" className="recent-footprints__month-toggle" aria-expanded={monthExpanded} aria-controls={monthId} aria-label={t(monthExpanded ? 'footprints.recent.group.collapse' : 'footprints.recent.group.expand', { label: formatFootprintMonth(monthGroup.key, locale) })} onClick={() => {
                  setTouchedMonths((current) => new Set(current).add(monthGroup.key))
                  setExpandedMonths((current) => toggleSet(current, monthGroup.key, !monthExpanded))
                }}><span aria-hidden="true">{monthExpanded ? '▼' : '▶'}</span><span>{formatFootprintMonth(monthGroup.key, locale)}</span><small>{t('footprints.recent.group.count', { count: monthGroup.entries.length })}</small></button>
                {monthExpanded ? <div id={monthId}><FootprintRows entries={monthGroup.entries} dateFormatter={dateFormatter} weekdayFormatter={weekdayFormatter} expandedDiaryIds={expandedDiaryIds} setExpandedDiaryIds={setExpandedDiaryIds} openEntry={openEntry} t={t} /></div> : null}
              </section>
            })}</div> : null}
          </section>
        })}</div> : null}
        {visibleEntries.length === 0 ? <p className="recent-footprints__empty">{t(query ? 'footprints.search.empty' : 'footprints.recent.empty')}</p> : null}
      </div>
      {visibleEntries.length > 3 ? <SecondaryButton className="recent-footprints__view-all" onClick={() => setShowAll((value) => !value)}>{t(showAll ? 'footprints.recent.showRecent' : 'footprints.viewAll')}</SecondaryButton> : null}
    </section>
  )
}

function FootprintRows({ entries, dateFormatter, weekdayFormatter, expandedDiaryIds, setExpandedDiaryIds, openEntry, t }: {
  entries: RecentFootprintEntry[]
  dateFormatter: Intl.DateTimeFormat
  weekdayFormatter: Intl.DateTimeFormat
  expandedDiaryIds: Set<string>
  setExpandedDiaryIds: Dispatch<SetStateAction<Set<string>>>
  openEntry: (entry: RecentFootprintEntry) => void
  t: (key: TranslationKey, values?: Record<string, string | number>) => string
}) {
  return <>{entries.map((entry) => {
    const date = new Date(`${entry.localDate}T00:00:00Z`)
    const icon = entry.type === 'mood' && entry.mood ? moodIcons[entry.mood] : entry.type === 'diary' ? footprintsAssets.diaryNotebook : footprintsAssets.clearRecordDrop
    if (entry.type === 'diary') {
      const summary = getRecentDiarySummary(entry.summary)
      const expanded = expandedDiaryIds.has(entry.recordId)
      const summaryId = `recent-diary-summary-${entry.recordId}`
      return <article className="recent-footprint recent-footprint--diary" key={entry.id}>
        <button className="recent-footprint__open" type="button" onClick={() => openEntry(entry)}>
          <time dateTime={entry.localDate}><strong>{dateFormatter.format(date)}</strong><span>{weekdayFormatter.format(date)}</span></time>
          <span className="recent-footprint__tag"><img src={icon} alt="" aria-hidden="true" />{t('footprints.type.diary')}</span>
          <span id={summaryId} className={`recent-footprint__summary${expanded ? ' recent-footprint__summary--expanded' : ''}`}>{summary.isLong && !expanded ? summary.collapsed : entry.summary}</span>
          <img className="recent-footprint__arrow" src={footprintsAssets.arrowRight} alt="" aria-hidden="true" />
        </button>
        {summary.isLong ? <button className="recent-footprint__summary-toggle" type="button" aria-expanded={expanded} aria-controls={summaryId} onClick={() => setExpandedDiaryIds((current) => toggleSet(current, entry.recordId, !expanded))}>{t(expanded ? 'footprints.recent.collapseDiary' : 'footprints.recent.expandDiary')}</button> : null}
      </article>
    }
    return <button className={`recent-footprint recent-footprint--${entry.type}`} type="button" onClick={() => openEntry(entry)} key={entry.id}>
      <time dateTime={entry.localDate}><strong>{dateFormatter.format(date)}</strong><span>{weekdayFormatter.format(date)}</span></time>
      <span className="recent-footprint__tag"><img src={icon} alt="" aria-hidden="true" />{t(`footprints.type.${entry.type}` as TranslationKey)}</span>
      <span className="recent-footprint__summary">{entry.summary}</span>
      <img className="recent-footprint__arrow" src={footprintsAssets.arrowRight} alt="" aria-hidden="true" />
    </button>
  })}</>
}

interface FootprintMonthGroup { key: string; entries: RecentFootprintEntry[] }
interface FootprintYearGroup { year: string; months: FootprintMonthGroup[] }

function groupFootprintsByYearMonth(entries: RecentFootprintEntry[]): FootprintYearGroup[] {
  const years = new Map<string, Map<string, RecentFootprintEntry[]>>()
  for (const entry of sortRecentFootprints(entries)) {
    const year = entry.localDate.slice(0, 4)
    const month = entry.localDate.slice(0, 7)
    const months = years.get(year) ?? new Map<string, RecentFootprintEntry[]>()
    months.set(month, [...(months.get(month) ?? []), entry])
    years.set(year, months)
  }
  return [...years.entries()].sort(([left], [right]) => right.localeCompare(left)).map(([year, months]) => ({ year, months: [...months.entries()].sort(([left], [right]) => right.localeCompare(left)).map(([key, groupedEntries]) => ({ key, entries: groupedEntries })) }))
}

function formatFootprintMonth(yearMonth: string, locale: string) {
  const [year, month] = yearMonth.split('-').map(Number)
  return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(year, month - 1, 1)))
}

function toggleSet(current: Set<string>, key: string, shouldInclude: boolean) {
  const next = new Set(current)
  if (shouldInclude) next.add(key)
  else next.delete(key)
  return next
}
