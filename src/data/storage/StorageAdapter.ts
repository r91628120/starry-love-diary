export const STORE_NAMES = ['profiles', 'settings', 'moods', 'diaries', 'stars', 'scoreAwards', 'heartPhrases', 'importantDates', 'memoryMoments', 'messageToYou', 'rememberedYouCards', 'clearRecords', 'loveBoatAssessments', 'loveBrainAssessments', 'likeOrHabitReflections'] as const
export type StoreName = (typeof STORE_NAMES)[number]

export interface StorageAdapter {
  open(): Promise<void>
  close(): void
  get<T>(store: StoreName, key: string): Promise<T | undefined>
  getAll<T>(store: StoreName): Promise<T[]>
  put<T>(store: StoreName, value: T & { id: string }): Promise<void>
  delete(store: StoreName, key: string): Promise<void>
}
