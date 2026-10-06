import { useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { PageHeader, PrimaryButton, SecondaryButton, SoftCard } from '../components'
import { useI18n } from '../i18n/I18nContext'
import type { TranslationKey } from '../i18n/messages'
import { shareStarrySkyTopic } from '../services/starrySkyTopicShare'
import { starrySkyCategoryIds, starrySkyTopicsForCategory } from '../features/our/starrySkyTopics'
import type { StarrySkyCategoryId } from '../features/our/starrySkyTopics.zh-TW'
import '../features/our/our.css'

export function StarrySkyTopicsPage() {
  const { t, locale } = useI18n()
  const navigate = useNavigate()
  const location = useLocation()
  const requested = (location.state as { categoryId?: StarrySkyCategoryId } | null)?.categoryId
  const [categoryId, setCategoryId] = useState<StarrySkyCategoryId>(requested && starrySkyCategoryIds.includes(requested) ? requested : 'A')
  const [feedback, setFeedback] = useState<string>()
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const pillsRef = useRef<HTMLDivElement>(null)
  const pillRefs = useRef<Partial<Record<StarrySkyCategoryId, HTMLButtonElement>>>({})
  const topics = starrySkyTopicsForCategory(categoryId)
  const share = async (text: string) => {
    const result = await shareStarrySkyTopic(text, locale)
    setFeedback(result === 'copied' ? t('our.starrySky.copied') : result === 'error' ? t('our.starrySky.shareError') : undefined)
  }
  const syncScrollControls = () => {
    const pills = pillsRef.current
    if (!pills) return
    setCanScrollLeft(pills.scrollLeft > 1)
    setCanScrollRight(pills.scrollLeft + pills.clientWidth < pills.scrollWidth - 1)
  }
  const scrollCategories = (direction: -1 | 1) => {
    const pills = pillsRef.current
    if (!pills) return
    pills.scrollBy({ left: direction * Math.max(160, pills.clientWidth * .75), behavior: 'auto' })
  }
  const selectCategory = (id: StarrySkyCategoryId) => setCategoryId(id)

  useEffect(() => {
    const pills = pillsRef.current
    if (!pills) return
    syncScrollControls()
    pills.addEventListener('scroll', syncScrollControls, { passive: true })
    window.addEventListener('resize', syncScrollControls)
    return () => { pills.removeEventListener('scroll', syncScrollControls); window.removeEventListener('resize', syncScrollControls) }
  }, [])

  useEffect(() => { pillRefs.current[categoryId]?.scrollIntoView?.({ behavior: 'auto', block: 'nearest', inline: 'nearest' }) }, [categoryId])

  return <div className="page our-page starry-sky-page">
    <PageHeader titleKey="our.starrySky.libraryTitle" variant="secondary" backFallback="/our/starry-sky" />
    <main className="our-page__content starry-sky-page__content">
      <section className="starry-sky-library"><img src="/assets/starry-sky/starry-sky-hero-bg.png" alt="" /><div><h2>{t('our.starrySky.libraryTitle')}</h2><p>{t('our.starrySky.librarySubtitle')}</p></div></section>
      <div className="starry-sky-category-nav">
        <button type="button" className="starry-sky-category-nav__arrow" aria-label="Previous categories" disabled={!canScrollLeft} onClick={() => scrollCategories(-1)}><span aria-hidden="true">‹</span></button>
        <div className="starry-sky-pills" ref={pillsRef} role="tablist" aria-label={t('our.starrySky.libraryTitle')}>
          {starrySkyCategoryIds.map((id) => <button type="button" role="tab" aria-selected={categoryId === id} className={categoryId === id ? 'is-active' : ''} key={id} ref={(element) => { pillRefs.current[id] = element ?? undefined }} onClick={() => selectCategory(id)}>{id}｜{t(`our.starrySky.category.${id}` as TranslationKey)}</button>)}
        </div>
        <button type="button" className="starry-sky-category-nav__arrow" aria-label="Next categories" disabled={!canScrollRight} onClick={() => scrollCategories(1)}><span aria-hidden="true">›</span></button>
      </div>
      <section className="starry-sky-topic-list" aria-live="polite">
        {topics.map((topic) => <SoftCard className="starry-sky-topic" key={topic.id}><span>{topic.id}</span><p lang="zh-TW">{topic.text}</p><div><SecondaryButton onClick={() => void share(topic.text)}>{t('our.starrySky.share')}</SecondaryButton><PrimaryButton onClick={() => navigate(`/our/starry-sky/invite?topic=${encodeURIComponent(topic.id)}`)}>{t('our.starrySky.choose')}</PrimaryButton></div></SoftCard>)}
      </section>
      {feedback ? <p className="mock-feedback" aria-live="polite">{feedback}</p> : null}
    </main>
  </div>
}
