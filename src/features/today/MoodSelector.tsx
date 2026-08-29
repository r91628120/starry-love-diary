import { useState } from 'react'
import { SectionHeader, SoftCard } from '../../components'
import { todayAssets } from '../../assets/uiAssets'
import { useI18n } from '../../i18n/I18nContext'
import type { TranslationKey } from '../../i18n/messages'
import { usePersistence } from '../../data/PersistenceStateContext'
import type { MoodKey } from '../../data/types'

const moods: Array<{ id: MoodKey; labelKey: TranslationKey; image: string }> = [
  { id: 'flutter', labelKey: 'today.mood.flutter', image: todayAssets.moods.flutter },
  { id: 'happy', labelKey: 'today.mood.happy', image: todayAssets.moods.happy },
  { id: 'peaceful', labelKey: 'today.mood.peaceful', image: todayAssets.moods.peaceful },
  { id: 'miss', labelKey: 'today.mood.miss', image: todayAssets.moods.miss },
  { id: 'uneasy', labelKey: 'today.mood.uneasy', image: todayAssets.moods.uneasy },
  { id: 'sad', labelKey: 'today.mood.sad', image: todayAssets.moods.sad },
  { id: 'rumination', labelKey: 'today.mood.rumination', image: todayAssets.moods.rumination },
]

export function MoodSelector() {
  const { t } = useI18n()
  const persistence = usePersistence()
  const [selectedMood, setSelectedMood] = useState<MoodKey>(persistence?.todayMood?.mood ?? 'miss')

  const selectMood = (mood: MoodKey) => {
    setSelectedMood(mood)
    if (persistence) void persistence.setTodayMood(mood)
  }

  return (
    <SoftCard className="mood-card">
      <SectionHeader icon={<span className="section-symbol" aria-hidden="true">♥</span>} title={t('today.mood.title')} />
      <div className="mood-selector" role="group" aria-label={t('today.mood.title')}>
        {moods.map((mood) => (
          <button key={mood.id} className={`mood-option mood-option--${mood.id}`} type="button" aria-pressed={selectedMood === mood.id} onClick={() => selectMood(mood.id)}>
            <img className="mood-option__illustration" src={mood.image} alt="" aria-hidden="true" />
            <span>{t(mood.labelKey)}</span>
          </button>
        ))}
      </div>
    </SoftCard>
  )
}
