import { useState } from 'react'
import { PageHeader, PrimaryButton, SecondaryButton, SoftCard } from '../components'
import { useI18n } from '../i18n/I18nContext'
import '../features/our/our.css'

type StarrySkyView = 'unpaired' | 'invite' | 'enter-code'

export function StarrySkyPage() {
  const { t } = useI18n()
  const [view, setView] = useState<StarrySkyView>('unpaired')
  const [code, setCode] = useState('')
  const reset = () => { setView('unpaired'); setCode('') }

  return <div className="page our-page starry-sky-page"><PageHeader titleKey="our.starrySky.title" variant="secondary" backFallback="/our" /><main className="our-page__content starry-sky-page__content">
    <SoftCard className="starry-sky-panel" tone="purple">
      {view === 'unpaired' ? <><h2>{t('our.starrySky.unpaired.title')}</h2><p>{t('our.starrySky.unpaired.body')}</p><div className="starry-sky-panel__actions"><PrimaryButton onClick={() => setView('invite')}>{t('our.starrySky.invitePartner')}</PrimaryButton><SecondaryButton onClick={() => setView('enter-code')}>{t('our.starrySky.enterPairingCode')}</SecondaryButton></div></> : null}
      {view === 'invite' ? <><h2>{t('our.starrySky.invite.title')}</h2><p>{t('our.starrySky.invite.body')}</p><SecondaryButton onClick={reset}>{t('common.cancel')}</SecondaryButton></> : null}
      {view === 'enter-code' ? <><h2>{t('our.starrySky.enterCode.title')}</h2><p>{t('our.starrySky.enterCode.body')}</p><label className="starry-sky-panel__code-label" htmlFor="starry-sky-pairing-code">{t('our.starrySky.enterCode.label')}</label><input id="starry-sky-pairing-code" className="starry-sky-panel__code" type="text" inputMode="numeric" maxLength={6} value={code} placeholder={t('our.starrySky.enterCode.placeholder')} onChange={(event) => setCode(event.target.value.replace(/\D/gu, '').slice(0, 6))} /><SecondaryButton onClick={reset}>{t('common.cancel')}</SecondaryButton></> : null}
    </SoftCard>
  </main></div>
}
