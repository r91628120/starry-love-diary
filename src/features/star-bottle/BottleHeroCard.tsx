import { useEffect, useState } from 'react'
import { starBottleAssets } from '../../assets/uiAssets'
import type { LocalStarDropPresentationRepository } from '../../data/repositories/starDropPresentationRepository'
import type { Star } from '../../data/types'
import { useI18n } from '../../i18n/I18nContext'
import { toLocalDate } from '../../services/localDateService'
import { selectCurrentMonthMoodStars } from './monthlyMoodStars'

const moodStars = [starBottleAssets.pinkStars.smile, starBottleAssets.pinkStars.heart, starBottleAssets.pinkStars.wave] as const
const clarityStars = [starBottleAssets.blueStars.calm, starBottleAssets.blueStars.peace, starBottleAssets.blueStars.think] as const
const SLOT_COUNT = 31
export const STAR_DROP_RITUAL_DURATION_MS = 4500
const impactParticles = [
  'north', 'north-east', 'east', 'south-east', 'south',
  'south-west', 'west', 'north-west', 'inner-left', 'inner-right',
] as const

function artForStar(star: Star, index: number) {
  const art = star.type === 'mood' ? moodStars : clarityStars
  return art[index % art.length]
}

function prefersReducedMotion() {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function BottleHeroCard({ stars, currentLocalDate = toLocalDate(), presentations }: { stars: Star[]; currentLocalDate?: string; presentations?: LocalStarDropPresentationRepository }) {
  const { t } = useI18n()
  const [droppingStar, setDroppingStar] = useState<Star>()

  useEffect(() => {
    let active = true
    let settleTimer: ReturnType<typeof setTimeout> | undefined
    void presentations?.claimRepresentative(stars, (star) => star.type === 'mood' && star.localDate.slice(0, 7) === currentLocalDate.slice(0, 7)).then((star) => {
      if (!active || !star || prefersReducedMotion()) return
      setDroppingStar(star)
      settleTimer = setTimeout(() => {
        if (active) setDroppingStar(undefined)
      }, STAR_DROP_RITUAL_DURATION_MS)
    })
    return () => {
      active = false
      if (settleTimer) clearTimeout(settleTimer)
    }
  }, [currentLocalDate, presentations, stars])

  const visibleStars = selectCurrentMonthMoodStars(stars, currentLocalDate).slice(0, SLOT_COUNT)

  return (
    <section className="bottle-hero" aria-label={t('starBottle.hero.label')}>
      <img className="bottle-hero__scene" src={starBottleAssets.hero} alt="" aria-hidden="true" />
      <img className="bottle-hero__sparkles" src={starBottleAssets.decorations} alt="" aria-hidden="true" />
      <div className="bottle-hero__ritual-stage" aria-hidden="true">
        <img className="bottle-hero__jar" src={starBottleAssets.jar} alt="" />
        <div className="bottle-hero__collection">
          {visibleStars.map((star, index) => <img key={star.id} className={`bottle-star bottle-star--slot-${index} bottle-star--count-${visibleStars.length}`} src={artForStar(star, index)} alt="" />)}
        </div>
        {droppingStar ? <>
          <img className="bottle-star bottle-star--dropping" src={droppingStar.type === 'mood' ? starBottleAssets.moodStar : starBottleAssets.clearStar} alt="" />
          <img className="bottle-hero__ritual-sparkles" src={starBottleAssets.decorations} alt="" />
          <div className="bottle-hero__impact" data-testid="star-drop-impact">
            {impactParticles.map((particle) => <span className={`bottle-hero__impact-particle bottle-hero__impact-particle--${particle}`} data-testid="star-drop-impact-particle" key={particle} />)}
          </div>
        </> : null}
      </div>
      <p className="bottle-hero__ritual-message" role="status">{droppingStar ? t(droppingStar.type === 'mood' ? 'starBottle.ritual.mood' : 'starBottle.ritual.clear') : ''}</p>
      <p className="bottle-hero__tagline">{t('starBottle.hero.monthlyLabel')}</p>
    </section>
  )
}
