import { useEffect, useState, type CSSProperties } from 'react'
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
type ImpactParticle = {
  wave: 1 | 2 | 3 | 4
  glyph: '★' | '✦' | '✧' | '♥' | 'dot'
  color: string
  size: string
  dx: string
  dy: string
  rotation: number
  delay: string
  duration: string
}

export const STAR_DROP_IMPACT_PARTICLES: readonly ImpactParticle[] = [
  { wave: 1, glyph: '★', color: '#FFE27A', size: '.64rem', dx: '-2rem', dy: '-1.2rem', rotation: -42, delay: '0ms', duration: '.9s' },
  { wave: 1, glyph: '★', color: '#FFD4DF', size: '.58rem', dx: '2.25rem', dy: '-1rem', rotation: 36, delay: '26ms', duration: '.88s' },
  { wave: 1, glyph: '✦', color: '#FFF9DF', size: '.52rem', dx: '0rem', dy: '-2.9rem', rotation: 24, delay: '11ms', duration: '.86s' },
  { wave: 1, glyph: '✦', color: '#DCEBFF', size: '.5rem', dx: '-2.9rem', dy: '.7rem', rotation: -52, delay: '48ms', duration: '.9s' },
  { wave: 1, glyph: '✦', color: '#FFF0A9', size: '.54rem', dx: '2.8rem', dy: '.65rem', rotation: 46, delay: '74ms', duration: '.92s' },
  { wave: 1, glyph: '✧', color: '#E8D8FF', size: '.44rem', dx: '-1.35rem', dy: '-2.25rem', rotation: -30, delay: '33ms', duration: '.84s' },
  { wave: 1, glyph: '✧', color: '#FFF7DC', size: '.46rem', dx: '1.45rem', dy: '2.25rem', rotation: 60, delay: '67ms', duration: '.88s' },
  { wave: 1, glyph: '♥', color: '#FFD9E4', size: '.56rem', dx: '-.8rem', dy: '2.45rem', rotation: -20, delay: '56ms', duration: '.9s' },
  { wave: 1, glyph: 'dot', color: '#FFF7DC', size: '.36rem', dx: '-3.2rem', dy: '-1.3rem', rotation: 0, delay: '18ms', duration: '.82s' },
  { wave: 1, glyph: 'dot', color: '#E8D8FF', size: '.38rem', dx: '2.35rem', dy: '1.75rem', rotation: 0, delay: '90ms', duration: '.86s' },
  { wave: 2, glyph: '★', color: '#FFF0A9', size: '.78rem', dx: '-3.9rem', dy: '-1.55rem', rotation: 38, delay: '220ms', duration: '1.02s' },
  { wave: 2, glyph: '★', color: '#FFD4DF', size: '.76rem', dx: '4.15rem', dy: '-1.45rem', rotation: -48, delay: '255ms', duration: '1s' },
  { wave: 2, glyph: '✦', color: '#FFE27A', size: '.64rem', dx: '0rem', dy: '-5.1rem', rotation: 68, delay: '231ms', duration: '1.06s' },
  { wave: 2, glyph: '✦', color: '#DCEBFF', size: '.6rem', dx: '-4.75rem', dy: '-.7rem', rotation: -40, delay: '271ms', duration: '.98s' },
  { wave: 2, glyph: '✦', color: '#FFF9DF', size: '.62rem', dx: '4.85rem', dy: '.45rem', rotation: 52, delay: '304ms', duration: '1.02s' },
  { wave: 2, glyph: '✦', color: '#E8D8FF', size: '.58rem', dx: '-3rem', dy: '3rem', rotation: -66, delay: '289ms', duration: '.96s' },
  { wave: 2, glyph: '✧', color: '#FFF7DC', size: '.52rem', dx: '3.2rem', dy: '2.75rem', rotation: 44, delay: '242ms', duration: '.94s' },
  { wave: 2, glyph: '✧', color: '#FFD4DF', size: '.54rem', dx: '-1.5rem', dy: '4.2rem', rotation: -58, delay: '280ms', duration: '.98s' },
  { wave: 2, glyph: '✧', color: '#FFF0A9', size: '.5rem', dx: '1.75rem', dy: '-4rem', rotation: 30, delay: '310ms', duration: '1.04s' },
  { wave: 2, glyph: '♥', color: '#FFD9E4', size: '.66rem', dx: '-3.45rem', dy: '2.35rem', rotation: -26, delay: '263ms', duration: '1.02s' },
  { wave: 2, glyph: '♥', color: '#FFE27A', size: '.62rem', dx: '3.55rem', dy: '2.2rem', rotation: 34, delay: '295ms', duration: '1s' },
  { wave: 2, glyph: 'dot', color: '#FFF9DF', size: '.4rem', dx: '-2.1rem', dy: '-3.75rem', rotation: 0, delay: '224ms', duration: '.92s' },
  { wave: 2, glyph: 'dot', color: '#DCEBFF', size: '.42rem', dx: '2.55rem', dy: '-3.55rem', rotation: 0, delay: '299ms', duration: '.94s' },
  { wave: 3, glyph: '★', color: '#FFE27A', size: '.96rem', dx: '-5rem', dy: '-4.1rem', rotation: -50, delay: '440ms', duration: '1.15s' },
  { wave: 3, glyph: '★', color: '#FFF0A9', size: '.92rem', dx: '5.45rem', dy: '-4rem', rotation: 56, delay: '471ms', duration: '1.18s' },
  { wave: 3, glyph: '★', color: '#FFD4DF', size: '.9rem', dx: '0rem', dy: '-8.7rem', rotation: 20, delay: '503ms', duration: '1.12s' },
  { wave: 3, glyph: '✦', color: '#FFF9DF', size: '.72rem', dx: '-6.4rem', dy: '-1.1rem', rotation: -68, delay: '452ms', duration: '1.08s' },
  { wave: 3, glyph: '✦', color: '#DCEBFF', size: '.7rem', dx: '6.65rem', dy: '-.8rem', rotation: 42, delay: '486ms', duration: '1.1s' },
  { wave: 3, glyph: '✦', color: '#E8D8FF', size: '.68rem', dx: '-4.75rem', dy: '4.45rem', rotation: -74, delay: '518ms', duration: '1.04s' },
  { wave: 3, glyph: '✦', color: '#FFF7DC', size: '.7rem', dx: '4.9rem', dy: '4.3rem', rotation: 62, delay: '462ms', duration: '1.06s' },
  { wave: 3, glyph: '✦', color: '#FFE27A', size: '.66rem', dx: '-2.2rem', dy: '6.15rem', rotation: -38, delay: '494ms', duration: '1.1s' },
  { wave: 3, glyph: '✧', color: '#FFD4DF', size: '.58rem', dx: '2.6rem', dy: '5.9rem', rotation: 48, delay: '527ms', duration: '1.04s' },
  { wave: 3, glyph: '✧', color: '#FFF0A9', size: '.56rem', dx: '-3.25rem', dy: '-5.45rem', rotation: -56, delay: '477ms', duration: '1.02s' },
  { wave: 3, glyph: '✧', color: '#FFF9DF', size: '.6rem', dx: '3.55rem', dy: '-5.3rem', rotation: 36, delay: '509ms', duration: '1.06s' },
  { wave: 3, glyph: '✧', color: '#DCEBFF', size: '.54rem', dx: '-5.85rem', dy: '1.85rem', rotation: -72, delay: '446ms', duration: '1s' },
  { wave: 3, glyph: '♥', color: '#FFD9E4', size: '.74rem', dx: '-5.15rem', dy: '2.9rem', rotation: -32, delay: '490ms', duration: '1.12s' },
  { wave: 3, glyph: '♥', color: '#FFE27A', size: '.7rem', dx: '5.35rem', dy: '2.7rem', rotation: 38, delay: '522ms', duration: '1.08s' },
  { wave: 3, glyph: 'dot', color: '#FFF7DC', size: '.46rem', dx: '1.2rem', dy: '-6.4rem', rotation: 0, delay: '458ms', duration: '1.02s' },
  { wave: 4, glyph: '★', color: '#FFF0A9', size: '.9rem', dx: '-6.9rem', dy: '-5.1rem', rotation: 48, delay: '660ms', duration: '1.12s' },
  { wave: 4, glyph: '★', color: '#E8D8FF', size: '.84rem', dx: '7.45rem', dy: '-4.8rem', rotation: -54, delay: '688ms', duration: '1.08s' },
  { wave: 4, glyph: '✦', color: '#DCEBFF', size: '.64rem', dx: '0rem', dy: '-9.8rem', rotation: 70, delay: '672ms', duration: '1.14s' },
  { wave: 4, glyph: '✦', color: '#FFF9DF', size: '.62rem', dx: '-9.25rem', dy: '-1.2rem', rotation: -42, delay: '704ms', duration: '1.06s' },
  { wave: 4, glyph: '✧', color: '#FFF7DC', size: '.56rem', dx: '10.8rem', dy: '.7rem', rotation: 64, delay: '716ms', duration: '1.02s' },
  { wave: 4, glyph: '✧', color: '#FFD4DF', size: '.54rem', dx: '-5.8rem', dy: '6.2rem', rotation: -68, delay: '681ms', duration: '1.04s' },
  { wave: 4, glyph: '♥', color: '#FFD9E4', size: '.68rem', dx: '6.2rem', dy: '5.9rem', rotation: 40, delay: '698ms', duration: '1.06s' },
  { wave: 4, glyph: 'dot', color: '#FFE27A', size: '.42rem', dx: '-8.4rem', dy: '2.5rem', rotation: 0, delay: '667ms', duration: '1.02s' },
  { wave: 4, glyph: 'dot', color: '#FFF0A9', size: '.44rem', dx: '8.7rem', dy: '2.2rem', rotation: 0, delay: '710ms', duration: '1s' },
  { wave: 4, glyph: 'dot', color: '#DCEBFF', size: '.4rem', dx: '1.7rem', dy: '8.6rem', rotation: 0, delay: '690ms', duration: '1.08s' },
] as const

