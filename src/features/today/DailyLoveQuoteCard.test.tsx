import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PersistenceProvider } from '../../data/PersistenceContext'
import { initializePersistence } from '../../data/persistence'
import { MemoryStorageAdapter } from '../../data/storage/MemoryStorageAdapter'
import { I18nProvider } from '../../i18n/I18nProvider'
import { useI18n } from '../../i18n/I18nContext'
import { DailyLoveQuoteCard } from './DailyLoveQuoteCard'
import { getDailyLoveQuote } from './dailyLoveQuoteRuntime'

function LocaleSwitch() {
  const { setLocale } = useI18n()
  return <button type="button" onClick={() => setLocale('en')}>switch-to-en</button>
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('DailyLoveQuoteCard runtime integration', () => {
  it('keeps the Day fixed, rerenders the selected locale, and shares that exact text', async () => {
    const runtime = await initializePersistence({
      adapter: new MemoryStorageAdapter(),
      defaultLocale: 'zh-TW',
      localDate: '2026-08-31',
    })
    const share = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { ...globalThis.navigator, share })

    render(
      <PersistenceProvider runtime={runtime}>
        <I18nProvider initialLocale="zh-TW">
          <DailyLoveQuoteCard />
          <LocaleSwitch />
        </I18nProvider>
      </PersistenceProvider>,
    )

    expect(screen.getByText('第 1 天')).toBeInTheDocument()
    expect(screen.getByText(getDailyLoveQuote('zh-TW', 1))).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'switch-to-en' }))
    expect(screen.getByText('Day 1')).toBeInTheDocument()
    expect(screen.getByText(getDailyLoveQuote('en', 1))).toBeInTheDocument()
    expect(screen.queryByText(getDailyLoveQuote('zh-TW', 1))).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Share' }))
    await waitFor(() => expect(share).toHaveBeenCalledWith({
      title: 'Love Note | Daily Quote',
      text: getDailyLoveQuote('en', 1),
    }))
    await waitFor(() => expect(screen.getByText('Share preview is ready')).toBeInTheDocument())
    expect(await runtime.scores.hasAward('quote_shared', { localDate: '2026-08-31' })).toBe(true)
  })
})
