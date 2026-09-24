import { readFileSync } from 'node:fs'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { PersistenceProvider } from '../../data/PersistenceContext'
import { LocalMemoryWallLayoutRepository, MAX_MEMORY_WALL_PHOTOS, MemoryWallValidationError, memoryWallLayoutType } from '../../data/photo/MemoryWallLayoutRepository'
import { IndexedDbPhotoContentStore } from '../../data/photo/PhotoContentStore'
import { LocalPhotoRepository, PhotoInUseError } from '../../data/photo/PhotoRepository'
import { initializePersistence, type PersistenceRuntime } from '../../data/persistence'
import { createMemoryStorageBacking, MemoryStorageAdapter, type MemoryStorageBacking } from '../../data/storage/MemoryStorageAdapter'
import { I18nProvider } from '../../i18n/I18nProvider'
import { useI18n } from '../../i18n/I18nContext'
import { memoryWallEditorMessages } from '../../i18n/memoryWallEditorMessages'
import type { PhotoCompressionService } from '../../services/photoCompressionService'
import { MemoryWall } from './MemoryWall'

const compression: PhotoCompressionService = {
  compress: async () => ({
    master: { blob: new Blob(['master'], { type: 'image/jpeg' }), mimeType: 'image/jpeg', width: 1200, height: 900 },
    thumbnail: { blob: new Blob(['thumb'], { type: 'image/jpeg' }), mimeType: 'image/jpeg', width: 512, height: 384 },
  }),
}

function file(index: number) { return new File([String(index)], `photo-${index}.jpg`, { type: 'image/jpeg' }) }

async function createRuntime(backing: MemoryStorageBacking = createMemoryStorageBacking(), photoCount = 0) {
  const runtime = await initializePersistence({ adapter: new MemoryStorageAdapter(backing), defaultLocale: 'zh-TW', localDate: '2026-09-03' })
  let photoId = 0
  runtime.photos = new LocalPhotoRepository(runtime.adapter, new IndexedDbPhotoContentStore(runtime.adapter), compression, {
    createId: () => `gallery-${++photoId}`,
    now: () => `2026-09-03T08:00:${String(photoId).padStart(2, '0')}.000Z`,
  })
  runtime.memoryWallLayouts = new LocalMemoryWallLayoutRepository(runtime.adapter, runtime.photos, () => '2026-09-03T09:00:00.000Z')
  for (let index = 1; index <= photoCount; index++) await runtime.photos.importPhoto(file(index), 'gallery')
  return runtime
}

function renderWall(runtime: PersistenceRuntime) {
  return render(<PersistenceProvider runtime={runtime}><I18nProvider initialLocale="zh-TW"><MemoryRouter initialEntries={['/our']}><Routes><Route path="/our" element={<MemoryWall />} /><Route path="/settings/memory-wall-photos" element={<p>photo manager destination</p>} /></Routes></MemoryRouter></I18nProvider></PersistenceProvider>)
}

function galleryChoices(container: HTMLElement) {
  return [...container.querySelectorAll<HTMLButtonElement>('.memory-wall-picker__choice')]
}

function mockFrameGeometry(frame: HTMLElement, frameWidth = 200, frameHeight = 200, sourceWidth = 200, sourceHeight = 200) {
  const crop = frame.querySelector<HTMLElement>('.memory-wall-frame__crop')!
  const image = crop.querySelector<HTMLImageElement>('img')!
  vi.spyOn(crop, 'getBoundingClientRect').mockReturnValue({ x: 0, y: 0, top: 0, left: 0, right: frameWidth, bottom: frameHeight, width: frameWidth, height: frameHeight, toJSON: () => ({}) })
  Object.defineProperty(image, 'naturalWidth', { configurable: true, value: sourceWidth })
  Object.defineProperty(image, 'naturalHeight', { configurable: true, value: sourceHeight })
  fireEvent.load(image)
}

