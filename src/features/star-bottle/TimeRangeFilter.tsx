import { FilterChip } from '../../components'
import { useI18n } from '../../i18n/I18nContext'
import type { TranslationKey } from '../../i18n/messages'

export type TimeRange = 'today' | 'month' | 'year' | 'all'

const ranges: Array<{ id: TimeRange; labelKey: TranslationKey }> = [
  { id: 'today', labelKey: 'starBottle.filter.today' },
  { id: 'month', labelKey: 'starBottle.filter.month' },
  { id: 'year', labelKey: 'starBottle.filter.year' },
  { id: 'all', labelKey: 'starBottle.filter.all' },
]

interface TimeRangeFilterProps {
  value: TimeRange
  onChange: (value: TimeRange) => void
}

export function TimeRangeFilter({ value, onChange }: TimeRangeFilterProps) {
  const { t } = useI18n()

  return (
    <div className="star-bottle-filter" role="group" aria-label={t('starBottle.filter.label')}>
      {ranges.map((range) => (
        <FilterChip key={range.id} selected={value === range.id} onClick={() => onChange(range.id)}>
          {t(range.labelKey)}
        </FilterChip>
      ))}
    </div>
  )
}
