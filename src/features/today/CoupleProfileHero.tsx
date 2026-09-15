import { ProfilePhotoVisual, SoftCard } from '../../components'
import { starBottleAssets, todayAssets } from '../../assets/uiAssets'
import { useI18n } from '../../i18n/I18nContext'
import { usePersistence } from '../../data/PersistenceStateContext'
import type { PhotoRepository } from '../../data/photo/PhotoRepository'
import { usePhotoObjectUrl } from '../../services/usePhotoObjectUrl'
import type { ProfilePhotoPlacementRepository } from '../../data/photo/ProfilePhotoPlacementRepository'
import type { ProfileKind } from '../../data/types'
import { useProfilePhotoPlacement } from '../../services/useProfilePhotoPlacement'

function StarHeartValue() {
  const { locale, t } = useI18n()
  const persistence = usePersistence()
  const total = persistence?.starHeartTotal ?? 0
  const formattedTotal = new Intl.NumberFormat(locale).format(total)

  return (
    <div className="star-heart" aria-label={t('today.starHeartAria', { score: formattedTotal })}>
      <img className="star-heart__art" src={todayAssets.starHeart} alt="" aria-hidden="true" />
      <span className="star-heart__label">{t('today.starHeartValue')}</span>
      <strong>{formattedTotal}</strong>
    </div>
  )
}

function ProfilePortrait({ kind, placeholderSrc, photoAssetId, repository, placementRepository, frameSrc, alt, name, tone }: { kind: ProfileKind; placeholderSrc: string; photoAssetId?: string; repository?: PhotoRepository; placementRepository?: ProfilePhotoPlacementRepository; frameSrc: string; alt: string; name: string; tone: 'pink' | 'blue' }) {
  const photoUrl = usePhotoObjectUrl(repository, photoAssetId, 'thumbnail')
  const [placement] = useProfilePhotoPlacement(placementRepository, kind, photoAssetId)
  return (
    <figure className={`profile-portrait profile-portrait--${tone}`}>
      <ProfilePhotoVisual className="profile-portrait__visual" photoClassName={`profile-portrait__photo ${photoUrl ? 'profile-portrait__photo--real' : ''}`.trim()} photoUrl={photoUrl} placeholderSrc={placeholderSrc} frameSrc={frameSrc} placement={placement} alt={alt} />
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
      <ProfilePortrait kind="user" placeholderSrc={starBottleAssets.profilePlaceholders.blue} photoAssetId={persistence?.userProfile.photoAssetId} repository={persistence?.repositories.photos} placementRepository={persistence?.repositories.profilePhotoPlacements} frameSrc={todayAssets.profileFrameBlue} alt={t('today.profile.meAlt')} name={persistence?.userProfile.nickname ?? t('today.profile.meName')} tone="blue" />
      <StarHeartValue />
      <ProfilePortrait kind="partner" placeholderSrc={starBottleAssets.profilePlaceholders.pink} photoAssetId={persistence?.partnerProfile.photoAssetId} repository={persistence?.repositories.photos} placementRepository={persistence?.repositories.profilePhotoPlacements} frameSrc={todayAssets.profileFramePink} alt={t('today.profile.partnerAlt')} name={persistence?.partnerProfile.nickname ?? t('today.profile.partnerName')} tone="pink" />
    </SoftCard>
  )
}