function impactParticleStyle({ color, size, dx, dy, rotation, delay, duration }: ImpactParticle): CSSProperties {
  return {
    '--impact-color': color,
    '--impact-size': size,
    '--impact-x': dx,
    '--impact-y': dy,
    '--impact-rotation': `${rotation}deg`,
    '--impact-start-rotation': `${rotation * .2}deg`,
    '--impact-delay': delay,
    '--impact-duration': duration,
  } as CSSProperties
}

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
      <div className="bottle-hero__ritual-stage" aria-hidden="true">
        <img className="bottle-hero__jar" src={starBottleAssets.jar} alt="" />
        <div className="bottle-hero__collection">
          {visibleStars.map((star, index) => <img key={star.id} className={`bottle-star bottle-star--slot-${index} bottle-star--count-${visibleStars.length}`} src={artForStar(star, index)} alt="" />)}
        </div>
        {droppingStar ? <>
          <img className="bottle-star bottle-star--dropping" src={droppingStar.type === 'mood' ? starBottleAssets.moodStar : starBottleAssets.clearStar} alt="" />
          <div className="bottle-hero__impact" data-testid="star-drop-impact">
            {STAR_DROP_IMPACT_PARTICLES.map((particle, index) => <span className={`bottle-hero__impact-particle bottle-hero__impact-particle--${particle.glyph === 'dot' ? 'dot' : 'glyph'}`} data-testid="star-drop-impact-particle" data-particle-wave={particle.wave} data-particle-glyph={particle.glyph} key={`${particle.glyph}-${index}`} style={impactParticleStyle(particle)}>{particle.glyph === 'dot' ? null : particle.glyph}</span>)}
          </div>
        </> : null}
      </div>
      <p className="bottle-hero__tagline">{t('starBottle.hero.monthlyLabel')}</p>
    </section>
  )
}
