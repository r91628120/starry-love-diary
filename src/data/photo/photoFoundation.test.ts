import { afterEach, describe, expect, it, vi } from 'vitest'
import { calculateContainedDimensions, type CompressedPhoto, type PhotoCompressionService } from '../../services/photoCompressionService'
import { normalizePhotoPlacement } from '../../services/photoPlacement'
import { WebPhotoPickerService } from '../../services/photoPickerService'
import { PhotoObjectUrlResolver } from '../../services/photoObjectUrl'
import type { DiaryPhoto, HeartPhrase, HeartRevealLine, HeartRevealProject, ImportantDate, MemoryMoment, PhotoLayout, Profile } from '../types'
import { ensureObjectStores, SCHEMA_VERSION } from '../storage/IndexedDbStorageAdapter'
import { createMemoryStorageBacking, MemoryStorageAdapter } from '../storage/MemoryStorageAdapter'
import { LEGACY_V4_STORE_NAMES, PHOTO_V5_STORE_NAMES, STAR_DROP_V6_STORE_NAMES, STORE_NAMES, type StoreName } from '../storage/StorageAdapter'
import { IndexedDbPhotoContentStore } from './PhotoContentStore'
import { LocalPhotoRepository, PhotoInUseError } from './PhotoRepository'

const masterBlob = new Blob(['compressed-master'], { type: 'image/jpeg' })
const thumbnailBlob = new Blob(['thumbnail'], { type: 'image/jpeg' })
const compressed: CompressedPhoto = {
  master: { blob: masterBlob, mimeType: 'image/jpeg', width: 1600, height: 1200 },
  thumbnail: { blob: thumbnailBlob, mimeType: 'image/jpeg', width: 512, height: 384 },
}

class StubCompressionService implements PhotoCompressionService {
  constructor(private readonly result: CompressedPhoto = compressed) {}
  async compress() { return this.result }
}

function createRepository(adapter: MemoryStorageAdapter, compression: PhotoCompressionService = new StubCompressionService()) {
  return new LocalPhotoRepository(adapter, new IndexedDbPhotoContentStore(adapter), compression, {
    createId: () => 'photo-fixed',
    now: () => '2026-09-02T08:00:00.000Z',
  })
}

function readBlob(blob: Blob | undefined) {
  if (!blob) return Promise.resolve(undefined)
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsText(blob)
  })
}

afterEach(() => vi.restoreAllMocks())

describe('IndexedDB v6 store migration', () => {
  it('creates every store on a fresh install', () => {
    const created: string[] = []
    ensureObjectStores({
      objectStoreNames: { contains: () => false } as unknown as DOMStringList,
      createObjectStore: ((name: string) => { created.push(name); return {} as IDBObjectStore }) as IDBDatabase['createObjectStore'],
    })
    expect(SCHEMA_VERSION).toBe(6)
    expect(created).toEqual(STORE_NAMES)
  })

  it('adds v5 and v6 stores without touching existing records', () => {
    const records = new Map<string, Map<string, unknown>>()
    for (const store of LEGACY_V4_STORE_NAMES) records.set(store, new Map([['legacy', { id: 'legacy', store }]]))
    const before = new Map([...records].map(([name, values]) => [name, structuredClone([...values])]))
    ensureObjectStores({
      objectStoreNames: { contains: (name: string) => records.has(name) } as unknown as DOMStringList,
      createObjectStore: ((name: string) => { records.set(name, new Map()); return {} as IDBObjectStore }) as IDBDatabase['createObjectStore'],
    })
    expect([...records.keys()].slice(-8)).toEqual([...PHOTO_V5_STORE_NAMES, ...STAR_DROP_V6_STORE_NAMES])
    for (const store of LEGACY_V4_STORE_NAMES) expect([...records.get(store)!]).toEqual(before.get(store))
  })

  it('does not migrate HeartPhrase records and allows multiple reveal lines on the same local date', async () => {
    const adapter = new MemoryStorageAdapter(); await adapter.open()
    const timestamp = '2026-09-02T08:00:00.000Z'
    const phrase: HeartPhrase = { id: 'phrase-1', content: '保留原句', order: 0, acceptedAt: timestamp, createdAt: timestamp, updatedAt: timestamp }
    await adapter.put('heartPhrases', phrase)
    const sameDayLines: HeartRevealLine[] = [1, 2].map((lineIndex) => ({
      id: `line-${lineIndex}`, projectId: 'project-1', lineIndex, content: `第 ${lineIndex} 句`, localDate: '2026-09-02', heartPressCount: 7, isConfirmed: true, createdAt: timestamp, updatedAt: timestamp,
    }))
    for (const line of sameDayLines) await adapter.put('heartRevealLines', line)
    expect(await adapter.getAll('heartPhrases')).toEqual([phrase])
    expect(await adapter.getAll<HeartRevealLine>('heartRevealLines')).toHaveLength(2)
  })
})

