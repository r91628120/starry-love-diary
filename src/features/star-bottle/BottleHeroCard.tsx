import { useEffect, useState } from 'react'
import { starBottleAssets } from '../../assets/uiAssets'
import type { LocalStarDropPresentationRepository } from '../../data/repositories/starDropPresentationRepository'
import type { Star } from '../../data/types'
import { useI18n } from '../../i18n/I18nContext'

const moodStars = [starBottleAssets.pinkStars.smile, starBottleAssets.pinkStars.heart, starBottleAssets.pinkStars.wave] as const
const clarityStars = [starBottleAssets.blueStars.calm, starBottleAssets.blueStars.peace, starBottleAssets.blueStars.think] as const
const MAX_VISIBLE_STARS = 12

function artForStar(star: Star, index: number) {
  const art = star.type === 'mood' ? moodStars : clarityStars
  return art[index % art.length]
}

function prefersReducedMotion() {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function BottleHeroCard({ stars, presentations }: { stars: Star[]; presentations?: LocalStarDropPresentationRepository }) {
  const { t } = useI18n()
  const [droppingStar, setDroppingStar] = useState<Star>()

  useEffect(() => {
    let active = true
    let settleTimer: ReturnType<typeof setTimeout> | undefined
    void presentations?.claimRepresentative(stars).then((star) => {
      if (!active || !star || prefersReducedMotion()) return
      setDroppingStar(star)
      settleTimer = setTimeout(() => {
        if (active) setDroppingStar(undefined)
      }, 1800)
    })
    return () => {
      active = false
      if (settleTimer) clearTimeout(settleTimer)
    }
  }, [presentations, stars])

  const visibleStars = stars.slice(0, MAX_VISIBLE_STARS)

  return (
    <section className="bottle-hero" aria-label={t('starBottle.hero.label')}>
      <img className="bottle-hero__scene" src={starBottleAssets.hero} alt="" aria-hidden="true" />
      <img className="bottle-hero__sparkles" src={starBottleAssets.decorations} alt="" aria-hidden="true" />
      <div className="bottle-hero__ritual-stage" aria-hidden="true">
        <img className="bottle-hero__jar" src={starBottleAssets.jar} alt="" />
        <div className="bottle-hero__collection">
          {visibleStars.map((star, index) => <img key={star.id} className={`bottle-star bottle-star--slot-${index}`} src={artForStar(star, index)} alt="" />)}
        </div>
        {droppingStar ? <>
          <img className="bottle-star bottle-star--dropping" src={droppingStar.type === 'mood' ? starBottleAssets.moodStar : starBottleAssets.clearStar} alt="" />
          <img className="bottle-hero__ritual-sparkles" src={starBottleAssets.decorations} alt="" />
        </> : null}
      </div>
      <p className="bottle-hero__ritual-message" role="status">{droppingStar ? t(droppingStar.type === 'mood' ? 'starBottle.ritual.mood' : 'starBottle.ritual.clear') : ''}</p>
      <p className="bottle-hero__tagline">{t('starBottle.hero.tagline')}</p>
    </section>
  )
}
