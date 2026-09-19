import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { PageHeader, SoftCard } from '../components'
import { APP_VERSION } from '../app/appMetadata'
import { useI18n } from '../i18n/I18nContext'
import type { TranslationKey } from '../i18n/messages'
import '../features/settings/settings.css'

export type SettingsInformationKind = 'help' | 'star-heart' | 'star-bottle-help' | 'data-help' | 'privacy' | 'terms' | 'version'

const helpItems: Array<{ title: TranslationKey; body: TranslationKey }> = [
  { title: 'settings.guide.today.title', body: 'settings.guide.today.body' },
  { title: 'settings.guide.bottle.title', body: 'settings.guide.bottle.body' },
  { title: 'settings.guide.footprints.title', body: 'settings.guide.footprints.body' },
  { title: 'settings.guide.our.title', body: 'settings.guide.our.body' },
  { title: 'settings.guide.clear.title', body: 'settings.guide.clear.body' },
  { title: 'settings.guide.data.title', body: 'settings.guide.data.body' },
]

const starHeartRules: TranslationKey[] = [
  'settings.info.starHeart.dailyOpen', 'settings.info.starHeart.diary', 'settings.info.starHeart.mood',
  'settings.info.starHeart.organize', 'settings.info.starHeart.quote', 'settings.info.starHeart.otherClear',
]

const dataManagementSections: Array<{ title: TranslationKey; body: TranslationKey; points: TranslationKey[] }> = [
  { title: 'settings.info.data.exportText.title', body: 'settings.info.data.exportText.body', points: ['settings.info.data.exportText.point1', 'settings.info.data.exportText.point2', 'settings.info.data.exportText.point3'] },
  { title: 'settings.info.data.exportApp.title', body: 'settings.info.data.exportApp.body', points: ['settings.info.data.exportApp.point1', 'settings.info.data.exportApp.point2', 'settings.info.data.exportApp.point3'] },
  { title: 'settings.info.data.importApp.title', body: 'settings.info.data.importApp.body', points: ['settings.info.data.importApp.point1', 'settings.info.data.importApp.point2', 'settings.info.data.importApp.point3', 'settings.info.data.importApp.point4'] },
  { title: 'settings.info.data.photos.title', body: 'settings.info.data.photos.body', points: [] },
]

const privacySections: Array<{ title: TranslationKey; body: TranslationKey }> = [
  { title: 'settings.info.privacy.records.title', body: 'settings.info.privacy.records.body' },
  { title: 'settings.info.privacy.storage.title', body: 'settings.info.privacy.storage.body' },
  { title: 'settings.info.privacy.photos.title', body: 'settings.info.privacy.photos.body' },
  { title: 'settings.info.privacy.transfer.title', body: 'settings.info.privacy.transfer.body' },
  { title: 'settings.info.privacy.tracking.title', body: 'settings.info.privacy.tracking.body' },
  { title: 'settings.info.privacy.management.title', body: 'settings.info.privacy.management.body' },
  { title: 'settings.info.privacy.updates.title', body: 'settings.info.privacy.updates.body' },
]

const termsSections: Array<{ title: TranslationKey; body: TranslationKey }> = [
  { title: 'settings.info.terms.purpose.title', body: 'settings.info.terms.purpose.body' },
  { title: 'settings.info.terms.advice.title', body: 'settings.info.terms.advice.body' },
  { title: 'settings.info.terms.content.title', body: 'settings.info.terms.content.body' },
  { title: 'settings.info.terms.storage.title', body: 'settings.info.terms.storage.body' },
  { title: 'settings.info.terms.transfer.title', body: 'settings.info.terms.transfer.body' },
  { title: 'settings.info.terms.changes.title', body: 'settings.info.terms.changes.body' },
  { title: 'settings.info.terms.updates.title', body: 'settings.info.terms.updates.body' },
]

const titleByKind: Record<SettingsInformationKind, TranslationKey> = {
  help: 'settings.help.usingApp', 'star-heart': 'settings.help.starHeart', 'star-bottle-help': 'settings.help.starBottle',
  'data-help': 'settings.help.data', privacy: 'settings.about.privacyPolicy', terms: 'settings.about.terms', version: 'settings.version.title',
}

