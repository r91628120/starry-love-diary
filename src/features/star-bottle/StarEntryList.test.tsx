import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { PersistenceProvider } from '../../data/PersistenceContext'
import { initializePersistence } from '../../data/persistence'
import { createMemoryStorageBacking, MemoryStorageAdapter } from '../../data/storage/MemoryStorageAdapter'
import { I18nProvider } from '../../i18n/I18nProvider'
import { StarBottlePage } from '../../pages/StarBottlePage'

async function renderPage() {
  const backing = createMemoryStorageBacking()
  const seeded = await initializePersistence({
    adapter: new MemoryStorageAdapter(backing),
    defaultLocale: 'zh-TW',
    localDate: '2026-09-09',
  })
  await seeded.stars.createStar({ type: 'mood', mood: 'happy', content: 'happy', localDate: '2025-12-30' })
  await seeded.stars.createStar({ type: 'clear_mind', sourceType: 'clear_record', title: '整理感受', content: 'clear note', localDate: '2026-01-01' })
  await seeded.stars.createStar({ type: 'mood', mood: 'miss', content: 'missing', localDate: '2026-09-01' })
  await seeded.stars.createStar({ type: 'clear_mind', sourceType: 'love_brain_assessment', title: '戀愛腦檢測', content: 'assessment note', localDate: '2026-09-08' })
  await seeded.stars.createStar({ type: 'mood', mood: 'peaceful', content: 'peaceful', localDate: '2026-09-09' })
  seeded.adapter.close()
  const runtime = await initializePersistence({
    adapter: new MemoryStorageAdapter(backing),
    defaultLocale: 'zh-TW',
    localDate: '2026-09-09',
  })
  render(
    <PersistenceProvider runtime={runtime}>
      <I18nProvider initialLocale="zh-TW"><MemoryRouter><StarBottlePage /></MemoryRouter></I18nProvider>
    </PersistenceProvider>,
  )
  return runtime
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-09-09T12:00:00'))
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('Star Bottle full list', () => {
  it('groups all real stars by descending year and month, with only the latest month expanded by default', async () => {
    const runtime = await renderPage()
    expect(document.querySelectorAll('.star-entry')).toHaveLength(1)
    fireEvent.click(screen.getByRole('button', { name: '查看全部星星' }))

    expect(screen.getByRole('heading', { name: '全部星星' })).toBeInTheDocument()
    expect(screen.queryByText(/完整星星清單將在下一階段開放/)).not.toBeInTheDocument()
    const entries = document.querySelectorAll('.star-entry')
    expect(entries).toHaveLength(3)
    expect(entries[0]).toHaveTextContent('安心')
    expect(entries[1]).toHaveTextContent('戀愛腦檢測')
    expect(screen.getByText('2026')).toBeInTheDocument()
    expect(screen.getByText('2025')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '收合 2026年9月' })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('button', { name: '展開 2026年1月' })).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByRole('button', { name: '展開 2025' })).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByLabelText('總星數：5')).toBeInTheDocument()
    expect((await runtime.stars.getStars())).toHaveLength(5)
  })

  it('allows independently expanding older months and years without modifying stored stars', async () => {
    const runtime = await renderPage()
    const starsBefore = await runtime.stars.getStars()
    fireEvent.click(screen.getByRole('button', { name: '查看全部星星' }))
    fireEvent.click(screen.getByRole('button', { name: '展開 2026年1月' }))
    expect(screen.getByText('整理感受')).toBeInTheDocument()
    expect(document.querySelectorAll('.star-entry--compact')).toHaveLength(4)
    fireEvent.click(screen.getByRole('button', { name: '展開 2025' }))
    fireEvent.click(screen.getByRole('button', { name: '展開 2025年12月' }))
    expect(screen.getByText('開心')).toBeInTheDocument()
    expect(document.querySelectorAll('.star-entry--compact')).toHaveLength(5)
    fireEvent.click(screen.getByRole('button', { name: '收合 2026年1月' }))
    expect(screen.queryByText('整理感受')).not.toBeInTheDocument()
    expect(screen.getByText('開心')).toBeInTheDocument()
    expect(await runtime.stars.getStars()).toEqual(starsBefore)
  })

  it('keeps range statistics real and auto-expands matching search groups', async () => {
    await renderPage()
    fireEvent.click(screen.getByRole('button', { name: '查看全部星星' }))
    fireEvent.click(screen.getByRole('button', { name: '本月' }))
    expect(document.querySelectorAll('.star-entry')).toHaveLength(3)
    expect(screen.getByLabelText('總星數：3')).toBeInTheDocument()

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: '想念' } })
    expect(document.querySelectorAll('.star-entry')).toHaveLength(1)
    expect(screen.getByText('想念')).toBeInTheDocument()
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: '戀愛腦' } })
    expect(document.querySelectorAll('.star-entry')).toHaveLength(1)
    expect(screen.getByText('戀愛腦檢測')).toBeInTheDocument()
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: '不存在' } })
    expect(screen.getByText('目前沒有符合搜尋的星星')).toBeInTheDocument()
  })

  it('uses compact rows for each time filter and never exposes destructive controls', async () => {
    await renderPage()
    fireEvent.click(screen.getByRole('button', { name: '查看全部星星' }))

    for (const [label, count] of [['今日', 1], ['本月', 3], ['本年', 4], ['全部', 5]] as const) {
      fireEvent.click(screen.getByRole('button', { name: label }))
      expect(screen.getByLabelText(`總星數：${count}`)).toBeInTheDocument()
    }
    expect(document.querySelectorAll('.star-entry--compact')).toHaveLength(3)
    expect(screen.queryByRole('button', { name: /刪除|清除/ })).not.toBeInTheDocument()
  })

  it('keeps the list read-only and returns to the three-record recent view', async () => {
    const runtime = await renderPage()
    const awardsBefore = await runtime.scores.getAwards()
    fireEvent.click(screen.getByRole('button', { name: '查看全部星星' }))
    fireEvent.click(screen.getByRole('button', { name: '返回最近紀錄' }))

    expect(screen.getByRole('heading', { name: '最近紀錄' })).toBeInTheDocument()
    expect(document.querySelectorAll('.star-entry')).toHaveLength(3)
    expect(await runtime.scores.getAwards()).toEqual(awardsBefore)
  })
})
