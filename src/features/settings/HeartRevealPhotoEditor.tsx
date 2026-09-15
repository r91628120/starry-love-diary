import { useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { ConfirmDialog, HeartRevealPhotoVisual, PrimaryButton, SecondaryButton } from '../../components'
import { usePersistence } from '../../data/PersistenceStateContext'
import type { PhotoPlacement } from '../../data/types'
import { useI18n } from '../../i18n/I18nContext'
import type { TranslationKey } from '../../i18n/messages'
import { WebPhotoPickerService, type PhotoPickerService } from '../../services/photoPickerService'
import { DEFAULT_PHOTO_PLACEMENT, normalizePhotoPlacement } from '../../services/photoPlacement'
import { applyPointerDeltaToPlacement, measurePhotoPlacementGeometry } from '../../services/photoPlacementGeometry'
import { usePhotoObjectUrl } from '../../services/usePhotoObjectUrl'

interface DragState { startX: number; startY: number; placement: PhotoPlacement }

export function HeartRevealPhotoEditor({ photoPicker }: { photoPicker?: PhotoPickerService }) {
  const { t } = useI18n()
  const persistence = usePersistence()
  const picker = useMemo(() => photoPicker ?? new WebPhotoPickerService(), [photoPicker])
  const project = persistence?.activeHeartRevealProject
  const photoUrl = usePhotoObjectUrl(persistence?.repositories.photos, project?.photoAssetId, 'master')
  const [busy, setBusy] = useState(false)
  const [editing, setEditing] = useState(false)
  const [removeOpen, setRemoveOpen] = useState(false)
  const [feedbackKey, setFeedbackKey] = useState<TranslationKey>()
  const [draftPlacement, setDraftPlacement] = useState<PhotoPlacement>(project?.photoPlacement ?? { ...DEFAULT_PHOTO_PLACEMENT })
  const drag = useRef<DragState | undefined>(undefined)

  const choosePhoto = async () => {
    if (!persistence || busy) return
    setFeedbackKey(undefined)
    try {
      const file = await picker.pickOne()
      if (!file) return
      setBusy(true)
      const next = await persistence.replaceHeartRevealPhoto(file)
      setDraftPlacement(next.photoPlacement ?? { ...DEFAULT_PHOTO_PLACEMENT })
      setEditing(false)
      setFeedbackKey('heartRevealPhoto.imported')
    } catch {
      setFeedbackKey('heartRevealPhoto.importFailed')
    } finally {
      setBusy(false)
    }
  }

  const beginAdjustment = () => {
    setDraftPlacement(project?.photoPlacement ?? { ...DEFAULT_PHOTO_PLACEMENT })
    setEditing(true)
    setFeedbackKey(undefined)
  }

  const updatePlacement = (changes: Partial<PhotoPlacement>) => setDraftPlacement((current) => normalizePhotoPlacement({ ...current, ...changes }))

  const completeAdjustment = async () => {
    if (!persistence || !project || busy) return
    setBusy(true)
    try {
      const saved = await persistence.saveHeartRevealPlacement(draftPlacement)
      setDraftPlacement(saved.photoPlacement ?? { ...DEFAULT_PHOTO_PLACEMENT })
      setEditing(false)
    } catch {
      setFeedbackKey('settings.feedback.saveError')
    } finally {
      setBusy(false)
    }
  }

  const confirmRemove = async () => {
    setRemoveOpen(false)
    if (!persistence || busy) return
    setBusy(true)
    try {
      await persistence.removeHeartRevealPhoto()
      setDraftPlacement({ ...DEFAULT_PHOTO_PLACEMENT })
      setEditing(false)
      setFeedbackKey('heartRevealPhoto.removed')
    } catch {
      setFeedbackKey('heartRevealPhoto.removeFailed')
    } finally {
      setBusy(false)
    }
  }

  const pointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!editing) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = { startX: event.clientX, startY: event.clientY, placement: { ...draftPlacement } }
  }
  const pointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const state = drag.current
    if (!editing || !state || !event.currentTarget.hasPointerCapture(event.pointerId)) return
    event.preventDefault()
    const frame = event.currentTarget.querySelector<HTMLElement>('.heart-reveal-photo-visual__crop')
    const image = frame?.querySelector<HTMLImageElement>('.heart-reveal-photo-visual__photo--real') ?? null
    const geometry = measurePhotoPlacementGeometry(frame, image, state.placement)
    if (!geometry) return
    setDraftPlacement(applyPointerDeltaToPlacement(state.placement, event.clientX - state.startX, event.clientY - state.startY, geometry))
  }
  const pointerEnd = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    drag.current = undefined
  }

  return <>
    <section className="heart-reveal-photo-editor" aria-labelledby="heart-reveal-photo-editor-title">
      <header>
        <h2 id="heart-reveal-photo-editor-title">{t('today.heartReveal.title')}</h2>
        <p>{t('heartRevealPhoto.prompt')}</p>
      </header>
      {!project?.photoAssetId ? <div className="heart-reveal-photo-editor__empty">
        <strong>{t('heartRevealPhoto.empty')}</strong>
        <PrimaryButton disabled={busy} onClick={() => void choosePhoto()}>{t('settings.profile.selectPhoto')}</PrimaryButton>
      </div> : <>
        <button type="button" className={`heart-reveal-photo-editor__preview ${editing ? 'is-editing' : ''}`} aria-label={t(editing ? 'memoryWallEditor.adjust' : 'today.heartReveal.imageAlt')} aria-pressed={editing} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerEnd} onPointerCancel={pointerEnd}>
          <HeartRevealPhotoVisual photoUrl={photoUrl} placeholderSrc="/images/heart-reveal-placeholder.svg" placement={editing ? draftPlacement : (project.photoPlacement ?? DEFAULT_PHOTO_PLACEMENT)} alt={t('today.heartReveal.imageAlt')} />
        </button>
        {editing ? <div className="heart-reveal-photo-editor__controls">
          <SecondaryButton aria-label={t('memoryWallEditor.zoomOut')} onClick={() => updatePlacement({ zoom: draftPlacement.zoom - .25 })}>−</SecondaryButton>
          <SecondaryButton aria-label={t('memoryWallEditor.zoomIn')} onClick={() => updatePlacement({ zoom: draftPlacement.zoom + .25 })}>＋</SecondaryButton>
          <SecondaryButton onClick={() => setDraftPlacement({ ...DEFAULT_PHOTO_PLACEMENT })}>{t('memoryWallEditor.reset')}</SecondaryButton>
          <PrimaryButton disabled={busy} onClick={() => void completeAdjustment()}>{t('memoryWallEditor.doneAdjustment')}</PrimaryButton>
        </div> : <div className="heart-reveal-photo-editor__actions">
          <SecondaryButton disabled={busy} onClick={() => void choosePhoto()}>{t('settings.profile.changePhoto')}</SecondaryButton>
          <SecondaryButton disabled={busy} onClick={beginAdjustment}>{t('memoryWallEditor.adjust')}</SecondaryButton>
          <button type="button" className="button button--danger" disabled={busy} onClick={() => setRemoveOpen(true)}>{t('settings.profile.removePhoto')}</button>
        </div>}
      </>}
      <p className="mock-feedback" aria-live="polite">{feedbackKey ? t(feedbackKey) : ''}</p>
    </section>
    <ConfirmDialog open={removeOpen} title={t('heartRevealPhoto.removeConfirmTitle')} description={t('heartRevealPhoto.removeConfirmBody')} onCancel={() => setRemoveOpen(false)} onConfirm={() => void confirmRemove()} />
  </>
}
