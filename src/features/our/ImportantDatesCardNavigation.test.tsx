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
  it('keeps the legacy per-record preference compatible without rendering its unused checkbox', async () => {
    const runtime = await initializePersistence({ adapter: new MemoryStorageAdapter(), defaultLocale: 'en', localDate: '2026-09-08' })
    const legacy = await runtime.importantDates.createImportantDate({ type: 'custom', title: 'Legacy', date: '2026-09-09', reminderEnabled: true })
    runtime.initial.importantDates = await runtime.importantDates.getImportantDates()
    render(<PersistenceProvider runtime={runtime}><I18nProvider initialLocale="en"><MemoryRouter><ImportantDatesCard /></MemoryRouter></I18nProvider></PersistenceProvider>)

    fireEvent.click(screen.getByRole('button', { name: 'Add' }))
    expect(screen.queryByText(/reminder preference/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Updated legacy' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(async () => expect(await runtime.importantDates.getImportantDate(legacy.id)).toMatchObject({ title: 'Updated legacy', reminderEnabled: true }))
  })

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
