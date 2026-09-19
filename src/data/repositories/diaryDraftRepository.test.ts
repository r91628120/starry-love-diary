import { describe, expect, it } from 'vitest'
import { MemoryStorageAdapter } from '../storage/MemoryStorageAdapter'
import { LocalDiaryDraftRepository } from './diaryDraftRepository'

describe('Diary draft repository', () => {
  it('uses one deterministic local-date record and removes empty drafts', async () => {
    const repository = new LocalDiaryDraftRepository(new MemoryStorageAdapter())
    const first = await repository.saveDraft('2026-09-20', '  draft text  ')
    expect(first).toMatchObject({ id: 'diary-draft:2026-09-20', localDate: '2026-09-20', content: '  draft text  ' })
    expect(await repository.getDraft('2026-09-20')).toMatchObject({ id: 'diary-draft:2026-09-20', content: '  draft text  ' })
    await repository.saveDraft('2026-09-20', '   ')
    expect(await repository.getDraft('2026-09-20')).toBeUndefined()
  })

  it('clears all local drafts without affecting other stores', async () => {
    const adapter = new MemoryStorageAdapter()
    const repository = new LocalDiaryDraftRepository(adapter)
    await repository.saveDraft('2026-09-20', 'today')
    await repository.saveDraft('2026-09-21', 'tomorrow')
    await adapter.put('diaries', { id: 'diary-1', localDate: '2026-09-20', content: 'saved', createdAt: '', updatedAt: '' })
    await repository.clear()
    expect(await adapter.getAll('diaryDrafts')).toEqual([])
    expect(await adapter.getAll('diaries')).toHaveLength(1)
  })
})
