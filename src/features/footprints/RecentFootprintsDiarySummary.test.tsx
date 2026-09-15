import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { PersistenceProvider } from '../../data/PersistenceContext'
import { initializePersistence, type PersistenceRuntime } from '../../data/persistence'
import { MemoryStorageAdapter } from '../../data/storage/MemoryStorageAdapter'
import { I18nProvider } from '../../i18n/I18nProvider'
import { RecentFootprints } from './RecentFootprints'
import { getRecentDiarySummary } from './footprintsData'

afterEach(cleanup)

function renderRecentFootprints(runtime: PersistenceRuntime) {
  return render(
    <PersistenceProvider runtime={runtime}>
      <I18nProvider initialLocale="en">
        <MemoryRouter initialEntries={['/footprints']}><RecentFootprints search="" /></MemoryRouter>
      </I18nProvider>
    </PersistenceProvider>,
  )
}

describe('Recent Footprints diary summaries', () => {
  it('groups full history by descending year and month while keeping diary expansion independent', async () => {
    const runtime = await initializePersistence({ adapter: new MemoryStorageAdapter(), defaultLocale: 'zh-TW', localDate: '2026-09-09' })
    const longDiary = '九月的日記內容需要超過二十個字才能驗證收合功能仍然獨立運作'
    await runtime.diaries.createDiary({ localDate: '2026-09-09', content: longDiary })
    await runtime.moods.setMood('happy', '2026-09-08')
    await runtime.clearRecords.complete({ localDate: '2026-08-31', triggerType: 'waiting_response', facts: '八月清醒紀錄', emotions: ['anxious'], emotionIntensity: 3, nextActionType: 'take_a_walk' })
    await runtime.diaries.createDiary({ localDate: '2025-12-31', content: '去年日記' })

    render(
      <PersistenceProvider runtime={runtime}>
        <I18nProvider initialLocale="zh-TW"><MemoryRouter initialEntries={['/footprints']}><RecentFootprints search="" /></MemoryRouter></I18nProvider>
      </PersistenceProvider>,
    )
    await waitFor(() => expect(screen.getByText(getRecentDiarySummary(longDiary).collapsed)).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: '查看全部足跡' }))

    expect(screen.getByRole('button', { name: '收合 2026' })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('button', { name: '收合 2026年9月' })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('button', { name: '展開 2026年8月' })).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByRole('button', { name: '展開 2025' })).toHaveAttribute('aria-expanded', 'false')

    const longRow = screen.getByText(getRecentDiarySummary(longDiary).collapsed).closest('article') as HTMLElement
    fireEvent.click(within(longRow).getByRole('button', { name: '展開' }))
    expect(within(longRow).getByText(longDiary)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '收合 2026年9月' })).toHaveAttribute('aria-expanded', 'true')

    fireEvent.click(screen.getByRole('button', { name: '展開 2026年8月' }))
    expect(screen.getByText('八月清醒紀錄')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '展開 2025' }))
    fireEvent.click(screen.getByRole('button', { name: '展開 2025年12月' }))
    expect(screen.getByText('去年日記')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '收合 2026年8月' }))
    expect(screen.queryByText('八月清醒紀錄')).not.toBeInTheDocument()
    expect(within(longRow).getByText(longDiary)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /刪除|清空/ })).not.toBeInTheDocument()
  })

  it('keeps short diary content whole, collapses long diaries independently, and leaves mood and Clear rows unchanged', async () => {
    const runtime = await initializePersistence({ adapter: new MemoryStorageAdapter(), defaultLocale: 'en', localDate: '2026-09-08' })
    const short = 's'.repeat(20)
    const longA = 'a'.repeat(21)
    const longB = 'b'.repeat(32)
    await runtime.diaries.createDiary({ localDate: '2026-09-08', content: longA })
    await runtime.diaries.createDiary({ localDate: '2026-09-07', content: longB })
    await runtime.diaries.createDiary({ localDate: '2026-09-06', content: short })
    await runtime.moods.setMood('happy', '2026-09-05')
    await runtime.clearRecords.complete({ localDate: '2026-09-04', triggerType: 'waiting_response', facts: 'A saved clarity record', emotions: ['anxious'], emotionIntensity: 3, nextActionType: 'take_a_walk' })

    const view = renderRecentFootprints(runtime)
    await waitFor(() => expect(screen.getByText(getRecentDiarySummary(longA).collapsed)).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'View all footprints' }))

    expect(screen.getByText(short)).toBeInTheDocument()
    expect(within(screen.getByText(short).closest('article') as HTMLElement).queryByRole('button', { name: 'Expand' })).toBeNull()

    const rowA = screen.getByText(getRecentDiarySummary(longA).collapsed).closest('article') as HTMLElement
    const rowB = screen.getByText(getRecentDiarySummary(longB).collapsed).closest('article') as HTMLElement
    const expandA = within(rowA).getByRole('button', { name: 'Expand' })
    expect(expandA).toHaveAttribute('aria-expanded', 'false')
    expect(expandA).toHaveAttribute('aria-controls')
    fireEvent.click(expandA)
    expect(within(rowA).getByText(longA)).toBeInTheDocument()
    expect(within(rowA).getByRole('button', { name: 'Collapse' })).toHaveAttribute('aria-expanded', 'true')
    expect(within(rowB).getByText(getRecentDiarySummary(longB).collapsed)).toBeInTheDocument()

    fireEvent.click(within(rowA).getByRole('button', { name: 'Collapse' }))
    expect(within(rowA).getByText(getRecentDiarySummary(longA).collapsed)).toBeInTheDocument()
    expect(screen.getByText('Happy')).toBeInTheDocument()
    expect(screen.getByText('A saved clarity record')).toBeInTheDocument()

    view.unmount()
    renderRecentFootprints(runtime)
    await waitFor(() => expect(screen.getByText(getRecentDiarySummary(longA).collapsed)).toBeInTheDocument())
    const reloadedRow = screen.getByText(getRecentDiarySummary(longA).collapsed).closest('article') as HTMLElement
    expect(within(reloadedRow).getByRole('button', { name: 'Expand' })).toHaveAttribute('aria-expanded', 'false')
  })

  it('normalizes newlines only for the collapsed summary without changing the stored diary content', async () => {
    const runtime = await initializePersistence({ adapter: new MemoryStorageAdapter(), defaultLocale: 'en', localDate: '2026-09-08' })
    const content = 'first line\nsecond line has more'
    const entry = await runtime.diaries.createDiary({ localDate: '2026-09-08', content })
    const summary = getRecentDiarySummary(content)

    renderRecentFootprints(runtime)
    await waitFor(() => expect(screen.getByText(summary.collapsed)).toBeInTheDocument())
    expect(summary.collapsed).not.toContain('\n')
    expect((await runtime.diaries.getDiary(entry.id))?.content).toBe(content)
    const row = screen.getByText(summary.collapsed).closest('article') as HTMLElement
    fireEvent.click(within(row).getByRole('button', { name: 'Expand' }))
    expect(row.querySelector('.recent-footprint__summary')?.textContent).toBe(content)
  })
})
