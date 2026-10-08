import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { PersistenceProvider } from './PersistenceContext'
import { usePersistence } from './PersistenceStateContext'
import { initializePersistence } from './persistence'
import { createMemoryStorageBacking, MemoryStorageAdapter } from './storage/MemoryStorageAdapter'
import { I18nProvider } from '../i18n/I18nProvider'
import { DailyLoveQuoteCard } from '../features/today/DailyLoveQuoteCard'
import { MoodSelector } from '../features/today/MoodSelector'
import { UpcomingImportantDateCard } from '../features/today/UpcomingImportantDateCard'
import { getDailyLoveQuote } from '../features/today/dailyLoveQuoteRuntime'

const localDate = vi.hoisted(() => ({ value: '2026-09-29' }))

vi.mock('../services/localDateService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/localDateService')>()
  return { ...actual, toLocalDate: () => localDate.value }
})

function DateProbe() {
  const persistence = usePersistence()
  if (!persistence) return null
  return <>
    <output data-testid="current-local-date">{persistence.currentLocalDate}</output>
    <output data-testid="today-mood">{persistence.todayMood?.mood ?? 'none'}</output>
    <button type="button" onClick={() => void persistence.shareDailyQuote()}>share-quote</button>
  </>
}

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  localDate.value = '2026-09-29'
})

describe('PersistenceProvider local-date rollover', () => {
  async function createRuntime() {
    const backing = createMemoryStorageBacking()
    const first = await initializePersistence({ adapter: new MemoryStorageAdapter(backing), defaultLocale: 'zh-TW', localDate: '2026-09-24' })
    first.adapter.close()
    const runtime = await initializePersistence({ adapter: new MemoryStorageAdapter(backing), defaultLocale: 'zh-TW', localDate: '2026-09-29' })
    await runtime.moods.setMood('happy', '2026-09-29')
    await runtime.importantDates.createImportantDate({ type: 'custom', title: 'Today', date: '2026-09-30' })
    runtime.initial.todayMood = await runtime.moods.getMoodByLocalDate('2026-09-29')
    runtime.initial.importantDates = await runtime.importantDates.getImportantDates()
    runtime.initial.starHeartTotal = await runtime.scores.getTotal()
    return runtime
  }

  function renderToday(runtime: Awaited<ReturnType<typeof createRuntime>>) {
    return render(
      <PersistenceProvider runtime={runtime}>
        <I18nProvider initialLocale="zh-TW">
          <MemoryRouter initialEntries={['/today']}>
            <DateProbe />
            <DailyLoveQuoteCard />
            <MoodSelector />
            <UpcomingImportantDateCard />
          </MemoryRouter>
        </I18nProvider>
      </PersistenceProvider>,
    )
  }

  it('refreshes quote, Day N, mood, daily-open, sharing, and important dates when foregrounded after midnight', async () => {
    const runtime = await createRuntime()
    renderToday(runtime)

    expect(screen.getByTestId('current-local-date')).toHaveTextContent('2026-09-29')
    expect(screen.getByTestId('today-mood')).toHaveTextContent('happy')
    expect(screen.getByText('第 6 天')).toBeInTheDocument()
    expect(screen.getByText(getDailyLoveQuote('zh-TW', 6))).toBeInTheDocument()

    localDate.value = '2026-09-30'
    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'))
    })

    await waitFor(() => expect(screen.getByTestId('current-local-date')).toHaveTextContent('2026-09-30'))
    expect(screen.getByTestId('today-mood')).toHaveTextContent('none')
    expect(screen.getByText('第 7 天')).toBeInTheDocument()
    expect(screen.getByText(getDailyLoveQuote('zh-TW', 7))).toBeInTheDocument()
    expect(screen.getByText('Today')).toBeInTheDocument()
    expect(await runtime.moods.getMoodByLocalDate('2026-09-29')).toMatchObject({ mood: 'happy' })
    expect(await runtime.moods.getMoodByLocalDate('2026-09-30')).toBeUndefined()
    expect(await runtime.scores.hasAward('daily_open', { localDate: '2026-09-30' })).toBe(true)

    fireEvent.click(screen.getByRole('button', { name: 'share-quote' }))
    await waitFor(() => expect(runtime.scores.hasAward('quote_shared', { localDate: '2026-09-30' })).resolves.toBe(true))
  })

  it('uses one logical rollover for repeated lifecycle events and no-ops on same-day focus', async () => {
    const runtime = await createRuntime()
    renderToday(runtime)

    localDate.value = '2026-09-30'
    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'))
      window.dispatchEvent(new Event('focus'))
      window.dispatchEvent(new Event('pageshow'))
    })
    await waitFor(() => expect(screen.getByTestId('current-local-date')).toHaveTextContent('2026-09-30'))
    expect((await runtime.scores.getAwards()).filter((award) => award.awardType === 'daily_open' && award.localDate === '2026-09-30')).toHaveLength(1)

    await act(async () => { window.dispatchEvent(new Event('focus')) })
    expect((await runtime.scores.getAwards()).filter((award) => award.awardType === 'daily_open' && award.localDate === '2026-09-30')).toHaveLength(1)
  })

  it('contains a foreground refresh rejection and allows the next lifecycle event to retry', async () => {
    const runtime = await createRuntime()
    renderToday(runtime)
    const failure = new DOMException('The database connection is closed', 'InvalidStateError')
    const moodLookup = vi.spyOn(runtime.moods, 'getMoodByLocalDate').mockRejectedValueOnce(failure)
    const unhandled = vi.fn()
    window.addEventListener('unhandledrejection', unhandled)

    localDate.value = '2026-09-30'
    await act(async () => { document.dispatchEvent(new Event('visibilitychange')) })
    await waitFor(() => expect(moodLookup).toHaveBeenCalledWith('2026-09-30'))
    await act(async () => { await Promise.resolve() })

    expect(screen.getByTestId('current-local-date')).toHaveTextContent('2026-09-29')
    expect(unhandled).not.toHaveBeenCalled()

    await act(async () => { window.dispatchEvent(new Event('focus')) })
    await waitFor(() => expect(screen.getByTestId('current-local-date')).toHaveTextContent('2026-09-30'))
    window.removeEventListener('unhandledrejection', unhandled)
  })

  it('refreshes at local midnight without navigation', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 8, 29, 23, 59, 59, 900))
    const runtime = await createRuntime()
    renderToday(runtime)

    localDate.value = '2026-09-30'
    await act(async () => { await vi.advanceTimersByTimeAsync(200) })

    expect(screen.getByTestId('current-local-date')).toHaveTextContent('2026-09-30')
    expect(screen.getByText('第 7 天')).toBeInTheDocument()
  })
})
