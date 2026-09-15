import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ourAssets } from '../../assets/uiAssets'
import { PhotoPlacementImage, PrimaryButton, SecondaryButton, SectionHeader, SoftCard } from '../../components'
import { MAX_MEMORY_WALL_PHOTOS, memoryWallLayoutType } from '../../data/photo/MemoryWallLayoutRepository'
import type { PhotoRepository } from '../../data/photo/PhotoRepository'
import { usePersistence } from '../../data/PersistenceStateContext'
import type { PhotoAsset, PhotoLayout, PhotoLayoutSlot, PhotoPlacement } from '../../data/types'
import { useI18n } from '../../i18n/I18nContext'
import type { TranslationKey } from '../../i18n/messages'
import { DEFAULT_PHOTO_PLACEMENT, normalizePhotoPlacement } from '../../services/photoPlacement'
import { applyPointerDeltaToPlacement, measurePhotoPlacementGeometry } from '../../services/photoPlacementGeometry'
import { usePhotoObjectUrl } from '../../services/usePhotoObjectUrl'

const frameKinds = ['vertical', 'horizontal', 'square', 'heart', 'horizontal', 'square'] as const

interface DragState { slotId: string; startX: number; startY: number; placement: PhotoPlacement }

export function MemoryWall() {
  const { locale, t } = useI18n()
  const persistence = usePersistence()
  const navigate = useNavigate()
  const photos = persistence?.repositories.photos
  const layouts = persistence?.repositories.memoryWallLayouts
  const [gallery, setGallery] = useState<PhotoAsset[]>([])
  const [activeLayout, setActiveLayout] = useState<PhotoLayout>()
  const [draftSlots, setDraftSlots] = useState<PhotoLayoutSlot[]>([])
  const [editing, setEditing] = useState(false)
  const [selectedSlotId, setSelectedSlotId] = useState<string>()
  const [replaceSlotId, setReplaceSlotId] = useState<string>()
  const [lightboxIndex, setLightboxIndex] = useState<number>()
  const [feedbackKey, setFeedbackKey] = useState<TranslationKey>()
  const drag = useRef<DragState | undefined>(undefined)

  const load = useCallback(async () => {
    if (!photos || !layouts) return
    const [assets, layout] = await Promise.all([photos.listPhotoAssets('gallery'), layouts.getActiveLayout()])
    setGallery(assets)
    setActiveLayout(layout)
    if (!editing) setDraftSlots(layout?.slots.map(copySlot) ?? [])
  }, [editing, layouts, photos])

  useEffect(() => { void load() }, [load])

  const displayedSlots = editing ? draftSlots : activeLayout?.slots ?? []
  const displayedLayoutType = displayedSlots.length > 0 ? memoryWallLayoutType(displayedSlots.length) : undefined

  const beginEdit = () => {
    setDraftSlots(activeLayout?.slots.map(copySlot) ?? [])
    setSelectedSlotId(undefined)
    setReplaceSlotId(undefined)
    setFeedbackKey(undefined)
    setEditing(true)
  }

  const cancelEdit = () => {
    setDraftSlots(activeLayout?.slots.map(copySlot) ?? [])
    setSelectedSlotId(undefined)
    setReplaceSlotId(undefined)
    setFeedbackKey(undefined)
    setEditing(false)
  }

  const choosePhoto = (photoAssetId: string) => {
    setFeedbackKey(undefined)
    if (replaceSlotId) {
      if (draftSlots.some((slot) => slot.id !== replaceSlotId && slot.photoAssetId === photoAssetId)) {
        setFeedbackKey('memoryWallEditor.alreadySelected')
        return
      }
      setDraftSlots((slots) => slots.map((slot) => slot.id === replaceSlotId ? { ...slot, photoAssetId, placement: { ...DEFAULT_PHOTO_PLACEMENT } } : slot))
      setSelectedSlotId(replaceSlotId)
      setReplaceSlotId(undefined)
      return
    }

    const existing = draftSlots.find((slot) => slot.photoAssetId === photoAssetId)
    if (existing) {
      setDraftSlots((slots) => slots.filter((slot) => slot.id !== existing.id))
      if (selectedSlotId === existing.id) setSelectedSlotId(undefined)
      return
    }
    if (draftSlots.length >= MAX_MEMORY_WALL_PHOTOS) {
      setFeedbackKey('memoryWallEditor.maximum')
      return
    }
    const nextSlot: PhotoLayoutSlot = { id: `memory-wall-slot-${photoAssetId}`, photoAssetId, placement: { ...DEFAULT_PHOTO_PLACEMENT } }
    setDraftSlots((slots) => [...slots, nextSlot])
    setSelectedSlotId(nextSlot.id)
  }

  const updatePlacement = (slotId: string, changes: Partial<PhotoPlacement>) => {
    setDraftSlots((slots) => slots.map((slot) => slot.id === slotId ? { ...slot, placement: normalizePhotoPlacement({ ...slot.placement, ...changes }) } : slot))
  }

  const zoom = (delta: number) => {
    const slot = draftSlots.find((item) => item.id === selectedSlotId)
    if (slot) updatePlacement(slot.id, { zoom: slot.placement.zoom + delta })
  }

  const removeSelectedSlot = () => {
    if (!selectedSlotId) return
    setDraftSlots((slots) => slots.filter((slot) => slot.id !== selectedSlotId))
    setSelectedSlotId(undefined)
    setReplaceSlotId(undefined)
  }

  const save = async () => {
    if (!layouts || draftSlots.length === 0) {
      setFeedbackKey('memoryWallEditor.minimum')
      return
    }
    try {
      const saved = await layouts.saveActiveLayout(draftSlots)
      setActiveLayout(saved)
      setDraftSlots(saved.slots.map(copySlot))
      setEditing(false)
      setSelectedSlotId(undefined)
      setReplaceSlotId(undefined)
      setFeedbackKey('memoryWallEditor.saved')
    } catch {
      setFeedbackKey('memoryWallEditor.saveFailed')
    }
  }

  const pointerDown = (slot: PhotoLayoutSlot, event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!editing || selectedSlotId !== slot.id) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = { slotId: slot.id, startX: event.clientX, startY: event.clientY, placement: { ...slot.placement } }
  }

  const pointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const state = drag.current
    if (!state || !event.currentTarget.hasPointerCapture(event.pointerId)) return
    event.preventDefault()
    const frame = event.currentTarget.querySelector<HTMLElement>('.memory-wall-frame__crop')
    const image = frame?.querySelector<HTMLImageElement>('img') ?? null
    const geometry = measurePhotoPlacementGeometry(frame, image, state.placement)
    if (!geometry) return
    updatePlacement(state.slotId, applyPointerDeltaToPlacement(state.placement, event.clientX - state.startX, event.clientY - state.startY, geometry))
  }

  const pointerEnd = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    drag.current = undefined
  }

  const openManager = () => navigate('/settings/memory-wall-photos', { state: { from: '/our' } })

  return <SoftCard className="memory-wall">
    <div className="memory-wall__heading"><SectionHeader title={t('our.memoryWall')} />{gallery.length > 0 && !editing ? <SecondaryButton onClick={beginEdit}>{t('memoryWallEditor.edit')}</SecondaryButton> : null}</div>
    <p className="memory-wall__count">{editing ? t('memoryWallEditor.selectedCount', { count: draftSlots.length, max: MAX_MEMORY_WALL_PHOTOS }) : t('our.photosCount', { current: new Intl.NumberFormat(locale).format(displayedSlots.length), max: new Intl.NumberFormat(locale).format(60) })}</p>

    {gallery.length === 0 ? <div className="memory-wall__empty"><p>{t('memoryWallEditor.emptyGallery')}</p><PrimaryButton onClick={openManager}>{t('memoryWallEditor.manage')}</PrimaryButton></div> : <>
      {displayedSlots.length > 0 && displayedLayoutType ? <div className={`memory-wall__canvas memory-wall__canvas--${displayedLayoutType}`} data-layout={displayedLayoutType}>
        <img className="memory-wall__background" src={ourAssets.memoryWall} alt="" aria-hidden="true" />
        <div className="memory-wall__layout">
          {displayedSlots.map((slot, index) => <MemoryWallFrame key={slot.id} slot={slot} index={index} selected={selectedSlotId === slot.id} editing={editing} onSelect={() => { if (editing) { setSelectedSlotId(slot.id); setReplaceSlotId(undefined) } else setLightboxIndex(index) }} onPointerDown={(event) => pointerDown(slot, event)} onPointerMove={pointerMove} onPointerEnd={pointerEnd} />)}
        </div>
      </div> : <div className="memory-wall__empty"><p>{t('memoryWallEditor.emptyWall')}</p></div>}

      {editing ? <section className="memory-wall-editor" aria-label={t('memoryWallEditor.edit')}>
        <header><h3>{replaceSlotId ? t('memoryWallEditor.replaceHint') : t('memoryWallEditor.choose')}</h3><strong>{t('memoryWallEditor.selectedCount', { count: draftSlots.length, max: MAX_MEMORY_WALL_PHOTOS })}</strong></header>
        <div className="memory-wall-picker">
          {gallery.map((asset, index) => {
            const selected = draftSlots.some((slot) => slot.photoAssetId === asset.id)
            return <GalleryChoice key={asset.id} asset={asset} index={index + 1} selected={selected} repository={photos} onClick={() => choosePhoto(asset.id)} />
          })}
        </div>
        {selectedSlotId ? <div className="memory-wall-adjust" aria-label={t('memoryWallEditor.adjust')}>
          <strong>{t('memoryWallEditor.adjust')}</strong>
          <div>
            <SecondaryButton aria-label={t('memoryWallEditor.zoomOut')} onClick={() => zoom(-0.25)}>−</SecondaryButton>
            <SecondaryButton aria-label={t('memoryWallEditor.zoomIn')} onClick={() => zoom(0.25)}>＋</SecondaryButton>
            <SecondaryButton onClick={() => updatePlacement(selectedSlotId, DEFAULT_PHOTO_PLACEMENT)}>{t('memoryWallEditor.reset')}</SecondaryButton>
            <SecondaryButton onClick={() => setReplaceSlotId(selectedSlotId)}>{t('memoryWallEditor.replace')}</SecondaryButton>
            <SecondaryButton onClick={removeSelectedSlot}>{t('memoryWallEditor.remove')}</SecondaryButton>
            <PrimaryButton onClick={() => { setSelectedSlotId(undefined); setReplaceSlotId(undefined) }}>{t('memoryWallEditor.done')}</PrimaryButton>
          </div>
        </div> : null}
        <p className="memory-wall-editor__feedback" role="status" aria-live="polite">{feedbackKey ? t(feedbackKey) : ''}</p>
        <div className="memory-wall-editor__actions"><SecondaryButton onClick={cancelEdit}>{t('memoryWallEditor.cancel')}</SecondaryButton><PrimaryButton onClick={() => void save()}>{t('memoryWallEditor.save')}</PrimaryButton></div>
      </section> : <p className="memory-wall-editor__feedback" role="status" aria-live="polite">{feedbackKey ? t(feedbackKey) : ''}</p>}
    </>}

    {lightboxIndex !== undefined && displayedSlots[lightboxIndex] ? <MemoryWallLightbox slots={displayedSlots} index={lightboxIndex} repository={photos} onChange={setLightboxIndex} onClose={() => setLightboxIndex(undefined)} /> : null}
  </SoftCard>
}

