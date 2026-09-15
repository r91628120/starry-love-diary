import { DEFAULT_PHOTO_PLACEMENT, normalizePhotoPlacement } from '../../services/photoPlacement'
import type { HeartPhrase, HeartRevealProject, HeartRevealTextPlacement, PhotoPlacement } from '../types'
import type { StorageAdapter } from '../storage/StorageAdapter'
import type { PhotoRepository } from './PhotoRepository'

export const ACTIVE_HEART_REVEAL_PROJECT_ID = 'heart-reveal-active'

export class HeartRevealPhotoValidationError extends Error {
  constructor(readonly code: 'heart_reveal_photo_required' | 'active_photo_mismatch') {
    super(code)
    this.name = 'HeartRevealPhotoValidationError'
  }
}

export interface HeartRevealPhotoRepository {
  getActiveProject(): Promise<HeartRevealProject | undefined>
  getCycleState(phrases: HeartPhrase[]): Promise<HeartRevealProject>
  registerHeartPhrase(phraseId: string, phrases: HeartPhrase[]): Promise<HeartRevealProject>
  refreshCycleState(phrases: HeartPhrase[]): Promise<HeartRevealProject>
  completeCycle(phrases: HeartPhrase[]): Promise<HeartRevealProject>
  setActivePhoto(photoAssetId: string, placement?: Partial<PhotoPlacement>): Promise<HeartRevealProject>
  savePlacement(photoAssetId: string, placement: Partial<PhotoPlacement>): Promise<HeartRevealProject>
  saveTextPlacement(placement: HeartRevealTextPlacement): Promise<HeartRevealProject>
  clearActivePhoto(): Promise<void>
}

export class LocalHeartRevealPhotoRepository implements HeartRevealPhotoRepository {
  constructor(
    private readonly storage: StorageAdapter,
    private readonly photos: Pick<PhotoRepository, 'getPhotoAsset'>,
    private readonly now: () => string = () => new Date().toISOString(),
  ) {}

  async getActiveProject() {
    const project = await this.storage.get<HeartRevealProject>('heartRevealProjects', ACTIVE_HEART_REVEAL_PROJECT_ID)
    if (!project || project.status !== 'active') return undefined
    return { ...project, photoPlacement: normalizePhotoPlacement(project.photoPlacement ?? DEFAULT_PHOTO_PLACEMENT) }
  }

  private async rawProject() {
    return this.storage.get<HeartRevealProject>('heartRevealProjects', ACTIVE_HEART_REVEAL_PROJECT_ID)
  }

  private normalizedCycle(project: HeartRevealProject, phrases: HeartPhrase[]): HeartRevealProject {
    // Pre-v2 data had only progressCount. Its existing archive is safely
    // interpreted as the first ready/active cycle, without clearing anything.
    const legacyInference = project.cyclePhraseIds === undefined
    const ids = project.cyclePhraseIds ?? phrases.slice(0, 7).map((phrase) => phrase.id)
    const validIds = ids.filter((id) => phrases.some((phrase) => phrase.id === id)).slice(0, 7)
    const overflow = (legacyInference ? phrases.slice(7).map((phrase) => phrase.id) : project.legacyOverflowPhraseIds ?? [])
      .filter((id, index, all) => all.indexOf(id) === index && !validIds.includes(id) && phrases.some((phrase) => phrase.id === id))
    const progressCount = validIds.length
    return {
      ...project,
      photoPlacement: project.photoAssetId ? normalizePhotoPlacement(project.photoPlacement ?? DEFAULT_PHOTO_PLACEMENT) : undefined,
      cyclePhraseIds: validIds,
      legacyOverflowPhraseIds: overflow,
      cycleNumber: project.cycleNumber ?? 1,
      cycleStatus: progressCount === 7 ? 'ready' : 'active',
      progressCount,
    }
  }

  async getCycleState(phrases: HeartPhrase[]) {
    const timestamp = this.now()
    const current = await this.rawProject()
    const base: HeartRevealProject = current ?? {
      id: ACTIVE_HEART_REVEAL_PROJECT_ID,
      status: 'active',
      progressCount: 0,
      // A non-empty archive with no project is legacy data. Leave the ids
      // undefined here so normalizedCycle can preserve its overflow boundary.
      cyclePhraseIds: phrases.length ? undefined : [],
      cycleNumber: 1,
      createdAt: timestamp,
      updatedAt: timestamp,
    }
    const normalized = this.normalizedCycle(base, phrases)
    const changed = !current || JSON.stringify({ ids: current.cyclePhraseIds, overflow: current.legacyOverflowPhraseIds, number: current.cycleNumber, state: current.cycleStatus, progress: current.progressCount }) !== JSON.stringify({ ids: normalized.cyclePhraseIds, overflow: normalized.legacyOverflowPhraseIds, number: normalized.cycleNumber, state: normalized.cycleStatus, progress: normalized.progressCount })
    if (changed) {
      normalized.updatedAt = timestamp
      await this.storage.put('heartRevealProjects', normalized)
    }
    return normalized
  }

