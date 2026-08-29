import { starBottleAssets } from '../../assets/uiAssets'
import { useI18n } from '../../i18n/I18nContext'

const bottleStars = [
  { src: starBottleAssets.pinkStars.smile, className: 'bottle-star--pink-one' },
  { src: starBottleAssets.pinkStars.heart, className: 'bottle-star--pink-two' },
  { src: starBottleAssets.pinkStars.wave, className: 'bottle-star--pink-three' },
  { src: starBottleAssets.blueStars.calm, className: 'bottle-star--blue-one' },
  { src: starBottleAssets.blueStars.peace, className: 'bottle-star--blue-two' },
  { src: starBottleAssets.blueStars.think, className: 'bottle-star--blue-three' },
] as const

export function BottleHeroCard() {
  const { t } = useI18n()

  return (
    <section className="bottle-hero" aria-label={t('starBottle.hero.label')}>
      <img className="bottle-hero__scene" src={starBottleAssets.hero} alt="" aria-hidden="true" />
      <img className="bottle-hero__sparkles" src={starBottleAssets.decorations} alt="" aria-hidden="true" />
      <div className="bottle-hero__collection" aria-hidden="true">
        {bottleStars.map((star) => <img key={star.className} className={`bottle-star ${star.className}`} src={star.src} alt="" />)}
      </div>
      <p className="bottle-hero__tagline">{t('starBottle.hero.tagline')}</p>
    </section>
  )
}