beforeEach(() => {
  let objectUrl = 0
  Object.defineProperty(window, 'PointerEvent', { configurable: true, value: MouseEvent })
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn(() => `blob:wall-${++objectUrl}`) })
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() })
  Object.defineProperty(HTMLElement.prototype, 'setPointerCapture', { configurable: true, value: vi.fn() })
  Object.defineProperty(HTMLElement.prototype, 'hasPointerCapture', { configurable: true, value: vi.fn(() => true) })
  Object.defineProperty(HTMLElement.prototype, 'releasePointerCapture', { configurable: true, value: vi.fn() })
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('Memory Wall layout repository', () => {
  it('maps 1–6 photos to the six stable layouts', () => {
    expect(Array.from({ length: 6 }, (_, index) => memoryWallLayoutType(index + 1))).toEqual(['single', 'split', 'feature_two', 'grid_four', 'feature_four', 'grid_six'])
    expect(() => memoryWallLayoutType(0)).toThrow(MemoryWallValidationError)
    expect(() => memoryWallLayoutType(7)).toThrow(MemoryWallValidationError)
  })

  it('persists slot order and independently normalized placements while rejecting duplicates and non-gallery assets', async () => {
    const runtime = await createRuntime(undefined, 3)
    const assets = await runtime.photos.listPhotoAssets('gallery')
    const saved = await runtime.memoryWallLayouts.saveActiveLayout([
      { id: 'first', photoAssetId: assets[2].id, placement: { positionX: -1, positionY: 2, zoom: 5 } },
      { id: 'second', photoAssetId: assets[0].id, placement: { positionX: .2, positionY: .8, zoom: .75 } },
    ])
    expect(saved.layoutType).toBe('split')
    expect(saved.slots.map((slot) => slot.id)).toEqual(['first', 'second'])
    expect(saved.slots[0].placement).toEqual({ positionX: 0, positionY: 1, zoom: 4 })
    expect(saved.slots[1].placement).toEqual({ positionX: .2, positionY: .8, zoom: .75 })
    await expect(runtime.memoryWallLayouts.saveActiveLayout([{ photoAssetId: assets[0].id }, { photoAssetId: assets[0].id }])).rejects.toMatchObject({ code: 'duplicate_photo' })
    await expect(runtime.memoryWallLayouts.saveActiveLayout(Array.from({ length: 7 }, (_, index) => ({ photoAssetId: assets[index % 3].id })))).rejects.toMatchObject({ code: 'photo_count' })
    const profile = await runtime.photos.importPhoto(file(8), 'profile')
    await expect(runtime.memoryWallLayouts.saveActiveLayout([{ photoAssetId: profile.id }])).rejects.toMatchObject({ code: 'gallery_photo_required' })
  })

  it('lets the same asset receive a different placement in a later frame contract', async () => {
    const runtime = await createRuntime(undefined, 1)
    const [asset] = await runtime.photos.listPhotoAssets('gallery')
    await runtime.memoryWallLayouts.saveActiveLayout([{ id: 'portrait-frame', photoAssetId: asset.id, placement: { positionX: .1, positionY: .3, zoom: 1.5 } }])
    const next = await runtime.memoryWallLayouts.saveActiveLayout([{ id: 'landscape-frame', photoAssetId: asset.id, placement: { positionX: .8, positionY: .7, zoom: 2 } }])
    expect(next.slots[0]).toMatchObject({ id: 'landscape-frame', photoAssetId: asset.id, placement: { positionX: .8, positionY: .7, zoom: 2 } })
  })
})

