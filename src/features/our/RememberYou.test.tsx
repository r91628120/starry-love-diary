import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { PersistenceProvider } from '../../data/PersistenceContext'
import { initializePersistence, type PersistenceRuntime } from '../../data/persistence'
import { MemoryStorageAdapter } from '../../data/storage/MemoryStorageAdapter'
import { I18nProvider } from '../../i18n/I18nProvider'
import { RememberYou } from './RememberYou'
import { groupRememberedYouCards } from './rememberYouGrouping'

async function createRuntime() {
  return initializePersistence({ adapter: new MemoryStorageAdapter(), defaultLocale: 'zh-TW', localDate: '2026-09-17' })
}

async function seed(runtime: PersistenceRuntime) {
  await runtime.rememberedYou.createRememberedYouCard({ title: '九月最新', content: '最新內容', localDate: '2026-09-17', isFavorite: true })
  await runtime.rememberedYou.createRememberedYouCard({ title: '九月較早', content: '較早內容', localDate: '2026-09-03' })
  await runtime.rememberedYou.createRememberedYouCard({ title: '八月收藏', content: '八月內容', localDate: '2026-08-08', isFavorite: true })
  await runtime.rememberedYou.createRememberedYouCard({ title: '去年資料', content: '舊資料', localDate: '2025-12-25' })
  runtime.initial.rememberedYouCards = await runtime.rememberedYou.getRememberedYouCards()
}

function renderRemembered(runtime: PersistenceRuntime, locale = 'zh-TW') {
  return render(<PersistenceProvider runtime={runtime}><I18nProvider initialLocale={locale as 'zh-TW'}><RememberYou /></I18nProvider></PersistenceProvider>)
}

afterEach(cleanup)

describe('Remembered You year and month browsing', () => {
  it('groups localDate records newest-first by year and month while retaining card order', async () => {
    const runtime = await createRuntime(); await seed(runtime)
    const groups = groupRememberedYouCards(await runtime.rememberedYou.getRememberedYouCards())
    expect(groups.map((group) => group.year)).toEqual(['2026', '2025'])
    expect(groups[0].months.map((group) => group.key)).toEqual(['2026-09', '2026-08'])
    expect(groups[0].months[0].cards.map((card) => card.title)).toEqual(['九月最新', '九月較早'])
  })

  it('expands only the latest year and latest month by default, then allows independent toggles', async () => {
    const runtime = await createRuntime(); await seed(runtime)
    renderRemembered(runtime)
    expect(screen.getByRole('button', { name: '收合 2026年' })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('button', { name: '收合 9月' })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('button', { name: '展開 8月' })).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByRole('button', { name: '展開 2025年' })).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(screen.getByRole('button', { name: '展開 8月' }))
    expect(await screen.findByText('八月收藏')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '展開 2025年' }))
    fireEvent.click(screen.getByRole('button', { name: '展開 12月' }))
    expect(await screen.findByText('去年資料')).toBeInTheDocument()
  })

  it('filters before grouping and expands matching groups for search and favorites', async () => {
    const runtime = await createRuntime(); await seed(runtime)
    renderRemembered(runtime)
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: '去年' } })
    expect(await screen.findByText('去年資料')).toBeInTheDocument()
    expect(screen.queryByText('九月最新')).not.toBeInTheDocument()
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: '只看收藏' }))
    expect(await screen.findByText('九月最新')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '展開 8月' }))
    expect(await screen.findByText('八月收藏')).toBeInTheDocument()
    expect(screen.queryByText('九月較早')).not.toBeInTheDocument()
  })

  it('keeps favorite, edit, and delete controls operating within grouped cards', async () => {
    const runtime = await createRuntime(); await seed(runtime)
    renderRemembered(runtime)
    const latest = screen.getByText('九月最新').closest('article') as HTMLElement
    fireEvent.click(within(latest).getByRole('button', { name: '取消收藏' }))
    await waitFor(async () => expect((await runtime.rememberedYou.getRememberedYouCards()).find((card) => card.title === '九月最新')?.isFavorite).toBe(false))
    fireEvent.click(within(latest).getByRole('button', { name: '編輯' }))
    expect(screen.getByDisplayValue('九月最新')).toBeInTheDocument()
    fireEvent.click(within(latest).getByRole('button', { name: '刪除' }))
    fireEvent.click(screen.getByRole('button', { name: '確認' }))
    await waitFor(async () => expect((await runtime.rememberedYou.getRememberedYouCards()).some((card) => card.title === '九月最新')).toBe(false))
  })

  it('uses locale-formatted year and month headings without changing an empty state', async () => {
    const runtime = await createRuntime(); await seed(runtime)
    renderRemembered(runtime, 'en')
    expect(screen.getByRole('button', { name: /2026/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /September/ })).toBeInTheDocument()
    cleanup()
    renderRemembered(await createRuntime())
    expect(screen.getByText('還沒有記錄，寫下一件你想記得的小事。')).toBeInTheDocument()
  })
})
