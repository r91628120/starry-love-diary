import { readFileSync } from 'node:fs'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { PersistenceProvider } from '../data/PersistenceContext'
import { usePersistence } from '../data/PersistenceStateContext'
import { initializePersistence } from '../data/persistence'
import { createMemoryStorageBacking, MemoryStorageAdapter } from '../data/storage/MemoryStorageAdapter'
import { OurPage } from '../pages/OurPage'
import { formatOurLocalDate } from '../features/our/ourFormatters'
import { I18nProvider } from './I18nProvider'
import { useI18n } from './I18nContext'
import { messages, supportedLocales } from './messages'
import { ourBatch4Messages } from './ourBatch4Messages'

const batch4Keys = Object.keys(ourBatch4Messages['zh-TW']) as Array<keyof (typeof ourBatch4Messages)['zh-TW']>

const scopedRuntimeFiles = [
  '../pages/OurPage.tsx',
  '../features/our/MemoryWall.tsx',
  '../features/our/ImportantDatesCard.tsx',
  '../features/our/MomentCarousel.tsx',
  '../features/our/MessageCard.tsx',
  '../features/our/RememberYou.tsx',
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

describe('Milestone 4C-3 Batch 4 Our localization', () => {
  it.each(supportedLocales)('has every non-empty Our UI key in %s', (locale) => {
    expect(Object.keys(ourBatch4Messages[locale])).toEqual(batch4Keys)
    for (const key of batch4Keys) {
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

  it('rerenders dates, numbers, feedback, and labels while preserving persisted and draft user text', async () => {
    const backing = createMemoryStorageBacking()
    const first = await initializePersistence({ adapter: new MemoryStorageAdapter(backing), defaultLocale: 'zh-TW', localDate: '2026-08-31' })
    await first.importantDates.createImportantDate({ type: 'first_meeting', title: '使用者重要日標題', description: '使用者日期描述', date: '2026-01-02' })
    await first.memoryMoments.createMemoryMoment({ title: '使用者時刻標題', content: '使用者時刻內容', localDate: '2026-08-20' })
    await first.messageToYou.saveMessage('使用者保留訊息')
    await first.rememberedYou.createRememberedYouCard({ title: '使用者卡片標題', content: '使用者卡片內容', localDate: '2026-08-19', isFavorite: true })
    first.adapter.close()

    const runtime = await initializePersistence({ adapter: new MemoryStorageAdapter(backing), defaultLocale: 'zh-TW', localDate: '2026-08-31' })
    const before = {
      dates: await runtime.importantDates.getImportantDates(),
      moments: await runtime.memoryMoments.getMemoryMoments(),
      message: await runtime.messageToYou.getMessage(),
      cards: await runtime.rememberedYou.getRememberedYouCards(),
      score: await runtime.scores.getTotal(),
    }

    render(
      <PersistenceProvider runtime={runtime}>
        <I18nProvider initialLocale="zh-TW">
          <MemoryRouter initialEntries={['/our']}>
            <OurPage />
            <LocaleSwitch />
          </MemoryRouter>
        </I18nProvider>
      </PersistenceProvider>,
    )

    expect(screen.getAllByText(formatOurLocalDate('2026-01-02', 'zh-TW')).length).toBeGreaterThan(0)
    const search = screen.getByRole('searchbox', { name: '搜尋我記得的你' })
    fireEvent.change(search, { target: { value: '使用者' } })
    fireEvent.click(screen.getByRole('button', { name: '只看收藏' }))

    const rememberSection = screen.getByRole('heading', { level: 2, name: '我記得的你' }).closest('section')
    expect(rememberSection).not.toBeNull()
    fireEvent.click(within(rememberSection!).getByRole('button', { name: '新增' }))
    fireEvent.change(within(rememberSection!).getByLabelText('標題'), { target: { value: '使用者未儲存標題' } })
    fireEvent.change(within(rememberSection!).getByRole('textbox', { name: /^內容/ }), { target: { value: '使用者未儲存內容' } })

    fireEvent.click(screen.getByRole('button', { name: 'switch-locale' }))

    await waitFor(() => expect(screen.getByRole('heading', { level: 1, name: 'Our Story' })).toBeInTheDocument())
    expect(search).toHaveValue('使用者')
    expect(screen.getByRole('button', { name: 'Favorites only' })).toHaveAttribute('aria-pressed', 'true')
    expect(within(rememberSection!).getByLabelText('Title')).toHaveValue('使用者未儲存標題')
    expect(within(rememberSection!).getByRole('textbox', { name: /^Content/ })).toHaveValue('使用者未儲存內容')
    expect(screen.queryByText('分享預覽將在下一階段開放')).not.toBeInTheDocument()
    expect(screen.getAllByText(formatOurLocalDate('2026-01-02', 'en')).length).toBeGreaterThan(0)

    fireEvent.click(screen.getByRole('button', { name: 'View message history' }))
    for (const userText of ['使用者重要日標題', '使用者日期描述', '使用者時刻標題', '使用者時刻內容', '使用者保留訊息', '使用者卡片標題', '使用者卡片內容']) {
      expect(screen.getByText(userText)).toBeInTheDocument()
    }
    expect(await runtime.importantDates.getImportantDates()).toEqual(before.dates)
    expect(await runtime.memoryMoments.getMemoryMoments()).toEqual(before.moments)
    expect(await runtime.messageToYou.getMessage()).toEqual(before.message)
    expect(await runtime.rememberedYou.getRememberedYouCards()).toEqual(before.cards)
    expect(await runtime.scores.getTotal()).toBe(before.score)
    expect((await runtime.settings.getSettings())?.locale).toBe('en')
  })

  it('shows repository validation as localized system copy without changing limits', async () => {
    const runtime = await initializePersistence({ adapter: new MemoryStorageAdapter(), defaultLocale: 'en', localDate: '2026-08-31' })
    render(
      <PersistenceProvider runtime={runtime}>
        <I18nProvider initialLocale="en">
          <MemoryRouter initialEntries={['/our']}><OurPage /></MemoryRouter>
        </I18nProvider>
      </PersistenceProvider>,
    )

    fireEvent.change(screen.getByRole('textbox', { name: 'Write what you want to say' }), { target: { value: 'x'.repeat(301) } })
    fireEvent.click(screen.getByRole('button', { name: 'Save this message' }))
    expect(await screen.findByText('Your message can contain up to 300 characters.')).toBeInTheDocument()
    expect(await runtime.messageToYou.getMessage()).toBeUndefined()
  })
})