describe('Memory Wall editor', () => {
  it('shows the gallery empty state and routes to photo management', async () => {
    const runtime = await createRuntime()
    renderWall(runtime)
    expect(await screen.findByText('尚未加入回憶照片')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '前往照片管理' }))
    expect(await screen.findByText('photo manager destination')).toBeInTheDocument()
  })

  it('selects and deselects photos, rejects a seventh, and renders every 1–6 layout', async () => {
    for (let count = 1; count <= MAX_MEMORY_WALL_PHOTOS; count++) {
      const runtime = await createRuntime(undefined, 7)
      const view = renderWall(runtime)
      fireEvent.click(await screen.findByRole('button', { name: '編輯回憶牆' }))
      const choices = galleryChoices(view.container)
      for (let index = 0; index < count; index++) fireEvent.click(choices[index])
      expect(screen.getAllByText(`已選 ${count} / 6`).length).toBeGreaterThan(0)
      expect(view.container.querySelector('.memory-wall__canvas')).toHaveAttribute('data-layout', memoryWallLayoutType(count))
      if (count === 1) {
        fireEvent.click(choices[0])
        expect(screen.getAllByText('已選 0 / 6').length).toBeGreaterThan(0)
        fireEvent.click(choices[0])
      }
      if (count === 6) {
        fireEvent.click(choices[6])
        expect(screen.getByText('最多只能選 6 張')).toBeInTheDocument()
        expect(view.container.querySelectorAll('.memory-wall-frame')).toHaveLength(6)
      }
      cleanup()
    }
  })

  it('keeps selected-photo adjustment between the preview and a large photo library, before save actions', async () => {
    const runtime = await createRuntime(undefined, 60)
    const view = renderWall(runtime)
    fireEvent.click(await screen.findByRole('button', { name: '編輯回憶牆' }))
    fireEvent.click(galleryChoices(view.container)[0])

    const preview = view.container.querySelector('.memory-wall__canvas')!
    const adjustment = view.container.querySelector('.memory-wall-adjust')!
    const library = view.container.querySelector('.memory-wall-picker')!
    const actions = view.container.querySelector('.memory-wall-editor__actions')!
    expect(preview.compareDocumentPosition(adjustment) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(adjustment.compareDocumentPosition(library) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(library.compareDocumentPosition(actions) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(galleryChoices(view.container)).toHaveLength(60)
  })

  it('saves and reopens the active layout with stable order', async () => {
    const backing = createMemoryStorageBacking()
    const first = await createRuntime(backing, 3)
    const view = renderWall(first)
    fireEvent.click(await screen.findByRole('button', { name: '編輯回憶牆' }))
    const choices = galleryChoices(view.container)
    fireEvent.click(choices[2]); fireEvent.click(choices[0]); fireEvent.click(choices[1])
    fireEvent.click(screen.getByRole('button', { name: '儲存回憶牆' }))
    expect(await screen.findByText('回憶牆已儲存')).toBeInTheDocument()
    const savedOrder = (await first.memoryWallLayouts.getActiveLayout())?.slots.map((slot) => slot.photoAssetId)
    cleanup(); first.adapter.close()

    const reopened = await createRuntime(backing)
    renderWall(reopened)
    await waitFor(() => expect(document.querySelectorAll('.memory-wall-frame')).toHaveLength(3))
    expect((await reopened.memoryWallLayouts.getActiveLayout())?.slots.map((slot) => slot.photoAssetId)).toEqual(savedOrder)
    expect(document.querySelector('.memory-wall__canvas')).toHaveAttribute('data-layout', 'feature_two')
  })

  it('zooms, drags, clamps, resets, and persists the selected frame placement', async () => {
    const runtime = await createRuntime(undefined, 1)
    const view = renderWall(runtime)
    fireEvent.click(await screen.findByRole('button', { name: '編輯回憶牆' }))
    fireEvent.click(galleryChoices(view.container)[0])
    const frame = screen.getByRole('button', { name: '已選擇照片格 1' })
    await waitFor(() => expect(frame.querySelector('.memory-wall-frame__crop img')).toBeInTheDocument())
    mockFrameGeometry(frame)
    fireEvent.click(screen.getByRole('button', { name: '放大' }))
    fireEvent.pointerDown(frame, { pointerId: 1, clientX: 100, clientY: 100 })
    fireEvent.pointerMove(frame, { pointerId: 1, clientX: -500, clientY: 700 })
    fireEvent.pointerUp(frame, { pointerId: 1, clientX: -500, clientY: 700 })
    fireEvent.click(screen.getByRole('button', { name: '儲存回憶牆' }))
    await waitFor(async () => expect((await runtime.memoryWallLayouts.getActiveLayout())?.slots[0].placement.zoom).toBe(1.25))
    expect((await runtime.memoryWallLayouts.getActiveLayout())?.slots[0].placement).toMatchObject({ positionX: 0, positionY: 1 })

    fireEvent.click(screen.getByRole('button', { name: '編輯回憶牆' }))
    fireEvent.click(view.container.querySelector<HTMLButtonElement>('.memory-wall-frame')!)
    fireEvent.click(screen.getByRole('button', { name: '重設位置' }))
    fireEvent.click(screen.getByRole('button', { name: '儲存回憶牆' }))
    await waitFor(async () => expect((await runtime.memoryWallLayouts.getActiveLayout())?.slots[0].placement).toEqual({ positionX: .5, positionY: .5, zoom: 1 }))
  })

  it('zooms below one, clamps at 0.5, and keeps the smaller zoom after reopen', async () => {
    const backing = createMemoryStorageBacking()
    const runtime = await createRuntime(backing, 1)
    const view = renderWall(runtime)
    fireEvent.click(await screen.findByRole('button', { name: '編輯回憶牆' }))
    fireEvent.click(galleryChoices(view.container)[0])
    const frame = screen.getByRole('button', { name: '已選擇照片格 1' })
    await waitFor(() => expect(frame.querySelector('.memory-wall-frame__crop img')).toBeInTheDocument())
    mockFrameGeometry(frame)
    for (let count = 0; count < 4; count++) fireEvent.click(screen.getByRole('button', { name: '縮小' }))
    fireEvent.pointerDown(frame, { pointerId: 1, clientX: 100, clientY: 100 })
    fireEvent.pointerMove(frame, { pointerId: 1, clientX: 100, clientY: 150 })
    fireEvent.pointerUp(frame, { pointerId: 1, clientX: 100, clientY: 150 })
    fireEvent.click(screen.getByRole('button', { name: '儲存回憶牆' }))
    await waitFor(async () => expect((await runtime.memoryWallLayouts.getActiveLayout())?.slots[0].placement.zoom).toBe(.5))
    expect((await runtime.memoryWallLayouts.getActiveLayout())?.slots[0].placement.positionY).toBe(1)
    cleanup(); runtime.adapter.close()

    const reopened = await createRuntime(backing)
    renderWall(reopened)
    await waitFor(() => expect(document.querySelector('.memory-wall-frame__crop img')).toHaveStyle({ transform: 'scale(0.5)' }))
    expect((await reopened.memoryWallLayouts.getActiveLayout())?.slots[0].placement.zoom).toBe(.5)
    expect((await reopened.memoryWallLayouts.getActiveLayout())?.slots[0].placement.positionY).toBe(1)
  })

  it('replaces and removes a slot without deleting either gallery asset', async () => {
    const runtime = await createRuntime(undefined, 3)
    const assets = await runtime.photos.listPhotoAssets('gallery')
    await runtime.memoryWallLayouts.saveActiveLayout([{ id: 'one', photoAssetId: assets[0].id }, { id: 'two', photoAssetId: assets[1].id }])
    const view = renderWall(runtime)
    fireEvent.click(await screen.findByRole('button', { name: '編輯回憶牆' }))
    fireEvent.click(view.container.querySelectorAll<HTMLButtonElement>('.memory-wall-frame')[0])
    fireEvent.click(screen.getByRole('button', { name: '更換照片' }))
    fireEvent.click(galleryChoices(view.container).find((button) => button.getAttribute('aria-pressed') === 'false')!)
    fireEvent.click(screen.getByRole('button', { name: '儲存回憶牆' }))
    await waitFor(async () => expect((await runtime.memoryWallLayouts.getActiveLayout())?.slots[0].photoAssetId).not.toBe(assets[0].id))
    expect((await runtime.memoryWallLayouts.getActiveLayout())?.slots[0].placement).toEqual({ positionX: .5, positionY: .5, zoom: 1 })

    fireEvent.click(screen.getByRole('button', { name: '編輯回憶牆' }))
    fireEvent.click(view.container.querySelectorAll<HTMLButtonElement>('.memory-wall-frame')[0])
    fireEvent.click(screen.getByRole('button', { name: '移除照片' }))
    fireEvent.click(screen.getByRole('button', { name: '儲存回憶牆' }))
    await waitFor(async () => expect((await runtime.memoryWallLayouts.getActiveLayout())?.layoutType).toBe('single'))
    expect(await runtime.photos.listPhotoAssets('gallery')).toHaveLength(3)
  })

  it('makes the active wall a reference that blocks gallery deletion until the asset is removed', async () => {
    const runtime = await createRuntime(undefined, 2)
    const assets = await runtime.photos.listPhotoAssets('gallery')
    await runtime.memoryWallLayouts.saveActiveLayout([{ photoAssetId: assets[0].id }])
    expect(await runtime.photos.getReferences(assets[0].id)).toEqual([expect.objectContaining({ type: 'photo_layout', recordId: 'memory-wall-active' })])
    await expect(runtime.photos.deletePhoto(assets[0].id)).rejects.toBeInstanceOf(PhotoInUseError)
    await runtime.memoryWallLayouts.saveActiveLayout([{ photoAssetId: assets[1].id }])
    expect(await runtime.photos.getReferences(assets[0].id)).toEqual([])
    await runtime.photos.deletePhoto(assets[0].id)
    expect(await runtime.photos.getPhotoAsset(assets[0].id)).toBeUndefined()
  })

  it('opens, navigates, and closes the master-photo lightbox without changing placement', async () => {
    const runtime = await createRuntime(undefined, 2)
    const assets = await runtime.photos.listPhotoAssets('gallery')
    await runtime.memoryWallLayouts.saveActiveLayout([{ photoAssetId: assets[0].id, placement: { positionX: .2, positionY: .7, zoom: 2 } }, { photoAssetId: assets[1].id }])
    renderWall(runtime)
    fireEvent.click(await screen.findByRole('button', { name: '放大查看照片 1' }))
    expect(await screen.findByRole('dialog', { name: '放大查看回憶照片' })).toBeInTheDocument()
    const firstSrc = screen.getByRole('dialog').querySelector('img')?.src
    fireEvent.click(screen.getByRole('button', { name: '下一張照片' }))
    await waitFor(() => expect(screen.getByRole('dialog').querySelector('img')?.src).not.toBe(firstSrc))
    fireEvent.click(screen.getByRole('button', { name: '上一張照片' }))
    fireEvent.click(screen.getByRole('button', { name: '關閉照片預覽' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect((await runtime.memoryWallLayouts.getActiveLayout())?.slots[0].placement).toEqual({ positionX: .2, positionY: .7, zoom: 2 })
  })

  it('rerenders locale text without changing layout IDs or placement', async () => {
    const runtime = await createRuntime(undefined, 1)
    const [asset] = await runtime.photos.listPhotoAssets('gallery')
    await runtime.memoryWallLayouts.saveActiveLayout([{ id: 'stable-slot', photoAssetId: asset.id, placement: { positionX: .25, positionY: .75, zoom: 1.5 } }])
    function LocaleWall() { const { setLocale } = useI18n(); return <><button onClick={() => setLocale('fr')}>switch locale</button><MemoryWall /></> }
    render(<PersistenceProvider runtime={runtime}><I18nProvider initialLocale="zh-TW"><MemoryRouter><LocaleWall /></MemoryRouter></I18nProvider></PersistenceProvider>)
    expect(await screen.findByRole('button', { name: '編輯回憶牆' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'switch locale' }))
    expect(await screen.findByRole('button', { name: 'Modifier le mur de souvenirs' })).toBeInTheDocument()
    expect((await runtime.memoryWallLayouts.getActiveLayout())?.slots[0]).toMatchObject({ id: 'stable-slot', photoAssetId: asset.id, placement: { positionX: .25, positionY: .75, zoom: 1.5 } })
  })
})

describe('Memory Wall editor localization and responsive contracts', () => {
  it('has matching, non-empty keys in all six locales', () => {
    const keys = Object.keys(memoryWallEditorMessages['zh-TW']).sort()
    for (const locale of ['zh-TW', 'en', 'ja', 'ko', 'es', 'fr'] as const) {
      expect(Object.keys(memoryWallEditorMessages[locale]).sort()).toEqual(keys)
      expect(Object.values(memoryWallEditorMessages[locale]).every((value) => value.trim().length > 0)).toBe(true)
    }
  })

  it('defines responsive, overflow-safe frames, controls, touch drag, and lightbox', () => {
    const css = readFileSync('src/features/our/our.css', 'utf8')
    expect(css).toMatch(/\.memory-wall-frame\.is-selected\{[^}]*touch-action:none/u)
    expect(css).toMatch(/\.memory-wall-frame__crop\{[^}]*overflow:hidden/u)
    expect(css).toMatch(/grid-template-columns:repeat\(12,minmax\(0,1fr\)\)/u)
    expect(css).toMatch(/max-height:calc\(100dvh - 6rem\)/u)
    expect(css).toMatch(/@media\(max-width:26rem\)/u)
  })
})
