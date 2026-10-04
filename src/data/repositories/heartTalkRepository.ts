import type { CompletedHeartTalk } from '../types'
import type { StorageAdapter } from '../storage/StorageAdapter'

function now() { return new Date().toISOString() }
function id() { return `heart-talk-${crypto.randomUUID()}` }
function validDate(value: string) { return /^\d{4}-\d{2}-\d{2}$/u.test(value) }
function validTime(value: string) { return /^([01]\d|2[0-3]):[0-5]\d$/u.test(value) }

export type AddCompletedHeartTalk =
  | { topicType: 'official'; questionId: string; localDate: string; startTime: string; endTime: string }
  | { topicType: 'custom'; localDate: string; startTime: string; endTime: string }

/** Future Phase 3D calls addCompletedHeartTalk only after an actual completion event. */
export class LocalCompletedHeartTalkRepository {
  constructor(private readonly storage: StorageAdapter) {}
  async list() { return (await this.storage.getAll<CompletedHeartTalk>('completedHeartTalks')).sort((a, b) => `${b.localDate}${b.startTime}`.localeCompare(`${a.localDate}${a.startTime}`) || b.createdAt.localeCompare(a.createdAt)) }
  get(recordId: string) { return this.storage.get<CompletedHeartTalk>('completedHeartTalks', recordId) }
  async count() { return (await this.list()).length }
  async addCompletedHeartTalk(input: AddCompletedHeartTalk): Promise<CompletedHeartTalk> {
    if (!validDate(input.localDate) || !validTime(input.startTime) || !validTime(input.endTime) || (input.topicType === 'official' && !/^Q\d{3}$/u.test(input.questionId))) throw new Error('Invalid completed Heart Talk metadata')
    const timestamp = now()
    const record: CompletedHeartTalk = input.topicType === 'official'
      ? { id: id(), topicType: 'official', questionId: input.questionId, localDate: input.localDate, startTime: input.startTime, endTime: input.endTime, createdAt: timestamp, updatedAt: timestamp }
      : { id: id(), topicType: 'custom', localDate: input.localDate, startTime: input.startTime, endTime: input.endTime, createdAt: timestamp, updatedAt: timestamp }
    await this.storage.put('completedHeartTalks', record)
    return record
  }
  deleteOne(recordId: string) { return this.storage.delete('completedHeartTalks', recordId) }
  async clearAll() { await this.storage.restoreStoresAtomically({ completedHeartTalks: [] }, []) }
}
