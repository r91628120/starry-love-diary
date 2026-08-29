import { useState } from 'react'
import { footprintsAssets, todayAssets } from '../../assets/uiAssets'
import { SecondaryButton, SectionHeader } from '../../components'
import { useI18n } from '../../i18n/I18nContext'
import type { TranslationKey } from '../../i18n/messages'
import { PhotoThumbnail } from './PhotoThumbnail'

const entries: Array<{ date: TranslationKey; weekday: TranslationKey; tag: TranslationKey; summary: TranslationKey; icon: string; position: 'left' | 'center' | 'right'; tone: string }> = [
  { date: 'footprints.recent.one.date', weekday: 'footprints.recent.one.weekday', tag: 'footprints.recent.one.tag', summary: 'footprints.recent.one.summary', icon: todayAssets.moods.miss, position: 'left', tone: 'pink' },
  { date: 'footprints.recent.two.date', weekday: 'footprints.recent.two.weekday', tag: 'footprints.recent.two.tag', summary: 'footprints.recent.two.summary', icon: todayAssets.moods.peaceful, position: 'right', tone: 'green' },
  { date: 'footprints.recent.three.date', weekday: 'footprints.recent.three.weekday', tag: 'footprints.recent.three.tag', summary: 'footprints.recent.three.summary', icon: footprintsAssets.clearRecordDrop, position: 'center', tone: 'blue' },
]

export function RecentFootprints() {
  const { t } = useI18n()
  const [feedback, setFeedback] = useState('')
  return (
    <section className="recent-footprints">
      <SectionHeader title={t('footprints.recentFootprints')} icon={<img src={footprintsAssets.mainIcon} alt="" aria-hidden="true" />} />
      <div className="recent-footprints__list">
        {entries.map((entry) => (
          <button className={`recent-footprint recent-footprint--${entry.tone}`} type="button" onClick={() => setFeedback(t('footprints.recent.feedback'))} key={entry.date}>
            <time><strong>{t(entry.date)}</strong><span>{t(entry.weekday)}</span></time>
            <span className="recent-footprint__tag"><img src={entry.icon} alt="" aria-hidden="true" />{t(entry.tag)}</span>
            <span className="recent-footprint__summary">{t(entry.summary)}</span>
            <PhotoThumbnail position={entry.position} />
            <img className="recent-footprint__arrow" src={footprintsAssets.arrowRight} alt="" aria-hidden="true" />
          </button>
        ))}
      </div>
      <SecondaryButton className="recent-footprints__view-all" onClick={() => setFeedback(t('footprints.viewAll.feedback'))}>{t('footprints.viewAll')}</SecondaryButton>
      <p className="mock-feedback" aria-live="polite">{feedback}</p>
    </section>
  )
}
