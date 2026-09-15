import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { settingsAssets } from '../../assets/uiAssets'
import { PrimaryButton, SecondaryButton, SoftCard } from '../../components'
import { usePersistence } from '../../data/PersistenceStateContext'
import { useI18n } from '../../i18n/I18nContext'
import type { Locale, TranslationKey } from '../../i18n/messages'

const locales: Array<{ locale: Locale; labelKey: TranslationKey }> = [
  { locale: 'zh-TW', labelKey: 'settings.language.zh' },
  { locale: 'en', labelKey: 'settings.language.en' },
  { locale: 'ja', labelKey: 'settings.language.ja' },
  { locale: 'ko', labelKey: 'settings.language.ko' },
  { locale: 'es', labelKey: 'settings.language.es' },
  { locale: 'fr', labelKey: 'settings.language.fr' },
]

const nicknameLimit = 20

export function OnboardingFlow() {
  const { locale, setLocale, t } = useI18n()
  const persistence = usePersistence()
  const navigate = useNavigate()
  const [step, setStep] = useState<1 | 2>(1)
  const [userNickname, setUserNickname] = useState('')
  const [otherNickname, setOtherNickname] = useState('')
  const [feedbackKey, setFeedbackKey] = useState<TranslationKey>()
  const [saving, setSaving] = useState(false)
  const number = new Intl.NumberFormat(locale)

  const selectLocale = (nextLocale: Locale) => {
    setLocale(nextLocale)
    if (persistence) {
      void persistence.updateSettings({ locale: nextLocale }).catch(() => setFeedbackKey('onboarding.feedback.saveError'))
    }
  }

  const validateNicknames = () => {
    if (!userNickname.trim() || !otherNickname.trim()) {
      setFeedbackKey('onboarding.validation.required')
      return false
    }
    if ([...userNickname.trim()].length > nicknameLimit || [...otherNickname.trim()].length > nicknameLimit) {
      setFeedbackKey('onboarding.validation.maxLength')
      return false
    }
    setFeedbackKey(undefined)
    return true
  }

  const goNext = () => {
    if (validateNicknames()) setStep(2)
  }

  const complete = async () => {
    if (!validateNicknames() || !persistence || saving) return
    setSaving(true)
    try {
      await persistence.updateProfile('user', { nickname: userNickname.trim() })
      await persistence.updateProfile('partner', { nickname: otherNickname.trim() })
      await persistence.updateSettings({ onboardingCompleted: true, dailyLoveQuoteActivationDate: persistence.currentLocalDate })
      navigate('/today', { replace: true })
    } catch {
      setFeedbackKey('onboarding.feedback.saveError')
      setSaving(false)
    }
  }

  const stepLabel = t('onboarding.step', { current: number.format(step), total: number.format(2) })
  const characterCount = (value: string) => t('onboarding.characterCount', {
    current: number.format([...value].length),
    max: number.format(nicknameLimit),
  })

  return <main className="onboarding-page__content">
    <header className="onboarding-hero">
      <img src={settingsAssets.star} alt="" aria-hidden="true" />
      <div>
        <h1>{t('onboarding.title')}</h1>
        <p>{t('onboarding.subtitle')}</p>
      </div>
    </header>

    <div className="onboarding-language" role="group" aria-label={t('onboarding.language.label')}>
      {locales.map((item) => <button type="button" key={item.locale} aria-pressed={locale === item.locale} className={locale === item.locale ? 'is-active' : ''} onClick={() => selectLocale(item.locale)}>{t(item.labelKey)}</button>)}
    </div>

    <p className="onboarding-step" aria-label={stepLabel}>{stepLabel}</p>

    {step === 1 ? <SoftCard className="onboarding-card" tone="pink">
      <h2>{t('onboarding.nickname.title')}</h2>
      <p>{t('onboarding.nickname.description')}</p>
      <div className="onboarding-fields">
        <label>
          <span>{t('onboarding.myNickname.label')}</span>
          <input autoComplete="nickname" maxLength={nicknameLimit} aria-label={t('onboarding.myNickname.label')} aria-invalid={feedbackKey === 'onboarding.validation.required' && !userNickname.trim()} placeholder={t('onboarding.myNickname.placeholder')} value={userNickname} onChange={(event) => setUserNickname(event.target.value)} />
          <small>{characterCount(userNickname)}</small>
        </label>
        <label>
          <span>{t('onboarding.otherNickname.label')}</span>
          <input maxLength={nicknameLimit} aria-label={t('onboarding.otherNickname.label')} aria-invalid={feedbackKey === 'onboarding.validation.required' && !otherNickname.trim()} placeholder={t('onboarding.otherNickname.placeholder')} value={otherNickname} onChange={(event) => setOtherNickname(event.target.value)} />
          <small>{characterCount(otherNickname)}</small>
        </label>
      </div>
      <p className="onboarding-helper">{t('onboarding.nickname.helper')}</p>
      <div className="onboarding-actions onboarding-actions--end">
        <PrimaryButton onClick={goNext}>{t('onboarding.next')} <span aria-hidden="true">→</span></PrimaryButton>
      </div>
    </SoftCard> : <SoftCard className="onboarding-card" tone="blue">
      <h2>{t('onboarding.photo.title')}</h2>
      <p>{t('onboarding.photo.description')}</p>
      <div className="onboarding-photos">
        <figure>
          <img src={settingsAssets.star} alt={t('onboarding.photo.myAlt')} />
          <figcaption><strong>{t('onboarding.photo.myLabel')}</strong><small>{t('onboarding.fallback.photo')}</small></figcaption>
        </figure>
        <figure>
          <img src={settingsAssets.star} alt={t('onboarding.photo.otherAlt')} />
          <figcaption><strong>{t('onboarding.photo.otherLabel')}</strong><small>{t('onboarding.fallback.photo')}</small></figcaption>
        </figure>
      </div>
      <p className="onboarding-helper">{t('onboarding.photo.optional')}</p>
      <div className="onboarding-actions">
        <SecondaryButton onClick={() => setStep(1)}><span aria-hidden="true">←</span> {t('onboarding.back')}</SecondaryButton>
        <SecondaryButton onClick={() => void complete()} disabled={saving}>{t('onboarding.skip')}</SecondaryButton>
        <PrimaryButton onClick={() => void complete()} disabled={saving}>{saving ? t('onboarding.saving') : t('onboarding.complete')}</PrimaryButton>
      </div>
    </SoftCard>}

    <p className="onboarding-feedback" role={feedbackKey ? 'alert' : undefined} aria-live="polite">{feedbackKey ? t(feedbackKey) : ''}</p>
  </main>
}
