import { describe, expect, it } from 'vitest'
import { initializePersistence } from '../data/persistence'
import { MemoryStorageAdapter } from '../data/storage/MemoryStorageAdapter'
import { buildAppDataExport } from './exportAppData'
import { AppDataImportError, applyImportPlan, buildImportPlan, parseAppDataFileText, summarizeImportPlan, validateAppDataExport } from './importAppData'

async function sourceRuntime() {
  const runtime = await initializePersistence({ adapter: new MemoryStorageAdapter(), defaultLocale: 'zh-TW', localDate: '2026-09-11' })
  const stamp = '2026-09-11T12:00:00.000Z'
  await runtime.adapter.put('moods', { id: '2026-09-10', localDate: '2026-09-10', mood: 'happy', timezone: 'Asia/Taipei', createdAt: stamp, updatedAt: stamp })
  await runtime.adapter.put('diaries', { id: 'diary-1', localDate: '2026-09-10', title: '標題', content: '內容', savedAsStar: false, timezone: 'Asia/Taipei', createdAt: stamp, updatedAt: stamp })
  await runtime.adapter.put('stars', { id: 'star-1', type: 'mood', sourceId: '2026-09-10', sourceType: 'mood', content: 'happy', mood: 'happy', localDate: '2026-09-10', timezone: 'Asia/Taipei', createdAt: stamp, updatedAt: stamp })
  await runtime.adapter.put('scoreAwards', { id: 'award-1', awardType: 'mood_selected', points: 2, sourceId: '2026-09-10', localDate: '2026-09-10', timezone: 'Asia/Taipei', createdAt: stamp, updatedAt: stamp })
  await runtime.adapter.put('loveBoatAssessments', { id: 'boat-draft', status: 'draft', currentSection: 'A', currentQuestionIndex: 0, aAnswers: {}, bAnswers: {}, localDate: '2026-09-10', timezone: 'Asia/Taipei', createdAt: stamp, updatedAt: stamp })
  await runtime.settings.updateSettings({ locale: 'fr', reminderTime: '20:45' })
  return runtime
}

async function addUsableLocalPhoto(runtime: Awaited<ReturnType<typeof initializePersistence>>, id: string) {
  const stamp = '2026-09-11T12:00:00.000Z'
  await runtime.adapter.put('photoAssets', { id, category: 'profile', storageKind: 'indexeddb_blob', localUri: `indexeddb-photo://${id}/master`, thumbnailUri: `indexeddb-photo://${id}/thumbnail`, mimeType: 'image/png', width: 1, height: 1, fileSizeBytes: 1, thumbnailMimeType: 'image/png', thumbnailWidth: 1, thumbnailHeight: 1, thumbnailFileSizeBytes: 1, createdAt: stamp, updatedAt: stamp })
  await runtime.adapter.put('photoAssetBlobs', { id, master: new Blob(['m']), thumbnail: new Blob(['t']) })
}

