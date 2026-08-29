import { useState } from 'react'
import { IconButton, SectionHeader, SoftCard } from '../../components'
import { HeartIcon } from '../../components/icons'
import { useI18n } from '../../i18n/I18nContext'
import { usePersistence } from '../../data/PersistenceStateContext'
import { HeartPhraseLimitError } from '../../data/repositories/repositories'
import { advanceHeartPhraseRitual } from './heartPhraseRitual'

const MAX_HEART_LINE_LENGTH = 30

export function HeartLineCard() {
  const { t } = useI18n()
  const [value, setValue] = useState(() => t('today.heartLine.content'))
  const [pressCount, setPressCount] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [editingId, setEditingId] = useState<string>()
  const persistence = usePersistence()

  async function submit() {
    if (!persistence || !value.trim()) return
    try {
      if (editingId) {
        await persistence.updateHeartPhrase(editingId, value)
        setEditingId(undefined)
        setFeedback(t('today.heartLine.feedback'))
      } else if (!advanceHeartPhraseRitual(pressCount).accepted) {
        const { nextPresses } = advanceHeartPhraseRitual(pressCount)
        setPressCount(nextPresses)
        setFeedback(t('today.heartLine.progress', { current: nextPresses }))
        return
      } else {
        await persistence.acceptHeartPhrase(value)
        setPressCount(0)
        setFeedback(t('today.heartLine.feedback'))
      }
      setValue('')
    } catch (error) {
      setFeedback(error instanceof HeartPhraseLimitError ? t('today.heartLine.limitReached') : t('today.heartLine.error'))
    }
  }

  return (
    <SoftCard className="heart-line-card">
      <SectionHeader icon={<span className="section-symbol" aria-hidden="true">♥</span>} title={t('today.heartLine.title')} action={<span className="heart-line-card__limit">{t('today.heartLine.maxLength', { max: MAX_HEART_LINE_LENGTH })}</span>} />
      <label className="sr-only" htmlFor="heart-line-input">{t('today.heartLine.placeholder')}</label>
      <textarea id="heart-line-input" value={value} maxLength={MAX_HEART_LINE_LENGTH} placeholder={t('today.heartLine.placeholder')} onChange={(event) => setValue(event.target.value.slice(0, MAX_HEART_LINE_LENGTH))} />
      <div className="heart-line-card__footer">
        <span aria-live="polite">{value.length} / {MAX_HEART_LINE_LENGTH}</span>
        <IconButton className={pressCount > 0 ? 'heart-line-card__heart heart-line-card__heart--active' : 'heart-line-card__heart'} ariaLabel={editingId ? t('today.heartLine.saveEdit') : t('today.heartLine.heart')} onClick={submit}><HeartIcon /></IconButton>
      </div>
      <p className="mock-feedback" aria-live="polite">{feedback}</p>
      {persistence?.heartPhrases.length ? <ul className="heart-line-card__phrases">
        {persistence.heartPhrases.map((phrase) => <li key={phrase.id}><span>{phrase.content}</span><span><button type="button" onClick={() => { setEditingId(phrase.id); setValue(phrase.content); setPressCount(0) }}>{t('today.heartLine.edit')}</button><button type="button" onClick={() => persistence.deleteHeartPhrase(phrase.id)}>{t('today.heartLine.delete')}</button></span></li>)}
      </ul> : null}
    </SoftCard>
  )
}
