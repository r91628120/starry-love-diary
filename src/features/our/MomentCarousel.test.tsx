import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PersistenceProvider } from '../../data/PersistenceContext'
import { initializePersistence } from '../../data/persistence'
import { createMemoryStorageBacking, MemoryStorageAdapter } from '../../data/storage/MemoryStorageAdapter'
import type { PhotoAsset } from '../../data/types'
import { I18nProvider } from '../../i18n/I18nProvider'
import { WebPhotoPickerService } from '../../services/photoPickerService'
import { MomentCarousel } from './MomentCarousel'

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals() })

describe('MomentCarousel', () => {
  it('makes the existing View all moments action render every persisted moment', async () => {
    const backing = createMemoryStorageBacking()
    const first = await initializePersistence({ adapter: new MemoryStorageAdapter(backing), defaultLocale: 'en', localDate: '2026-09-08' })
    await first.memoryMoments.createMemoryMoment({ title: 'First moment', content: 'A first real memory', localDate: '2026-09-01' })
    await first.memoryMoments.createMemoryMoment({ title: 'Second moment', content: 'A second real memory', localDate: '2026-09-02' })
    first.adapter.close()
    const runtime = await initializePersistence({ adapter: new MemoryStorageAdapter(backing), defaultLocale: 'en', localDate: '2026-09-08' })

    render(<PersistenceProvider runtime={runtime}><I18nProvider initialLocale="en"><MomentCarousel photoManagement /></I18nProvider></PersistenceProvider>)

    expect(screen.queryByText('A first real memory')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'View all moments' }))
    expect(screen.getByText('A first real memory')).toBeInTheDocument()
    expect(screen.getAllByText('A second real memory')).toHaveLength(2)
  })

  it('rolls back a newly created moment when its optional photo cannot be imported', async () => {
    const runtime = await initializePersistence({ adapter: new MemoryStorageAdapter(), defaultLocale: 'en', localDate: '2026-09-08' })
    vi.spyOn(WebPhotoPickerService.prototype, 'pickOne').mockResolvedValue(new File(['photo'], 'moment.jpg', { type: 'image/jpeg' }))
    vi.spyOn(runtime.photos, 'importPhoto').mockRejectedValue(new Error('compression failed'))
    render(<PersistenceProvider runtime={runtime}><I18nProvider initialLocale="en"><MomentCarousel photoManagement /></I18nProvider></PersistenceProvider>)

    fireEvent.click(screen.getByRole('button', { name: 'Add' }))
    fireEvent.change(screen.getByLabelText('Content'), { target: { value: 'This must not become a partial record.' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add photo' }))
    await screen.findByText('moment.jpg')
    fireEvent.click(screen.getByRole('button', { name: 'Save this moment' }))

    await waitFor(async () => expect(await runtime.memoryMoments.getMemoryMoments()).toEqual([]))
  })

  it('keeps a no-photo moment as a text-only public card without photo controls', async () => {
    const runtime = await initializePersistence({ adapter: new MemoryStorageAdapter(), defaultLocale: 'en', localDate: '2026-09-08' })
    await runtime.memoryMoments.createMemoryMoment({ title: 'Text memory', content: 'A memory without a photo.', localDate: '2026-09-08' })
    runtime.initial.memoryMoments = await runtime.memoryMoments.getMemoryMoments()

    const view = render(<PersistenceProvider runtime={runtime}><I18nProvider initialLocale="en"><MomentCarousel /></I18nProvider></PersistenceProvider>)

    const card = view.container.querySelector('.moment-card')
    expect(card).toHaveClass('moment-card--text')
    expect(card?.querySelector('.moment-card__photo')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Add photo' })).not.toBeInTheDocument()
    expect(screen.queryByText('You can add a photo later.')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
  })

  it('renders a real photo in the public card while photo management remains available only in Settings mode', async () => {
    const runtime = await initializePersistence({ adapter: new MemoryStorageAdapter(), defaultLocale: 'en', localDate: '2026-09-08' })
    vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:moment-photo'), revokeObjectURL: vi.fn() })
    const asset: PhotoAsset = {
      id: 'moment-photo', category: 'gallery', storageKind: 'indexeddb_blob', localUri: 'indexeddb-photo://moment-photo/master', thumbnailUri: 'indexeddb-photo://moment-photo/thumbnail', mimeType: 'image/jpeg', width: 100, height: 100, fileSizeBytes: 5, thumbnailMimeType: 'image/jpeg', thumbnailWidth: 50, thumbnailHeight: 50, thumbnailFileSizeBytes: 5, createdAt: '2026-09-08T00:00:00.000Z', updatedAt: '2026-09-08T00:00:00.000Z',
    }
    await runtime.adapter.put('photoAssets', asset)
    await runtime.adapter.put('photoAssetBlobs', { id: asset.id, master: new Blob(['photo'], { type: 'image/jpeg' }), thumbnail: new Blob(['photo'], { type: 'image/jpeg' }) })
    await runtime.memoryMoments.createMemoryMoment({ content: 'A photo memory.', localDate: '2026-09-08', photoAssetId: asset.id })
    runtime.initial.memoryMoments = await runtime.memoryMoments.getMemoryMoments()

    const publicView = render(<PersistenceProvider runtime={runtime}><I18nProvider initialLocale="en"><MomentCarousel /></I18nProvider></PersistenceProvider>)
    await waitFor(() => expect(publicView.container.querySelector('.moment-card__photo img')).not.toBeNull())
    expect(screen.queryByRole('button', { name: 'Change photo' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Adjust photo' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Remove photo' })).not.toBeInTheDocument()
    publicView.unmount()

    render(<PersistenceProvider runtime={runtime}><I18nProvider initialLocale="en"><MomentCarousel photoManagement /></I18nProvider></PersistenceProvider>)
    expect(screen.getByRole('button', { name: 'Replace photo' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Adjust photo' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remove photo' })).toBeInTheDocument()
  })
})
