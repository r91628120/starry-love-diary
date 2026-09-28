import { useState } from 'react'
import { ConfirmDialog, PrimaryButton, SecondaryButton, SoftCard } from '../../components'
import { usePersistence } from '../../data/PersistenceStateContext'
import { useI18n } from '../../i18n/I18nContext'
import { EXTERNAL_AI_HANDOFF_CONSENT_VERSION, type ExternalAiDestination, copyLoveBrainAiHandoffText, openExternalAiDestination } from '../../services/loveBrainAiHandoff'

/** Shared, clipboard-first external-AI action row for a single completed Clear record. */
export function ClearAiHandoff({ buildText, presentation = 'result' }: { buildText: () => string; presentation?: 'result' | 'freeTalk' }) {
  const { t } = useI18n()
  const persistence = usePersistence()
  const [requestedAction, setRequestedAction] = useState<ExternalAiDestination | 'copy'>()
  const [retryDestination, setRetryDestination] = useState<ExternalAiDestination>()
  const [feedback, setFeedback] = useState('')
  const consented = persistence?.settings.externalAiHandoffConsentVersion === EXTERNAL_AI_HANDOFF_CONSENT_VERSION

  async function perform(action: ExternalAiDestination | 'copy') {
    const copied = await copyLoveBrainAiHandoffText(buildText())
    if (!copied) { setFeedback(t('clear.ai.copyFailed')); return }
    if (action === 'copy') { setFeedback(t('clear.ai.copied')); return }
    const openResult = openExternalAiDestination(action)
    if (openResult === 'failed') { setRetryDestination(action); setFeedback(t('clear.ai.openFailed', { provider: action === 'chatgpt' ? 'ChatGPT' : 'Gemini' })); return }
    setFeedback(t('clear.ai.opened', { provider: action === 'chatgpt' ? 'ChatGPT' : 'Gemini' }))
  }
  function request(action: ExternalAiDestination | 'copy') {
    setFeedback('')
    if (consented) void perform(action)
    else setRequestedAction(action)
  }
  async function confirm() {
    if (!requestedAction || !persistence) return
    await persistence.updateSettings({ externalAiHandoffConsentVersion: EXTERNAL_AI_HANDOFF_CONSENT_VERSION })
    const action = requestedAction
    setRequestedAction(undefined)
    await perform(action)
  }
  const isFreeTalk = presentation === 'freeTalk'
  return <SoftCard className={`clear-ai-handoff ${isFreeTalk ? 'clear-ai-handoff--free-talk' : ''}`.trim()} tone="blue">
    <h3>{t(isFreeTalk ? 'clear.freeTalk.ai.title' : 'clear.ai.title')}</h3><p>{t(isFreeTalk ? 'clear.freeTalk.ai.body' : 'clear.ai.body')}</p><p>{t('clear.ai.steps')}</p><p>{t('clear.ai.reminder')}</p>
    <div className="clear-flow__actions">
      <SecondaryButton onClick={() => request('copy')}>{t(isFreeTalk ? 'clear.freeTalk.ai.copy' : 'clear.ai.copy')}</SecondaryButton>
      <PrimaryButton onClick={() => request('chatgpt')}>{t('clear.ai.chatgpt')}</PrimaryButton>
      <SecondaryButton onClick={() => request('gemini')}>{t('clear.ai.gemini')}</SecondaryButton>
    </div>
    {feedback ? <p role="status">{feedback}</p> : null}
    {retryDestination ? <SecondaryButton onClick={() => { const destination = retryDestination; setRetryDestination(undefined); void perform(destination) }}>{t('clear.ai.retry')}</SecondaryButton> : null}
    <ConfirmDialog open={Boolean(requestedAction)} title={t('clear.ai.consentTitle')} description={t('clear.ai.consentBody')} confirmLabel={t('clear.ai.consentConfirm')} onConfirm={() => void confirm()} onCancel={() => setRequestedAction(undefined)} />
  </SoftCard>
}