describe('Import App Data V1', () => {
  it('accepts Export App Data V1 and round-trips raw score, stars, and persisted drafts without user-action side effects', async () => {
    const source = await sourceRuntime()
    const exported = await buildAppDataExport({ repositories: source, localDate: '2026-09-11', exportedAt: '2026-09-11T12:00:01.000Z' })
    const target = await initializePersistence({ adapter: new MemoryStorageAdapter(), defaultLocale: 'zh-TW', localDate: '2026-09-11' })
    const plan = await buildImportPlan(target, validateAppDataExport(exported))
    expect(summarizeImportPlan(plan).added).toBeGreaterThan(0)
    await applyImportPlan(target, plan)
    expect(await target.moods.getMoods()).toEqual(expect.arrayContaining([expect.objectContaining({ id: '2026-09-10', mood: 'happy' })]))
    expect(await target.stars.getStars()).toEqual(expect.arrayContaining([expect.objectContaining({ id: 'star-1', sourceId: '2026-09-10' })]))
    expect(await target.scores.getAwards()).toEqual(expect.arrayContaining([expect.objectContaining({ id: 'award-1', awardType: 'mood_selected', points: 2 })]))
    expect((await target.loveBoatAssessments.listAll()).find((item) => item.id === 'boat-draft')).toMatchObject({ status: 'draft' })
    expect((await target.scores.getAwards()).filter((award) => award.id === 'award-1')).toHaveLength(1)
    const second = await buildImportPlan(target, exported)
    expect(summarizeImportPlan(second).added + summarizeImportPlan(second).updated).toBe(0)
  })

  it('keeps current newer records and current device photo references while merging a newer incoming record', async () => {
    const target = await initializePersistence({ adapter: new MemoryStorageAdapter(), defaultLocale: 'zh-TW', localDate: '2026-09-11' })
    await addUsableLocalPhoto(target, 'device-photo')
    await target.adapter.put('profiles', { id: 'user', kind: 'user', nickname: '現在', photoAssetId: 'device-photo', createdAt: '2026-09-01T00:00:00.000Z', updatedAt: '2026-09-12T00:00:00.000Z' })
    const exportData = await buildAppDataExport({ repositories: target, localDate: '2026-09-11', exportedAt: '2026-09-11T00:00:00.000Z' })
    exportData.data.profiles = exportData.data.profiles.map((profile) => profile.kind === 'user' ? { ...profile, nickname: '舊資料', updatedAt: '2026-09-10T00:00:00.000Z' } : profile)
    expect(summarizeImportPlan(await buildImportPlan(target, exportData)).updated).toBe(0)
    exportData.data.profiles = exportData.data.profiles.map((profile) => profile.kind === 'user' ? { ...profile, nickname: '新資料', updatedAt: '2026-09-13T00:00:00.000Z' } : profile)
    await applyImportPlan(target, await buildImportPlan(target, exportData))
    expect(await target.profiles.getProfile('user')).toMatchObject({ nickname: '新資料', photoAssetId: 'device-photo' })
  })

  it('rejects malformed, unsupported, future-schema, and invalid-enum payloads before any writes', async () => {
    await expect(() => parseAppDataFileText('{')).toThrowError(AppDataImportError)
    const runtime = await sourceRuntime()
    const data = await buildAppDataExport({ repositories: runtime, localDate: '2026-09-11' })
    expect(() => validateAppDataExport({ ...data, format: 'other' })).toThrowError(AppDataImportError)
    expect(() => validateAppDataExport({ ...data, exportVersion: 2 })).toThrowError(AppDataImportError)
    expect(() => validateAppDataExport({ ...data, app: { ...data.app, schemaVersion: 99 } })).toThrowError(AppDataImportError)
    expect(() => validateAppDataExport({ ...data, data: { ...data.data, moods: [{ ...data.data.moods[0], mood: 'unknown' }] } })).toThrowError(AppDataImportError)
  })

  it('whitelists records so hostile photo fields cannot be imported', async () => {
    const runtime = await sourceRuntime()
    const data = await buildAppDataExport({ repositories: runtime, localDate: '2026-09-11' })
    const hostile = JSON.parse(JSON.stringify(data))
    hostile.data.profiles[0].photoAssetId = 'not-imported'
    hostile.data.memoryMoments.push({ id: 'moment-1', localDate: '2026-09-10', content: '文字', order: 0, timezone: 'Asia/Taipei', createdAt: '2026-09-10T00:00:00.000Z', updatedAt: '2026-09-10T00:00:00.000Z', photoAssetId: 'not-imported', image: 'data:image/png;base64,nope' })
    const target = await initializePersistence({ adapter: new MemoryStorageAdapter(), defaultLocale: 'zh-TW', localDate: '2026-09-11' })
    await applyImportPlan(target, await buildImportPlan(target, validateAppDataExport(hostile)))
    expect(await target.memoryMoments.getMemoryMoment('moment-1')).not.toHaveProperty('photoAssetId')
  })

  it('round-trips multilingual non-photo records into a clean database without restoring photo stores or ghost references', async () => {
    const source = await sourceRuntime()
    const stamp = '2099-09-11T12:00:00.000Z'
    await source.adapter.put('profiles', { id: 'user', kind: 'user', nickname: '繁體中文 日本語 한국어 ✨', photoAssetId: 'source-profile', createdAt: stamp, updatedAt: stamp })
    await source.adapter.put('memoryMoments', { id: 'moment-photo', title: 'Español Français', content: 'cœur 💛', localDate: '2026-09-10', timezone: 'Asia/Taipei', order: 0, photoAssetId: 'source-moment', createdAt: stamp, updatedAt: stamp })
    await source.adapter.put('photoAssets', { id: 'source-profile', category: 'profile', storageKind: 'indexeddb_blob', localUri: 'indexeddb-photo://source-profile/master', mimeType: 'image/png', width: 1, height: 1, fileSizeBytes: 1, createdAt: stamp, updatedAt: stamp })
    await source.adapter.put('photoAssetBlobs', { id: 'source-profile', master: new Blob(['secret-image']), thumbnail: new Blob(['secret-thumb']) })
    await source.adapter.put('diaryPhotos', { id: 'diary-photo', diaryEntryId: 'diary-1', photoAssetId: 'source-profile', sortOrder: 0, createdAt: stamp, updatedAt: stamp })
    await source.adapter.put('photoLayouts', { id: 'wall', layoutType: 'wall', photoCount: 1, slots: [{ id: 'slot', photoAssetId: 'source-profile', placement: { positionX: 0, positionY: 0, zoom: 1 } }], isActive: true, createdAt: stamp, updatedAt: stamp })
    await source.adapter.put('heartRevealProjects', { id: 'reveal', photoAssetId: 'source-profile', status: 'active', progressCount: 1, createdAt: stamp, updatedAt: stamp })
    const exported = await buildAppDataExport({ repositories: source, localDate: '2026-09-11', exportedAt: '2026-09-11T12:00:01.000Z' })
    const serialized = JSON.stringify(exported)
    expect(serialized).not.toMatch(/source-profile|source-moment|secret-image|photoAssetId|photoLayouts|heartReveal/u)

    const target = await initializePersistence({ adapter: new MemoryStorageAdapter(), defaultLocale: 'zh-TW', localDate: '2026-09-11' })
    await applyImportPlan(target, await buildImportPlan(target, validateAppDataExport(JSON.parse(serialized))))
    expect(await target.profiles.getProfile('user')).toMatchObject({ nickname: '繁體中文 日本語 한국어 ✨' })
    expect(await target.profiles.getProfile('user')).not.toHaveProperty('photoAssetId')
    expect(await target.memoryMoments.getMemoryMoment('moment-photo')).toMatchObject({ title: 'Español Français', content: 'cœur 💛', localDate: '2026-09-10' })
    expect(await target.memoryMoments.getMemoryMoment('moment-photo')).not.toHaveProperty('photoAssetId')
    expect(await target.adapter.getAll('photoAssets')).toHaveLength(0)
    expect(await target.adapter.getAll('photoAssetBlobs')).toHaveLength(0)
    expect(await target.adapter.getAll('diaryPhotos')).toHaveLength(0)
    expect(await target.adapter.getAll('photoLayouts')).toHaveLength(0)
    expect(await target.adapter.get('heartRevealProjects', 'reveal')).toBeUndefined()
    expect((await target.scores.getAwards()).filter((award) => award.id === 'award-1')).toHaveLength(1)
  })

  it('clears a stale existing photo reference when its local image is unavailable', async () => {
    const target = await initializePersistence({ adapter: new MemoryStorageAdapter(), defaultLocale: 'zh-TW', localDate: '2026-09-11' })
    await target.adapter.put('profiles', { id: 'user', kind: 'user', nickname: '舊資料', photoAssetId: 'missing-local-photo', createdAt: '2026-09-01T00:00:00.000Z', updatedAt: '2026-09-01T00:00:00.000Z' })
    const incoming = await buildAppDataExport({ repositories: target, localDate: '2026-09-11' })
    incoming.data.profiles = incoming.data.profiles.map((profile) => profile.kind === 'user' ? { ...profile, nickname: '已恢復', updatedAt: '2026-09-12T00:00:00.000Z' } : profile)
    await applyImportPlan(target, await buildImportPlan(target, incoming))
    expect(await target.profiles.getProfile('user')).toMatchObject({ nickname: '已恢復' })
    expect(await target.profiles.getProfile('user')).not.toHaveProperty('photoAssetId')
  })
})
