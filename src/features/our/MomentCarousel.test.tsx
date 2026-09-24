import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PersistenceProvider } from '../../data/PersistenceContext'
import { initializePersistence } from '../../data/persistence'
import { createMemoryStorageBacking, MemoryStorageAdapter } from '../../data/storage/MemoryStorageAdapter'
import type { PhotoAsset } from '../../data/types'
import { I18nProvider } from '../../i18n/I18nProvider'
import { WebPhotoPickerService } from '../../services/photoPickerService'
import { MomentCarousel } from './MomentCarousel'
import { MomentPhotoManagementPage } from '../../pages/MomentPhotoManagementPage'

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals() })

function LocationProbe() {
  const location = useLocation()
  return <output data-testid="location">{JSON.stringify({ pathname: location.pathname, state: location.state })}</output>
}

function OurMomentEntry() {
  const navigate = useNavigate()
  return <MomentCarousel onManagePhoto={(momentId) => navigate('/settings/moments', { state: { from: '/our', momentId } })} />
}

describe('MomentCarousel', () => {
  it('keeps the native date input constrained to its own Moments form field', async () => {
    const runtime = await initializePersistence({ adapter: new MemoryStorageAdapter(), defaultLocale: 'en', localDate: '2026-09-08' })
    const view = render(<PersistenceProvider runtime={runtime}><I18nProvider initialLocale="en"><MomentCarousel photoManagement /></I18nProvider></PersistenceProvider>)

    fireEvent.click(screen.getByRole('button', { name: 'Add' }))

    const dateInput = screen.getByLabelText('Date')
    expect(dateInput).toHaveAttribute('type', 'date')
    expect(dateInput).toHaveClass('moment-form__date-input')
    expect(dateInput.closest('label')).toHaveClass('moment-form__date-field')
    const css = readFileSync('src/features/our/our.css', 'utf8')
    expect(css).toMatch(/\.moment-carousel \.moment-form__date-field\{min-width:0\}\.moment-carousel \.moment-form__date-input\{min-width:0;max-width:100%\}/u)
    expect(css).toContain('@media(max-width:28rem){.moment-carousel .our-data-form{grid-template-columns:1fr}}')
    expect(css).toContain('@media(max-width:30rem){.moment-card__photo{aspect-ratio:16/9}.moment-card{grid-template-columns:1fr!important}}')
    expect(view.container.querySelector('.important-dates .moment-form__date-input')).toBeNull()
  })

  it('keeps the native date binding unchanged through moment save and edit', async () => {
    const runtime = await initializePersistence({ adapter: new MemoryStorageAdapter(), defaultLocale: 'en', localDate: '2026-09-08' })
    render(<PersistenceProvider runtime={runtime}><I18nProvider initialLocale="en"><MomentCarousel photoManagement /></I18nProvider></PersistenceProvider>)

    fireEvent.click(screen.getByRole('button', { name: 'Add' }))
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2026-09-07' } })
    fireEvent.change(screen.getByLabelText('Content'), { target: { value: 'A saved local date.' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save this moment' }))

    await waitFor(async () => expect(await runtime.memoryMoments.getMemoryMoments()).toMatchObject([{ localDate: '2026-09-07', content: 'A saved local date.' }]))
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    expect(screen.getByLabelText('Date')).toHaveValue('2026-09-07')
  })

  it('opens a saved Moment in the existing Settings photo-management flow without discarding an edit draft', async () => {
    const runtime = await initializePersistence({ adapter: new MemoryStorageAdapter(), defaultLocale: 'en', localDate: '2026-09-08' })
    const saved = await runtime.memoryMoments.createMemoryMoment({ title: 'Saved moment', content: 'Keep this safe.', localDate: '2026-09-07' })
    runtime.initial.memoryMoments = await runtime.memoryMoments.getMemoryMoments()
    render(<PersistenceProvider runtime={runtime}><I18nProvider initialLocale={"en"}><MemoryRouter initialEntries={['/our']}><LocationProbe /><OurMomentEntry /></MemoryRouter></I18nProvider></PersistenceProvider>)

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    const managePhotos = screen.getByRole('button', { name: 'Manage photos' })
    expect(managePhotos).toBeEnabled()
    fireEvent.change(screen.getByLabelText('Content'), { target: { value: 'Unsaved draft' } })
    expect(managePhotos).toBeDisabled()
    fireEvent.change(screen.getByLabelText('Content'), { target: { value: 'Keep this safe.' } })
    expect(managePhotos).toBeEnabled()
    fireEvent.click(managePhotos)
    expect(screen.getByTestId('location')).toHaveTextContent(`"pathname":"/settings/moments"`)
    expect(screen.getByTestId('location')).toHaveTextContent(`"momentId":"${saved.id}"`)
  })

  it('focuses the routed saved Moment in the existing photo-management page', async () => {
    const runtime = await initializePersistence({ adapter: new MemoryStorageAdapter(), defaultLocale: 'en', localDate: '2026-09-08' })
    await runtime.memoryMoments.createMemoryMoment({ title: 'First moment', content: 'First content', localDate: '2026-09-06' })
    const target = await runtime.memoryMoments.createMemoryMoment({ title: 'Target moment', content: 'Target content', localDate: '2026-09-07' })
    runtime.initial.memoryMoments = await runtime.memoryMoments.getMemoryMoments()
    render(<PersistenceProvider runtime={runtime}><I18nProvider initialLocale="en"><MemoryRouter initialEntries={[{ pathname: '/settings/moments', state: { from: '/our', momentId: target.id } }]}><MomentPhotoManagementPage /></MemoryRouter></I18nProvider></PersistenceProvider>)

    await waitFor(() => expect(screen.getByText('Target content')).toBeInTheDocument())
    expect(screen.getByRole('button', { name: 'Add photo' })).toBeInTheDocument()
  })

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

  it('renders the Moment management actions as full-width icon-first vertical rows without changing photo conditions', async () => {
    const runtime = await initializePersistence({ adapter: new MemoryStorageAdapter(), defaultLocale: 'en', localDate: '2026-09-08' })
    await runtime.memoryMoments.createMemoryMoment({ title: 'Text memory', content: 'A memory without a photo.', localDate: '2026-09-08' })
    runtime.initial.memoryMoments = await runtime.memoryMoments.getMemoryMoments()

    const view = render(<PersistenceProvider runtime={runtime}><I18nProvider initialLocale="en"><MomentCarousel photoManagement /></I18nProvider></PersistenceProvider>)
    const actionList = view.container.querySelector('.moment-action-list')
    expect(actionList).toBeInTheDocument()
    expect(Array.from(actionList!.querySelectorAll(':scope > button')).map((button) => button.textContent)).toEqual(['Edit', 'Delete'])
    expect(actionList?.querySelectorAll('svg')).toHaveLength(2)
    expect(actionList?.querySelectorAll('button > svg + span')).toHaveLength(2)
    expect(screen.queryByRole('button', { name: 'Replace photo' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Adjust photo' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Remove photo' })).not.toBeInTheDocument()

    const source = readFileSync('src/features/our/MomentCarousel.tsx', 'utf8')
    const css = readFileSync('src/features/our/our.css', 'utf8')
    expect(source).toContain('moment-action-list__row')
    expect(source).not.toMatch(/moment-action-list[\s\S]*?<br\s*\/?/u)
    expect(css).toMatch(/\.moment-carousel \.moment-action-list\{display:grid;width:100%;min-width:0/u)
    expect(css).toMatch(/grid-template-columns:1\.5rem minmax\(0,1fr\)/u)
    expect(css).toContain('white-space:normal')
    expect(css).not.toMatch(/\.moment-carousel \.moment-action-list[^}]*overflow-x:\s*(auto|scroll)/u)
    expect(css).not.toMatch(/\.moment-carousel \.moment-action-list__row[^}]*line-clamp/u)
  })
})
