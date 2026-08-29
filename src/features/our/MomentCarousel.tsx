import { useState } from 'react'
import { footprintsAssets, ourAssets } from '../../assets/uiAssets'
import { IconButton, SecondaryButton, SectionHeader, SoftCard } from '../../components'
import { useI18n } from '../../i18n/I18nContext'
import type { TranslationKey } from '../../i18n/messages'

const moments: Array<{ title: TranslationKey; body: TranslationKey; date: TranslationKey; position: string }> = [
  { title: 'our.moments.one.title', body: 'our.moments.one.body', date: 'our.moments.one.date', position: '25% 25%' },
  { title: 'our.moments.two.title', body: 'our.moments.two.body', date: 'our.moments.two.date', position: '50% 30%' },
  { title: 'our.moments.three.title', body: 'our.moments.three.body', date: 'our.moments.three.date', position: '75% 25%' },
]

export function MomentCarousel() {
  const { t } = useI18n(); const [index, setIndex] = useState(0); const [feedback, setFeedback] = useState(''); const moment = moments[index]
  const move = (step: number) => setIndex((value) => (value + step + moments.length) % moments.length)
  return <SoftCard className="moment-carousel"><SectionHeader title={t('our.moments.title')} /><div className="moment-carousel__row">
    <IconButton ariaLabel={t('our.moments.previous')} onClick={() => move(-1)}><img src={ourAssets.moments.arrowLeft} alt="" /></IconButton>
    <article className="moment-card"><img src={footprintsAssets.hero} alt={t('our.moments.photoAlt')} style={{ objectPosition: moment.position }} /><div><h3>{t(moment.title)}</h3><p>{t(moment.body)}</p><time>{t(moment.date)}</time></div></article>
    <IconButton ariaLabel={t('our.moments.next')} onClick={() => move(1)}><img src={ourAssets.moments.arrowRight} alt="" /></IconButton>
  </div><div className="moment-carousel__dots" aria-hidden="true">{moments.map((_, dot) => <span className={dot === index ? 'is-active' : ''} key={dot} />)}</div><SecondaryButton onClick={() => setFeedback(t('our.moments.viewAllFeedback'))}>{t('our.moments.viewAll')}</SecondaryButton><p className="mock-feedback" aria-live="polite">{feedback}</p></SoftCard>
}
