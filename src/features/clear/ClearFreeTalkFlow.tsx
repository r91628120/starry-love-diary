import { useEffect, useRef, useState } from 'react'
import { ConfirmDialog, IconButton, PrimaryButton, SecondaryButton, SoftCard } from '../../components'
import { BackIcon } from '../../components/icons'
import type { ClearFreeTalkRecord } from '../../data/clearTypes'
import { usePersistence } from '../../data/PersistenceStateContext'
import { useI18n } from '../../i18n/I18nContext'
import { buildClearFreeTalkAiHandoffText } from '../../services/clearAiHandoffBuilders'
import { ClearAiHandoff } from './ClearAiHandoff'

const MAX_LENGTH = 1500

export function ClearFreeTalkFlow({ recordId, onDone, onStartNew }: { recordId?: string; onDone: () => void; onStartNew: () => void }) {
  const { t, locale } = useI18n()
  const persistence = usePersistence()
  const [record, setRecord] = useState<ClearFreeTalkRecord>()
  const [text, setText] = useState('')
  const [editing, setEditing] = useState(!recordId)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const recordRef = useRef<ClearFreeTalkRecord | undefined>(undefined)
  const textRef = useRef('')

  useEffect(() => { recordRef.current = record }, [record])
  useEffect(() => { textRef.current = text }, [text])
  useEffect(() => {
    if (!persistence) return
    void (recordId ? persistence.repositories.clearFreeTalkRecords.getById(recordId) : persistence.repositories.clearFreeTalkRecords.getActiveDraft()).then((value) => {
      if (!recordId && textRef.current) return
      recordRef.current = value
      setRecord(value)
      setText(value?.text ?? '')
      setEditing(value?.status !== 'completed')
    })
  }, [persistence, recordId])

  async function persist(value = textRef.current) {
    if (!persistence) return undefined
    const current = recordRef.current
    if (!value.trim()) {
      if (current?.status === 'draft') await persistence.repositories.clearFreeTalkRecords.delete(current.id)
      recordRef.current = undefined; setRecord(undefined)
      return undefined
    }
    const next = current
      ? current.status === 'draft' ? await persistence.repositories.clearFreeTalkRecords.updateDraft(current.id, value) : current
      : await persistence.repositories.clearFreeTalkRecords.createDraft(value)
    recordRef.current = next
    setRecord(next)
    return next
  }
  function schedulePersist(value: string) {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => { void persist(value) }, 500)
  }
  useEffect(() => () => {
    clearTimeout(timer.current)
    const current = recordRef.current
    const pendingText = textRef.current
    if (!persistence || !pendingText.trim()) return
    if (current?.status === 'draft') void persistence.repositories.clearFreeTalkRecords.updateDraft(current.id, pendingText)
    else if (!current) void persistence.repositories.clearFreeTalkRecords.createDraft(pendingText)
  }, [persistence])

  function change(value: string) {
    if ([...value].length > MAX_LENGTH) { setError(String(MAX_LENGTH)); return }
    setError(''); textRef.current = value; setText(value); schedulePersist(value)
  }
  async function save() {
    clearTimeout(timer.current)
    if (!textRef.current.trim()) { setError(t('clear.freeTalk.required')); return }
    const current = await persist()
    if (!current || !persistence) return
    const updated = current.status === 'draft'
      ? await persistence.repositories.clearFreeTalkRecords.complete(current.id, textRef.current)
      : await persistence.repositories.clearFreeTalkRecords.updateCompleted(current.id, textRef.current)
    recordRef.current = updated; setRecord(updated); setText(updated.text); setEditing(false)
  }
  async function remove() {
    clearTimeout(timer.current)
    if (recordRef.current && persistence) await persistence.repositories.clearFreeTalkRecords.delete(recordRef.current.id)
    recordRef.current = undefined; textRef.current = ''; setRecord(undefined); setText(''); setConfirmDelete(false); onDone()
  }
  const back = <IconButton className="clear-free-talk__back" ariaLabel={t('common.back')} onClick={onDone}><BackIcon /></IconButton>
  if (record?.status === 'completed' && !editing) return <SoftCard className="clear-flow clear-result clear-free-talk-flow" tone="blue">
    <header className="clear-free-talk-flow__header">{back}<div><h2>{t('clear.freeTalk.title')}</h2></div></header>
    <p className="clear-free-talk-flow__record">{record.text}</p>
    <ClearAiHandoff presentation="freeTalk" buildText={() => buildClearFreeTalkAiHandoffText(record.text, locale)} />
    <div className="clear-flow__actions clear-free-talk-flow__record-actions"><PrimaryButton onClick={() => setEditing(true)}>{t('clear.freeTalk.edit')}</PrimaryButton><SecondaryButton className="button--danger" onClick={() => setConfirmDelete(true)}>{t('clear.freeTalk.delete')}</SecondaryButton></div>
    <div className="clear-free-talk-flow__new-action"><SecondaryButton onClick={() => { onStartNew(); recordRef.current = undefined; textRef.current = ''; setRecord(undefined); setText(''); setEditing(true) }}>{t('clear.freeTalk.new')}</SecondaryButton></div>
    <ConfirmDialog open={confirmDelete} title={t('clear.freeTalk.deleteTitle')} description={t('clear.freeTalk.deleteBody')} onConfirm={() => void remove()} onCancel={() => setConfirmDelete(false)} />
  </SoftCard>
  return <SoftCard className="clear-flow clear-free-talk-flow" tone="blue">
    <header className="clear-free-talk-flow__header">{back}<div><h2>{t('clear.freeTalk.title')}</h2><p>{t('clear.freeTalk.intro')}</p></div></header>
    <div className="clear-free-talk-flow__editor"><textarea value={text} placeholder={t('clear.freeTalk.placeholder')} onChange={(event) => change(event.target.value)} /><span className="clear-free-talk-flow__count">{t('clear.freeTalk.count', { count: [...text].length, max: MAX_LENGTH })}</span></div>
    {error ? <p className="clear-flow__error" role="alert">{error === String(MAX_LENGTH) ? t('clear.freeTalk.count', { count: MAX_LENGTH, max: MAX_LENGTH }) : error}</p> : null}
    <div className="clear-free-talk-flow__primary-action"><PrimaryButton onClick={() => void save()}>{record?.status === 'completed' ? t('clear.freeTalk.saveChanges') : t('clear.freeTalk.save')}</PrimaryButton></div>
    {record?.status === 'draft' ? <div className="clear-free-talk-flow__secondary-action"><SecondaryButton className="button--danger" onClick={() => setConfirmDelete(true)}>{t('clear.freeTalk.deleteDraft')}</SecondaryButton></div> : null}
    {text.trim() ? <ClearAiHandoff presentation="freeTalk" buildText={() => buildClearFreeTalkAiHandoffText(text, locale)} /> : null}
    <ConfirmDialog open={confirmDelete} title={t('clear.freeTalk.deleteTitle')} description={t('clear.freeTalk.deleteBody')} onConfirm={() => void remove()} onCancel={() => setConfirmDelete(false)} />
  </SoftCard>
}