describe('Photo content and repository foundation', () => {
  it('writes master and thumbnail blobs, metadata, and reads them after reopen', async () => {
    const backing = createMemoryStorageBacking()
    const firstAdapter = new MemoryStorageAdapter(backing); await firstAdapter.open()
    const imported = await createRepository(firstAdapter).importPhoto(new File(['source-not-saved'], 'photo.jpg', { type: 'image/jpeg', lastModified: 1_700_000_000_000 }), 'diary')
    expect(imported).toMatchObject({
      id: 'photo-fixed', category: 'diary', storageKind: 'indexeddb_blob', width: 1600, height: 1200,
      fileSizeBytes: masterBlob.size, thumbnailWidth: 512, thumbnailHeight: 384, thumbnailFileSizeBytes: thumbnailBlob.size,
    })
    expect(imported.localUri).not.toContain('blob:')
    firstAdapter.close()

    const reopenedAdapter = new MemoryStorageAdapter(backing); await reopenedAdapter.open()
    const reopened = createRepository(reopenedAdapter)
    expect(await readBlob(await reopened.getRenderableMaster(imported.id))).toBe('compressed-master')
    expect(await readBlob(await reopened.getRenderableThumbnail(imported.id))).toBe('thumbnail')
  })

  it('leaves no blob or metadata orphan when import metadata persistence fails', async () => {
    class FailingMetadataAdapter extends MemoryStorageAdapter {
      override async put<T>(store: StoreName, value: T & { id: string }) {
        if (store === 'photoAssets') throw new Error('metadata failed')
        return super.put(store, value)
      }
    }
    const adapter = new FailingMetadataAdapter(); await adapter.open()
    await expect(createRepository(adapter).importPhoto(new File(['source'], 'photo.jpg', { type: 'image/jpeg' }), 'gallery')).rejects.toThrow('metadata failed')
    expect(await adapter.getAll('photoAssets')).toEqual([])
    expect(await adapter.getAll('photoAssetBlobs')).toEqual([])
  })

  it('writes nothing when compression fails', async () => {
    const adapter = new MemoryStorageAdapter(); await adapter.open()
    const failingCompression: PhotoCompressionService = { compress: async () => { throw new Error('compression failed') } }
    await expect(createRepository(adapter, failingCompression).importPhoto(new File(['source'], 'photo.jpg', { type: 'image/jpeg' }), 'profile')).rejects.toThrow('compression failed')
    expect(await adapter.getAll('photoAssets')).toEqual([])
    expect(await adapter.getAll('photoAssetBlobs')).toEqual([])
  })

  it('does not delete an asset while any shared reference remains', async () => {
    const adapter = new MemoryStorageAdapter(); await adapter.open()
    const repository = createRepository(adapter)
    const asset = await repository.importPhoto(new File(['source'], 'photo.jpg', { type: 'image/jpeg' }), 'profile')
    const timestamp = '2026-09-02T08:00:00.000Z'
    const profile: Profile = { id: 'user', kind: 'user', nickname: '星星', photoAssetId: asset.id, createdAt: timestamp, updatedAt: timestamp }
    await adapter.put('profiles', profile)
    await adapter.put('memoryMoments', { id: 'moment-1', content: '回憶', localDate: '2026-09-02', photoAssetId: asset.id, order: 0, createdAt: timestamp, updatedAt: timestamp })
    await expect(repository.deletePhoto(asset.id)).rejects.toBeInstanceOf(PhotoInUseError)
    expect(await repository.getPhotoAsset(asset.id)).toBeDefined()
    expect(await repository.getRenderableMaster(asset.id)).toBeDefined()
    expect(await repository.getReferences(asset.id)).toHaveLength(2)
  })

  it('finds every persisted reference type before permitting deletion', async () => {
    const adapter = new MemoryStorageAdapter(); await adapter.open()
    const repository = createRepository(adapter)
    const asset = await repository.importPhoto(new File(['source'], 'photo.jpg', { type: 'image/jpeg' }), 'gallery')
    const timestamp = '2026-09-02T08:00:00.000Z'
    const profile: Profile = { id: 'user', kind: 'user', nickname: 'Star', photoAssetId: asset.id, createdAt: timestamp, updatedAt: timestamp }
    const diaryPhoto: DiaryPhoto = { id: 'diary-photo', diaryEntryId: 'diary', photoAssetId: asset.id, sortOrder: 0, createdAt: timestamp, updatedAt: timestamp }
    const moment: MemoryMoment = { id: 'moment', content: 'memory', localDate: '2026-09-02', photoAssetId: asset.id, order: 0, createdAt: timestamp, updatedAt: timestamp }
    const date: ImportantDate & { photoAssetId: string } = { id: 'date', type: 'custom', title: 'Date', date: '2026-09-02', photoAssetId: asset.id, createdAt: timestamp, updatedAt: timestamp }
    const layout: PhotoLayout = { id: 'layout', layoutType: 'test', photoCount: 1, slots: [{ id: 'slot', photoAssetId: asset.id, placement: { positionX: .5, positionY: .5, zoom: 1 } }], isActive: true, createdAt: timestamp, updatedAt: timestamp }
    const reveal: HeartRevealProject = { id: 'reveal', photoAssetId: asset.id, status: 'active', progressCount: 0, createdAt: timestamp, updatedAt: timestamp }
    await Promise.all([adapter.put('profiles', profile), adapter.put('diaryPhotos', diaryPhoto), adapter.put('memoryMoments', moment), adapter.put('importantDates', date), adapter.put('photoLayouts', layout), adapter.put('heartRevealProjects', reveal)])

    expect((await repository.getReferences(asset.id)).map((reference) => reference.type).sort()).toEqual(['diary', 'heart_reveal_project', 'important_date', 'memory_moment', 'photo_layout', 'profile'])
    await expect(repository.deletePhoto(asset.id)).rejects.toBeInstanceOf(PhotoInUseError)
  })

  it('removes only unreferenced assets during orphan cleanup', async () => {
    const adapter = new MemoryStorageAdapter(); await adapter.open()
    const repository = createRepository(adapter)
    await repository.importPhoto(new File(['source'], 'photo.jpg', { type: 'image/jpeg' }), 'diary')
    expect(await repository.cleanupOrphans()).toEqual(['photo-fixed'])
    expect(await repository.getPhotoAsset('photo-fixed')).toBeUndefined()
    expect(await adapter.getAll('photoAssetBlobs')).toEqual([])
  })

  it('retains an unplaced gallery asset as a valid Memory Wall library item', async () => {
    const adapter = new MemoryStorageAdapter(); await adapter.open()
    const repository = createRepository(adapter)
    await repository.importPhoto(new File(['source'], 'photo.jpg', { type: 'image/jpeg' }), 'gallery')
    expect(await repository.cleanupOrphans()).toEqual([])
    expect(await repository.getPhotoAsset('photo-fixed')).toBeDefined()
  })
})

