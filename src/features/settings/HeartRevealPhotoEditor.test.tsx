import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { PersistenceProvider } from '../../data/PersistenceContext'
import { initializePersistence, type PersistenceRuntime } from '../../data/persistence'
import { IndexedDbPhotoContentStore } from '../../data/photo/PhotoContentStore'
import { LocalPhotoRepository } from '../../data/photo/PhotoRepository'
import { replaceHeartRevealPhoto } from '../../data/photo/heartRevealPhotoActions'
import { createMemoryStorageBacking, MemoryStorageAdapter, type MemoryStorageBacking } from '../../data/storage/MemoryStorageAdapter'
import type { PhotoCompressionService } from '../../services/photoCompressionService'
import type { PhotoPickerService } from '../../services/photoPickerService'
import { I18nProvider } from '../../i18n/I18nProvider'
import { messages, supportedLocales } from '../../i18n/messages'
import { HeartRevealProgressCard } from '../today/HeartRevealProgressCard'
import { HeartRevealPhotoEditor } from './HeartRevealPhotoEditor'

const compressed = {
  master: { blob: new Blob(['master'], { type: 'image/jpeg' }), mimeType: 'image/jpeg', width: 1200, height: 900 },
  thumbnail: { blob: new Blob(['thumb'], { type: 'image/jpeg' }), mimeType: 'image/jpeg', width: 512, height: 384 },
}
const compression: PhotoCompressionService = { compress: async () => compressed }

async function createRuntime(backing: MemoryStorageBacking = createMemoryStorageBacking(), ids = ['reveal-1', 'reveal-2']) {
  const runtime = await initializePersistence({ adapter: new MemoryStorageAdapter(backing), defaultLocale: 'zh-TW', localDate: '2026-09-08' })
  let index = 0
  runtime.photos = new LocalPhotoRepository(runtime.adapter, new IndexedDbPhotoContentStore(runtime.adapter), compression, {
    createId: () => ids[index++] ?? `reveal-extra-${index}`,
    now: () => '2026-09-08T08:00:00.000Z',
  })
  return runtime
}

const picker = (file?: File): PhotoPickerService => ({ pickOne: vi.fn(async () => file), pickMany: vi.fn(async () => []) })

function renderEditor(runtime: PersistenceRuntime, photoPicker: PhotoPickerService = picker(), locale: 'zh-TW' | 'en' = 'zh-TW') {
  return render(<PersistenceProvider runtime={runtime}><I18nProvider initialLocale={locale}><MemoryRouter><HeartRevealPhotoEditor photoPicker={photoPicker} /></MemoryRouter></I18nProvider></PersistenceProvider>)
}

function renderToday(runtime: PersistenceRuntime) {
  return render(<PersistenceProvider runtime={runtime}><I18nProvider initialLocale="zh-TW"><HeartRevealProgressCard /></I18nProvider></PersistenceProvider>)
}

function mockGeometry(container: HTMLElement) {
  const frame = container.querySelector<HTMLElement>('.heart-reveal-photo-visual__crop')!
  const image = frame.querySelector<HTMLImageElement>('.heart-reveal-photo-visual__photo--real')!
  vi.spyOn(frame, 'getBoundingClientRect').mockReturnValue({ x: 0, y: 0, top: 0, left: 0, right: 200, bottom: 150, width: 200, height: 150, toJSON: () => ({}) })
  Object.defineProperty(image, 'naturalWidth', { configurable: true, value: 1200 })
  Object.defineProperty(image, 'naturalHeight', { configurable: true, value: 900 })
  fireEvent.load(image)
}

beforeEach(() => {
  let url = 0
  Object.defineProperty(window, 'PointerEvent', { configurable: true, value: MouseEvent })
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn(() => `blob:reveal-${++url}`) })
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() })
  Object.defineProperty(HTMLElement.prototype, 'setPointerCapture', { configurable: true, value: vi.fn() })
  Object.defineProperty(HTMLElement.prototype, 'hasPointerCapture', { configurable: true, value: vi.fn(() => true) })
  Object.defineProperty(HTMLElement.prototype, 'releasePointerCapture', { configurable: true, value: vi.fn() })
})

afterEach(() => { cleanup(); vi.restoreAllMocks() })

