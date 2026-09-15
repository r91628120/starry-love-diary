import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { PersistenceProvider } from '../../data/PersistenceContext'
import { PhotoInUseError, LocalPhotoRepository } from '../../data/photo/PhotoRepository'
import { IndexedDbPhotoContentStore } from '../../data/photo/PhotoContentStore'
import { GalleryCapacityError, importGalleryPhotos, MAX_GALLERY_PHOTOS } from '../../data/photo/galleryPhotoActions'
import { initializePersistence, type PersistenceRuntime } from '../../data/persistence'
import { createMemoryStorageBacking, MemoryStorageAdapter, type MemoryStorageBacking } from '../../data/storage/MemoryStorageAdapter'
import { I18nProvider } from '../../i18n/I18nProvider'
import { useI18n } from '../../i18n/I18nContext'
import { memoryWallPhotoLibraryMessages } from '../../i18n/memoryWallPhotoLibraryMessages'
import type { PhotoCompressionService } from '../../services/photoCompressionService'
import type { PhotoPickerService } from '../../services/photoPickerService'
import { MemoryWallPhotoLibraryPage } from '../../pages/MemoryWallPhotoLibraryPage'
import { SettingsPage } from '../../pages/SettingsPage'
import { MemoryWallPhotoLibrary } from './MemoryWallPhotoLibrary'

const compression: PhotoCompressionService = {
  compress: async () => ({
    master: { blob: new Blob(['master'], { type: 'image/jpeg' }), mimeType: 'image/jpeg', width: 1200, height: 900 },
    thumbnail: { blob: new Blob(['thumb'], { type: 'image/jpeg' }), mimeType: 'image/jpeg', width: 512, height: 384 },
  }),
}

function installPhotoRepository(runtime: PersistenceRuntime) {
  let nextId = 0
  runtime.photos = new LocalPhotoRepository(runtime.adapter, new IndexedDbPhotoContentStore(runtime.adapter), compression, {
    createId: () => `gallery-${++nextId}`,
    now: () => `2026-09-02T08:00:${String(nextId).padStart(2, '0')}.000Z`,
  })
}

async function createRuntime(backing: MemoryStorageBacking = createMemoryStorageBacking()) {
  const runtime = await initializePersistence({ adapter: new MemoryStorageAdapter(backing), defaultLocale: 'zh-TW', localDate: '2026-09-02' })
  installPhotoRepository(runtime)
  return runtime
}

function renderLibrary(runtime: PersistenceRuntime, picker: PhotoPickerService, locale: 'zh-TW' | 'en' = 'zh-TW') {
  return render(<PersistenceProvider runtime={runtime}><I18nProvider initialLocale={locale}><MemoryRouter><MemoryWallPhotoLibrary photoPicker={picker} /></MemoryRouter></I18nProvider></PersistenceProvider>)
}

function file(name: string) { return new File([name], name, { type: 'image/jpeg' }) }
function picker(one?: File, many: File[] = []): PhotoPickerService {
  return { pickOne: vi.fn().mockResolvedValue(one), pickMany: vi.fn().mockResolvedValue(many) }
}

async function seedGallery(runtime: PersistenceRuntime, count: number) {
  for (let index = 0; index < count; index++) await runtime.photos.importPhoto(file(`photo-${index}.jpg`), 'gallery')
}

