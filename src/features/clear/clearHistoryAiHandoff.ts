import type { AiHandoffReflection } from '../../data/clearTypes'
import type { PersistenceContextValue } from '../../data/PersistenceStateContext'
import type { AiHandoffReflectionInput } from '../../data/repositories/clearRepositories'

export type AiHandoffRecord = AiHandoffReflection & { id: string }
export type AiHandoffRepository = {
  getById(recordId: string): Promise<AiHandoffRecord | undefined>
  updateAiHandoff(recordId: string, changes: AiHandoffReflectionInput): Promise<AiHandoffRecord>
}

export function clearHistoryAiHandoffIdentity(sourceType: string, recordId: string) {
  return `${sourceType}:${recordId}`
}

export function resolveClearHistoryAiHandoffRepository(persistence: PersistenceContextValue, sourceType: string): AiHandoffRepository | undefined {
  switch (sourceType) {
    case 'clear_record': return persistence.repositories.clearRecords
    case 'free_talk': return persistence.repositories.clearFreeTalkRecords
    case 'love_boat_code': return persistence.repositories.loveBoatAssessments
    case 'love_brain_assessment': return persistence.repositories.loveBrainAssessments
    case 'like_or_habit': return persistence.repositories.likeOrHabitReflections
    default: return undefined
  }
}
