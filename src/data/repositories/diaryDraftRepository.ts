import type { DiaryDraft } from '../types'
import type { StorageAdapter } from '../storage/StorageAdapter'

function draftId(localDate: string) { return `diary-draft:${localDate}` }

export class LocalDiaryDraftRepository {
  constructor(private readonly storage: StorageAdapter) {}

  getDraft(localDate: string) { return this.storage.get<DiaryDraft>('diaryDrafts', draftId(localDate)) }

  async saveDraft(localDate: string, content: string) {
    if (!content.trim()) {
      await this.deleteDraft(localDate)
      return undefined
    }
    const draft: DiaryDraft = { id: draftId(localDate), localDate, content, updatedAt: new Date().toISOString() }
    await this.storage.put('diaryDrafts', draft)
    return draft
  }

  deleteDraft(localDate: string) { return this.storage.delete('diaryDrafts', draftId(localDate)) }

  async clear() {
    const records = await this.storage.getAll<DiaryDraft>('diaryDrafts')
    await Promise.all(records.map((record) => this.storage.delete('diaryDrafts', record.id)))
  }
}
