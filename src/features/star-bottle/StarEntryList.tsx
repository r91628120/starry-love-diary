import { useState } from 'react'
import { starBottleAssets } from '../../assets/uiAssets'
import { PrimaryButton, SectionHeader } from '../../components'
import { useI18n } from '../../i18n/I18nContext'
import type { Star } from '../../data/types'
import type { Locale, TranslationKey } from '../../i18n/messages'
import type { TimeRange } from './TimeRangeFilter'

interface StarEntryListProps {
  entries: Star[]
  range: TimeRange
  search: string
  showAll: boolean
  onShowAll: () => void
  onShowRecent: () => void
}

interface MonthGroup { key: string; entries: Star[] }
interface YearGroup { year: string; months: MonthGroup[] }

export function StarEntryList({ entries, range, search, showAll, onShowAll, onShowRecent }: StarEntryListProps) {
  const { locale, t } = useI18n()
  const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' })
  const sortedEntries = [...entries].sort(compareStars)
  const normalizedSearch = search.trim().toLocaleLowerCase(locale)
  const searchedEntries = sortedEntries.filter((entry) => searchableText(entry, locale, t).includes(normalizedSearch))
  const displayedEntries = showAll ? searchedEntries : searchedEntries.slice(0, 3)
  const emptyKey = normalizedSearch ? 'starBottle.empty.search' : `starBottle.empty.${showAll ? 'all' : 'range'}`
  const groups = groupStarsByYearMonth(searchedEntries)
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(() => new Set())
  const [touchedMonths, setTouchedMonths] = useState<Set<string>>(() => new Set())
  const [expandedYears, setExpandedYears] = useState<Set<string>>(() => new Set())
  const [touchedYears, setTouchedYears] = useState<Set<string>>(() => new Set())
  const searchActive = normalizedSearch.length > 0

  const toggleMonth = (key: string, currentlyExpanded: boolean) => {
    setTouchedMonths((current) => new Set(current).add(key))
    setExpandedMonths((current) => toggleSet(current, key, !currentlyExpanded))
  }
  const toggleYear = (year: string, currentlyExpanded: boolean) => {
    setTouchedYears((current) => new Set(current).add(year))
    setExpandedYears((current) => toggleSet(current, year, !currentlyExpanded))
  }

  return (
    <section className={`star-entry-section${showAll ? ' star-entry-section--full' : ''}`}>
      <SectionHeader title={t(showAll ? 'starBottle.fullList' : 'starBottle.recentStars')} icon={<span className="star-entry-section__sparkle" aria-hidden="true">✦</span>} />
      {displayedEntries.length === 0 ? <p className="star-entry-list__empty">{t(emptyKey as TranslationKey)}</p> : null}
      {!showAll && displayedEntries.length > 0 ? <StarRows entries={displayedEntries} dateFormatter={dateFormatter} t={t} /> : null}
      {showAll && range === 'today' && displayedEntries.length > 0 ? <StarRows entries={displayedEntries} compact dateFormatter={dateFormatter} t={t} /> : null}
      {showAll && range !== 'today' && displayedEntries.length > 0 ? (
        <div className="star-year-groups">
          {groups.map((yearGroup, yearIndex) => {
            const yearExpanded = searchActive || (touchedYears.has(yearGroup.year) ? expandedYears.has(yearGroup.year) : yearIndex === 0)
            const yearId = `star-year-${yearGroup.year}`
            return (
              <section className="star-year-group" key={yearGroup.year}>
                <button type="button" className="star-year-group__toggle" aria-expanded={yearExpanded} aria-controls={yearId} aria-label={t(yearExpanded ? 'starBottle.group.collapse' : 'starBottle.group.expand', { label: yearGroup.year })} onClick={() => toggleYear(yearGroup.year, yearExpanded)}>
                  <span aria-hidden="true">{yearExpanded ? '▼' : '▶'}</span><strong>{yearGroup.year}</strong>
                </button>
                {yearExpanded ? <div className="star-year-group__content" id={yearId}>
                  {yearGroup.months.map((monthGroup, monthIndex) => {
                    const monthExpanded = searchActive || (touchedMonths.has(monthGroup.key) ? expandedMonths.has(monthGroup.key) : yearIndex === 0 && monthIndex === 0)
                    const monthId = `star-month-${monthGroup.key}`
                    const moodCount = monthGroup.entries.filter((entry) => entry.type === 'mood').length
                    const clearCount = monthGroup.entries.length - moodCount
                    return <section className="star-month-group" key={monthGroup.key}>
                      <button type="button" className="star-month-group__toggle" aria-expanded={monthExpanded} aria-controls={monthId} aria-label={t(monthExpanded ? 'starBottle.group.collapse' : 'starBottle.group.expand', { label: formatStarMonth(monthGroup.key, locale) })} onClick={() => toggleMonth(monthGroup.key, monthExpanded)}>
                        <span className="star-month-group__indicator" aria-hidden="true">{monthExpanded ? '▼' : '▶'}</span>
                        <span className="star-month-group__title">{formatStarMonth(monthGroup.key, locale)}</span>
                        <span className="star-month-group__count">{t('starBottle.group.count', { count: monthGroup.entries.length })}</span>
                        <span className="star-month-group__breakdown">{t('starBottle.type.mood')} {moodCount} · {t('starBottle.type.clear')} {clearCount}</span>
                      </button>
                      {monthExpanded ? <div id={monthId}><StarRows entries={monthGroup.entries} compact dateFormatter={dateFormatter} t={t} /></div> : null}
                    </section>
                  })}
                </div> : null}
              </section>
            )
          })}
        </div>
      ) : null}
      {showAll
        ? <PrimaryButton className="star-entry-section__view-all" onClick={onShowRecent}>{t('starBottle.backToRecent')}</PrimaryButton>
        : <PrimaryButton className="star-entry-section__view-all" onClick={onShowAll}>{t('starBottle.viewAll')}</PrimaryButton>}
    </section>
  )
}

