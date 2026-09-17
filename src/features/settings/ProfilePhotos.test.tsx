import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { PersistenceProvider } from '../../data/PersistenceContext'
import { initializePersistence, type PersistenceRuntime } from '../../data/persistence'
import { IndexedDbPhotoContentStore } from '../../data/photo/PhotoContentStore'
import { LocalPhotoRepository } from '../../data/photo/PhotoRepository'
import { removeProfilePhoto, replaceProfilePhoto } from '../../data/photo/profilePhotoActions'
import { LocalProfileRepository } from '../../data/repositories/repositories'
import { createMemoryStorageBacking, MemoryStorageAdapter, type MemoryStorageBacking } from '../../data/storage/MemoryStorageAdapter'
import type { ProfileRepository } from '../../data/repositories/repositories'
import type { PhotoCompressionService } from '../../services/photoCompressionService'
import { WebPhotoPickerService } from '../../services/photoPickerService'
import { CoupleProfileHero } from '../today/CoupleProfileHero'
import { I18nProvider } from '../../i18n/I18nProvider'
import { messages, supportedLocales, type Locale } from '../../i18n/messages'
import { SettingsPage } from '../../pages/SettingsPage'

const compressed = {
  master: { blob: new Blob(['master'], { type: 'image/jpeg' }), mimeType: 'image/jpeg', width: 1200, height: 900 },
  thumbnail: { blob: new Blob(['thumb'], { type: 'image/jpeg' }), mimeType: 'image/jpeg', width: 512, height: 384 },
}
const compression: PhotoCompressionService = { compress: async () => compressed }
const nicknameStressValues: Record<Locale, string> = {
  'zh-TW': '超級喜歡看星星的小宇宙女孩',
  en: 'StarlightDreamerForever',
  ja: '星空を見上げる恋するわたし',
  ko: '별빛을좋아하는마음가득한사람',
  es: 'CorazónBajoLasEstrellas',
  fr: 'MonCoeurSousLesÉtoiles',
}
const emojiNickname = '🌙⭐黑貓與星星✨💗'

function installPhotoRepository(runtime: PersistenceRuntime, ids: string[]) {
  let index = 0
  runtime.photos = new LocalPhotoRepository(runtime.adapter, new IndexedDbPhotoContentStore(runtime.adapter), compression, {
    createId: () => ids[index++] ?? `photo-extra-${index}`,
    now: () => '2026-09-02T08:00:00.000Z',
  })
  return runtime.photos
}

async function createRuntime(backing: MemoryStorageBacking = createMemoryStorageBacking(), ids = ['photo-user', 'photo-partner']) {
  const runtime = await initializePersistence({ adapter: new MemoryStorageAdapter(backing), defaultLocale: 'zh-TW', localDate: '2026-09-02' })
  installPhotoRepository(runtime, ids)
  return runtime
}

function renderSettings(runtime: PersistenceRuntime, locale: Locale = 'zh-TW') {
  return render(<PersistenceProvider runtime={runtime}><I18nProvider initialLocale={locale}><MemoryRouter initialEntries={['/settings']}><SettingsPage /></MemoryRouter></I18nProvider></PersistenceProvider>)
}

function renderHero(runtime: PersistenceRuntime, locale: 'zh-TW' | 'en' = 'zh-TW') {
  return render(<PersistenceProvider runtime={runtime}><I18nProvider initialLocale={locale}><CoupleProfileHero /></I18nProvider></PersistenceProvider>)
}

function mockPlacementGeometry(container: HTMLElement, frameWidth = 200, frameHeight = 200, sourceWidth = 200, sourceHeight = 200) {
  const frame = container.querySelector<HTMLElement>('.profile-photo-visual__crop')!
  const image = frame.querySelector<HTMLImageElement>('.profile-photo-visual__photo--real')!
  vi.spyOn(frame, 'getBoundingClientRect').mockReturnValue({ x: 0, y: 0, top: 0, left: 0, right: frameWidth, bottom: frameHeight, width: frameWidth, height: frameHeight, toJSON: () => ({}) })
  Object.defineProperty(image, 'naturalWidth', { configurable: true, value: sourceWidth })
  Object.defineProperty(image, 'naturalHeight', { configurable: true, value: sourceHeight })
  fireEvent.load(image)
}

