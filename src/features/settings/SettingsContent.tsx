import { useEffect, useState } from 'react'
import { clearAssets, ourAssets, settingsAssets } from '../../assets/uiAssets'
import { ConfirmDialog } from '../../components'
import { usePersistence } from '../../data/PersistenceStateContext'
import { useI18n } from '../../i18n/I18nContext'
import type { Locale } from '../../i18n/messages'
import { SettingsRow, SettingsSection } from './SettingsSection'

const languages: Array<{ locale: Locale; key: 'settings.language.zh' | 'settings.language.en' | 'settings.language.ja' | 'settings.language.ko' | 'settings.language.es' | 'settings.language.fr' }> = [
  { locale: 'zh-TW', key: 'settings.language.zh' }, { locale: 'en', key: 'settings.language.en' }, { locale: 'ja', key: 'settings.language.ja' },
  { locale: 'ko', key: 'settings.language.ko' }, { locale: 'es', key: 'settings.language.es' }, { locale: 'fr', key: 'settings.language.fr' },
]

export function SettingsContent() {
  const { t, locale, setLocale } = useI18n()
  const persistence = usePersistence()
  const [quoteFallback, setQuoteFallback] = useState(true)
  const [dateFallback, setDateFallback] = useState(true)
  const [userNickname, setUserNickname] = useState(persistence?.userProfile.nickname ?? t('settings.profile.meValue'))
  const [partnerNickname, setPartnerNickname] = useState(persistence?.partnerProfile.nickname ?? t('settings.profile.partnerValue'))
  const [reminderTime, setReminderTime] = useState(persistence?.settings.reminderTime ?? '20:00')
  const [confirming, setConfirming] = useState(false)
  const [feedback, setFeedback] = useState('')
  const quoteReminder = persistence?.settings.loveQuoteReminderEnabled ?? quoteFallback
  const dateReminder = persistence?.settings.importantDateReminderEnabled ?? dateFallback
  const mock = () => setFeedback(t('settings.mockFeedback'))

  useEffect(() => { if (persistence) setUserNickname(persistence.userProfile.nickname) }, [persistence, persistence?.userProfile.nickname])
  useEffect(() => { if (persistence) setPartnerNickname(persistence.partnerProfile.nickname) }, [persistence, persistence?.partnerProfile.nickname])

  const persistNickname = async (kind: 'user' | 'partner', nickname: string) => {
    if (!persistence) return
    try { await persistence.updateProfile(kind, { nickname }) } catch { setFeedback(t('settings.mockFeedback')) }
  }
  const toggleQuote = () => persistence ? void persistence.updateSettings({ loveQuoteReminderEnabled: !quoteReminder }) : setQuoteFallback((value) => !value)
  const toggleDate = () => persistence ? void persistence.updateSettings({ importantDateReminderEnabled: !dateReminder }) : setDateFallback((value) => !value)
  const chooseLocale = (nextLocale: Locale) => {
    setLocale(nextLocale)
    if (persistence) void persistence.updateSettings({ locale: nextLocale })
  }

  return <>
    <div className="settings-grid">
      <SettingsSection title={t('settings.profile.title')} icon={settingsAssets.profileMe}>
        <SettingsRow icon={settingsAssets.profileMe} label={t('settings.profile.meName')} control={<input className="settings-text-input" aria-label={t('settings.profile.meName')} maxLength={20} value={userNickname} onChange={(event) => setUserNickname(event.target.value)} onBlur={() => void persistNickname('user', userNickname)} />} />
        <SettingsRow icon={settingsAssets.profilePartner} label={t('settings.profile.partnerName')} control={<input className="settings-text-input" aria-label={t('settings.profile.partnerName')} maxLength={20} value={partnerNickname} onChange={(event) => setPartnerNickname(event.target.value)} onBlur={() => void persistNickname('partner', partnerNickname)} />} />
        <SettingsRow icon={settingsAssets.photo} label={t('settings.profile.mePhoto')} onClick={mock} />
        <SettingsRow icon={settingsAssets.photo} label={t('settings.profile.partnerPhoto')} onClick={mock} />
      </SettingsSection>
      <SettingsSection title={t('settings.dates.title')} icon={settingsAssets.metDate}><SettingsRow icon={settingsAssets.birthdayCake} label={t('settings.dates.birthday')} value={t('settings.dates.birthdayValue')} onClick={mock} /><SettingsRow icon={settingsAssets.metDate} label={t('settings.dates.met')} value={t('settings.dates.metValue')} onClick={mock} /><SettingsRow icon={settingsAssets.anniversary} label={t('settings.dates.anniversary')} value={t('settings.dates.anniversaryValue')} onClick={mock} /></SettingsSection>
      <SettingsSection title={t('settings.memories.title')} icon={settingsAssets.camera}><SettingsRow icon={settingsAssets.memoryWall} label={t('settings.memories.wall')} onClick={mock} /><SettingsRow icon={settingsAssets.moment} label={t('settings.memories.moments')} onClick={mock} /><SettingsRow icon={ourAssets.message.edit} label={t('settings.memories.message')} onClick={mock} /></SettingsSection>
      <SettingsSection title={t('settings.diary.title')} icon={settingsAssets.star}><SettingsRow icon={settingsAssets.star} label={t('settings.diary.stars')} onClick={mock} /><SettingsRow icon={settingsAssets.exportData} label={t('settings.diary.export')} onClick={mock} /><SettingsRow icon={settingsAssets.backup} label={t('settings.diary.backup')} description={t('settings.diary.backupNote')} onClick={mock} /></SettingsSection>
      <SettingsSection title={t('settings.clear.title')} icon={settingsAssets.clearRecord}><SettingsRow icon={settingsAssets.clearRecord} label={t('settings.clear.records')} onClick={mock} /><SettingsRow icon={clearAssets.tools.loveBrainTest} label={t('settings.clear.loveBrain')} onClick={mock} /><SettingsRow icon={clearAssets.tools.boatGuide} label={t('settings.clear.boatGuide')} onClick={mock} /><SettingsRow icon={clearAssets.tools.likeOrHabit} label={t('settings.clear.likeOrHabit')} onClick={mock} /></SettingsSection>
      <SettingsSection title={t('settings.notifications.title')} icon={settingsAssets.notification}>
        <SettingsRow icon={settingsAssets.loveQuoteReminder} label={t('settings.notifications.quote')} control={<button type="button" role="switch" aria-label={t('settings.notifications.quote')} aria-checked={quoteReminder} className={`settings-toggle ${quoteReminder ? 'is-on' : ''}`} onClick={toggleQuote}><span /></button>} />
        <SettingsRow icon={settingsAssets.metDate} label={t('settings.notifications.dates')} control={<button type="button" role="switch" aria-label={t('settings.notifications.dates')} aria-checked={dateReminder} className={`settings-toggle ${dateReminder ? 'is-on' : ''}`} onClick={toggleDate}><span /></button>} />
        <SettingsRow icon={settingsAssets.reminderClock} label={t('settings.notifications.time')} control={<input className="settings-time-input" type="time" aria-label={t('settings.notifications.time')} value={reminderTime} onChange={(event) => { setReminderTime(event.target.value); if (persistence) void persistence.updateSettings({ reminderTime: event.target.value }) }} />} />
      </SettingsSection>
    </div>
    <SettingsSection title={t('settings.language.title')} icon={settingsAssets.language} className="settings-section--wide"><div className="language-options" role="group" aria-label={t('settings.language.title')}>{languages.map((item) => <button type="button" aria-pressed={locale === item.locale} className={locale === item.locale ? 'is-active' : ''} onClick={() => chooseLocale(item.locale)} key={item.locale}>{locale === item.locale ? <span aria-hidden="true">✓</span> : null}{t(item.key)}</button>)}</div></SettingsSection>
    <div className="settings-grid settings-grid--last"><SettingsSection title={t('settings.privacy.title')} icon={settingsAssets.privacy}><SettingsRow icon={settingsAssets.photoPermission} label={t('settings.privacy.photos')} onClick={mock} /><SettingsRow icon={settingsAssets.notificationPermission} label={t('settings.privacy.notifications')} onClick={mock} /><SettingsRow icon={settingsAssets.trash} label={t('settings.privacy.clearData')} danger onClick={() => setConfirming(true)} /></SettingsSection><SettingsSection title={t('settings.about.title')} icon={settingsAssets.info}><SettingsRow icon={settingsAssets.info} label={t('settings.about.version')} value={t('settings.about.versionValue')} /><SettingsRow icon={settingsAssets.privacyPolicy} label={t('settings.about.privacyPolicy')} onClick={mock} /><SettingsRow icon={settingsAssets.terms} label={t('settings.about.terms')} onClick={mock} /></SettingsSection></div>
    <p className="mock-feedback" aria-live="polite">{feedback}</p><img className="settings-footer-decoration" src={settingsAssets.decorations} alt="" />
    <ConfirmDialog open={confirming} title={t('settings.privacy.clearConfirmTitle')} description={t('settings.privacy.clearConfirmBody')} onCancel={() => setConfirming(false)} onConfirm={() => { setConfirming(false); setFeedback(t('settings.privacy.clearMocked')) }} />
  </>
}
