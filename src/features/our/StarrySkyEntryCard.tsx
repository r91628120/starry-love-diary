import { useNavigate } from 'react-router-dom'
import { useI18n } from '../../i18n/I18nContext'

export function StarrySkyEntryCard() {
  const { t } = useI18n()
  const navigate = useNavigate()

  return <section className="starry-sky-entry" aria-labelledby="starry-sky-entry-title">
    <button type="button" className="starry-sky-entry__button" onClick={() => navigate('/our/starry-sky', { state: { from: '/our' } })}>
      <span className="starry-sky-entry__content">
        <span id="starry-sky-entry-title" className="starry-sky-entry__title">{t('our.starrySky.title')}</span>
        <span className="starry-sky-entry__body">{t('our.starrySky.entryDescription')}</span>
      </span>
      <span className="starry-sky-entry__history">{t('our.starrySky.historyPlaceholder')}</span>
      <span className="starry-sky-entry__count">{t('our.starrySky.sharedDiaryCount', { count: 0 })}</span>
    </button>
  </section>
}
