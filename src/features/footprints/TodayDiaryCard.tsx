import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { footprintsAssets } from '../../assets/uiAssets'
import { ConfirmDialog, PrimaryButton, SecondaryButton, SectionHeader, SoftCard } from '../../components'
import { usePersistence } from '../../data/PersistenceStateContext'
import { useI18n } from '../../i18n/I18nContext'
import type { TranslationKey } from '../../i18n/messages'

const diaryPhotoUrls: string[] = []

export function DiaryPhotoGrid({ photos }: { photos: string[] }) {
  const { t } = useI18n()
  const visiblePhotos = photos.slice(0, 3)
  if (visiblePhotos.length === 0) return null
  return <div className="today-diary-card__photos" aria-label={t('footprints.photo.groupLabel')}>
    {visiblePhotos.map((photo, index) => <img className="today-diary-card__photo" src={photo} alt={t('footprints.photo.alt', { index: index + 1 })} key={photo + index} />)}
  </div>
}

export function TodayDiaryCard() {
  const { locale, t } = useI18n()
  const persistence = usePersistence()
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedRecordId = searchParams.get('entry') === 'diary' ? searchParams.get('recordId') ?? undefined : undefined
  const [editingRecordId, setEditingRecordId] = useState<string>()
  const [content, setContent] = useState('')
  const [feedbackKey, setFeedbackKey] = useState<TranslationKey>()
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const numberFormatter = new Intl.NumberFormat(locale)

  useEffect(() => {
    let active = true
    if (!requestedRecordId || !persistence) {
      setEditingRecordId(undefined)
      setContent('')
      return () => { active = false }
    }
    void persistence.repositories.diaries.getDiary(requestedRecordId).then((record) => {
      if (!active) return
      setEditingRecordId(record?.id)
      setContent(record?.content ?? '')
    })
    return () => { active = false }
  }, [persistence, requestedRecordId])

  const exitEditMode = () => {
    setEditingRecordId(undefined)
    setContent('')
    const next = new URLSearchParams(searchParams)
    next.delete('entry')
    next.delete('recordId')
    setSearchParams(next, { replace: true })
  }

  const save = async () => {
    if (!persistence) { setFeedbackKey('footprints.diary.saveError'); return }
    const updating = Boolean(editingRecordId)
    try {
      await persistence.saveTodayDiary(content, editingRecordId)
      setFeedbackKey(updating ? 'footprints.diary.updated' : 'footprints.diary.saved')
      exitEditMode()
    } catch {
      setFeedbackKey('footprints.diary.saveError')
    }
  }

  const deleteDiary = async () => {
    setConfirmingDelete(false)
    if (!persistence) { setFeedbackKey('footprints.diary.deleteError'); return }
    try {
      await persistence.deleteTodayDiary(editingRecordId)
      setFeedbackKey('footprints.diary.deleted')
      exitEditMode()
    } catch {
      setFeedbackKey('footprints.diary.deleteError')
    }
  }

  return (
    <SoftCard className="today-diary-card">
      <SectionHeader title={t('footprints.todayDiary')} icon={<img src={footprintsAssets.diaryNotebook} alt="" aria-hidden="true" />} />
      <div className={`today-diary-card__body ${diaryPhotoUrls.length === 0 ? 'today-diary-card__body--no-photos' : ''}`}>
        <img className="today-diary-card__notebook" src={footprintsAssets.diaryNotebook} alt="" aria-hidden="true" />
        <div className="today-diary-card__copy">
          <textarea aria-label={t('footprints.todayDiary')} maxLength={1000} placeholder={t('footprints.diary.placeholder')} value={content} onChange={(event) => setContent(event.target.value)} />
          <span>{numberFormatter.format([...content].length)} / {numberFormatter.format(1000)} · {t('footprints.diary.maxLength')}</span>
        </div>
        <DiaryPhotoGrid photos={diaryPhotoUrls} />
      </div>
      <div className="today-diary-card__actions">
        {editingRecordId ? <SecondaryButton onClick={() => setConfirmingDelete(true)}>{t('footprints.diary.delete')}</SecondaryButton> : null}
        <PrimaryButton onClick={() => void save()}>{editingRecordId ? t('footprints.diary.saveChanges') : t('footprints.diary.save')}</PrimaryButton>
      </div>
      <p className="mock-feedback" aria-live="polite">{feedbackKey ? t(feedbackKey) : ''}</p>
      <ConfirmDialog open={confirmingDelete} title={t('footprints.diary.deleteConfirmTitle')} description={t('footprints.diary.deleteConfirmBody')} onCancel={() => setConfirmingDelete(false)} onConfirm={() => void deleteDiary()} />
    </SoftCard>
  )
}
