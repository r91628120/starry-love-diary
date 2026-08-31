import { readFileSync } from 'node:fs'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { PersistenceProvider } from '../data/PersistenceContext'
import { usePersistence } from '../data/PersistenceStateContext'
import { initializePersistence } from '../data/persistence'
import { createMemoryStorageBacking, MemoryStorageAdapter } from '../data/storage/MemoryStorageAdapter'
import { StarBottlePage } from '../pages/StarBottlePage'
import { I18nProvider } from './I18nProvider'
import { useI18n } from './I18nContext'
import { messages, supportedLocales, type TranslationKey } from './messages'

const batch2Keys = [
  'starBottle.title',
  'starBottle.hero.label', 'starBottle.hero.tagline',
  'starBottle.filter.label', 'starBottle.filter.today', 'starBottle.filter.month', 'starBottle.filter.year', 'starBottle.filter.all',
  'starBottle.stats.label', 'starBottle.totalStars', 'starBottle.moodStars', 'starBottle.clearStars', 'starBottle.statAria',
  'starBottle.searchPlaceholder',
  'starBottle.recentStars', 'starBottle.viewAll', 'starBottle.viewAll.feedback',
  'starBottle.type.mood', 'starBottle.type.clear', 'starBottle.entry.more', 'starBottle.empty',
] as const satisfies readonly TranslationKey[]

const scopedRuntimeFiles = [
  '../pages/StarBottlePage.tsx',
  '../features/star-bottle/BottleHeroCard.tsx',
  '../features/star-bottle/StarEntryList.tsx',
  '../features/star-bottle/StarStats.tsx',
  '../features/star-bottle/TimeRangeFilter.tsx',
] as const

function LocaleSwitch() {
  const { setLocale } = useI18n()
  const persistence = usePersistence()
  return <button type="button" onClick={async () => {
    await persistence?.updateSettings({ locale: 'en' })
    setLocale('en')
  }}>switch-locale</button>
}

function formatTestDate(localDate: string, locale: string) {
  const [year, month, day] = localDate.split('-').map(Number)
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(Date.UTC(year, month - 1, day)))
}

afterEach(cleanup)

describe('Milestone 4C-3 Batch 2 Star Bottle localization', () => {
  it.each(supportedLocales)('has every non-empty Star Bottle UI key in %s', (locale) => {
    for (const key of batch2Keys) {
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

  it('switches locale without changing stars, range, search, or user-authored text', async () => {
    const backing = createMemoryStorageBacking()
    const first = await initializePersistence({
      adapter: new MemoryStorageAdapter(backing),
      defaultLocale: 'zh-TW',
      localDate: '2026-08-31',
    })
    await first.stars.createStar({ type: 'mood', title: '使用者標題', content: '使用者星星內容', localDate: '2026-08-01' })
    await first.stars.createStar({ type: 'clear_mind', content: '使用者清醒內容', localDate: '2026-08-02' })
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
          <MemoryRouter initialEntries={['/star-bottle']}>
            <StarBottlePage />
            <LocaleSwitch />
          </MemoryRouter>
        </I18nProvider>
      </PersistenceProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: '全部' }))
    const search = screen.getByRole('searchbox', { name: '搜尋星星、心情或關鍵字' })
    fireEvent.change(search, { target: { value: '使用者' } })
    expect(screen.getByText('使用者星星內容')).toBeInTheDocument()
    expect(screen.getByText('使用者清醒內容')).toBeInTheDocument()
    expect(screen.getByText(formatTestDate('2026-08-01', 'zh-TW'))).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '查看全部星星' }))
    expect(screen.getByText('完整星星清單將在下一階段開放')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'switch-locale' }))
    await waitFor(() => expect(screen.getByRole('searchbox', { name: 'Search stars, moods, or keywords' })).toBeInTheDocument())

    expect(search).toHaveValue('使用者')
    expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('使用者星星內容')).toBeInTheDocument()
    expect(screen.getByText('使用者清醒內容')).toBeInTheDocument()
    expect(screen.getByText(formatTestDate('2026-08-01', 'en'))).toBeInTheDocument()
    expect(screen.getByLabelText('Total stars: 2')).toBeInTheDocument()
    expect(screen.getByText('The full star list will open in a later phase')).toBeInTheDocument()
    expect(screen.queryByText('完整星星清單將在下一階段開放')).not.toBeInTheDocument()

    const stars = await runtime.stars.getStars()
    expect(stars.map(({ type, title, content, localDate }) => ({ type, title, content, localDate }))).toEqual([
      { type: 'clear_mind', title: undefined, content: '使用者清醒內容', localDate: '2026-08-02' },
      { type: 'mood', title: '使用者標題', content: '使用者星星內容', localDate: '2026-08-01' },
    ])
    expect((await runtime.settings.getSettings())?.locale).toBe('en')
    expect(await runtime.scores.getTotal()).toBe(scoreBefore)
  })
})
