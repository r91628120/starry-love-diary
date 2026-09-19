import { useMemo, useState, type ReactNode } from 'react'
import type { PersistenceRuntime } from './persistence'
import { PersistenceStateContext, type PersistenceContextValue } from './PersistenceStateContext'
import { removeProfilePhoto, replaceProfilePhoto } from './photo/profilePhotoActions'
import { removeHeartRevealPhoto, replaceHeartRevealPhoto } from './photo/heartRevealPhotoActions'
import { deleteMemoryMomentWithPhoto, removeMemoryMomentPhoto, replaceMemoryMomentPhoto } from './photo/memoryMomentPhotoActions'
import { applyImportPlan, type AppDataImportPlan } from '../services/importAppData'
import { clearCurrentRelationshipData } from '../services/clearCurrentRelationshipData'

export function PersistenceProvider({ runtime, children }: { runtime: PersistenceRuntime; children: ReactNode }) {
  const [userProfile, setUserProfile] = useState(runtime.initial.userProfile)
  const [partnerProfile, setPartnerProfile] = useState(runtime.initial.partnerProfile)
  const [settings, setSettings] = useState(runtime.initial.settings)
  const [todayMood, setTodayMoodState] = useState(runtime.initial.todayMood)
  const [todayDiary, setTodayDiary] = useState(runtime.initial.todayDiary)
  const [starHeartTotal, setStarHeartTotal] = useState(runtime.initial.starHeartTotal)
  const [stars, setStars] = useState(runtime.initial.stars)
  const [heartPhrases, setHeartPhrases] = useState(runtime.initial.heartPhrases)
  const [heartPhraseCount, setHeartPhraseCount] = useState(runtime.initial.heartPhraseCount)
  const [activeHeartRevealProject, setActiveHeartRevealProject] = useState(runtime.initial.activeHeartRevealProject)
  const [importantDates, setImportantDates] = useState(runtime.initial.importantDates)
  const [memoryMoments, setMemoryMoments] = useState(runtime.initial.memoryMoments)
  const [messageToYou, setMessageToYou] = useState(runtime.initial.messageToYou)
  const [messageToYouEntries, setMessageToYouEntries] = useState(runtime.initial.messageToYouEntries)
  const [rememberedYouCards, setRememberedYouCards] = useState(runtime.initial.rememberedYouCards)
  const [diaryCount, setDiaryCount] = useState(runtime.initial.diaryCount)

  const value = useMemo<PersistenceContextValue>(() => ({
    userProfile,
    partnerProfile,
    settings,
    currentLocalDate: runtime.initial.currentLocalDate,
    todayMood,
    todayDiary,
    starHeartTotal,
    stars,
    heartPhrases,
    heartPhraseCount,
    activeHeartRevealProject,
    importantDates,
    memoryMoments,
    messageToYou,
    messageToYouEntries,
    rememberedYouCards,
    diaryCount,
    repositories: runtime,
    async updateProfile(kind, changes) {
      const profile = await runtime.profiles.updateProfile(kind, changes)
      if (kind === 'user') setUserProfile(profile)
      else setPartnerProfile(profile)
      return profile
    },
    async replaceProfilePhoto(kind, file) {
      const profile = await replaceProfilePhoto(kind, file, runtime.profiles, runtime.photos, runtime.profilePhotoPlacements)
      if (kind === 'user') setUserProfile(profile)
      else setPartnerProfile(profile)
      return profile
    },
    async removeProfilePhoto(kind) {
      const profile = await removeProfilePhoto(kind, runtime.profiles, runtime.photos, runtime.profilePhotoPlacements)
      if (kind === 'user') setUserProfile(profile)
      else setPartnerProfile(profile)
      return profile
    },
    async setTodayMood(mood) {
      const record = await runtime.moods.setMood(mood)
      const [total, persistedStars] = await Promise.all([runtime.scores.getTotal(), runtime.stars.getStars()])
      setTodayMoodState(record)
      setStarHeartTotal(total)
      setStars(persistedStars)
      return record
    },
    async saveTodayDiary(content, diaryId) {
      const creating = !diaryId
      const entry = diaryId
        ? await runtime.diaries.updateDiary(diaryId, { content })
        : await runtime.diaries.createDiary({ content })
      setTodayDiary(entry)
        if (creating) await runtime.diaryDrafts.deleteDraft(runtime.initial.currentLocalDate).catch(() => undefined)
      if (creating) setDiaryCount((count) => count + 1)
      setStarHeartTotal(await runtime.scores.getTotal())
      return entry
    },
    async deleteTodayDiary(diaryId) {
      if (diaryId) {
        await runtime.diaries.deleteDiary(diaryId)
        setDiaryCount((count) => Math.max(0, count - 1))
      }
      setTodayDiary(undefined)
    },
    async shareDailyQuote() {
      const result = await runtime.scores.award('quote_shared', { localDate: runtime.initial.currentLocalDate })
      setStarHeartTotal(await runtime.scores.getTotal())
      return result.awarded
    },
    async acceptHeartPhrase(content) {
      const phrase = await runtime.heartPhrases.acceptHeartPhrase(content)
      const allPhrases = await runtime.heartPhrases.getHeartPhrases()
      const project = await runtime.heartRevealPhotos.registerHeartPhrase(phrase.id, allPhrases)
      setHeartPhrases(allPhrases)
      setHeartPhraseCount(allPhrases.length)
      setActiveHeartRevealProject(project)
      return phrase
    },
    async updateHeartPhrase(id, content) {
      const phrase = await runtime.heartPhrases.updateHeartPhrase(id, content)
      setHeartPhrases(await runtime.heartPhrases.getHeartPhrases())
      return phrase
    },
    async deleteHeartPhrase(id) {
      await runtime.heartPhrases.deleteHeartPhrase(id)
      const allPhrases = await runtime.heartPhrases.getHeartPhrases()
      const project = await runtime.heartRevealPhotos.refreshCycleState(allPhrases)
      setHeartPhrases(allPhrases)
      setHeartPhraseCount(allPhrases.length)
      setActiveHeartRevealProject(project)
    },
    async replaceHeartRevealPhoto(file) {
      const project = await replaceHeartRevealPhoto(file, runtime.heartRevealPhotos, runtime.photos)
      setActiveHeartRevealProject(project)
      return project
    },
    async saveHeartRevealPlacement(placement) {
      if (!activeHeartRevealProject?.photoAssetId) throw new Error('No active heart reveal photo')
      const project = await runtime.heartRevealPhotos.savePlacement(activeHeartRevealProject.photoAssetId, placement)
      setActiveHeartRevealProject(project)
      return project
    },
    async saveHeartRevealTextPlacement(placement) {
      const project = await runtime.heartRevealPhotos.saveTextPlacement(placement)
      setActiveHeartRevealProject(project)
      return project
    },
    async removeHeartRevealPhoto() {
      await removeHeartRevealPhoto(runtime.heartRevealPhotos, runtime.photos)
      setActiveHeartRevealProject(await runtime.heartRevealPhotos.getCycleState(await runtime.heartPhrases.getHeartPhrases()))
    },
    async completeHeartRevealCycle() {
      const project = await runtime.heartRevealPhotos.completeCycle(await runtime.heartPhrases.getHeartPhrases())
      setActiveHeartRevealProject(project)
      return project
    },
    async createImportantDate(input) {
      const record = await runtime.importantDates.createImportantDate(input)
      setImportantDates(await runtime.importantDates.getImportantDates())
      return record
    },
    async updateImportantDate(id, changes) {
      const record = await runtime.importantDates.updateImportantDate(id, changes)
      setImportantDates(await runtime.importantDates.getImportantDates())
      return record
    },
    async deleteImportantDate(id) {
      await runtime.importantDates.deleteImportantDate(id)
      setImportantDates(await runtime.importantDates.getImportantDates())
    },
    async createMemoryMoment(input) {
      const record = await runtime.memoryMoments.createMemoryMoment(input)
      setMemoryMoments(await runtime.memoryMoments.getMemoryMoments())
      return record
    },
    async updateMemoryMoment(id, changes) {
      const record = await runtime.memoryMoments.updateMemoryMoment(id, changes)
      setMemoryMoments(await runtime.memoryMoments.getMemoryMoments())
      return record
    },
    async replaceMemoryMomentPhoto(id, file) {
      const record = await replaceMemoryMomentPhoto(id, file, runtime.memoryMoments, runtime.photos, runtime.memoryMomentPhotoPlacements)
      setMemoryMoments(await runtime.memoryMoments.getMemoryMoments())
      return record
    },
    async removeMemoryMomentPhoto(id) {
      const record = await removeMemoryMomentPhoto(id, runtime.memoryMoments, runtime.photos, runtime.memoryMomentPhotoPlacements)
      setMemoryMoments(await runtime.memoryMoments.getMemoryMoments())
      return record
    },
    async saveMemoryMomentPhotoPlacement(id, placement) {
      const moment = await runtime.memoryMoments.getMemoryMoment(id)
      if (!moment?.photoAssetId) throw new Error('Memory moment has no photo')
      return runtime.memoryMomentPhotoPlacements.savePlacement(id, moment.photoAssetId, placement)
    },
    async deleteMemoryMoment(id) {
      await deleteMemoryMomentWithPhoto(id, runtime.memoryMoments, runtime.photos, runtime.memoryMomentPhotoPlacements)
      setMemoryMoments(await runtime.memoryMoments.getMemoryMoments())
    },
    async saveMessageToYou(content) {
      const record = await runtime.messageToYou.saveMessage(content)
      setMessageToYou(record)
      return record
    },
    async clearMessageToYou() {
      await runtime.messageToYou.clearMessage()
      setMessageToYou(undefined)
      setMessageToYouEntries([])
    },
    async createMessageToYouEntry(input) {
      const record = await runtime.messageToYou.createEntry({ ...input, localDate: runtime.initial.currentLocalDate })
      setMessageToYouEntries(await runtime.messageToYou.getEntries())
      return record
    },
    async updateMessageToYouEntry(id, changes) {
      const record = await runtime.messageToYou.updateEntry(id, changes)
      setMessageToYouEntries(await runtime.messageToYou.getEntries())
      return record
    },
    async deleteMessageToYouEntry(id) {
      await runtime.messageToYou.deleteEntry(id)
      setMessageToYouEntries(await runtime.messageToYou.getEntries())
    },
    async createRememberedYouCard(input) {
      const record = await runtime.rememberedYou.createRememberedYouCard(input)
      setRememberedYouCards(await runtime.rememberedYou.getRememberedYouCards())
      return record
    },
    async updateRememberedYouCard(id, changes) {
      const record = await runtime.rememberedYou.updateRememberedYouCard(id, changes)
      setRememberedYouCards(await runtime.rememberedYou.getRememberedYouCards())
      return record
    },
    async deleteRememberedYouCard(id) {
      await runtime.rememberedYou.deleteRememberedYouCard(id)
      setRememberedYouCards(await runtime.rememberedYou.getRememberedYouCards())
    },
    async toggleRememberedYouFavorite(id) {
      const record = await runtime.rememberedYou.toggleFavorite(id)
      setRememberedYouCards(await runtime.rememberedYou.getRememberedYouCards())
      return record
    },
    async updateSettings(changes) {
      const updated = await runtime.settings.updateSettings(changes)
      setSettings(updated)
      return updated
    },
    async clearCurrentRelationshipData() {
      const result = await clearCurrentRelationshipData(runtime)
      setUserProfile(result.userProfile)
      setPartnerProfile(result.partnerProfile)
      setSettings(result.settings)
      setTodayMoodState(undefined)
      setTodayDiary(undefined)
      setStarHeartTotal(0)
      setStars([])
      setHeartPhrases([])
      setHeartPhraseCount(0)
      setActiveHeartRevealProject(undefined)
      setImportantDates([])
      setMemoryMoments([])
      setMessageToYou(undefined)
      setRememberedYouCards([])
      setDiaryCount(0)
    },
    async refreshScoreAndStars() {
      const [total, persistedStars] = await Promise.all([runtime.scores.getTotal(), runtime.stars.getStars()])
      setStarHeartTotal(total)
      setStars(persistedStars)
    },
    async applyAppDataImport(plan: AppDataImportPlan) {
      const summary = await applyImportPlan(runtime, plan)
      await runtime.starDropPresentations.clear()
      await runtime.diaryDrafts.clear()
      const [user, partner, nextSettings, nextMood, nextDiary, nextScore, nextStars, nextPhrases, nextImportantDates, nextMoments, nextMessage, nextMessageEntries, nextRemembered, nextDiaries] = await Promise.all([
        runtime.profiles.getProfile('user'), runtime.profiles.getProfile('partner'), runtime.settings.getSettings(), runtime.moods.getMoodByLocalDate(runtime.initial.currentLocalDate), runtime.diaries.getDiaryByLocalDate(runtime.initial.currentLocalDate), runtime.scores.getTotal(), runtime.stars.getStars(), runtime.heartPhrases.getHeartPhrases(), runtime.importantDates.getImportantDates(), runtime.memoryMoments.getMemoryMoments(), runtime.messageToYou.getMessage(), runtime.messageToYou.reconcileLegacy(), runtime.rememberedYou.getRememberedYouCards(), runtime.diaries.getDiaries(),
      ])
      if (user) setUserProfile(user)
      if (partner) setPartnerProfile(partner)
      if (nextSettings) setSettings(nextSettings)
      setTodayMoodState(nextMood)
      setTodayDiary(nextDiary)
      setStarHeartTotal(nextScore)
      setStars(nextStars)
      setHeartPhrases(nextPhrases)
      setHeartPhraseCount(nextPhrases.length)
      setActiveHeartRevealProject(await runtime.heartRevealPhotos.getCycleState(nextPhrases))
      setImportantDates(nextImportantDates)
      setMemoryMoments(nextMoments)
      setMessageToYou(nextMessage)
      setMessageToYouEntries(nextMessageEntries)
      setRememberedYouCards(nextRemembered)
      setDiaryCount(nextDiaries.length)
      return summary
    },
  }), [activeHeartRevealProject, diaryCount, heartPhraseCount, heartPhrases, importantDates, memoryMoments, messageToYou, messageToYouEntries, partnerProfile, rememberedYouCards, runtime, settings, starHeartTotal, stars, todayDiary, todayMood, userProfile])

  return <PersistenceStateContext.Provider value={value}>{children}</PersistenceStateContext.Provider>
}
