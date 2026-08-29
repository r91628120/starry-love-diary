import { useState } from 'react'
import { ourAssets } from '../../assets/uiAssets'
import { ConfirmDialog, PrimaryButton, SecondaryButton, SectionHeader, SoftCard } from '../../components'
import { useI18n } from '../../i18n/I18nContext'

export function MessageCard() {
  const { t } = useI18n(); const initial = t('our.message.content'); const [message, setMessage] = useState(initial); const [editing, setEditing] = useState(false); const [confirming, setConfirming] = useState(false); const [feedback, setFeedback] = useState('')
  return <SoftCard className="our-message"><SectionHeader title={t('our.message.title')} icon={<img src={ourAssets.message.edit} alt="" />} />
    {editing ? <textarea aria-label={t('our.message.editLabel')} maxLength={300} value={message} onChange={(event) => setMessage(event.target.value.slice(0, 300))} /> : <p>{message || t('our.message.empty')}</p>}
    <span className="our-message__count">{t('our.message.characterCount', { current: message.length, max: 300 })}</span>
    <div className="our-message__actions"><SecondaryButton onClick={() => setEditing((value) => !value)}>{t(editing ? 'our.message.done' : 'our.message.edit')}</SecondaryButton><SecondaryButton onClick={() => setConfirming(true)}>{t('our.message.clear')}</SecondaryButton><PrimaryButton onClick={() => setFeedback(t('our.message.shareFeedback'))}>{t('our.message.share')}</PrimaryButton></div><p className="mock-feedback" aria-live="polite">{feedback}</p>
    <ConfirmDialog open={confirming} title={t('our.message.clearConfirmTitle')} description={t('our.message.clearConfirmBody')} onCancel={() => setConfirming(false)} onConfirm={() => { setMessage(''); setConfirming(false) }} />
  </SoftCard>
}
