import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { PersistenceProvider } from '../../data/PersistenceContext'
import { initializePersistence, type PersistenceRuntime } from '../../data/persistence'
import { MemoryStorageAdapter } from '../../data/storage/MemoryStorageAdapter'
import { I18nProvider } from '../../i18n/I18nProvider'
import { messages, supportedLocales, type Locale } from '../../i18n/messages'
import { ClearContent } from './ClearContent'

afterEach(cleanup)

async function createRuntime(locale: Locale = 'zh-TW') {
  const adapter = new MemoryStorageAdapter()
  const runtime = await initializePersistence({ adapter, defaultLocale: locale, localDate: '2026-09-09' })
  const stamp = (value: string) => `${value}T12:00:00.000Z`
  await adapter.put('clearRecords', { id: 'organize-september', localDate: '2026-09-09', triggerText: '九月整理', facts: '', emotions: ['anxious'], emotionIntensity: 3, timezone: 'Asia/Taipei', createdAt: stamp('2026-09-09'), updatedAt: stamp('2026-09-09'), completedAt: stamp('2026-09-09') })
  await adapter.put('loveBoatAssessments', { id: 'boat-september', status: 'completed', currentSection: 'result', currentQuestionIndex: 21, aAnswers: {}, bAnswers: {}, localDate: '2026-09-08', timezone: 'Asia/Taipei', createdAt: stamp('2026-09-08'), updatedAt: stamp('2026-09-08'), completedAt: stamp('2026-09-08') })
  await adapter.put('loveBrainAssessments', { id: 'brain-august', status: 'completed', currentQuestionIndex: 24, answers: {}, isLowOverall: true, localDate: '2026-08-31', timezone: 'Asia/Taipei', createdAt: stamp('2026-08-31'), updatedAt: stamp('2026-08-31'), completedAt: stamp('2026-08-31') })
  await adapter.put('likeOrHabitReflections', { id: 'like-december', status: 'completed', currentSection: 'result', answers: {}, resultVariantKey: 'unclear.v1', localDate: '2025-12-31', timezone: 'Asia/Taipei', createdAt: stamp('2025-12-31'), updatedAt: stamp('2025-12-31'), completedAt: stamp('2025-12-31') })
  await adapter.put('loveBoatAssessments', { id: 'boat-draft', status: 'draft', currentSection: 'A', currentQuestionIndex: 0, aAnswers: {}, bAnswers: {}, localDate: '2026-09-09', timezone: 'Asia/Taipei', createdAt: stamp('2026-09-09'), updatedAt: stamp('2026-09-09') })
  return runtime
}

function renderHistory(runtime: PersistenceRuntime, locale: Locale = 'zh-TW') {
  return render(<PersistenceProvider runtime={runtime}><I18nProvider initialLocale={locale}><ClearContent /></I18nProvider></PersistenceProvider>)
}

function historySection() {
  return screen.getByRole('heading', { name: '最近清醒紀錄' }).closest('section') as HTMLElement
}

describe('Clear year and month grouped history', () => {
  it('shows only the latest three completed records by default, excluding drafts', async () => {
    renderHistory(await createRuntime())
    await waitFor(() => expect(within(historySection()).getByText('開始整理心情')).toBeInTheDocument())
    expect(within(historySection()).getByText('暈船法典')).toBeInTheDocument()
    expect(within(historySection()).getByText('戀愛腦檢測')).toBeInTheDocument()
    expect(within(historySection()).queryByText('喜歡？習慣？')).not.toBeInTheDocument()
    expect(screen.queryByText('boat-draft')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '查看全部清醒紀錄' })).toBeInTheDocument()
  })

  it('groups all completed records by descending year and month with independent toggles', async () => {
    renderHistory(await createRuntime())
    await waitFor(() => expect(screen.getByRole('button', { name: '查看全部清醒紀錄' })).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: '查看全部清醒紀錄' }))

    expect(screen.getByRole('button', { name: '收合 2026' })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('button', { name: '收合 2026年9月' })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('button', { name: '展開 2026年8月' })).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByRole('button', { name: '展開 2025' })).toHaveAttribute('aria-expanded', 'false')
    expect(within(historySection()).getByText('開始整理心情')).toBeInTheDocument()
    expect(within(historySection()).queryByText('戀愛腦檢測')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '展開 2026年8月' }))
    expect(within(historySection()).getByText('戀愛腦檢測')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '收合 2026年9月' })).toHaveAttribute('aria-expanded', 'true')
    fireEvent.click(screen.getByRole('button', { name: /^收合 2026$/ }))
    expect(document.querySelector('#clear-history-month-2026-08')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /^展開 2026$/ }))
    expect(screen.getByRole('button', { name: '收合 2026年8月' })).toHaveAttribute('aria-expanded', 'true')

    fireEvent.click(screen.getByRole('button', { name: '展開 2025' }))
    expect(screen.getByRole('button', { name: '展開 2025年12月' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '展開 2025年12月' }))
    const likeCard = within(historySection()).getByText('喜歡？習慣？').closest('button') as HTMLButtonElement
    fireEvent.click(likeCard)
    expect(screen.getByRole('heading', { name: '喜歡？習慣？' })).toBeInTheDocument()
  })

  it('returns to the compact recent-three mode without adding bulk controls', async () => {
    renderHistory(await createRuntime())
    await waitFor(() => expect(screen.getByRole('button', { name: '查看全部清醒紀錄' })).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: '查看全部清醒紀錄' }))
    fireEvent.click(screen.getByRole('button', { name: '顯示最近三筆' }))
    expect(screen.queryByRole('button', { name: '收合 2026' })).not.toBeInTheDocument()
    expect(within(historySection()).queryByText('喜歡？習慣？')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /清除全部|刪除全部/ })).not.toBeInTheDocument()
  })

  it.each(supportedLocales)('formats the full-history month header for %s', async (locale) => {
    const runtime = await createRuntime(locale)
    renderHistory(runtime, locale)
    const viewAll = messages[locale]['clear.history.viewAll']
    await waitFor(() => expect(screen.getByRole('button', { name: viewAll })).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: viewAll }))
    const expectedMonth = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(2026, 8, 1)))
    expect(screen.getByText(expectedMonth)).toBeInTheDocument()
    expect(screen.getByText(messages[locale]['clear.history.group.count'].replace('{count}', '2'))).toBeInTheDocument()
    expect(screen.queryByText('boat-draft')).not.toBeInTheDocument()
    expect(within(screen.getByText(expectedMonth).closest('button') as HTMLButtonElement).getByText(expectedMonth)).toBeInTheDocument()
  })
})
