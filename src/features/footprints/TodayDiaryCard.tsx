import { useEffect, useState } from 'react'
import { footprintsAssets } from '../../assets/uiAssets'
import { PrimaryButton, SecondaryButton, SectionHeader, SoftCard } from '../../components'
import { usePersistence } from '../../data/PersistenceStateContext'
import { useI18n } from '../../i18n/I18nContext'
import { PhotoThumbnail } from './PhotoThumbnail'

export function TodayDiaryCard() {
  const { t } = useI18n()
  const persistence = usePersistence()
  const [content, setContent] = useState(persistence?.todayDiary?.content ?? '')
  const [feedback, setFeedback] = useState('')

  useEffect(() => { setContent(persistence?.todayDiary?.content ?? '') }, [persistence?.todayDiary?.content])

  const save = async () => {
    if (!persistence) { setFeedback(t('footprints.addDiary.feedback')); return }
    const updating = Boolean(persistence.todayDiary)
    await persistence.saveTodayDiary(content)
    setFeedback(t(updating ? 'footprints.editDiary.feedback' : 'footprints.addDiary.feedback'))
  }

  return (
    <SoftCard className="today-diary-card">
      <SectionHeader title={t('footprints.todayDiary')} icon={<img src={footprintsAssets.diaryNotebook} alt="" aria-hidden="true" />} />
      <div className="today-diary-card__body">
        <img className="today-diary-card__notebook" src={footprintsAssets.diaryNotebook} alt="" aria-hidden="true" />
        <div className="today-diary-card__copy">
          <textarea aria-label={t('footprints.todayDiary')} maxLength={1000} placeholder={t('footprints.todayDiary.content')} value={content} onChange={(event) => setContent(event.target.value)} />
          <span>{[...content].length} / 1000</span>
        </div>
        <div className="today-diary-card__photos" aria-label={t('footprints.photo.groupLabel')}>
          <PhotoThumbnail position="left" /><PhotoThumbnail position="center" /><PhotoThumbnail position="right" />
        </div>
      </div>
      <div className="today-diary-card__actions">
        <SecondaryButton onClick={() => setContent(persistence?.todayDiary?.content ?? '')}>{t('footprints.editDiary')}</SecondaryButton>
        <PrimaryButton onClick={() => void save()}>{persistence?.todayDiary ? t('footprints.editDiary') : t('footprints.addDiary')}</PrimaryButton>
      </div>
      <p className="mock-feedback" aria-live="polite">{feedback}</p>
    </SoftCard>
  )
}
