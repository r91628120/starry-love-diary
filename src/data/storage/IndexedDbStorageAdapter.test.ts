import 'fake-indexeddb/auto'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { IndexedDbStorageAdapter } from './IndexedDbStorageAdapter'

type AdapterInternals = { database?: IDBDatabase }

const databaseOf = (adapter: IndexedDbStorageAdapter) => (adapter as unknown as AdapterInternals).database

afterEach(() => {
  vi.restoreAllMocks()
})

describe('IndexedDbStorageAdapter stale connection recovery', () => {
  it('uses a healthy cached connection without reopening', async () => {
    const adapter = new IndexedDbStorageAdapter(`idb-recovery-normal-${crypto.randomUUID()}`)
    const open = vi.spyOn(indexedDB, 'open')
    await adapter.open()

    await adapter.put('moods', { id: 'today', mood: 'happy' })

    expect(open).toHaveBeenCalledTimes(1)
    await expect(adapter.get<{ id: string; mood: string }>('moods', 'today')).resolves.toEqual({ id: 'today', mood: 'happy' })
  })

  it('invalidates a closed cached connection, reopens once, and retries the operation', async () => {
    const adapter = new IndexedDbStorageAdapter(`idb-recovery-once-${crypto.randomUUID()}`)
    const open = vi.spyOn(indexedDB, 'open')
    await adapter.open()
    databaseOf(adapter)?.close()

    await adapter.put('moods', { id: 'today', mood: 'happy' })

    expect(open).toHaveBeenCalledTimes(2)
    await expect(adapter.get<{ id: string; mood: string }>('moods', 'today')).resolves.toEqual({ id: 'today', mood: 'happy' })
  })

  it('does not attempt a third connection when the retry is also invalid', async () => {
    const adapter = new IndexedDbStorageAdapter(`idb-recovery-fails-${crypto.randomUUID()}`)
    await adapter.open()
    databaseOf(adapter)?.close()
    const nativeOpen = indexedDB.open.bind(indexedDB)
    const open = vi.spyOn(indexedDB, 'open').mockImplementation(((name: string, version?: number) => {
      const request = nativeOpen(name, version)
      request.addEventListener('success', () => request.result.close())
      return request
    }) as typeof indexedDB.open)

    await expect(adapter.put('moods', { id: 'today', mood: 'happy' })).rejects.toMatchObject({ name: 'InvalidStateError' })

    expect(open).toHaveBeenCalledTimes(1)
  })

  it('does not retry non-InvalidStateError transaction failures', async () => {
    const adapter = new IndexedDbStorageAdapter(`idb-recovery-non-invalid-${crypto.randomUUID()}`)
    await adapter.open()
    const transaction = vi.fn(() => { throw new Error('transaction failed') })
    ;(adapter as unknown as AdapterInternals).database = { transaction } as unknown as IDBDatabase
    const open = vi.spyOn(indexedDB, 'open')

    await expect(adapter.get('moods', 'today')).rejects.toThrow('transaction failed')

    expect(open).not.toHaveBeenCalled()
    expect(transaction).toHaveBeenCalledTimes(1)
  })

  it('discards a versionchanged connection so the next operation opens a new one', async () => {
    const adapter = new IndexedDbStorageAdapter(`idb-recovery-versionchange-${crypto.randomUUID()}`)
    const open = vi.spyOn(indexedDB, 'open')
    await adapter.open()
    databaseOf(adapter)?.onversionchange?.(new Event('versionchange') as IDBVersionChangeEvent)

    await adapter.put('moods', { id: 'today', mood: 'happy' })

    expect(open).toHaveBeenCalledTimes(2)
  })

  it('upgrades a v9 database additively and preserves its completed Heart Talk records', async () => {
    const name = `idb-heart-talk-v9-${crypto.randomUUID()}`
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(name, 9)
      request.onupgradeneeded = () => request.result.createObjectStore('completedHeartTalks', { keyPath: 'id' })
      request.onsuccess = () => { const transaction = request.result.transaction('completedHeartTalks', 'readwrite'); transaction.objectStore('completedHeartTalks').put({ id: 'legacy', topicType: 'custom' }); transaction.oncomplete = () => { request.result.close(); resolve() }; transaction.onerror = () => reject(transaction.error) }
      request.onerror = () => reject(request.error)
    })
    const adapter = new IndexedDbStorageAdapter(name)
    await adapter.open()
    expect(await adapter.get('completedHeartTalks', 'legacy')).toMatchObject({ id: 'legacy' })
    await adapter.put('heartTalkHistoryTombstones', { id: 'tombstone', kind: 'all-before', clearedAt: '2026-10-10T00:00:00.000Z', createdAt: '2026-10-10T00:00:00.000Z', updatedAt: '2026-10-10T00:00:00.000Z' })
    await expect(adapter.get('heartTalkHistoryTombstones', 'tombstone')).resolves.toMatchObject({ kind: 'all-before' })
  })
})
