import { readFileSync } from 'node:fs'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { BottomNavigation } from '../components'
import { PersistenceProvider } from '../data/PersistenceContext'
import { usePersistence } from '../data/PersistenceStateContext'
import { initializePersistence } from '../data/persistence'
import { createMemoryStorageBacking, MemoryStorageAdapter } from '../data/storage/MemoryStorageAdapter'
import { TodayPage } from '../pages/TodayPage'
import { I18nProvider } from './I18nProvider'
import { useI18n } from './I18nContext'
import { messages, supportedLocales, type TranslationKey } from './messages'

const batch1Keys = [
  'app.brand',
  'nav.today', 'nav.starBottle', 'nav.footprints', 'nav.our', 'nav.clear', 'nav.primary', 'nav.settings',
  'common.settings', 'common.back', 'common.cancel', 'common.confirm', 'common.close',
  'today.title',
  'today.profile.meName', 'today.profile.partnerName', 'today.profile.meAlt', 'today.profile.partnerAlt',
  'today.starHeartValue', 'today.starHeartAria',
  'today.dailyQuote', 'today.dayNumber', 'today.share', 'today.share.feedback',
  'today.mood.title', 'today.mood.flutter', 'today.mood.happy', 'today.mood.peaceful', 'today.mood.miss', 'today.mood.uneasy', 'today.mood.sad', 'today.mood.rumination',
  'today.heartLine.title', 'today.heartLine.placeholder', 'today.heartLine.maxLength', 'today.heartLine.heart', 'today.heartLine.feedback', 'today.heartLine.progress', 'today.heartLine.limitReached', 'today.heartLine.error', 'today.heartLine.edit', 'today.heartLine.delete', 'today.heartLine.saveEdit',
  'today.heartReveal.title', 'today.heartReveal.imageAlt', 'today.heartReveal.progress', 'today.heartReveal.availableToday', 'today.heartReveal.continue', 'today.heartReveal.feedback',
  'today.upcomingImportantDate', 'today.upcoming.date', 'today.upcoming.event', 'today.upcoming.daysRemaining',
] as const satisfies readonly TranslationKey[]

const scopedRuntimeFiles = [
  '../components/BottomNavigation.tsx',
  '../components/PageHeader.tsx',
  '../components/ConfirmDialog.tsx',
  '../pages/TodayPage.tsx',
  '../features/today/CoupleProfileHero.tsx',
  '../features/today/DailyLoveQuoteCard.tsx',
  '../features/today/HeartLineCard.tsx',
  '../features/today/HeartRevealProgressCard.tsx',
  '../features/today/MoodSelector.tsx',
  '../features/today/TodayHeroArtwork.tsx',
  '../features/today/UpcomingImportantDateCard.tsx',
] as const

function LocaleSwitch() {
  const { setLocale } = useI18n()
  const persistence = usePersistence()
  return <button type="button" onClick={async () => {
    await persistence?.updateSettings({ locale: 'en' })
    setLocale('en')
  }}>switch-locale</button>
}

afterEach(cleanup)

describe('Milestone 4C-3 Batch 1 localization', () => {
  it.each(supportedLocales)('has every non-empty scoped UI key in %s', (locale) => {
    for (const key of batch1Keys) {
      expect(Object.prototype.hasOwnProperty.call(messages[locale], key), `${locale} missing ${key}`).toBe(true)
      expect(messages[locale][key].trim(), `${locale} empty ${key}`).not.toBe('')
    }
  })

  it('contains no hardcoded Han UI strings in the scoped runtime components', () => {
    for (const relativePath of scopedRuntimeFiles) {
      const source = readFileSync(new URL(relativePath, import.meta.url), 'utf8')
      expect(source, relativePath).not.toMatch(/[\u3400-\u9fff]/u)
    }
  })

  it('switches the whole Today frame without changing persisted or in-progress user data', async () => {
    const backing = createMemoryStorageBacking()
    const first = await initializePersistence({
      adapter: new MemoryStorageAdapter(backing),
      defaultLocale: 'zh-TW',
      localDate: '2026-08-31',
    })
    await first.profiles.updateProfile('user', { nickname: '小星原文' })
    await first.moods.setMood('happy', '2026-08-31')
    first.adapter.close()
    const runtime = await initializePersistence({
      adapter: new MemoryStorageAdapter(backing),
      defaultLocale: 'zh-TW',
      localDate: '2026-08-31',
    })
    const scoreBefore = await runtime.scores.getTotal()

    render(
      <PersistenceProvider runtime={runtime}>
        <I18nProvider initialLocale="zh-TW">
          <MemoryRouter initialEntries={['/today']}>
            <TodayPage />
            <BottomNavigation />
            <LocaleSwitch />
          </MemoryRouter>
        </I18nProvider>
      </PersistenceProvider>,
    )

    const heartLine = screen.getByRole('textbox', { name: '今天，有什麼話想留下？' })
    fireEvent.change(heartLine, { target: { value: '這是使用者自己輸入的內容' } })
    fireEvent.click(screen.getByRole('button', { name: '收下這句心話' }))
    expect(await screen.findByText('第 1 / 7 次心意')).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: '主要導覽' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'switch-locale' }))
    await waitFor(() => expect(screen.getByRole('navigation', { name: 'Primary navigation' })).toBeInTheDocument())

    expect(heartLine).toHaveValue('這是使用者自己輸入的內容')
    expect(screen.getByText('Heart 1 of 7')).toBeInTheDocument()
    expect(screen.queryByText('第 1 / 7 次心意')).not.toBeInTheDocument()
    expect(screen.getByText('小星原文')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Happy' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument()
    expect((await runtime.settings.getSettings())?.locale).toBe('en')
    expect((await runtime.moods.getMoodByLocalDate('2026-08-31'))?.mood).toBe('happy')
    expect(await runtime.scores.getTotal()).toBe(scoreBefore)
  })
})