beforeEach(() => {
  let objectUrl = 0
  Object.defineProperty(window, 'PointerEvent', { configurable: true, value: MouseEvent })
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn(() => `blob:profile-${++objectUrl}`) })
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() })
  Object.defineProperty(HTMLElement.prototype, 'setPointerCapture', { configurable: true, value: vi.fn() })
  Object.defineProperty(HTMLElement.prototype, 'hasPointerCapture', { configurable: true, value: vi.fn(() => true) })
  Object.defineProperty(HTMLElement.prototype, 'releasePointerCapture', { configurable: true, value: vi.fn() })
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('Profile photo Settings and Today integration', () => {
  it('keeps both nickname fields native, controlled, and available for long Unicode values in every locale', async () => {
    for (const locale of supportedLocales) {
      const runtime = await createRuntime()
      const view = renderSettings(runtime, locale)
      const mine = screen.getByRole<HTMLInputElement>('textbox', { name: messages[locale]['settings.profile.meName'] })
      const partner = screen.getByRole<HTMLInputElement>('textbox', { name: messages[locale]['settings.profile.partnerName'] })

      for (const field of [mine, partner]) {
        expect(field.tagName).toBe('INPUT')
        expect(field.type).toBe('text')
        expect(field).toHaveAttribute('maxlength', '20')
        expect(field.closest('.settings-row--responsive-control')).toBeInTheDocument()
        expect(field.closest('.settings-row__actions')).toBeInTheDocument()
      }
      fireEvent.change(mine, { target: { value: nicknameStressValues[locale] } })
      fireEvent.change(partner, { target: { value: emojiNickname } })
      expect(mine).toHaveValue(nicknameStressValues[locale])
      expect(partner).toHaveValue(emojiNickname)
      expect(view.container.querySelector('textarea')).not.toBeInTheDocument()
      view.unmount()
    }
  })

  it('persists valid nickname edits independently and restores them after reopening Settings', async () => {
    const backing = createMemoryStorageBacking()
    const first = await createRuntime(backing)
    const view = renderSettings(first)
    const mine = screen.getByRole<HTMLInputElement>('textbox', { name: '我的暱稱' })
    const partner = screen.getByRole<HTMLInputElement>('textbox', { name: '對方暱稱' })
    fireEvent.change(mine, { target: { value: 'StarlightDreamer2026' } })
    fireEvent.blur(mine)
    fireEvent.change(partner, { target: { value: emojiNickname } })
    fireEvent.blur(partner)
    await waitFor(async () => expect((await first.profiles.getProfile('user'))?.nickname).toBe('StarlightDreamer2026'))
    await waitFor(async () => expect((await first.profiles.getProfile('partner'))?.nickname).toBe(emojiNickname))

    view.unmount()
    first.adapter.close()
    const reopened = await createRuntime(backing)
    renderSettings(reopened)
    expect(screen.getByRole('textbox', { name: '我的暱稱' })).toHaveValue('StarlightDreamer2026')
    expect(screen.getByRole('textbox', { name: '對方暱稱' })).toHaveValue(emojiNickname)
  })

  it('uses the same responsive nickname structure for all supported locales', async () => {
    const runtime = await createRuntime()
    for (const locale of supportedLocales) {
      const view = renderSettings(runtime, locale)
      const nicknameRows = view.container.querySelectorAll<HTMLElement>('.settings-row--responsive-control')
      expect(nicknameRows).toHaveLength(2)
      expect(screen.getByRole('textbox', { name: messages[locale]['settings.profile.meName'] })).toBeInTheDocument()
      expect(screen.getByRole('textbox', { name: messages[locale]['settings.profile.partnerName'] })).toBeInTheDocument()
      for (const row of nicknameRows) {
        expect(row.querySelector('.settings-row__identity')).toBeInTheDocument()
        expect(row.querySelector('.settings-row__actions .settings-text-input')).toBeInTheDocument()
      }
      view.unmount()
    }
  })

  it('uses a shared two-level identity and wrapping actions layout for every locale', async () => {
    const runtime = await createRuntime()
    for (const locale of supportedLocales) {
      const view = renderSettings(runtime, locale)
      const photoRows = view.container.querySelectorAll<HTMLElement>('.settings-row--stacked-control')
      expect(photoRows).toHaveLength(2)
      expect(screen.getByText(messages[locale]['settings.profile.mePhoto'])).toBeInTheDocument()
      expect(screen.getByText(messages[locale]['settings.profile.partnerPhoto'])).toBeInTheDocument()
      for (const row of photoRows) {
        expect(row.querySelector('.settings-row__identity')).toBeInTheDocument()
        expect(row.querySelector('.settings-row__actions')).toBeInTheDocument()
        expect(row.querySelector('.settings-photo-actions')).toBeInTheDocument()
      }
      view.unmount()
    }
  })

  it('keeps the mobile profile rows in their dedicated one-column layouts', () => {
    const styles = readFileSync('src/features/settings/settings.css', 'utf8')
    const mobileStyles = styles.slice(styles.indexOf('@media (max-width: 30rem)'))
    expect(mobileStyles).toContain('.settings-row--responsive-control {\n    grid-template-columns: minmax(0, 1fr);')
    expect(mobileStyles).toContain('.settings-row--stacked-control {\n    grid-template-columns: minmax(0, 1fr);')
    expect(mobileStyles).toContain('.settings-row--stacked-control .settings-row__actions {\n    padding-left: 0;')
  })

  it('imports mine and partner photos with stable categories and updates Settings immediately', async () => {
    const runtime = await createRuntime()
    vi.spyOn(WebPhotoPickerService.prototype, 'pickOne')
      .mockResolvedValueOnce(new File(['mine'], 'mine.jpg', { type: 'image/jpeg' }))
      .mockResolvedValueOnce(new File(['partner'], 'partner.jpg', { type: 'image/jpeg' }))
    renderSettings(runtime)

    fireEvent.click(screen.getAllByRole('button', { name: '選擇照片' })[0])
    await waitFor(() => expect(runtime.initial.userProfile.id && screen.getByText('照片已更新')).toBeInTheDocument())
    expect((await runtime.profiles.getProfile('user'))?.photoAssetId).toBe('photo-user')
    expect((await runtime.photos.getPhotoAsset('photo-user'))?.category).toBe('profile')
    await waitFor(() => expect(document.querySelectorAll('.settings-profile-photo--real')).toHaveLength(1))

    fireEvent.click(screen.getByRole('button', { name: '選擇照片' }))
    await waitFor(() => expect((runtime.initial.partnerProfile.id && document.querySelectorAll('.settings-profile-photo--real')).length).toBe(2))
    expect((await runtime.profiles.getProfile('partner'))?.photoAssetId).toBe('photo-partner')
    expect((await runtime.photos.getPhotoAsset('photo-partner'))?.category).toBe('partner')
  })

  it('does nothing when the picker is cancelled and keeps placeholder fallbacks', async () => {
    const runtime = await createRuntime()
    vi.spyOn(WebPhotoPickerService.prototype, 'pickOne').mockResolvedValue(undefined)
    renderSettings(runtime)
    fireEvent.click(screen.getAllByRole('button', { name: '選擇照片' })[0])
    await waitFor(() => expect(WebPhotoPickerService.prototype.pickOne).toHaveBeenCalled())
    expect((await runtime.profiles.getProfile('user'))?.photoAssetId).toBeUndefined()
    expect(await runtime.photos.listPhotoAssets()).toEqual([])
    expect(document.querySelectorAll('.settings-profile-photo--real')).toHaveLength(0)
    cleanup()
    renderHero(runtime)
    expect(document.querySelectorAll('.profile-portrait__photo--real')).toHaveLength(0)
    expect(document.querySelectorAll('.profile-portrait__photo')).toHaveLength(2)
  })

  it('shows persisted photos in Today after reopen without reusing an old object URL', async () => {
    const backing = createMemoryStorageBacking()
    const first = await createRuntime(backing, ['mine', 'partner'])
    const mine = await first.photos.importPhoto(new File(['mine'], 'mine.jpg', { type: 'image/jpeg' }), 'profile')
    const partner = await first.photos.importPhoto(new File(['partner'], 'partner.jpg', { type: 'image/jpeg' }), 'partner')
    await first.profiles.updateProfile('user', { photoAssetId: mine.id })
    await first.profiles.updateProfile('partner', { photoAssetId: partner.id })
    first.adapter.close()

    const reopened = await createRuntime(backing, ['unused'])
    renderHero(reopened)
    await waitFor(() => expect(document.querySelectorAll('.profile-portrait__photo--real')).toHaveLength(2))
    const sources = [...document.querySelectorAll<HTMLImageElement>('.profile-portrait__photo--real')].map((image) => image.src)
    expect(sources).toEqual(expect.arrayContaining(['blob:profile-1', 'blob:profile-2']))
  })

  it('replaces an unshared old photo, but rolls back a new orphan when profile update fails', async () => {
    const adapter = new MemoryStorageAdapter(); await adapter.open()
    const profiles = new LocalProfileRepository(adapter)
    await profiles.ensureDefaults()
    const photos = new LocalPhotoRepository(adapter, new IndexedDbPhotoContentStore(adapter), compression, {
      createId: (() => { const ids = ['old', 'new', 'failed-new']; let index = 0; return () => ids[index++] })(),
      now: () => '2026-09-02T08:00:00.000Z',
    })
    const old = await photos.importPhoto(new File(['old'], 'old.jpg', { type: 'image/jpeg' }), 'profile')
    await profiles.updateProfile('user', { photoAssetId: old.id })
    expect((await replaceProfilePhoto('user', new File(['new'], 'new.jpg', { type: 'image/jpeg' }), profiles, photos)).photoAssetId).toBe('new')
    expect(await photos.getPhotoAsset('old')).toBeUndefined()

    const failingProfiles: ProfileRepository = {
      getProfile: (kind) => profiles.getProfile(kind),
      ensureDefaults: () => profiles.ensureDefaults(),
      updateProfile: async () => { throw new Error('profile failed') },
    }
    await expect(replaceProfilePhoto('user', new File(['failed'], 'failed.jpg', { type: 'image/jpeg' }), failingProfiles, photos)).rejects.toThrow('profile failed')
    expect((await profiles.getProfile('user'))?.photoAssetId).toBe('new')
    expect(await photos.getPhotoAsset('failed-new')).toBeUndefined()
    expect(await photos.getRenderableMaster('new')).toBeDefined()
  })

  it('removes with confirmation, safely retains shared assets, and revokes component URLs', async () => {
    const runtime = await createRuntime(undefined, ['shared'])
    const asset = await runtime.photos.importPhoto(new File(['shared'], 'shared.jpg', { type: 'image/jpeg' }), 'profile')
    await runtime.profiles.updateProfile('user', { photoAssetId: asset.id })
    await runtime.memoryMoments.createMemoryMoment({ content: 'shared', photoAssetId: asset.id })
    runtime.initial.userProfile = (await runtime.profiles.getProfile('user'))!
    renderSettings(runtime)
    await waitFor(() => expect(document.querySelector('.settings-profile-photo--real')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: '移除照片' }))
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '確認' }))
    await waitFor(() => expect(screen.getByText('照片已移除')).toBeInTheDocument())
    expect((await runtime.profiles.getProfile('user'))?.photoAssetId).toBeUndefined()
    expect(await runtime.photos.getPhotoAsset(asset.id)).toBeDefined()
    await waitFor(() => expect(document.querySelector('.settings-profile-photo--real')).not.toBeInTheDocument())
    cleanup()
    expect(URL.revokeObjectURL).toHaveBeenCalled()
  })

  it('keeps the photo and stable profile id across locale switches', async () => {
    const runtime = await createRuntime(undefined, ['mine'])
    const asset = await runtime.photos.importPhoto(new File(['mine'], 'mine.jpg', { type: 'image/jpeg' }), 'profile')
    await runtime.profiles.updateProfile('user', { photoAssetId: asset.id })
    runtime.initial.userProfile = (await runtime.profiles.getProfile('user'))!
    renderSettings(runtime)
    await waitFor(() => expect(document.querySelector('.settings-profile-photo--real')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'English' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Change photo' })).toBeInTheDocument())
    expect((await runtime.profiles.getProfile('user'))?.photoAssetId).toBe(asset.id)
    expect(document.querySelector('.settings-profile-photo--real')).toBeInTheDocument()
  })

  it('persists independent user and partner placements across reopen with 0.5–4 clamping', async () => {
    const backing = createMemoryStorageBacking()
    const runtime = await createRuntime(backing, ['mine', 'partner'])
    const mine = await runtime.photos.importPhoto(new File(['mine'], 'mine.jpg', { type: 'image/jpeg' }), 'profile')
    const partner = await runtime.photos.importPhoto(new File(['partner'], 'partner.jpg', { type: 'image/jpeg' }), 'partner')
    await runtime.profiles.updateProfile('user', { photoAssetId: mine.id })
    await runtime.profiles.updateProfile('partner', { photoAssetId: partner.id })
    expect(await runtime.profilePhotoPlacements.getPlacement('user', mine.id)).toEqual({ positionX: .5, positionY: .5, zoom: 1 })
    await runtime.profilePhotoPlacements.savePlacement('user', mine.id, { positionX: -.2, positionY: .25, zoom: .2 })
    await runtime.profilePhotoPlacements.savePlacement('partner', partner.id, { positionX: .8, positionY: 1.4, zoom: 8 })
    runtime.adapter.close()

    const reopened = await createRuntime(backing, ['unused'])
    expect(await reopened.profilePhotoPlacements.getPlacement('user', mine.id)).toEqual({ positionX: 0, positionY: .25, zoom: .5 })
    expect(await reopened.profilePhotoPlacements.getPlacement('partner', partner.id)).toEqual({ positionX: .8, positionY: 1, zoom: 4 })
  })

  it('drags, zooms below one, saves, survives locale changes, and renders the same placement in Today', async () => {
    const runtime = await createRuntime(undefined, ['mine'])
    const mine = await runtime.photos.importPhoto(new File(['mine'], 'mine.jpg', { type: 'image/jpeg' }), 'profile')
    await runtime.profiles.updateProfile('user', { photoAssetId: mine.id })
    runtime.initial.userProfile = (await runtime.profiles.getProfile('user'))!
    renderSettings(runtime)
    await waitFor(() => expect(document.querySelector('.settings-profile-photo--real')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: '調整照片' }))
    const preview = document.querySelector<HTMLButtonElement>('.profile-photo-editor__preview')!
    mockPlacementGeometry(preview)
    fireEvent.click(screen.getByRole('button', { name: '縮小' }))
    fireEvent.click(screen.getByRole('button', { name: '縮小' }))
    fireEvent.pointerDown(preview, { pointerId: 1, clientX: 100, clientY: 100 })
    fireEvent.pointerMove(preview, { pointerId: 1, clientX: 140, clientY: 60 })
    fireEvent.pointerUp(preview, { pointerId: 1, clientX: 140, clientY: 60 })
    fireEvent.click(screen.getByRole('button', { name: 'English' }))
    expect(screen.getByRole('button', { name: 'Done adjusting' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Done adjusting' }))
    await waitFor(async () => expect((await runtime.profilePhotoPlacements.getPlacement('user', mine.id)).zoom).toBe(.5))
    const saved = await runtime.profilePhotoPlacements.getPlacement('user', mine.id)
    expect(saved.positionX).toBeCloseTo(.9)
    expect(saved.positionY).toBeCloseTo(.1)

    cleanup()
    renderHero(runtime, 'en')
    const todayPhoto = await waitFor(() => {
      const image = document.querySelector<HTMLImageElement>('.profile-portrait__photo--real')
      expect(image).toBeInTheDocument()
      return image!
    })
    mockPlacementGeometry(todayPhoto.closest<HTMLElement>('.profile-photo-visual')!)
    await waitFor(() => expect(todayPhoto).toHaveAttribute('data-position-x', String(saved.positionX)))
    expect(todayPhoto).toHaveAttribute('data-position-y', String(saved.positionY))
    expect(todayPhoto).toHaveAttribute('data-zoom', '0.5')
    expect(Number(todayPhoto.dataset.translateX)).toBeCloseTo(40)
    expect(Number(todayPhoto.dataset.translateY)).toBeCloseTo(-40)
  })

  it('zooms to the maximum, resets to centered default, and saves the reset', async () => {
    const runtime = await createRuntime(undefined, ['mine'])
    const mine = await runtime.photos.importPhoto(new File(['mine'], 'mine.jpg', { type: 'image/jpeg' }), 'profile')
    await runtime.profiles.updateProfile('user', { photoAssetId: mine.id })
    runtime.initial.userProfile = (await runtime.profiles.getProfile('user'))!
    renderSettings(runtime)
    await waitFor(() => expect(screen.getByRole('button', { name: '調整照片' })).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: '調整照片' }))
    for (let count = 0; count < 20; count++) fireEvent.click(screen.getByRole('button', { name: '放大' }))
    expect(document.querySelector('.profile-photo-editor .profile-photo-visual__photo')).toHaveStyle({ transform: 'scale(4)' })
    fireEvent.click(screen.getByRole('button', { name: '重設位置' }))
    fireEvent.click(screen.getByRole('button', { name: '完成調整' }))
    await waitFor(async () => expect(await runtime.profilePhotoPlacements.getPlacement('user', mine.id)).toEqual({ positionX: .5, positionY: .5, zoom: 1 }))
  })

  it('resets placement on replacement and clears only the removed profile placement', async () => {
    const runtime = await createRuntime(undefined, ['old', 'replacement', 'partner'])
    const old = await runtime.photos.importPhoto(new File(['old'], 'old.jpg', { type: 'image/jpeg' }), 'profile')
    const partner = await runtime.photos.importPhoto(new File(['partner'], 'partner.jpg', { type: 'image/jpeg' }), 'partner')
    await runtime.profiles.updateProfile('user', { photoAssetId: old.id })
    await runtime.profiles.updateProfile('partner', { photoAssetId: partner.id })
    await runtime.profilePhotoPlacements.savePlacement('user', old.id, { positionX: .2, positionY: .3, zoom: .7 })
    await runtime.profilePhotoPlacements.savePlacement('partner', partner.id, { positionX: .8, positionY: .6, zoom: 1.5 })

    const replaced = await replaceProfilePhoto('user', new File(['new'], 'new.jpg', { type: 'image/jpeg' }), runtime.profiles, runtime.photos, runtime.profilePhotoPlacements)
    expect(await runtime.profilePhotoPlacements.getPlacement('user', replaced.photoAssetId)).toEqual({ positionX: .5, positionY: .5, zoom: 1 })
    await removeProfilePhoto('user', runtime.profiles, runtime.photos, runtime.profilePhotoPlacements)
    expect(await runtime.profilePhotoPlacements.getSavedPlacement('user')).toBeUndefined()
    expect(await runtime.profilePhotoPlacements.getPlacement('partner', partner.id)).toEqual({ positionX: .8, positionY: .6, zoom: 1.5 })
  })
})