describe('Heart reveal photo Settings and Today integration', () => {
  it('has complete non-empty copy in all six locales', () => {
    const keys = ['heartRevealPhoto.empty', 'heartRevealPhoto.prompt', 'heartRevealPhoto.removeConfirmTitle', 'heartRevealPhoto.removeConfirmBody', 'heartRevealPhoto.imported', 'heartRevealPhoto.removed', 'heartRevealPhoto.importFailed', 'heartRevealPhoto.removeFailed'] as const
    expect(supportedLocales).toHaveLength(6)
    for (const locale of supportedLocales) for (const key of keys) {
      expect(messages[locale][key]).toEqual(expect.any(String))
      expect(messages[locale][key].trim()).not.toBe('')
    }
  })

  it('keeps the neutral Today placeholder when no active photo exists', () => {
    return createRuntime().then((runtime) => {
      renderToday(runtime)
      expect(document.querySelector('.heart-reveal-photo-visual__photo--placeholder')).toHaveAttribute('src', '/images/heart-reveal-placeholder.svg')
      expect(document.querySelector('.heart-reveal-photo-visual__photo--real')).not.toBeInTheDocument()
    })
  })

  it('shows an empty state, imports one heart_reveal photo, and ignores picker cancel', async () => {
    const runtime = await createRuntime()
    const cancelled = picker()
    const view = renderEditor(runtime, cancelled)
    expect(screen.getByText('尚未選擇照片')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '選擇照片' }))
    await waitFor(() => expect(cancelled.pickOne).toHaveBeenCalled())
    expect(await runtime.photos.listPhotoAssets()).toEqual([])
    view.unmount()

    renderEditor(runtime, picker(new File(['photo'], 'reveal.jpg', { type: 'image/jpeg' })))
    fireEvent.click(screen.getByRole('button', { name: '選擇照片' }))
    await screen.findByText('顯影照片已更新')
    expect((await runtime.photos.getPhotoAsset('reveal-1'))?.category).toBe('heart_reveal')
    expect((await runtime.heartRevealPhotos.getActiveProject())?.photoAssetId).toBe('reveal-1')
    await waitFor(() => expect(document.querySelector('.heart-reveal-photo-visual__photo--real')).toBeInTheDocument())
  })

  it('restores the active photo and placement after reopen without persisting an object URL', async () => {
    const backing = createMemoryStorageBacking()
    const first = await createRuntime(backing, ['saved-reveal'])
    const asset = await first.photos.importPhoto(new File(['photo'], 'saved.jpg', { type: 'image/jpeg' }), 'heart_reveal')
    await first.heartRevealPhotos.setActivePhoto(asset.id, { positionX: .2, positionY: .8, zoom: .7 })
    first.adapter.close()

    const reopened = await createRuntime(backing, ['unused'])
    expect(reopened.initial.activeHeartRevealProject?.photoPlacement).toEqual({ positionX: .2, positionY: .8, zoom: .7 })
    renderToday(reopened)
    await waitFor(() => expect(document.querySelector('.heart-reveal-photo-visual__photo--real')).toHaveAttribute('data-zoom', '0.7'))
    expect(document.querySelector('.heart-reveal-photo-visual__photo--real')).toHaveAttribute('data-position-x', '0.2')
    expect(document.querySelector('.heart-reveal-photo-visual__photo--real')).toHaveAttribute('data-position-y', '0.8')
  })

  it('drags, zooms below one, resets, and saves placement through the shared geometry', async () => {
    const runtime = await createRuntime(undefined, ['placed'])
    const asset = await runtime.photos.importPhoto(new File(['photo'], 'placed.jpg', { type: 'image/jpeg' }), 'heart_reveal')
    runtime.initial.activeHeartRevealProject = await runtime.heartRevealPhotos.setActivePhoto(asset.id)
    renderEditor(runtime)
    await waitFor(() => expect(screen.getByRole('button', { name: '調整照片' })).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: '調整照片' }))
    const preview = document.querySelector<HTMLElement>('.heart-reveal-photo-editor__preview')!
    mockGeometry(preview)
    fireEvent.click(screen.getByRole('button', { name: '縮小' }))
    fireEvent.click(screen.getByRole('button', { name: '縮小' }))
    fireEvent.pointerDown(preview, { pointerId: 1, clientX: 100, clientY: 75 })
    fireEvent.pointerMove(preview, { pointerId: 1, clientX: 150, clientY: 130 })
    fireEvent.pointerUp(preview, { pointerId: 1, clientX: 150, clientY: 130 })
    fireEvent.click(screen.getByRole('button', { name: '完成調整' }))
    await waitFor(async () => expect((await runtime.heartRevealPhotos.getActiveProject())?.photoPlacement.zoom).toBe(.5))
    const saved = (await runtime.heartRevealPhotos.getActiveProject())!.photoPlacement!
    expect(saved.positionX).toBe(1)
    expect(saved.positionY).toBe(1)

    fireEvent.click(screen.getByRole('button', { name: '調整照片' }))
    fireEvent.click(screen.getByRole('button', { name: '重設位置' }))
    fireEvent.click(screen.getByRole('button', { name: '完成調整' }))
    await waitFor(async () => expect((await runtime.heartRevealPhotos.getActiveProject())?.photoPlacement).toEqual({ positionX: .5, positionY: .5, zoom: 1 }))
  })

  it('replaces and removes the photo without changing seven-note progress', async () => {
    const runtime = await createRuntime(undefined, ['old', 'replacement'])
    await runtime.heartPhrases.acceptHeartPhrase('一')
    await runtime.heartPhrases.acceptHeartPhrase('二')
    runtime.initial.heartPhrases = await runtime.heartPhrases.getTopHeartPhrases(7)
    runtime.initial.heartPhraseCount = 2
    const old = await runtime.photos.importPhoto(new File(['old'], 'old.jpg', { type: 'image/jpeg' }), 'heart_reveal')
    runtime.initial.activeHeartRevealProject = await runtime.heartRevealPhotos.setActivePhoto(old.id, { positionX: .1, positionY: .2, zoom: .6 })
    const filePicker = picker(new File(['new'], 'new.jpg', { type: 'image/jpeg' }))
    renderEditor(runtime, filePicker)
    fireEvent.click(screen.getByRole('button', { name: '更換照片' }))
    await screen.findByText('顯影照片已更新')
    expect((await runtime.heartRevealPhotos.getActiveProject())?.photoPlacement).toEqual({ positionX: .5, positionY: .5, zoom: 1 })
    expect(await runtime.photos.getPhotoAsset('old')).toBeUndefined()
    expect((await runtime.heartPhrases.getHeartPhrases())).toHaveLength(2)

    fireEvent.click(screen.getByRole('button', { name: '移除照片' }))
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '確認' }))
    await screen.findByText('顯影照片已移除')
    expect((await runtime.heartRevealPhotos.getActiveProject())?.photoAssetId).toBeUndefined()
    expect(await runtime.photos.getPhotoAsset('replacement')).toBeUndefined()
    expect((await runtime.heartPhrases.getHeartPhrases())).toHaveLength(2)
  })

  it('blocks unsafe deletion while active and retains a shared asset after unlink', async () => {
    const runtime = await createRuntime(undefined, ['shared'])
    const shared = await runtime.photos.importPhoto(new File(['shared'], 'shared.jpg', { type: 'image/jpeg' }), 'heart_reveal')
    await runtime.heartRevealPhotos.setActivePhoto(shared.id)
    await expect(runtime.photos.deletePhoto(shared.id)).rejects.toMatchObject({ code: 'photo_in_use' })
    await runtime.memoryMoments.createMemoryMoment({ content: 'shared', photoAssetId: shared.id })
    await runtime.heartRevealPhotos.clearActivePhoto()
    await expect(runtime.photos.deletePhoto(shared.id)).rejects.toMatchObject({ code: 'photo_in_use' })
    expect(await runtime.photos.getPhotoAsset(shared.id)).toBeDefined()
  })

  it('cleans an imported orphan when activating the replacement fails', async () => {
    const runtime = await createRuntime(undefined, ['orphan'])
    const failure = vi.spyOn(runtime.heartRevealPhotos, 'setActivePhoto').mockRejectedValueOnce(new Error('save failed'))
    await expect(replaceHeartRevealPhoto(new File(['bad'], 'bad.jpg', { type: 'image/jpeg' }), runtime.heartRevealPhotos, runtime.photos)).rejects.toThrow('save failed')
    expect(failure).toHaveBeenCalled()
    expect(await runtime.photos.getPhotoAsset('orphan')).toBeUndefined()
    expect(await runtime.photos.getRenderableMaster('orphan')).toBeUndefined()
  })

  it('switches locale without changing photo id, placement, or progress', async () => {
    const runtime = await createRuntime(undefined, ['locale-photo'])
    const asset = await runtime.photos.importPhoto(new File(['photo'], 'locale.jpg', { type: 'image/jpeg' }), 'heart_reveal')
    runtime.initial.activeHeartRevealProject = await runtime.heartRevealPhotos.setActivePhoto(asset.id, { positionX: .3, positionY: .7, zoom: .8 })
    await runtime.heartPhrases.acceptHeartPhrase('保留文字')
    runtime.initial.heartPhrases = await runtime.heartPhrases.getTopHeartPhrases(7)
    runtime.initial.heartPhraseCount = 1
    renderEditor(runtime)
    fireEvent.click(screen.getByRole('button', { name: '調整照片' }))
    const before = await runtime.heartRevealPhotos.getActiveProject()
    cleanup()
    renderEditor(runtime, picker(), 'en')
    expect(screen.getByRole('heading', { name: 'Seven Heart Notes · Photo Reveal' })).toBeInTheDocument()
    expect(await runtime.heartRevealPhotos.getActiveProject()).toEqual(before)
    expect((await runtime.heartPhrases.getHeartPhrases())).toHaveLength(1)
  })
})
