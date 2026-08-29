import { ourAssets } from '../../assets/uiAssets'
import { SectionHeader, SoftCard } from '../../components'
import { useI18n } from '../../i18n/I18nContext'

export function ImportantDatesCard() {
  const { t } = useI18n()
  const dates = [
    { icon: ourAssets.importantDates.birthday, title: t('our.importantDates.birthday'), date: t('our.importantDates.birthdayDate'), status: t('our.importantDates.birthdayStatus') },
    { icon: ourAssets.importantDates.anniversary, title: t('our.importantDates.metDate'), date: t('our.importantDates.metDateValue'), status: t('our.importantDates.metDateStatus') },
    { icon: ourAssets.importantDates.anniversary, title: t('our.importantDates.anniversary'), date: t('our.importantDates.anniversaryDate'), status: t('our.importantDates.anniversaryStatus') },
  ]
  return <SoftCard className="important-dates"><SectionHeader title={t('our.importantDates.title')} /><div className="important-dates__list">{dates.map((item) => <article className="important-date" key={item.title}><img src={item.icon} alt="" /><div><strong>{item.title}</strong><time>{item.date}</time><span>{item.status}</span></div></article>)}</div></SoftCard>
}
