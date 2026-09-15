import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom'
import { PersistenceProvider } from '../../data/PersistenceContext'
import { initializePersistence } from '../../data/persistence'
import { createMemoryStorageBacking, MemoryStorageAdapter, type MemoryStorageBacking } from '../../data/storage/MemoryStorageAdapter'
import { I18nProvider } from '../../i18n/I18nProvider'
import { StarBottlePage } from '../../pages/StarBottlePage'
import { MoodSelector } from './MoodSelector'

const localDate = '2026-09-14'

async function runtime(backing?: MemoryStorageBacking) {
  return initializePersistence({ adapter: new MemoryStorageAdapter(backing), defaultLocale: 'zh-TW', localDate })
}

function TodayWithNavigation() {
  const navigate = useNavigate()
  return <><MoodSelector /><button type="button" onClick={() => navigate('/star-bottle')}>open bottle</button></>
}

function renderFlow(appRuntime: Awaited<ReturnType<typeof runtime>>) {
  return render(
    <PersistenceProvider runtime={appRuntime}>
      <I18nProvider initialLocale="zh-TW">
        <MemoryRouter initialEntries={['/today']}>
          <Routes>
            <Route path="/today" element={<TodayWithNavigation />} />
            <Route path="/star-bottle" element={<StarBottlePage />} />
          </Routes>
        </MemoryRouter>
      </I18nProvider>
    </PersistenceProvider>,
  )
}

function stats() { return screen.getByRole('region', { name: '星星統計' }) }
function expectCounts(total: string, mood: string, clear: string) {
  expect(within(stats()).getByLabelText(`總星數：${total}`)).toBeInTheDocument()
  expect(within(stats()).getByLabelText(`心情星星：${mood}`)).toBeInTheDocument()
  expect(within(stats()).getByLabelText(`清醒星星：${clear}`)).toBeInTheDocument()
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-09-14T12:00:00+08:00'))
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('Today Mood to Star Bottle immediate sync', () => {
  it('refreshes context stars immediately, keeps one same-day star/award, and updates its mood', async () => {
    const appRuntime = await runtime()
    renderFlow(appRuntime)
    for (const label of ['安心', '想念', '不安']) {
      fireEvent.click(screen.getByRole('button', { name: label }))
      await waitFor(() => expect(screen.getByRole('button', { name: label })).toHaveAttribute('aria-pressed', 'true'))
    }
    fireEvent.click(screen.getByRole('button', { name: 'open bottle' }))
    await waitFor(() => expectCounts('1', '1', '0'))

    const stars = await appRuntime.stars.getStarsByType('mood')
    expect(stars).toHaveLength(1)
    expect(stars[0]).toMatchObject({ id: `mood-star:${localDate}`, sourceId: localDate, mood: 'uneasy', content: 'uneasy' })
    expect((await appRuntime.moods.getMoods())).toHaveLength(1)
    expect((await appRuntime.scores.getAwards()).filter((award) => award.awardType === 'mood_selected')).toHaveLength(1)

    for (const range of ['本月', '本年', '全部']) {
      fireEvent.click(screen.getByRole('button', { name: range }))
      expectCounts('1', '1', '0')
    }
  })

  it('shows the same persisted mood star after reopen', async () => {
    const backing = createMemoryStorageBacking()
    const first = await runtime(backing)
    renderFlow(first)
    fireEvent.click(screen.getByRole('button', { name: '安心' }))
    await waitFor(() => expect(first.stars.getStarsByType('mood')).resolves.toHaveLength(1))
    fireEvent.click(screen.getByRole('button', { name: 'open bottle' }))
    await waitFor(() => expectCounts('1', '1', '0'))
    cleanup()
    first.adapter.close()

    const reopened = await runtime(backing)
    renderFlow(reopened)
    fireEvent.click(screen.getByRole('button', { name: 'open bottle' }))
    expectCounts('1', '1', '0')
  })
})