function copySlot(slot: PhotoLayoutSlot): PhotoLayoutSlot { return { ...slot, placement: { ...slot.placement } } }

function MemoryWallFrame({ slot, index, selected, editing, onSelect, onPointerDown, onPointerMove, onPointerEnd }: { slot: PhotoLayoutSlot; index: number; selected: boolean; editing: boolean; onSelect: () => void; onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => void; onPointerMove: (event: ReactPointerEvent<HTMLButtonElement>) => void; onPointerEnd: (event: ReactPointerEvent<HTMLButtonElement>) => void }) {
  const { t } = useI18n()
  const persistence = usePersistence()
  const url = usePhotoObjectUrl(persistence?.repositories.photos, slot.photoAssetId, 'thumbnail')
  const kind = frameKinds[index] ?? 'square'
  return <button type="button" className={`memory-wall-frame memory-wall-frame--${kind} ${selected ? 'is-selected' : ''}`.trim()} aria-label={selected ? t('memoryWallEditor.selectedFrame', { index: index + 1 }) : t(editing ? 'memoryWallEditor.frame' : 'memoryWallEditor.openPhoto', { index: index + 1 })} aria-pressed={editing ? selected : undefined} onClick={onSelect} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerEnd} onPointerCancel={onPointerEnd}>
    <span className="memory-wall-frame__crop"><PhotoImage url={url} placement={slot.placement} alt={t('our.memoryWall.photoAlt')} /></span>
    <img className="memory-wall-frame__art" src={ourAssets.frames[kind]} alt="" aria-hidden="true" />
    {selected ? <span className="memory-wall-frame__selected" aria-hidden="true">✓</span> : null}
  </button>
}