  async refreshCycleState(phrases: HeartPhrase[]) {
    const project = await this.getCycleState(phrases)
    const refreshed = this.normalizedCycle(project, phrases)
    if (refreshed.progressCount !== project.progressCount || refreshed.cycleStatus !== project.cycleStatus || JSON.stringify(refreshed.cyclePhraseIds) !== JSON.stringify(project.cyclePhraseIds) || JSON.stringify(refreshed.legacyOverflowPhraseIds) !== JSON.stringify(project.legacyOverflowPhraseIds)) {
      refreshed.updatedAt = this.now()
      await this.storage.put('heartRevealProjects', refreshed)
    }
    return refreshed
  }

  async registerHeartPhrase(phraseId: string, phrases: HeartPhrase[]) {
    const current = await this.getCycleState(phrases.filter((phrase) => phrase.id !== phraseId))
    // A ready cycle remains frozen until its owner explicitly completes it.
    if (current.cycleStatus === 'ready') return current
    const ids = [...new Set([...(current.cyclePhraseIds ?? []), phraseId])].slice(0, 7)
    const next = this.normalizedCycle({ ...current, cyclePhraseIds: ids }, phrases)
    next.updatedAt = this.now()
    await this.storage.put('heartRevealProjects', next)
    return next
  }

  async completeCycle(phrases: HeartPhrase[]) {
    const current = await this.getCycleState(phrases)
    if (current.cycleStatus !== 'ready' || current.progressCount !== 7) throw new HeartRevealPhotoValidationError('active_photo_mismatch')
    const timestamp = this.now()
    const validOverflow = (current.legacyOverflowPhraseIds ?? []).filter((id) => phrases.some((phrase) => phrase.id === id))
    const cyclePhraseIds = validOverflow.slice(0, 7)
    const next: HeartRevealProject = {
      id: ACTIVE_HEART_REVEAL_PROJECT_ID,
      status: 'active',
      progressCount: cyclePhraseIds.length,
      cyclePhraseIds,
      legacyOverflowPhraseIds: validOverflow.slice(7),
      cycleNumber: (current.cycleNumber ?? 1) + 1,
      cycleStatus: cyclePhraseIds.length === 7 ? 'ready' : 'active',
      textPlacement: current.textPlacement,
      lastCompletedAt: timestamp,
      createdAt: current.createdAt,
      updatedAt: timestamp,
    }
    await this.storage.put('heartRevealProjects', next)
    return next
  }

  async setActivePhoto(photoAssetId: string, placement: Partial<PhotoPlacement> = DEFAULT_PHOTO_PLACEMENT) {
    const asset = await this.photos.getPhotoAsset(photoAssetId)
    if (!asset || asset.category !== 'heart_reveal') throw new HeartRevealPhotoValidationError('heart_reveal_photo_required')
    const previous = await this.rawProject()
    const timestamp = this.now()
    const project: HeartRevealProject = {
      id: ACTIVE_HEART_REVEAL_PROJECT_ID,
      photoAssetId,
      photoPlacement: normalizePhotoPlacement(placement),
      textPlacement: previous?.textPlacement,
      status: 'active',
      progressCount: previous?.progressCount ?? 0,
      cyclePhraseIds: previous?.cyclePhraseIds,
      legacyOverflowPhraseIds: previous?.legacyOverflowPhraseIds,
      cycleNumber: previous?.cycleNumber,
      cycleStatus: previous?.cycleStatus,
      lastCompletedAt: previous?.lastCompletedAt,
      createdAt: previous?.createdAt ?? timestamp,
      updatedAt: timestamp,
    }
    await this.storage.put('heartRevealProjects', project)
    return project
  }

  async savePlacement(photoAssetId: string, placement: Partial<PhotoPlacement>) {
    const active = await this.getActiveProject()
    if (!active || active.photoAssetId !== photoAssetId) throw new HeartRevealPhotoValidationError('active_photo_mismatch')
    const project = { ...active, photoPlacement: normalizePhotoPlacement(placement), updatedAt: this.now() }
    await this.storage.put('heartRevealProjects', project)
    return project
  }

  async saveTextPlacement(textPlacement: HeartRevealTextPlacement) {
    const project = await this.getCycleState(await this.storage.getAll<HeartPhrase>('heartPhrases'))
    const next = { ...project, textPlacement, updatedAt: this.now() }
    await this.storage.put('heartRevealProjects', next)
    return next
  }

  clearActivePhoto() {
    return this.rawProject().then(async (project) => {
      if (!project) return
      await this.storage.put('heartRevealProjects', { ...project, photoAssetId: undefined, photoPlacement: undefined, updatedAt: this.now() })
    })
  }
}
