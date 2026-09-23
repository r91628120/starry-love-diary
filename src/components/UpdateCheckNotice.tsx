import { useEffect, useState } from 'react'
import { APP_VERSION } from '../app/appMetadata'
import { useI18n } from '../i18n/I18nContext'
import { checkForSoftUpdate, dismissUpdateVersion, getDismissedUpdateVersion, hasSupportedStoreUrl, openStoreUrl, type UpdateCheckResult } from '../services/updateCheckService'
import { PrimaryButton, SecondaryButton } from './Buttons'

interface UpdateCheckNoticeProps {
  check?: () => Promise<UpdateCheckResult | undefined>
}

export function UpdateCheckNotice({ check }: UpdateCheckNoticeProps) {
  const { t } = useI18n()
  const [update, setUpdate] = useState<UpdateCheckResult>()
  useEffect(() => {
    let active = true
    const runCheck = check ?? (() => checkForSoftUpdate({ currentVersion: APP_VERSION }))
    void runCheck().then((result) => {
      if (active) setUpdate(result && getDismissedUpdateVersion() !== result.latestVersion ? result : undefined)
    }).catch(() => undefined)
    return () => { active = false }
  }, [check])

  if (!update) return null
  const canOpenStore = hasSupportedStoreUrl(update.storeUrl)
  const dismiss = () => {
    dismissUpdateVersion(update.latestVersion)
    setUpdate(undefined)
  }
  const goToUpdate = () => {
    if (!canOpenStore) return
    openStoreUrl(update.storeUrl)
    dismiss()
  }

  return <div className="update-check-notice__backdrop" data-qa12-overlay="update-check" role="presentation"><section className="update-check-notice" role="dialog" aria-modal="true" aria-labelledby="update-check-title" aria-describedby="update-check-description"><h2 id="update-check-title">{t('update.title')}</h2><p id="update-check-description">{t('update.body')}</p><div className="update-check-notice__actions"><SecondaryButton onClick={dismiss}>{t('update.later')}</SecondaryButton>{canOpenStore ? <PrimaryButton onClick={goToUpdate}>{t('update.now')}</PrimaryButton> : null}</div></section></div>
}
