import { footprintsAssets } from '../../assets/uiAssets'
import { useI18n } from '../../i18n/I18nContext'

interface PhotoThumbnailProps { position?: 'left' | 'center' | 'right'; className?: string }

export function PhotoThumbnail({ position = 'center', className = '' }: PhotoThumbnailProps) {
  const { t } = useI18n()
  return (
    <div className={`footprints-photo ${className}`.trim()}>
      <img className={`footprints-photo__image footprints-photo__image--${position}`} src={footprintsAssets.hero} alt={t('footprints.photo.mockAlt')} />
      <img className="footprints-photo__frame" src={footprintsAssets.photoFrame} alt="" aria-hidden="true" />
    </div>
  )
}
