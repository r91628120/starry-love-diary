import { SoftCard } from '../../components'
import { useI18n } from '../../i18n/I18nContext'

const pointRules = [
  ['starBottle.starHeartHelp.dailyOpen', '+1'],
  ['starBottle.starHeartHelp.mood', '+2'],
  ['starBottle.starHeartHelp.organize', '+5'],
  ['starBottle.starHeartHelp.diary', '+7'],
  ['starBottle.starHeartHelp.quote', '+10'],
] as const

export function StarBottleHelpCard() {
  const { t } = useI18n()

  return (
    <SoftCard className="star-bottle-help" tone="cream">
      <details className="star-bottle-help__disclosure">
        <summary>
          <span aria-hidden="true">✨</span>
          <span>{t('starBottle.help.title')}</span>
          <span className="star-bottle-help__chevron" aria-hidden="true">⌄</span>
        </summary>
        <div className="star-bottle-help__content">
          <p>{t('starBottle.help.intro')}</p>
          <section>
            <h2>{t('starBottle.help.moodTitle')}</h2>
            <p>{t('starBottle.help.moodBody')}</p>
          </section>
          <section>
            <h2>{t('starBottle.help.clearTitle')}</h2>
            <p>{t('starBottle.help.clearBody')}</p>
          </section>
          <section>
            <h2>{t('starBottle.help.rangeTitle')}</h2>
            <p>{t('starBottle.help.rangeBody')}</p>
          </section>
          <details className="star-bottle-help__score-disclosure">
            <summary>
              <span>{t('starBottle.starHeartHelp.title')}</span>
              <span className="star-bottle-help__chevron" aria-hidden="true">⌄</span>
            </summary>
            <div className="star-bottle-help__score-content">
              <p><strong>{t('starBottle.starHeartHelp.intro')}</strong></p>
              <p>{t('starBottle.starHeartHelp.body')}</p>
              <ul>
                {pointRules.map(([key, points]) => <li key={key}><span>{t(key)}</span><strong>{points}</strong></li>)}
              </ul>
              <p>{t('starBottle.starHeartHelp.footer')}</p>
            </div>
          </details>
        </div>
      </details>
    </SoftCard>
  )
}
