import { useMemo, useState, type ReactNode } from 'react'
import type { PersistenceRuntime } from './persistence'
import { PersistenceStateContext, type PersistenceContextValue } from './PersistenceStateContext'

export function PersistenceProvider({ runtime, children }: { runtime: PersistenceRuntime; children: ReactNode }) {
  const [userProfile, setUserProfile] = useState(runtime.initial.userProfile)
  const [partnerProfile, setPartnerProfile] = useState(runtime.initial.partnerProfile)
  const [settings, setSettings] = useState(runtime.initial.settings)
  const [todayMood, setTodayMoodState] = useState(runtime.initial.todayMood)
  const [todayDiary, setTodayDiary] = useState(runtime.initial.todayDiary)
  const [starHeartTotal, setStarHeartTotal] = useState(runtime.initial.starHeartTotal)
  const [heartPhrases, setHeartPhrases] = useState(runtime.initial.heartPhrases)
  const [importantDates, setImportantDates] = useState(runtime.initial.importantDates)
  const [memoryMoments, setMemoryMoments] = useState(runtime.initial.memoryMoments)
  const [messageToYou, setMessageToYou] = useState(runtime.initial.messageToYou)
  const [rememberedYouCards, setRememberedYouCards] = useState(runtime.initial.rememberedYouCards)
  const [diaryCount, setDiaryCount] = useState(runtime.initial.diaryCount)

  const value = useMemo<PersistenceContextValue>(() => ({
    userProfile,
    partnerProfile,
    settings,
    todayMood,
    todayDiary,
    starHeartTotal,
    stars: runtime.initial.stars,
    heartPhrases,
    importantDates,
    memoryMoments,
    messageToYou,
    rememberedYouCards,
    diaryCount,
    repositories: runtime,
    async updateProfile(kind, changes) {
      const profile = await runtime.profiles.updateProfile(kind, changes)
      if (kind === 'user') setUserProfile(profile)
      else setPartnerProfile(profile)
      return profile
    },
    async setTodayMood(mood) {
      const record = await runtime.moods.setMood(mood)
      setTodayMoodState(record)
      setStarHeartTotal(await runtime.scores.getTotal())
      return record
    },
    async saveTodayDiary(content) {
      const creating = !todayDiary
      const entry = todayDiary
        ? await runtime.diaries.updateDiary(todayDiary.id, { content })
        : await runtime.diaries.createDiary({ content })
      setTodayDiary(entry)
      if (creating) setDiaryCount((count) => count + 1)
      setStarHeartTotal(await runtime.scores.getTotal())
      return entry
    },
    async deleteTodayDiary() {
      if (todayDiary) {
        await runtime.diaries.deleteDiary(todayDiary.id)
        setDiaryCount((count) => Math.max(0, count - 1))
      }
      setTodayDiary(undefined)
    },
    async shareDailyQuote() {
      const result = await runtime.scores.award('quote_shared')
      setStarHeartTotal(await runtime.scores.getTotal())
      return result.awarded
    },
    async acceptHeartPhrase(content) {
      const phrase = await runtime.heartPhrases.acceptHeartPhrase(content)
      setHeartPhrases(await runtime.heartPhrases.getTopHeartPhrases(3))
      return phrase
    },
    async updateHeartPhrase(id, content) {
      const phrase = await runtime.heartPhrases.updateHeartPhrase(id, content)
      setHeartPhrases(await runtime.heartPhrases.getTopHeartPhrases(3))
      return phrase
    },
    async deleteHeartPhrase(id) {
      await runtime.heartPhrases.deleteHeartPhrase(id)
      setHeartPhrases(await runtime.heartPhrases.getTopHeartPhrases(3))
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
    async deleteMemoryMoment(id) {
      await runtime.memoryMoments.deleteMemoryMoment(id)
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
  }), [diaryCount, heartPhrases, importantDates, memoryMoments, messageToYou, partnerProfile, rememberedYouCards, runtime, settings, starHeartTotal, todayDiary, todayMood, userProfile])

  return <PersistenceStateContext.Provider value={value}>{children}</PersistenceStateContext.Provider>
}
