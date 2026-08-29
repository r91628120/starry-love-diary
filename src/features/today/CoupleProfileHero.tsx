import { SoftCard } from '../../components'
import { starBottleAssets, todayAssets } from '../../assets/uiAssets'
import { useI18n } from '../../i18n/I18nContext'
import { usePersistence } from '../../data/PersistenceStateContext'

function StarHeartValue() {
  const { t } = useI18n()
  const persistence = usePersistence()
  const total = persistence?.starHeartTotal ?? 0

  return (
    <div className="star-heart" aria-label={`${t('today.starHeartValue')} ${total}`}>
      <img className="star-heart__art" src={todayAssets.starHeart} alt="" aria-hidden="true" />
      <span className="star-heart__label">{t('today.starHeartValue')}</span>
      <strong>{total}</strong>
    </div>
  )
}

function ProfilePortrait({ src, frameSrc, alt, name, tone }: { src: string; frameSrc: string; alt: string; name: string; tone: 'pink' | 'blue' }) {
  return (
    <figure className={`profile-portrait profile-portrait--${tone}`}>
      <div className="profile-portrait__visual">
        <img className="profile-portrait__photo" src={src} alt={alt} />
        <img className="profile-portrait__frame-art" src={frameSrc} alt="" aria-hidden="true" />
      </div>
      <figcaption>{name}</figcaption>
    </figure>
  )
}

export function CoupleProfileHero() {
  const { t } = useI18n()
  const persistence = usePersistence()

  return (
    <SoftCard className="couple-profile-hero" tone="pink">
      <img className="couple-profile-hero__decoration couple-profile-hero__decoration--flower" src={todayAssets.decorations.pinkFlower} alt="" aria-hidden="true" />
      <img className="couple-profile-hero__decoration couple-profile-hero__decoration--sparkles" src={todayAssets.decorations.blueGoldSparkles} alt="" aria-hidden="true" />
      <ProfilePortrait src={starBottleAssets.profilePlaceholders.blue} frameSrc={todayAssets.profileFrameBlue} alt={t('today.profile.meAlt')} name={persistence?.userProfile.nickname ?? t('today.profile.meName')} tone="blue" />
      <StarHeartValue />
      <ProfilePortrait src={starBottleAssets.profilePlaceholders.pink} frameSrc={todayAssets.profileFramePink} alt={t('today.profile.partnerAlt')} name={persistence?.partnerProfile.nickname ?? t('today.profile.partnerName')} tone="pink" />
    </SoftCard>
  )
}
