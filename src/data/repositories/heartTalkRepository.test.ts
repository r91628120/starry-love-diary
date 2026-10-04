import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { LocalCompletedHeartTalkRepository } from './heartTalkRepository'
import { IndexedDbStorageAdapter } from '../storage/IndexedDbStorageAdapter'
import { MemoryStorageAdapter } from '../storage/MemoryStorageAdapter'
import { LEGACY_V4_STORE_NAMES } from '../storage/StorageAdapter'

describe('completed Heart Talk local repository', () => {
  it('derives count only from metadata records and never retains custom prompt text', async () => {
    const adapter = new MemoryStorageAdapter(); await adapter.open()
    const repository = new LocalCompletedHeartTalkRepository(adapter)
    const official = await repository.addCompletedHeartTalk({ topicType: 'official', questionId: 'Q002', localDate: '2026-10-04', startTime: '20:00', endTime: '20:30' })
    const custom = await repository.addCompletedHeartTalk({ topicType: 'custom', localDate: '2026-10-04', startTime: '18:00', endTime: '18:30' })
    expect(await repository.count()).toBe(2)
    expect(await repository.get(official.id)).toMatchObject({ id: official.id, questionId: 'Q002' })
    expect(custom).not.toHaveProperty('questionId')
    expect(JSON.stringify(await repository.list())).not.toContain('custom question')
    await repository.deleteOne(official.id); expect(await repository.count()).toBe(1)
    await repository.clearAll(); expect(await repository.list()).toEqual([])
  })

  it('upgrades a representative v8 database additively without changing existing records', async () => {
    const name = `heart-talk-v8-${crypto.randomUUID()}`
    await new Promise<void>((resolve, reject) => { const request = indexedDB.open(name, 8); request.onupgradeneeded = () => { for (const store of LEGACY_V4_STORE_NAMES) request.result.createObjectStore(store, { keyPath: 'id' }) }; request.onsuccess = () => { const database = request.result; const transaction = database.transaction('profiles', 'readwrite'); transaction.objectStore('profiles').put({ id: 'user', nickname: 'v8 user' }); transaction.oncomplete = () => { database.close(); resolve() }; transaction.onerror = () => reject(transaction.error) }; request.onerror = () => reject(request.error) })
    const adapter = new IndexedDbStorageAdapter(name); await adapter.open()
    expect(await adapter.get('profiles', 'user')).toEqual({ id: 'user', nickname: 'v8 user' })
    await adapter.put('completedHeartTalks', { id: 'v9-record', topicType: 'custom', localDate: '2026-10-04', startTime: '18:00', endTime: '18:30', createdAt: '2026-10-04T00:00:00.000Z', updatedAt: '2026-10-04T00:00:00.000Z' })
    adapter.close()
    const reopened = new IndexedDbStorageAdapter(name); await reopened.open()
    expect(await reopened.getAll('completedHeartTalks')).toHaveLength(1)
    expect(await reopened.get('profiles', 'user')).toEqual({ id: 'user', nickname: 'v8 user' })
    reopened.close()
  })
})
