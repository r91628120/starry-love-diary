import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PersistenceProvider } from '../../data/PersistenceContext'
import { initializePersistence } from '../../data/persistence'
import { createMemoryStorageBacking, MemoryStorageAdapter } from '../../data/storage/MemoryStorageAdapter'
import { I18nProvider } from '../../i18n/I18nProvider'
import { ImportantDatesCard } from './ImportantDatesCard'

const originalScrollIntoView = HTMLElement.prototype.scrollIntoView

afterEach(() => {
  cleanup()
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, value: originalScrollIntoView })
})

describe('ImportantDatesCard incoming Today navigation', () => {
  it('adds scoped spacing only when the conditional View all action is rendered', async () => {
    const runtime = await initializePersistence({ adapter: new MemoryStorageAdapter(), defaultLocale: 'en', localDate: '2026-09-08' })
    await runtime.importantDates.createImportantDate({ type: 'custom', title: 'First', date: '2026-09-09' })
    await runtime.importantDates.createImportantDate({ type: 'custom', title: 'Second', date: '2026-09-10' })
    await runtime.importantDates.createImportantDate({ type: 'custom', title: 'Third', date: '2026-09-11' })
    runtime.initial.importantDates = await runtime.importantDates.getImportantDates()

    const view = render(<PersistenceProvider runtime={runtime}><I18nProvider initialLocale="en"><MemoryRouter><ImportantDatesCard /></MemoryRouter></I18nProvider></PersistenceProvider>)
    const viewAll = screen.getByRole('button', { name: 'View all' })
    expect(viewAll).toHaveClass('important-dates__view-all')
    expect(view.container.querySelectorAll('.important-date')).toHaveLength(2)
    expect(readFileSync('src/features/our/our.css', 'utf8')).toMatch(/\.important-dates__view-all\{margin-top:var\(--space-3\)\}/u)

    fireEvent.click(viewAll)
    expect(view.container.querySelectorAll('.important-date')).toHaveLength(3)
  })

  it('expands, focuses, and highlights the requested persisted important date', async () => {
    const backing = createMemoryStorageBacking()
    const seed = await initializePersistence({ adapter: new MemoryStorageAdapter(backing), defaultLocale: 'en', localDate: '2026-09-08' })
    await seed.importantDates.createImportantDate({ type: 'custom', title: 'First', date: '2026-09-09' })
    await seed.importantDates.createImportantDate({ type: 'custom', title: 'Second', date: '2026-09-10' })
    const target = await seed.importantDates.createImportantDate({ type: 'custom', title: 'Target', date: '2026-09-11' })
    seed.adapter.close()
    const runtime = await initializePersistence({ adapter: new MemoryStorageAdapter(backing), defaultLocale: 'en', localDate: '2026-09-08' })
    const scrollIntoView = vi.fn()
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, value: scrollIntoView })

    render(<PersistenceProvider runtime={runtime}><I18nProvider initialLocale="en"><MemoryRouter initialEntries={[`/our?section=important-dates&recordId=${target.id}`]}><ImportantDatesCard /></MemoryRouter></I18nProvider></PersistenceProvider>)

    const article = await screen.findByText('Target').then((title) => title.closest('article'))
    expect(article).toHaveClass('important-date--focused')
    await waitFor(() => expect(document.activeElement).toBe(article))
    expect(scrollIntoView).toHaveBeenCalled()
  })
})