beforeEach(() => {
  let objectUrl = 0
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn(() => `blob:gallery-${++objectUrl}`) })
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() })
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('Memory Wall photo library', () => {
  it('opens from Settings, renders the empty gallery, and returns to Settings', async () => {
    const runtime = await createRuntime()
    render(<PersistenceProvider runtime={runtime}><I18nProvider initialLocale="zh-TW"><MemoryRouter initialEntries={['/settings']}><Routes><Route path="/settings" element={<SettingsPage />} /><Route path="/settings/memory-wall-photos" element={<MemoryWallPhotoLibraryPage />} /></Routes></MemoryRouter></I18nProvider></PersistenceProvider>)
    fireEvent.click(screen.getByRole('button', { name: '回憶牆照片管理' }))
    expect(await screen.findByRole('heading', { level: 1, name: '回憶牆照片管理' })).toBeInTheDocument()
    expect(screen.getByText('尚未加入照片')).toBeInTheDocument()
    expect(screen.getByText('0 / 60')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '返回' }))
    expect(await screen.findByRole('heading', { level: 1, name: '設定' })).toBeInTheDocument()
  })

  it('adds one photo, renders its thumbnail, opens the master lightbox, and revokes URLs', async () => {
    const runtime = await createRuntime()
    renderLibrary(runtime, picker(file('one.jpg')))
    fireEvent.click(screen.getByRole('button', { name: '新增照片' }))
    expect(await screen.findByText('1 / 60')).toBeInTheDocument()
    const image = await screen.findByRole('img', { name: '回憶照片 1' })
    expect(image).toHaveAttribute('src', expect.stringContaining('blob:gallery-'))
    expect((await runtime.photos.listPhotoAssets('gallery'))[0]?.category).toBe('gallery')
    fireEvent.click(screen.getByRole('button', { name: /放大查看照片/ }))
    expect(await screen.findByRole('dialog', { name: '放大查看照片' })).toBeInTheDocument()
    expect(within(screen.getByRole('dialog')).getByRole('img')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '關閉照片預覽' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    cleanup()
    expect(URL.revokeObjectURL).toHaveBeenCalled()
  })

  it('adds multiple photos and treats both picker cancellation paths as no-ops', async () => {
    const runtime = await createRuntime()
    const photoPicker = picker(undefined, [file('a.jpg'), file('b.jpg'), file('c.jpg')])
    renderLibrary(runtime, photoPicker)
    fireEvent.click(screen.getByRole('button', { name: '新增照片' }))
    await waitFor(() => expect(photoPicker.pickOne).toHaveBeenCalled())
    expect(await runtime.photos.listPhotoAssets('gallery')).toEqual([])
    fireEvent.click(screen.getByRole('button', { name: '新增多張照片' }))
    expect(await screen.findByText('3 / 60')).toBeInTheDocument()
    expect(await runtime.photos.listPhotoAssets('gallery')).toHaveLength(3)
    vi.mocked(photoPicker.pickMany).mockResolvedValueOnce([])
    fireEvent.click(screen.getByRole('button', { name: '新增多張照片' }))
    await waitFor(() => expect(photoPicker.pickMany).toHaveBeenLastCalledWith(57))
    expect(await runtime.photos.listPhotoAssets('gallery')).toHaveLength(3)
  })

  it('rolls back earlier files when a multi-import fails, leaving no gallery orphan', async () => {
    const adapter = new MemoryStorageAdapter()
    await adapter.open()
    let compressionCall = 0
    const failingCompression: PhotoCompressionService = {
      compress: async () => {
        compressionCall += 1
        if (compressionCall === 2) throw new Error('compression failed')
        return compression.compress(file('source.jpg'))
      },
    }
    const repository = new LocalPhotoRepository(adapter, new IndexedDbPhotoContentStore(adapter), failingCompression, { createId: () => 'rolled-back-gallery' })
    await expect(importGalleryPhotos(repository, [file('first.jpg'), file('second.jpg')])).rejects.toThrow('compression failed')
    expect(await repository.listPhotoAssets('gallery')).toEqual([])
    expect(await repository.getPhotoAsset('rolled-back-gallery')).toBeUndefined()
    expect(await repository.getRenderableMaster('rolled-back-gallery')).toBeUndefined()
  })

  it('enforces the 60-photo limit and passes only the remaining capacity to multi-pick', async () => {
    const runtime = await createRuntime()
    await seedGallery(runtime, 58)
    const photoPicker = picker(undefined, [file('last-a.jpg'), file('last-b.jpg')])
    renderLibrary(runtime, photoPicker)
    expect(await screen.findByText('58 / 60')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '新增多張照片' }))
    await waitFor(() => expect(photoPicker.pickMany).toHaveBeenCalledWith(2))
    expect(await screen.findByText('60 / 60')).toBeInTheDocument()
    expect(screen.getByText('照片庫已滿')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '新增照片' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '新增多張照片' })).toBeDisabled()
    await expect(importGalleryPhotos(runtime.photos, [file('overflow.jpg')])).rejects.toBeInstanceOf(GalleryCapacityError)
    expect(await runtime.photos.listPhotoAssets('gallery')).toHaveLength(MAX_GALLERY_PHOTOS)
  })

  it('restores gallery blobs after reopen without relying on an old object URL', async () => {
    const backing = createMemoryStorageBacking()
    const first = await createRuntime(backing)
    await first.photos.importPhoto(file('persisted.jpg'), 'gallery')
    first.adapter.close()
    const reopened = await createRuntime(backing)
    renderLibrary(reopened, picker())
    expect(await screen.findByText('1 / 60')).toBeInTheDocument()
    expect(await screen.findByRole('img', { name: '回憶照片 1' })).toHaveAttribute('src', 'blob:gallery-1')
    expect(await reopened.photos.getRenderableThumbnail('gallery-1')).toBeDefined()
  })

  it('requires confirmation, then removes unreferenced metadata and blobs without an orphan', async () => {
    const runtime = await createRuntime()
    const asset = await runtime.photos.importPhoto(file('delete.jpg'), 'gallery')
    renderLibrary(runtime, picker())
    const remove = await screen.findByRole('button', { name: '移除照片' })
    fireEvent.click(remove)
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '取消' }))
    expect(await runtime.photos.getPhotoAsset(asset.id)).toBeDefined()
    fireEvent.click(screen.getByRole('button', { name: '移除照片' }))
    fireEvent.click(screen.getByRole('button', { name: '確認' }))
    expect(await screen.findByText('照片已移除')).toBeInTheDocument()
    expect(await runtime.photos.getPhotoAsset(asset.id)).toBeUndefined()
    expect(await runtime.photos.getRenderableMaster(asset.id)).toBeUndefined()
    expect(await runtime.photos.getRenderableThumbnail(asset.id)).toBeUndefined()
  })

  it('does not delete a referenced gallery asset', async () => {
    const runtime = await createRuntime()
    const asset = await runtime.photos.importPhoto(file('shared.jpg'), 'gallery')
    await runtime.memoryMoments.createMemoryMoment({ content: 'shared memory', photoAssetId: asset.id })
    renderLibrary(runtime, picker())
    fireEvent.click(await screen.findByRole('button', { name: '移除照片' }))
    fireEvent.click(screen.getByRole('button', { name: '確認' }))
    expect(await screen.findByText('照片仍在使用中，無法移除。')).toBeInTheDocument()
    expect(await runtime.photos.getPhotoAsset(asset.id)).toBeDefined()
    await expect(runtime.photos.deletePhoto(asset.id)).rejects.toBeInstanceOf(PhotoInUseError)
  })

  it('rerenders in English without changing gallery data', async () => {
    const runtime = await createRuntime()
    const asset = await runtime.photos.importPhoto(file('locale.jpg'), 'gallery')
    function LocaleHarness() {
      const { setLocale } = useI18n()
      return <><button type="button" onClick={() => setLocale('en')}>switch locale</button><MemoryWallPhotoLibrary photoPicker={picker()} /></>
    }
    render(<PersistenceProvider runtime={runtime}><I18nProvider initialLocale="zh-TW"><MemoryRouter><LocaleHarness /></MemoryRouter></I18nProvider></PersistenceProvider>)
    expect(await screen.findByText('照片庫')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'switch locale' }))
    expect(await screen.findByRole('heading', { name: 'Photo library' })).toBeInTheDocument()
    expect(screen.queryByText('照片庫')).not.toBeInTheDocument()
    expect((await runtime.photos.listPhotoAssets('gallery')).map((photo) => photo.id)).toEqual([asset.id])
  })
})

describe('Memory Wall photo library localization', () => {
  it('has identical, non-empty keys in all six locales', () => {
    const canonicalKeys = Object.keys(memoryWallPhotoLibraryMessages['zh-TW'])
    expect(canonicalKeys.length).toBeGreaterThan(0)
    for (const locale of ['zh-TW', 'en', 'ja', 'ko', 'es', 'fr'] as const) {
      expect(Object.keys(memoryWallPhotoLibraryMessages[locale])).toEqual(canonicalKeys)
      expect(Object.values(memoryWallPhotoLibraryMessages[locale]).every((value) => value.trim().length > 0)).toBe(true)
    }
  })

  it('keeps the thumbnail grid and lightbox within narrow viewports', () => {
    const css = readFileSync('src/features/settings/memoryWallPhotoLibrary.css', 'utf8')
    expect(css).toMatch(/grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/u)
    expect(css).toMatch(/max-width:100%/u)
    expect(css).toMatch(/max-height:calc\(100dvh - 6rem\)/u)
    expect(css).toMatch(/overflow-x:clip/u)
  })
})
