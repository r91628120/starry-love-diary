import { useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { IconButton, SectionHeader, SoftCard } from '../../components'
import { InfoIcon } from '../../components/icons'
import { useI18n } from '../../i18n/I18nContext'
import { usePersistence } from '../../data/PersistenceStateContext'
import { advanceHeartPhraseRitual } from './heartPhraseRitual'
import type { TranslationKey } from '../../i18n/messages'

const MAX_HEART_LINE_LENGTH = 30

interface ContextualHelpReturnState {
  heartLineHelpReturn?: boolean
  heartLineDraft?: { value: string; pressCount: number }
}

export function HeartLineCard() {
  const { locale, t } = useI18n()
  const location = useLocation()
  const navigate = useNavigate()
  const returnState = location.state as ContextualHelpReturnState | null
  const contextualDraft = returnState?.heartLineHelpReturn ? returnState.heartLineDraft : undefined
  const [value, setValue] = useState(() => contextualDraft?.value ?? '')
  const [pressCount, setPressCount] = useState(() => contextualDraft?.pressCount ?? 0)
  const [feedback, setFeedback] = useState<{ key: TranslationKey; current?: number }>()
  const [editingId, setEditingId] = useState<string>()
  const [isSaving, setIsSaving] = useState(false)
  const savingRef = useRef(false)
  const persistence = usePersistence()

  async function submit() {
    if (!persistence || !value.trim()) return
    if (editingId) {
      if (savingRef.current) return
      savingRef.current = true
      setIsSaving(true)
      try {
        await persistence.updateHeartPhrase(editingId, value)
        setEditingId(undefined)
        setFeedback({ key: 'today.heartLine.feedback' })
        setValue('')
      } catch {
        setFeedback({ key: 'today.heartLine.error' })
      } finally {
        savingRef.current = false
        setIsSaving(false)
      }
      return
    }

    const ritual = advanceHeartPhraseRitual(pressCount)
    if (!ritual.accepted) {
      setPressCount(ritual.nextPresses)
      setFeedback(undefined)
      return
    }

    if (savingRef.current) return
    savingRef.current = true
    setIsSaving(true)
    try {
        await persistence.acceptHeartPhrase(value)
        setPressCount(0)
        setFeedback({ key: 'today.heartLine.feedback' })
      setValue('')
    } catch {
      setFeedback({ key: 'today.heartLine.error' })
    } finally {
      savingRef.current = false
      setIsSaving(false)
    }
  }

  const openHelp = () => navigate('/settings/help', {
    state: { from: '/today', guideTarget: 'today', heartLineDraft: { value, pressCount } },
  })

  return (
    <SoftCard className="heart-line-card">
      <SectionHeader icon={<span className="section-symbol" aria-hidden="true">♥</span>} title={t('today.heartLine.title')} titleAction={<IconButton className="heart-line-card__help" ariaLabel={t('today.heartLine.help')} onClick={openHelp}><InfoIcon /></IconButton>} action={<span className="heart-line-card__limit">{t('today.heartLine.maxLength', { max: MAX_HEART_LINE_LENGTH })}</span>} />
      <label className="sr-only" htmlFor="heart-line-input">{t('today.heartLine.placeholder')}</label>
      <textarea id="heart-line-input" value={value} maxLength={MAX_HEART_LINE_LENGTH} placeholder={t('today.heartLine.placeholder')} onChange={(event) => setValue(event.target.value.slice(0, MAX_HEART_LINE_LENGTH))} />
      <div className="heart-line-card__footer">
        <span aria-live="polite">{new Intl.NumberFormat(locale).format(value.length)} / {new Intl.NumberFormat(locale).format(MAX_HEART_LINE_LENGTH)}</span>
        <span className="heart-line-card__ritual-progress" data-testid="heart-line-ritual-progress" aria-live="polite">{editingId ? '' : t('today.heartLine.progress', { current: new Intl.NumberFormat(locale).format(pressCount) })}</span>
        <IconButton className={pressCount > 0 ? 'heart-line-card__heart heart-line-card__heart--active' : 'heart-line-card__heart'} ariaLabel={editingId ? t('today.heartLine.saveEdit') : t('today.heartLine.heart')} data-ritual-progress={pressCount} disabled={isSaving} onClick={submit}><span className="heart-line-card__heart-glyph" data-testid="heart-line-icon" aria-hidden="true">♥</span></IconButton>
      </div>
      <p className="mock-feedback" aria-live="polite">{feedback ? t(feedback.key, feedback.current === undefined ? undefined : { current: new Intl.NumberFormat(locale).format(feedback.current) }) : ''}</p>
      {persistence?.heartPhrases.length ? <ul className="heart-line-card__phrases">
        {persistence.heartPhrases.map((phrase) => <li key={phrase.id}><span>{phrase.content}</span><span><button type="button" onClick={() => { setEditingId(phrase.id); setValue(phrase.content); setPressCount(0) }}>{t('today.heartLine.edit')}</button><button type="button" onClick={() => persistence.deleteHeartPhrase(phrase.id)}>{t('today.heartLine.delete')}</button></span></li>)}
      </ul> : null}
    </SoftCard>
  )
}
