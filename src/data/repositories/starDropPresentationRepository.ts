import type { StorageAdapter } from '../storage/StorageAdapter'
import type { Star } from '../types'

type PresentationState = 'pending' | 'presented'

interface StarDropPresentation {
  id: string
  starId: string
  state: PresentationState
  queuedAt: string
  presentedAt?: string
}

export interface StarPresentationWriter {
  queue(star: Star): Promise<void>
  remove(starId: string): Promise<void>
}

/**
 * Presentation state is deliberately separate from Star records: it can never
 * create, count, alter, or delete a canonical star.
 */
export class LocalStarDropPresentationRepository implements StarPresentationWriter {
  constructor(private readonly storage: StorageAdapter) {}

  async queue(star: Star) {
    const id = `star-drop:${star.id}`
    if (await this.storage.get<StarDropPresentation>('starDropPresentations', id)) return
    await this.storage.put('starDropPresentations', { id, starId: star.id, state: 'pending', queuedAt: new Date().toISOString() })
  }

  async claimRepresentative(stars: Star[]): Promise<Star | undefined> {
    const starById = new Map(stars.map((star) => [star.id, star]))
    const records = (await this.storage.getAll<StarDropPresentation>('starDropPresentations'))
      .sort((left, right) => left.queuedAt.localeCompare(right.queuedAt) || left.id.localeCompare(right.id))
    const pending = records.filter((record) => record.state === 'pending')

    await Promise.all(records.filter((record) => !starById.has(record.starId)).map((record) => this.storage.delete('starDropPresentations', record.id)))
    const eligible = pending.filter((record) => starById.has(record.starId))
    if (!eligible.length) return undefined

    const presentedAt = new Date().toISOString()
    await Promise.all(eligible.map((record) => this.storage.put('starDropPresentations', { ...record, state: 'presented', presentedAt })))
    return starById.get(eligible[eligible.length - 1].starId)
  }

  async remove(starId: string) { await this.storage.delete('starDropPresentations', `star-drop:${starId}`) }

  async clear() {
    const records = await this.storage.getAll<StarDropPresentation>('starDropPresentations')
    await Promise.all(records.map((record) => this.storage.delete('starDropPresentations', record.id)))
  }
}
