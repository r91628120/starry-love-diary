import { useCallback, useEffect, useMemo, useState } from 'react'
import { ConfirmDialog, PrimaryButton, SecondaryButton } from '../../components'
import { GalleryCapacityError, importGalleryPhotos, MAX_GALLERY_PHOTOS } from '../../data/photo/galleryPhotoActions'
import { PhotoInUseError, type PhotoRepository } from '../../data/photo/PhotoRepository'
import { usePersistence } from '../../data/PersistenceStateContext'
import type { PhotoAsset } from '../../data/types'
import { useI18n } from '../../i18n/I18nContext'
import type { TranslationKey } from '../../i18n/messages'
import { WebPhotoPickerService, type PhotoPickerService } from '../../services/photoPickerService'
import { usePhotoObjectUrl } from '../../services/usePhotoObjectUrl'

export function MemoryWallPhotoLibrary({ photoPicker }: { photoPicker?: PhotoPickerService }) {
  const { t } = useI18n()
  const persistence = usePersistence()
  const repository = persistence?.repositories.photos
  const picker = useMemo(() => photoPicker ?? new WebPhotoPickerService(), [photoPicker])
  const [assets, setAssets] = useState<PhotoAsset[]>([])
  const [busy, setBusy] = useState(false)
  const [feedbackKey, setFeedbackKey] = useState<TranslationKey>()
  const [previewId, setPreviewId] = useState<string>()
  const [removeId, setRemoveId] = useState<string>()

  const refresh = useCallback(async () => {
    setAssets(repository ? await repository.listPhotoAssets('gallery') : [])
  }, [repository])

  useEffect(() => { void refresh() }, [refresh])

  const importFiles = async (files: File[]) => {
    if (!repository || files.length === 0) return
    setBusy(true)
    setFeedbackKey(undefined)
    try {
      await importGalleryPhotos(repository, files)
      await refresh()
      setFeedbackKey('memoryWallPhotos.imported')
    } catch (error) {
      setFeedbackKey(error instanceof GalleryCapacityError ? 'memoryWallPhotos.full' : 'memoryWallPhotos.importFailed')
    } finally {
      setBusy(false)
    }
  }

  const addOne = async () => {
    if (busy || assets.length >= MAX_GALLERY_PHOTOS) return
    try {
      const file = await picker.pickOne()
      if (file) await importFiles([file])
    } catch {
      setFeedbackKey('memoryWallPhotos.importFailed')
    }
  }

  const addMany = async () => {
    if (busy) return
    const remaining = MAX_GALLERY_PHOTOS - assets.length
    if (remaining <= 0) {
      setFeedbackKey('memoryWallPhotos.full')
      return
    }
    try {
      await importFiles(await picker.pickMany(remaining))
    } catch {
      setFeedbackKey('memoryWallPhotos.importFailed')
    }
  }

  const confirmRemove = async () => {
    const id = removeId
    setRemoveId(undefined)
    if (!repository || !id || busy) return
    setBusy(true)
    setFeedbackKey(undefined)
    try {
      await repository.deletePhoto(id)
      setAssets((current) => current.filter((asset) => asset.id !== id))
      if (previewId === id) setPreviewId(undefined)
      setFeedbackKey('memoryWallPhotos.removed')
    } catch (error) {
      setFeedbackKey(error instanceof PhotoInUseError ? 'memoryWallPhotos.inUse' : 'memoryWallPhotos.deleteFailed')
    } finally {
      setBusy(false)
    }
  }

  const full = assets.length >= MAX_GALLERY_PHOTOS

  return <>
    <section className="memory-wall-library" aria-labelledby="memory-wall-library-title">
      <header className="memory-wall-library__header">
        <div>
          <h2 id="memory-wall-library-title">{t('memoryWallPhotos.libraryTitle')}</h2>
          <strong>{t('memoryWallPhotos.count', { count: assets.length, max: MAX_GALLERY_PHOTOS })}</strong>
        </div>
        <div className="memory-wall-library__add-actions">
          <SecondaryButton disabled={busy || full} onClick={() => void addOne()}>{t('memoryWallPhotos.addOne')}</SecondaryButton>
          <PrimaryButton disabled={busy || full} onClick={() => void addMany()}>{t('memoryWallPhotos.addMany')}</PrimaryButton>
        </div>
      </header>

      {full ? <p className="memory-wall-library__notice">{t('memoryWallPhotos.full')}</p> : null}
      {assets.length === 0 ? <p className="memory-wall-library__empty">{t('memoryWallPhotos.empty')}</p> : <div className="memory-wall-library__grid">
        {assets.map((asset, index) => <GalleryPhotoCard key={asset.id} asset={asset} index={index + 1} repository={repository} busy={busy} onPreview={() => setPreviewId(asset.id)} onRemove={() => setRemoveId(asset.id)} />)}
      </div>}
      <p className="memory-wall-library__feedback" role="status" aria-live="polite">{feedbackKey ? t(feedbackKey) : ''}</p>
    </section>

    <PhotoPreview assetId={previewId} repository={repository} onClose={() => setPreviewId(undefined)} />
    <ConfirmDialog open={Boolean(removeId)} title={t('memoryWallPhotos.removeConfirmTitle')} description={t('memoryWallPhotos.removeConfirmBody')} onConfirm={() => void confirmRemove()} onCancel={() => setRemoveId(undefined)} />
  </>
}

function GalleryPhotoCard({ asset, index, repository, busy, onPreview, onRemove }: { asset: PhotoAsset; index: number; repository?: PhotoRepository; busy: boolean; onPreview: () => void; onRemove: () => void }) {
  const { t } = useI18n()
  const thumbnailUrl = usePhotoObjectUrl(repository, asset.id, 'thumbnail')
  const alt = t('memoryWallPhotos.thumbnailAlt', { index })
  return <article className="memory-wall-library__item">
    <button type="button" className="memory-wall-library__thumbnail" aria-label={`${t('memoryWallPhotos.view')}: ${alt}`} onClick={onPreview}>
      {thumbnailUrl ? <img src={thumbnailUrl} alt={alt} /> : <span aria-hidden="true" />}
    </button>
    <SecondaryButton disabled={busy} onClick={onRemove}>{t('memoryWallPhotos.remove')}</SecondaryButton>
  </article>
}

function PhotoPreview({ assetId, repository, onClose }: { assetId?: string; repository?: PhotoRepository; onClose: () => void }) {
  const { t } = useI18n()
  const masterUrl = usePhotoObjectUrl(repository, assetId, 'master')
  if (!assetId) return null
  return <div className="memory-wall-lightbox" role="presentation">
    <section className="memory-wall-lightbox__dialog" role="dialog" aria-modal="true" aria-label={t('memoryWallPhotos.view')}>
      <button type="button" className="memory-wall-lightbox__close" aria-label={t('memoryWallPhotos.closePreview')} onClick={onClose}>×</button>
      {masterUrl ? <img src={masterUrl} alt={t('memoryWallPhotos.view')} /> : null}
    </section>
  </div>
}
