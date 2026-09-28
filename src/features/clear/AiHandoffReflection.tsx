import { useEffect, useState } from 'react'
import { PrimaryButton, SecondaryButton } from '../../components'
import type { AiHandoffReflection as AiHandoffReflectionRecord } from '../../data/clearTypes'
import { MAX_AI_RESPONSE_EXCERPT_CHARACTERS, MAX_POST_CHAT_REFLECTION_CHARACTERS, type AiHandoffReflectionInput } from '../../data/repositories/clearRepositories'
import { useI18n } from '../../i18n/I18nContext'

type Field = 'aiResponseExcerpt' | 'postChatReflection'
const fieldConfig: Record<Field, { title: 'clear.aiReflection.response.title' | 'clear.aiReflection.reflection.title'; body: 'clear.aiReflection.response.body' | 'clear.aiReflection.reflection.body'; add: 'clear.aiReflection.response.add' | 'clear.aiReflection.reflection.add'; maximum: number }> = {
  aiResponseExcerpt: { title: 'clear.aiReflection.response.title', body: 'clear.aiReflection.response.body', add: 'clear.aiReflection.response.add', maximum: MAX_AI_RESPONSE_EXCERPT_CHARACTERS },
  postChatReflection: { title: 'clear.aiReflection.reflection.title', body: 'clear.aiReflection.reflection.body', add: 'clear.aiReflection.reflection.add', maximum: MAX_POST_CHAT_REFLECTION_CHARACTERS },
}

export function AiHandoffReflection({ record, onSave }: { record: AiHandoffReflectionRecord; onSave: (changes: AiHandoffReflectionInput) => Promise<AiHandoffReflectionRecord> }) {
  return <section className="clear-ai-reflection"><AiHandoffReflectionField field="aiResponseExcerpt" record={record} onSave={onSave} /><AiHandoffReflectionField field="postChatReflection" record={record} onSave={onSave} /></section>
}

function AiHandoffReflectionField({ field, record, onSave }: { field: Field; record: AiHandoffReflectionRecord; onSave: (changes: AiHandoffReflectionInput) => Promise<AiHandoffReflectionRecord> }) {
  const { t } = useI18n(); const config = fieldConfig[field]; const saved = record[field] ?? ''
  const [editing, setEditing] = useState(false); const [value, setValue] = useState(saved); const [saving, setSaving] = useState(false)
  useEffect(() => { setValue(saved) }, [saved])
  const characters = [...value].length; const tooLong = characters > config.maximum
  async function save() {
    if (tooLong) return
    setSaving(true)
    try { await onSave({ aiResponseExcerpt: field === 'aiResponseExcerpt' ? value : record.aiResponseExcerpt, postChatReflection: field === 'postChatReflection' ? value : record.postChatReflection }); setEditing(false) } finally { setSaving(false) }
  }
  function cancel() { setValue(saved); setEditing(false) }
  return <section className="clear-ai-reflection__field"><h3>{t(config.title)}</h3><p>{t(config.body)}</p>{editing ? <><textarea aria-label={t(config.title)} value={value} onChange={(event) => setValue(event.target.value)} /><span className="clear-ai-reflection__count">{t('clear.aiReflection.count', { count: characters, max: config.maximum })}</span>{tooLong ? <p className="clear-flow__error" role="alert">{t('clear.aiReflection.tooLong', { max: config.maximum })}</p> : null}<div className="clear-flow__actions"><PrimaryButton disabled={tooLong || saving} onClick={() => void save()}>{t('clear.aiReflection.save')}</PrimaryButton><SecondaryButton disabled={saving} onClick={cancel}>{t('clear.aiReflection.cancel')}</SecondaryButton></div></> : saved ? <><p className="clear-ai-reflection__saved">{saved}</p><SecondaryButton onClick={() => setEditing(true)}>{t('clear.aiReflection.edit')}</SecondaryButton></> : <SecondaryButton onClick={() => setEditing(true)}>{t(config.add)}</SecondaryButton>}</section>
}
