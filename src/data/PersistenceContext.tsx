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

  const value = useMemo<PersistenceContextValue>(() => ({
    userProfile,
    partnerProfile,
    settings,
    todayMood,
    todayDiary,
    starHeartTotal,
    stars: runtime.initial.stars,
    heartPhrases,
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
      const entry = todayDiary
        ? await runtime.diaries.updateDiary(todayDiary.id, { content })
        : await runtime.diaries.createDiary({ content })
      setTodayDiary(entry)
      setStarHeartTotal(await runtime.scores.getTotal())
      return entry
    },
    async deleteTodayDiary() {
      if (todayDiary) await runtime.diaries.deleteDiary(todayDiary.id)
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
    async updateSettings(changes) {
      const updated = await runtime.settings.updateSettings(changes)
      setSettings(updated)
      return updated
    },
  }), [heartPhrases, partnerProfile, runtime, settings, starHeartTotal, todayDiary, todayMood, userProfile])

  return <PersistenceStateContext.Provider value={value}>{children}</PersistenceStateContext.Provider>
}
