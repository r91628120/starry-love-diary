import { useNavigate } from 'react-router-dom'
import { PageHeader, SecondaryButton } from '../components'
import { HeartRevealPhotoEditor } from '../features/settings/HeartRevealPhotoEditor'
import { useI18n } from '../i18n/I18nContext'
import '../features/settings/heartRevealPhotoEditor.css'

export function HeartRevealPhotoPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  return <div className="app-shell"><div className="page page--settings heart-reveal-photo-page"><PageHeader titleKey="today.heartReveal.title" variant="secondary" backFallback="/settings" /><main className="page__content heart-reveal-photo-page__content"><HeartRevealPhotoEditor /><SecondaryButton onClick={() => navigate('/today')}>{t('heartRevealPhoto.returnToHeartPhrases')}</SecondaryButton></main></div></div>
}
