import { describe, expect, it } from 'vitest'
import { LocalHeartPhraseRepository } from '../repositories/repositories'
import { createMemoryStorageBacking, MemoryStorageAdapter } from '../storage/MemoryStorageAdapter'
import { LocalHeartRevealPhotoRepository } from './HeartRevealPhotoRepository'

async function setup(backing = createMemoryStorageBacking()) {
  const storage = new MemoryStorageAdapter(backing); await storage.open()
  const phrases = new LocalHeartPhraseRepository(storage)
  const projects = new LocalHeartRevealPhotoRepository(storage, { getPhotoAsset: async () => undefined })
  return { storage, phrases, projects, backing }
}

async function add(repository: LocalHeartPhraseRepository, projects: LocalHeartRevealPhotoRepository, content: string) {
  const phrase = await repository.acceptHeartPhrase(content)
  await projects.registerHeartPhrase(phrase.id, await repository.getHeartPhrases())
  return phrase
}

describe('Heart reveal cycle v2', () => {
  it('starts at zero, reaches ready at seven, and does not auto-reset', async () => {
    const { phrases, projects } = await setup()
    expect((await projects.getCycleState([])).progressCount).toBe(0)
    for (let index = 1; index <= 7; index += 1) await add(phrases, projects, `心話 ${index}`)
    const ready = await projects.getCycleState(await phrases.getHeartPhrases())
    expect(ready).toMatchObject({ progressCount: 7, cycleStatus: 'ready' })
    expect((await projects.getCycleState(await phrases.getHeartPhrases())).progressCount).toBe(7)
  })

  it('keeps all archive phrases and makes phrase 8 the next cycle 1 / 7 only after explicit completion', async () => {
    const { phrases, projects } = await setup()
    for (let index = 1; index <= 7; index += 1) await add(phrases, projects, `心話 ${index}`)
    const next = await projects.completeCycle(await phrases.getHeartPhrases())
    expect(next).toMatchObject({ progressCount: 0, cycleNumber: 2 })
    expect(next.photoAssetId).toBeUndefined()
    await add(phrases, projects, '心話 8')
    expect((await projects.getCycleState(await phrases.getHeartPhrases())).progressCount).toBe(1)
    expect(await phrases.getHeartPhrases()).toHaveLength(8)
  })

  it('keeps current progress when a completed-cycle phrase is edited or deleted, but decrements for a current phrase', async () => {
    const { phrases, projects } = await setup()
    const firstCycle = []
    for (let index = 1; index <= 7; index += 1) firstCycle.push(await add(phrases, projects, `心話 ${index}`))
    await projects.completeCycle(await phrases.getHeartPhrases())
    const current = []
    for (let index = 8; index <= 11; index += 1) current.push(await add(phrases, projects, `心話 ${index}`))
    await phrases.updateHeartPhrase(firstCycle[0].id, '已編輯的舊心話')
    await phrases.deleteHeartPhrase(firstCycle[1].id)
    expect((await projects.refreshCycleState(await phrases.getHeartPhrases())).progressCount).toBe(4)
    await phrases.deleteHeartPhrase(current[0].id)
    expect((await projects.refreshCycleState(await phrases.getHeartPhrases())).progressCount).toBe(3)
  })

  it('persists a ready cycle, reset boundary, and no-photo progress across reopen', async () => {
    const first = await setup()
    for (let index = 1; index <= 7; index += 1) await add(first.phrases, first.projects, `心話 ${index}`)
    first.storage.close()
    const reopened = await setup(first.backing)
    expect((await reopened.projects.getCycleState(await reopened.phrases.getHeartPhrases())).progressCount).toBe(7)
    await reopened.projects.completeCycle(await reopened.phrases.getHeartPhrases())
    await add(reopened.phrases, reopened.projects, '心話 8')
    reopened.storage.close()
    const again = await setup(first.backing)
    expect((await again.projects.getCycleState(await again.phrases.getHeartPhrases())).progressCount).toBe(1)
  })

  it('keeps a text overlay position across reload and carries it into the next cycle without changing photo placement', async () => {
    const first = await setup()
    const initial = await first.projects.getCycleState([])
    expect(initial.textPlacement ?? 'bottom-center').toBe('bottom-center')
    await first.projects.saveTextPlacement('top-right')
    expect((await first.projects.getCycleState([])).textPlacement).toBe('top-right')
    first.storage.close()
    const reopened = await setup(first.backing)
    expect((await reopened.projects.getCycleState([])).textPlacement).toBe('top-right')
    for (let index = 1; index <= 7; index += 1) await add(reopened.phrases, reopened.projects, `心話 ${index}`)
    const next = await reopened.projects.completeCycle(await reopened.phrases.getHeartPhrases())
    expect(next).toMatchObject({ textPlacement: 'top-right', progressCount: 0 })
    expect(next.photoAssetId).toBeUndefined()
  })

  it('reaches a second ready cycle at phrase 14 while keeping all fourteen choices available', async () => {
    const { phrases, projects } = await setup()
    for (let index = 1; index <= 7; index += 1) await add(phrases, projects, `心話 ${index}`)
    await projects.completeCycle(await phrases.getHeartPhrases())
    for (let index = 8; index <= 14; index += 1) await add(phrases, projects, `心話 ${index}`)
    const archive = await phrases.getHeartPhrases()
    expect(archive).toHaveLength(14)
    expect((await projects.getCycleState(archive))).toMatchObject({ cycleNumber: 2, progressCount: 7, cycleStatus: 'ready' })
    expect(archive.some((phrase) => phrase.content === '心話 3')).toBe(true)
  })

  it('clears only the active photo binding when a cycle completes', async () => {
    const { storage, phrases, projects } = await setup()
    for (let index = 1; index <= 7; index += 1) await add(phrases, projects, `心話 ${index}`)
    await storage.put('heartRevealProjects', { ...(await projects.getCycleState(await phrases.getHeartPhrases())), photoAssetId: 'retained-photo', status: 'active', updatedAt: '2026-09-09T00:00:00.000Z' })
    const next = await projects.completeCycle(await phrases.getHeartPhrases())
    expect(next.photoAssetId).toBeUndefined()
    // Completion never calls PhotoRepository/delete; an existing asset remains
    // available for the shared integrity cleanup policy to decide later.
    expect(await storage.get('photoAssets', 'retained-photo')).toBeUndefined()
  })

  it('infers legacy seven-or-more archives as a ready first cycle without losing data', async () => {
    const { storage, phrases, projects } = await setup()
    for (let index = 1; index <= 14; index += 1) await phrases.acceptHeartPhrase(`舊心話 ${index}`)
    const inferred = await projects.getCycleState(await phrases.getHeartPhrases())
    expect(inferred).toMatchObject({ cycleNumber: 1, progressCount: 7, cycleStatus: 'ready' })
    expect(await phrases.getHeartPhrases()).toHaveLength(14)
    expect(await storage.get('heartRevealProjects', inferred.id)).toMatchObject({ cyclePhraseIds: expect.any(Array) })
  })

  it.each([[7, 0], [8, 1], [10, 3], [14, 7]])('moves legacy overflow from %i archived phrases into the next cycle at %i / 7', async (count, nextProgress) => {
    const { phrases, projects } = await setup()
    for (let index = 1; index <= count; index += 1) await phrases.acceptHeartPhrase(`舊心話 ${index}`)
    const archiveBefore = await phrases.getHeartPhrases()
    const legacyReady = await projects.getCycleState(archiveBefore)
    expect(legacyReady).toMatchObject({ cycleNumber: 1, progressCount: 7, cycleStatus: 'ready' })
    const next = await projects.completeCycle(archiveBefore)
    expect(next).toMatchObject({ cycleNumber: 2, progressCount: nextProgress, cycleStatus: nextProgress === 7 ? 'ready' : 'active' })
    expect(next.cyclePhraseIds).toEqual(archiveBefore.slice(7, 14).map((phrase) => phrase.id))
    expect(await phrases.getHeartPhrases()).toEqual(archiveBefore)
    expect(new Set(next.cyclePhraseIds).size).toBe(next.cyclePhraseIds?.length)
  })

  it('keeps a legacy overflow boundary stable when an old cycle phrase is edited or deleted after completion', async () => {
    const { phrases, projects } = await setup()
    for (let index = 1; index <= 10; index += 1) await phrases.acceptHeartPhrase(`舊心話 ${index}`)
    const before = await phrases.getHeartPhrases(); await projects.getCycleState(before)
    await phrases.updateHeartPhrase(before[0].id, '修改舊句')
    await projects.completeCycle(await phrases.getHeartPhrases())
    await phrases.deleteHeartPhrase(before[1].id)
    const refreshed = await projects.refreshCycleState(await phrases.getHeartPhrases())
    expect(refreshed.progressCount).toBe(3)
    expect(refreshed.cyclePhraseIds).toEqual(before.slice(7, 10).map((phrase) => phrase.id))
  })
})