function GalleryChoice({ asset, index, selected, repository, onClick }: { asset: PhotoAsset; index: number; selected: boolean; repository?: PhotoRepository; onClick: () => void }) {
  const { t } = useI18n()
  const url = usePhotoObjectUrl(repository, asset.id, 'thumbnail')
  return <button type="button" className={`memory-wall-picker__choice ${selected ? 'is-selected' : ''}`.trim()} aria-pressed={selected} aria-label={t('memoryWallEditor.frame', { index })} onClick={onClick}>{url ? <img src={url} alt="" /> : <span />}{selected ? <b aria-hidden="true">✓</b> : null}</button>
}

function PhotoImage({ url, placement, alt }: { url?: string; placement: PhotoPlacement; alt: string }) {
  if (!url) return <span className="memory-wall-frame__loading" />
  return <PhotoPlacementImage src={url} alt={alt} placement={placement} />
}

function MemoryWallLightbox({ slots, index, repository, onChange, onClose }: { slots: PhotoLayoutSlot[]; index: number; repository?: PhotoRepository; onChange: (index: number) => void; onClose: () => void }) {
  const { t } = useI18n()
  const slot = slots[index]
  const url = usePhotoObjectUrl(repository, slot?.photoAssetId, 'master')
  const previous = () => onChange((index - 1 + slots.length) % slots.length)
  const next = () => onChange((index + 1) % slots.length)
  return <div className="memory-lightbox" role="presentation"><section className="memory-lightbox__dialog" role="dialog" aria-modal="true" aria-label={t('our.memoryWall.openPhoto')}>
    <button type="button" className="memory-lightbox__close" aria-label={t('memoryWallEditor.closeLightbox')} onClick={onClose}>×</button>
    {slots.length > 1 ? <button type="button" className="memory-lightbox__previous" aria-label={t('memoryWallEditor.previousPhoto')} onClick={previous}>‹</button> : null}
    {url ? <img src={url} alt={t('our.memoryWall.photoAlt')} /> : null}
    {slots.length > 1 ? <button type="button" className="memory-lightbox__next" aria-label={t('memoryWallEditor.nextPhoto')} onClick={next}>›</button> : null}
  </section></div>
}