function StarRows({ entries, compact = false, dateFormatter, t }: { entries: Star[]; compact?: boolean; dateFormatter: Intl.DateTimeFormat; t: (key: TranslationKey, values?: Record<string, string | number>) => string }) {
  return <div className={`star-entry-list${compact ? ' star-entry-list--compact' : ''}`}>
    {entries.map((entry) => {
      const isMood = entry.type === 'mood'
      const typeLabel = t(isMood ? 'starBottle.type.mood' : 'starBottle.type.clear')
      const sourceContent = starPrimaryText(entry, t)
      const summary = !isMood && entry.content !== sourceContent && !isStableSourceKey(entry.content) ? entry.content : undefined
      return <article className={`star-entry star-entry--${isMood ? 'mood' : 'clear'}${compact ? ' star-entry--compact' : ''}`} key={entry.id}>
        <img src={isMood ? starBottleAssets.moodStar : starBottleAssets.clearStar} alt="" aria-hidden="true" />
        <div className="star-entry__content"><strong>{typeLabel}</strong><p>{sourceContent}</p>{summary ? <small className="star-entry__summary">{summary}</small> : null}<div className="star-entry__meta"><time dateTime={entry.localDate}>{formatLocalDate(entry.localDate, dateFormatter)}</time><span>{typeLabel}</span></div></div>
        {!compact ? <span className="star-entry__flower" aria-hidden="true">✿</span> : null}
      </article>
    })}
  </div>
}

function starPrimaryText(entry: Star, t: (key: TranslationKey) => string) {
  if (entry.type === 'mood' && entry.mood) return t(('today.mood.' + entry.mood) as TranslationKey)
  if (entry.type === 'mood') return entry.content
  if (entry.type === 'clear_mind' && entry.sourceType && ['clear_record', 'love_boat_code', 'love_brain_assessment', 'like_or_habit'].includes(entry.sourceType)) {
    return entry.title && !isStableSourceKey(entry.title) ? entry.title : t(('clear.star.' + entry.sourceType) as TranslationKey)
  }
  return entry.title ?? entry.content
}

function searchableText(entry: Star, locale: string, t: (key: TranslationKey) => string) {
  const typeLabel = t(entry.type === 'mood' ? 'starBottle.type.mood' : 'starBottle.type.clear')
  return [typeLabel, starPrimaryText(entry, t), entry.content, entry.localDate].join(' ').toLocaleLowerCase(locale)
}

function isStableSourceKey(value: string) {
  return ['clear_record', 'love_boat_code', 'love_brain_assessment', 'like_or_habit'].includes(value)
}

function groupStarsByYearMonth(entries: Star[]): YearGroup[] {
  const byYear = new Map<string, Map<string, Star[]>>()
  for (const entry of [...entries].sort(compareStars)) {
    const year = entry.localDate.slice(0, 4)
    const month = entry.localDate.slice(0, 7)
    const months = byYear.get(year) ?? new Map<string, Star[]>()
    months.set(month, [...(months.get(month) ?? []), entry])
    byYear.set(year, months)
  }
  return [...byYear.entries()].sort(([left], [right]) => right.localeCompare(left)).map(([year, months]) => ({ year, months: [...months.entries()].sort(([left], [right]) => right.localeCompare(left)).map(([key, groupedEntries]) => ({ key, entries: groupedEntries })) }))
}

function formatStarMonth(yearMonth: string, locale: Locale) {
  const [year, month] = yearMonth.split('-').map(Number)
  return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(year, month - 1, 1)))
}

function compareStars(left: Star, right: Star) { return right.localDate.localeCompare(left.localDate) || right.createdAt.localeCompare(left.createdAt) || left.id.localeCompare(right.id) }
function formatLocalDate(localDate: string, formatter: Intl.DateTimeFormat) { const [year, month, day] = localDate.split('-').map(Number); return formatter.format(new Date(Date.UTC(year, month - 1, day))) }
function toggleSet(current: Set<string>, key: string, shouldInclude: boolean) { const next = new Set(current); if (shouldInclude) next.add(key); else next.delete(key); return next }
