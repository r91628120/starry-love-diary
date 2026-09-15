export const LEGACY_V4_STORE_NAMES = ['profiles', 'settings', 'moods', 'diaries', 'stars', 'scoreAwards', 'heartPhrases', 'importantDates', 'memoryMoments', 'messageToYou', 'rememberedYouCards', 'clearRecords', 'loveBoatAssessments', 'loveBrainAssessments', 'likeOrHabitReflections'] as const
export const PHOTO_V5_STORE_NAMES = ['photoAssets', 'photoAssetBlobs', 'diaryPhotos', 'photoLayouts', 'heartRevealProjects', 'heartRevealLines', 'heartRevealCards'] as const
export const STORE_NAMES = [...LEGACY_V4_STORE_NAMES, ...PHOTO_V5_STORE_NAMES] as const
export type StoreName = (typeof STORE_NAMES)[number]

export interface StorageAdapter {
  open(): Promise<void>
  close(): void
  get<T>(store: StoreName, key: string): Promise<T | undefined>
  getAll<T>(store: StoreName): Promise<T[]>
  put<T>(store: StoreName, value: T & { id: string }): Promise<void>
  delete(store: StoreName, key: string): Promise<void>
}
