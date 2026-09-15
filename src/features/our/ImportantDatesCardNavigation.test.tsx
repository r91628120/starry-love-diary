import { cleanup, render, screen, waitFor } from '@testing-library/react'
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
