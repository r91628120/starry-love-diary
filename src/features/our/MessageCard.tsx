import { useEffect, useState } from 'react'
import { ourAssets } from '../../assets/uiAssets'
import { ConfirmDialog, PrimaryButton, SecondaryButton, SectionHeader, SoftCard } from '../../components'
import { usePersistence } from '../../data/PersistenceStateContext'
import { useI18n } from '../../i18n/I18nContext'

export function MessageCard() {
  const { t } = useI18n()
  const persistence = usePersistence()
  const persistedContent = persistence?.messageToYou?.content ?? ''
  const [draft, setDraft] = useState(persistedContent)
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [feedback, setFeedback] = useState('')

  useEffect(() => { setDraft(persistedContent) }, [persistedContent])

  const save = async () => {
    if (!persistence) return
    try {
      await persistence.saveMessageToYou(draft)
      setEditing(false)
      setFeedback(t('our.actions.saved'))
    } catch (caught) {
      setFeedback(caught instanceof Error ? caught.message : t('our.validation.generic'))
    }
  }

  return <SoftCard className="our-message"><SectionHeader title={t('our.message.title')} icon={<img src={ourAssets.message.edit} alt="" />} />
    {editing ? <textarea aria-label={t('our.message.editLabel')} aria-invalid={[...draft].length > 300} value={draft} onChange={(event) => setDraft(event.target.value)} /> : <p>{persistedContent || t('our.message.empty')}</p>}
    <span className="our-message__count">{t('our.message.characterCount', { current: [...draft].length, max: 300 })}</span>
    <div className="our-message__actions">
      {editing ? <><SecondaryButton onClick={() => { setDraft(persistedContent); setEditing(false); setFeedback('') }}>{t('common.cancel')}</SecondaryButton><PrimaryButton onClick={() => void save()}>{t('our.actions.save')}</PrimaryButton></> : <SecondaryButton onClick={() => { setDraft(persistedContent); setEditing(true); setFeedback('') }}>{t(persistedContent ? 'our.message.edit' : 'our.actions.add')}</SecondaryButton>}
      {persistedContent ? <SecondaryButton onClick={() => setConfirming(true)}>{t('our.message.clear')}</SecondaryButton> : null}
      <PrimaryButton onClick={() => setFeedback(t('our.message.shareFeedback'))}>{t('our.message.share')}</PrimaryButton>
    </div><p className="mock-feedback" aria-live="polite">{feedback}</p>
    <ConfirmDialog open={confirming} title={t('our.message.clearConfirmTitle')} description={t('our.message.clearConfirmBody')} onCancel={() => setConfirming(false)} onConfirm={() => { if (persistence) void persistence.clearMessageToYou(); setConfirming(false); setEditing(false); setFeedback('') }} />
  </SoftCard>
}
