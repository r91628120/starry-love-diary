import { useNavigate } from 'react-router-dom'
import { useI18n } from '../../i18n/I18nContext'

export function LoveDeliveryEntryCard() {
  const { t } = useI18n()
  const navigate = useNavigate()
  return <section className="love-delivery-entry" aria-labelledby="love-delivery-entry-title"><button type="button" onClick={() => navigate('/our/love-delivery', { state: { from: '/our' } })}><span><strong id="love-delivery-entry-title">{t('our.loveDelivery.entryTitle')}</strong><b>{t('our.loveDelivery.entrySubtitle')}</b><small>{t('our.loveDelivery.entryBody')}</small></span><i aria-hidden="true">›</i></button></section>
}