describe('Photo browser services', () => {
  it('clamps placement and preserves valid values', () => {
    expect(normalizePhotoPlacement({ positionX: -1, positionY: 2, zoom: 9 })).toEqual({ positionX: 0, positionY: 1, zoom: 4 })
    expect(normalizePhotoPlacement({ positionX: 0.5, positionY: 0.5, zoom: 0.1 })).toEqual({ positionX: 0.5, positionY: 0.5, zoom: 0.5 })
    expect(normalizePhotoPlacement({ positionX: 0.5, positionY: 0.5, zoom: 0.75 })).toEqual({ positionX: 0.5, positionY: 0.5, zoom: 0.75 })
    expect(normalizePhotoPlacement({ positionX: 0.2, positionY: 0.8, zoom: 2.5 })).toEqual({ positionX: 0.2, positionY: 0.8, zoom: 2.5 })
    expect(normalizePhotoPlacement({ positionX: Number.NaN, zoom: Number.POSITIVE_INFINITY })).toEqual({ positionX: 0.5, positionY: 0.5, zoom: 1 })
  })

  it('calculates master and thumbnail bounds without upscaling', () => {
    expect(calculateContainedDimensions(4000, 3000, 2048)).toEqual({ width: 2048, height: 1536 })
    expect(calculateContainedDimensions(300, 200, 512)).toEqual({ width: 300, height: 200 })
  })

  it('resolves cancellation without creating any PhotoAsset', async () => {
    vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(function (this: HTMLInputElement) {
      this.dispatchEvent(new Event('cancel'))
    })
    const adapter = new MemoryStorageAdapter(); await adapter.open()
    expect(await new WebPhotoPickerService().pickOne()).toBeUndefined()
    expect(await adapter.getAll('photoAssets')).toEqual([])
  })

  it('revokes object URLs on replacement and release', async () => {
    const createObjectURL = vi.fn().mockReturnValueOnce('blob:first').mockReturnValueOnce('blob:second')
    const revokeObjectURL = vi.fn()
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectURL })
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectURL })
    const repository = { getRenderableMaster: vi.fn(async () => masterBlob), getRenderableThumbnail: vi.fn(async () => thumbnailBlob) }
    const resolver = new PhotoObjectUrlResolver(repository)
    expect(await resolver.resolve('photo-1')).toBe('blob:first')
    expect(await resolver.resolve('photo-2', 'master')).toBe('blob:second')
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:first')
    resolver.release()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:second')
  })
})
