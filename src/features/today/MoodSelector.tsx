import { useEffect, useRef, useState } from 'react'
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
  const [selectedMood, setSelectedMood] = useState<MoodKey | undefined>(persistence?.todayMood?.mood)
  const [showReward, setShowReward] = useState(false)
  const selectionPendingRef = useRef(false)
  const rewardTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    setSelectedMood(persistence?.todayMood?.mood)
  }, [persistence?.todayMood?.mood])

  useEffect(() => () => {
    if (rewardTimerRef.current) clearTimeout(rewardTimerRef.current)
  }, [])

  const selectMood = async (mood: MoodKey) => {
    if (!persistence || selectionPendingRef.current) return
    const isFirstSelectionToday = !persistence.todayMood
    selectionPendingRef.current = true
    try {
      const record = await persistence.setTodayMood(mood)
      setSelectedMood(record.mood)
      if (isFirstSelectionToday) {
        setShowReward(true)
        if (rewardTimerRef.current) clearTimeout(rewardTimerRef.current)
        rewardTimerRef.current = setTimeout(() => setShowReward(false), 1200)
      }
    } finally {
      selectionPendingRef.current = false
    }
  }

  return (
    <SoftCard className="mood-card">
      <SectionHeader icon={<span className="section-symbol" aria-hidden="true">♥</span>} title={t('today.mood.title')} />
      {showReward ? <span className="mood-card__reward" role="status">+2</span> : null}
      <div className="mood-selector" role="group" aria-label={t('today.mood.title')}>
        {moods.map((mood) => (
          <button key={mood.id} className={`mood-option mood-option--${mood.id}`} type="button" aria-pressed={selectedMood === mood.id} onClick={() => selectMood(mood.id)}>
            <span className="mood-option__check" aria-hidden="true">✓</span>
            <img className="mood-option__illustration" src={mood.image} alt="" aria-hidden="true" />
            <span>{t(mood.labelKey)}</span>
          </button>
        ))}
      </div>
    </SoftCard>
  )
}
