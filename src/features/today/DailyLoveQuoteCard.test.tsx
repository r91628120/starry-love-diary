import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PersistenceProvider } from '../../data/PersistenceContext'
import { initializePersistence } from '../../data/persistence'
import { createMemoryStorageBacking, MemoryStorageAdapter, type MemoryStorageBacking } from '../../data/storage/MemoryStorageAdapter'
import { I18nProvider } from '../../i18n/I18nProvider'
import { useI18n } from '../../i18n/I18nContext'
import type { Locale } from '../../i18n/messages'
import { DailyLoveQuoteCard } from './DailyLoveQuoteCard'
import { formatDailyLoveQuoteDate, getDailyLoveQuote } from './dailyLoveQuoteRuntime'

function LocaleSwitch() {
  const { setLocale } = useI18n()
  return <button type="button" onClick={() => setLocale('en')}>switch-to-en</button>
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('DailyLoveQuoteCard runtime integration', () => {
  async function createRuntime(backing?: MemoryStorageBacking) {
    return initializePersistence({
      adapter: new MemoryStorageAdapter(backing),
      defaultLocale: 'zh-TW',
      localDate: '2026-08-31',
    })
  }

  function renderCard(runtime: Awaited<ReturnType<typeof createRuntime>>, locale: Locale = 'zh-TW') {
    return render(
      <PersistenceProvider runtime={runtime}>
        <I18nProvider initialLocale={locale}>
          <DailyLoveQuoteCard />
          <LocaleSwitch />
        </I18nProvider>
      </PersistenceProvider>,
    )
  }

  it('keeps the Day fixed, rerenders the selected locale, and shares the localized quote with the app name', async () => {
    const runtime = await createRuntime()
    const share = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { ...globalThis.navigator, share })

    renderCard(runtime)

    expect(screen.getByText('第 1 天')).toBeInTheDocument()
    expect(screen.getByText(getDailyLoveQuote('zh-TW', 1))).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'switch-to-en' }))
    expect(screen.getByText('Day 1')).toBeInTheDocument()
    expect(screen.getByText(getDailyLoveQuote('en', 1))).toBeInTheDocument()
    expect(screen.queryByText(getDailyLoveQuote('zh-TW', 1))).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Share' }))
    await waitFor(() => expect(share).toHaveBeenCalledWith({
      title: 'Love Note | Daily Quote',
      text: `${getDailyLoveQuote('en', 1)}\n\nLove Note | Daily Quote\n${formatDailyLoveQuoteDate('2026-08-31', 'en')}｜Day 1\nStarry Love Diary`,
    }))
    await waitFor(() => expect(screen.getByText('Today’s love quote was shared')).toBeInTheDocument())
    expect(await runtime.scores.hasAward('quote_shared', { localDate: '2026-08-31' })).toBe(true)
  })

  it('uses the clipboard only when Web Share is unavailable and reports the copied result', async () => {
    const runtime = await createRuntime()
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    renderCard(runtime, 'en')

    fireEvent.click(screen.getByRole('button', { name: 'Share' }))
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(`${getDailyLoveQuote('en', 1)}\n\nLove Note | Daily Quote\n${formatDailyLoveQuoteDate('2026-08-31', 'en')}｜Day 1\nStarry Love Diary`))
    expect(await screen.findByText('Today’s love quote was copied')).toBeInTheDocument()
    expect(await runtime.scores.hasAward('quote_shared', { localDate: '2026-08-31' })).toBe(true)
  })

  it('does not award or show feedback when the native share sheet is cancelled', async () => {
    const runtime = await createRuntime()
    const abortError = new DOMException('cancelled', 'AbortError')
    vi.stubGlobal('navigator', { share: vi.fn().mockRejectedValue(abortError) })
    renderCard(runtime, 'en')

    fireEvent.click(screen.getByRole('button', { name: 'Share' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Share' })).not.toBeDisabled())
    expect(await runtime.scores.hasAward('quote_shared', { localDate: '2026-08-31' })).toBe(false)
    expect(screen.queryByText('Today’s love quote was shared')).not.toBeInTheDocument()
    expect(screen.queryByText('Today’s love quote was copied')).not.toBeInTheDocument()
  })

  it('does not fall back to clipboard or award when native sharing fails', async () => {
    const runtime = await createRuntime()
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { share: vi.fn().mockRejectedValue(new Error('native share failed')), clipboard: { writeText } })
    renderCard(runtime, 'en')

    fireEvent.click(screen.getByRole('button', { name: 'Share' }))
    expect(await screen.findByText('Unable to share today’s love quote. Please try again.')).toBeInTheDocument()
    expect(writeText).not.toHaveBeenCalled()
    expect(await runtime.scores.hasAward('quote_shared', { localDate: '2026-08-31' })).toBe(false)
  })

  it('awards quote_shared only once per persisted local date, including after reopen', async () => {
    const backing = createMemoryStorageBacking()
    const runtime = await createRuntime(backing)
    const share = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { share })
    const view = renderCard(runtime, 'en')

    fireEvent.click(screen.getByRole('button', { name: 'Share' }))
    await screen.findByText('Today’s love quote was shared')
    fireEvent.click(screen.getByRole('button', { name: 'Share' }))
    await waitFor(() => expect(share).toHaveBeenCalledTimes(2))
    expect((await runtime.scores.getAwards()).filter((award) => award.awardType === 'quote_shared')).toHaveLength(1)
    view.unmount()
    runtime.adapter.close()

    const reopened = await createRuntime(backing)
    vi.stubGlobal('navigator', { share: vi.fn().mockResolvedValue(undefined) })
    renderCard(reopened, 'en')
    fireEvent.click(screen.getByRole('button', { name: 'Share' }))
    await screen.findByText('Today’s love quote was shared')
    expect((await reopened.scores.getAwards()).filter((award) => award.awardType === 'quote_shared')).toHaveLength(1)
  })

  it('guards rapid duplicate clicks while sharing and releases the button after completion', async () => {
    const runtime = await createRuntime()
    let resolveShare: (() => void) | undefined
    const share = vi.fn(() => new Promise<void>((resolve) => { resolveShare = resolve }))
    vi.stubGlobal('navigator', { share })
    renderCard(runtime, 'en')

    const button = screen.getByRole('button', { name: 'Share' })
    fireEvent.click(button)
    await waitFor(() => expect(button).toBeDisabled())
    fireEvent.click(button)
    expect(share).toHaveBeenCalledTimes(1)
    resolveShare?.()
    await waitFor(() => expect(button).not.toBeDisabled())
  })

  it('shows a localized error and no award when clipboard fallback fails', async () => {
    const runtime = await createRuntime()
    vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('clipboard failed')) } })
    renderCard(runtime, 'en')

    fireEvent.click(screen.getByRole('button', { name: 'Share' }))
    expect(await screen.findByText('Unable to share today’s love quote. Please try again.')).toBeInTheDocument()
    expect(await runtime.scores.hasAward('quote_shared', { localDate: '2026-08-31' })).toBe(false)
  })
})
