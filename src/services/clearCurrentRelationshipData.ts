import type { PersistenceRuntime } from '../data/persistence'
import type { AppSettings, Profile } from '../data/types'
import type { StoreName } from '../data/storage/StorageAdapter'

// Settings is intentionally excluded: locale and the existing preference record survive.
const STORY_STORES: StoreName[] = [
  'profiles', 'moods', 'diaries', 'stars', 'scoreAwards', 'heartPhrases',
  'importantDates', 'memoryMoments', 'messageToYou', 'rememberedYouCards',
  'clearRecords', 'loveBoatAssessments', 'loveBrainAssessments', 'likeOrHabitReflections', 'starDropPresentations',
  'diaryPhotos', 'photoLayouts', 'heartRevealProjects', 'heartRevealLines', 'heartRevealCards',
]

export interface ClearCurrentRelationshipPlan {
  counts: Record<string, number>
  total: number
}

export interface ClearCurrentRelationshipResult {
  settings: AppSettings
  userProfile: Profile
  partnerProfile: Profile
  cleared: Record<string, number>
}

export async function buildClearCurrentRelationshipPlan(runtime: PersistenceRuntime): Promise<ClearCurrentRelationshipPlan> {
  if (!await runtime.settings.getSettings()) throw new Error('Settings are unavailable')
  const targetStores: StoreName[] = [...STORY_STORES, 'photoAssets', 'photoAssetBlobs']
  const snapshots = await Promise.all(targetStores.map(async (store) => [store, (await runtime.adapter.getAll<{ id: string }>(store)).length] as const))
  const counts = Object.fromEntries(snapshots)
  return { counts, total: Object.values(counts).reduce((sum, count) => sum + count, 0) }
}

export function summarizeClearCurrentRelationshipPlan(plan: ClearCurrentRelationshipPlan) { return { ...plan.counts, total: plan.total } }

/**
 * Clears only the current relationship story. StorageAdapter deliberately has no
 * cross-store transaction, so this performs a complete read preflight before any
 * deletion and deletes references before PhotoAssets/blobs.
 */
export async function clearCurrentRelationshipData(runtime: PersistenceRuntime): Promise<ClearCurrentRelationshipResult> {
  const existingSettings = await runtime.settings.getSettings()
  if (!existingSettings) throw new Error('Settings are unavailable')

  await buildClearCurrentRelationshipPlan(runtime)
  const snapshots = await Promise.all(STORY_STORES.map(async (store) => [store, await runtime.adapter.getAll<{ id: string }>(store)] as const))
  const assets = await runtime.adapter.getAll<{ id: string }>('photoAssets')
  const blobs = await runtime.adapter.getAll<{ id: string }>('photoAssetBlobs')
  const cleared: Record<string, number> = Object.fromEntries(snapshots.map(([store, records]) => [store, records.length]))
  cleared.photoAssets = assets.length
  cleared.photoAssetBlobs = blobs.length

  for (const [store, records] of snapshots) {
    for (const record of records) await runtime.adapter.delete(store, record.id)
  }
  // All relationship references are gone. Delete only the app-owned IndexedDB
  // asset metadata and blob copies; no device photo API is involved.
  for (const asset of assets) await runtime.adapter.delete('photoAssets', asset.id)
  for (const blob of blobs) await runtime.adapter.delete('photoAssetBlobs', blob.id)

  const resetSettings: AppSettings = {
    ...existingSettings,
    onboardingCompleted: false,
    dailyLoveQuoteActivationDate: runtime.initial.currentLocalDate,
    updatedAt: new Date().toISOString(),
  }
  await runtime.adapter.put('settings', resetSettings)
  const profiles = await runtime.profiles.ensureDefaults()
  return { settings: resetSettings, userProfile: profiles.user, partnerProfile: profiles.partner, cleared }
}