export function SettingsInformationPage({ kind }: { kind: SettingsInformationKind }) {
  const { t } = useI18n()
  const location = useLocation()
  const todayGuideRef = useRef<HTMLDetailsElement>(null)
  const contextualState = location.state as { from?: string; guideTarget?: string; heartLineDraft?: { value: string; pressCount: number } } | null
  const isContextualTodayGuide = kind === 'help' && contextualState?.from === '/today' && contextualState.guideTarget === 'today'

  useEffect(() => {
    if (!isContextualTodayGuide) return
    const guide = todayGuideRef.current
    guide?.scrollIntoView?.({ block: 'start' })
    guide?.querySelector('summary')?.focus({ preventScroll: true })
  }, [isContextualTodayGuide])

  const contextualBackState = isContextualTodayGuide ? { heartLineHelpReturn: true, heartLineDraft: contextualState?.heartLineDraft } : undefined
  return <div className="app-shell"><div className="page page--settings settings-page settings-information-page">
    <PageHeader titleKey={titleByKind[kind]} variant="secondary" backFallback="/settings" backState={contextualBackState} />
    <main className="page__content settings-page__content">
      {kind === 'help' ? <InfoCard intro="settings.guide.intro"><div className="settings-user-guide">{helpItems.map((item) => <details key={item.title} ref={item.title === 'settings.guide.today.title' ? todayGuideRef : undefined} className="settings-user-guide__section" open={item.title === 'settings.guide.today.title' && isContextualTodayGuide ? true : undefined}><summary>{t(item.title)}</summary><GuideBody value={t(item.body)} /></details>)}</div></InfoCard> : null}
      {kind === 'star-heart' ? <InfoCard intro="settings.info.starHeart.intro"><ul className="settings-info-rules">{starHeartRules.map((rule) => <li key={rule}>{t(rule)}</li>)}</ul><p className="settings-info-note">{t('settings.info.starHeart.notScore')}</p></InfoCard> : null}
      {kind === 'star-bottle-help' ? <InfoCard intro="settings.info.starBottle.intro"><dl className="settings-info-list"><div><dt>{t('settings.info.starBottle.mood.title')}</dt><dd>{t('settings.info.starBottle.mood.body')}</dd></div><div><dt>{t('settings.info.starBottle.clear.title')}</dt><dd>{t('settings.info.starBottle.clear.body')}</dd></div></dl><p className="settings-info-note">{t('settings.info.starBottle.different')}</p></InfoCard> : null}
      {kind === 'data-help' ? <InfoCard><InformationSections sections={dataManagementSections} listClassName="settings-info-bullets" /></InfoCard> : null}
      {kind === 'privacy' ? <InfoCard><p className="settings-information-card__updated">{t('settings.info.privacy.updated')}</p><InformationSections sections={privacySections} /></InfoCard> : null}
      {kind === 'terms' ? <InfoCard><p className="settings-information-card__updated">{t('settings.info.terms.updated')}</p><InformationSections sections={termsSections} /></InfoCard> : null}
      {kind === 'version' ? <InfoCard><dl className="settings-info-list settings-info-list--version"><div><dt>{t('settings.info.version.app')}</dt><dd>{t('app.brand')}</dd><dd className="settings-info-list__secondary">{t('settings.info.version.englishName')}</dd></div><div><dt>{t('settings.info.version.number')}</dt><dd>{APP_VERSION}</dd></div></dl><p>{t('settings.info.version.description')}</p><p className="settings-info-copyright">{t('settings.info.version.copyright')}</p></InfoCard> : null}
    </main>
  </div></div>
}

function GuideBody({ value }: { value: string }) {
  return <div className="settings-user-guide__body">{value.split('\n\n').map((block) => {
    const [heading, ...lines] = block.split('\n')
    return <section key={heading}><h3>{heading}</h3><p>{lines.join('\n')}</p></section>
  })}</div>
}

function InformationSections({ sections, listClassName }: { sections: Array<{ title: TranslationKey; body: TranslationKey; points?: TranslationKey[] }>; listClassName?: string }) {
  const { t } = useI18n()
  return <dl className="settings-info-list">{sections.map((section) => <div key={section.title}><dt>{t(section.title)}</dt><dd>{t(section.body)}</dd>{section.points?.length ? <ul className={listClassName}>{section.points.map((point) => <li key={point}>{t(point)}</li>)}</ul> : null}</div>)}</dl>
}

function InfoCard({ intro, children }: { intro?: TranslationKey; children: React.ReactNode }) {
  const { t } = useI18n()
  return <SoftCard className="settings-information-card"><div className="settings-information-card__body">{intro ? <p className="settings-information-card__intro">{t(intro)}</p> : null}{children}</div></SoftCard>
}
