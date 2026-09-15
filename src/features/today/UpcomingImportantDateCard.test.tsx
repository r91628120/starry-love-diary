import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { PersistenceProvider } from '../../data/PersistenceContext'
import { usePersistence } from '../../data/PersistenceStateContext'
import { initializePersistence } from '../../data/persistence'
import { createMemoryStorageBacking, MemoryStorageAdapter, type MemoryStorageBacking } from '../../data/storage/MemoryStorageAdapter'
import { I18nProvider } from '../../i18n/I18nProvider'
import { UpcomingImportantDateCard } from './UpcomingImportantDateCard'
import { getNextImportantDateOccurrence, getNextUpcomingImportantDate } from './upcomingImportantDates'

const localDate = '2026-09-08'

afterEach(() => cleanup())

function LocationProbe() {
  const location = useLocation()
  return <output data-testid="location">{location.pathname}{location.search}</output>
}

function DateControls({ id }: { id: string }) {
  const persistence = usePersistence()
  return <>
    <button type="button" onClick={() => void persistence?.updateImportantDate(id, { title: 'Updated date', date: '2026-09-11' })}>update</button>
    <button type="button" onClick={() => void persistence?.deleteImportantDate(id)}>delete</button>
  </>
}

async function createRuntime(backing?: MemoryStorageBacking) {
  return initializePersistence({ adapter: new MemoryStorageAdapter(backing), defaultLocale: 'en', localDate })
}

async function createSeededRuntime(create: (runtime: Awaited<ReturnType<typeof createRuntime>>) => Promise<void>) {
  const backing = createMemoryStorageBacking()
  const seed = await createRuntime(backing)
  await create(seed)
  seed.adapter.close()
  return createRuntime(backing)
}

function renderCard(runtime: Awaited<ReturnType<typeof createRuntime>>, controlsId?: string) {
  return render(<PersistenceProvider runtime={runtime}><I18nProvider initialLocale="en"><MemoryRouter initialEntries={['/today']}><UpcomingImportantDateCard />{controlsId ? <DateControls id={controlsId} /> : null}<LocationProbe /></MemoryRouter></I18nProvider></PersistenceProvider>)
}

describe('UpcomingImportantDateCard', () => {
  it('shows today’s persisted important date before later dates', async () => {
    const runtime = await createSeededRuntime(async (seed) => {
      await seed.importantDates.createImportantDate({ type: 'custom', title: 'Today', date: '2026-09-08' })
      await seed.importantDates.createImportantDate({ type: 'custom', title: 'Tomorrow', date: '2026-09-09' })
      await seed.importantDates.createImportantDate({ type: 'custom', title: 'Later', date: '2026-09-20' })
      await seed.importantDates.createImportantDate({ type: 'custom', title: 'Day thirty', date: '2026-10-08' })
      await seed.importantDates.createImportantDate({ type: 'custom', title: 'Outside range', date: '2026-10-09' })
      await seed.importantDates.createImportantDate({ type: 'custom', title: 'Past', date: '2026-09-07' })
    })
    const dates = await runtime.importantDates.getImportantDates()

    expect(getNextUpcomingImportantDate(dates, localDate)?.title).toBe('Today')
    renderCard(runtime)
    expect(screen.getByText('Today')).toBeInTheDocument()
    expect(screen.queryByText('Tomorrow')).not.toBeInTheDocument()
    expect(screen.queryByText('Later')).not.toBeInTheDocument()
    expect(screen.queryByText('Outside range')).not.toBeInTheDocument()
  })

  it('shows the nearest future record, excludes past records, and advances after that record is deleted', async () => {
    const backing = createMemoryStorageBacking()
    const seed = await createRuntime(backing)
    await seed.importantDates.createImportantDate({ type: 'custom', title: 'Past', date: '2026-09-07' })
    const first = await seed.importantDates.createImportantDate({ type: 'custom', title: 'First future', date: '2026-09-12' })
    await seed.importantDates.createImportantDate({ type: 'custom', title: 'Second future', date: '2026-09-21' })
    seed.adapter.close()
    const runtime = await createRuntime(backing)
    renderCard(runtime, first.id)

    expect(screen.getByText('First future')).toBeInTheDocument()
    expect(screen.queryByText('Past')).not.toBeInTheDocument()
    expect(screen.queryByText('Second future')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'delete' }))
    expect(await screen.findByText('Second future')).toBeInTheDocument()
  })

  it('continues across months, beyond 30 days, and across years', () => {
    const distant = { id: 'distant', type: 'custom' as const, title: 'November birthday', date: '2026-11-15', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }
    const nextYear = { id: 'next-year', type: 'custom' as const, title: 'New year trip', date: '2027-01-05', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }

    expect(getNextUpcomingImportantDate([distant], '2026-09-09')?.title).toBe('November birthday')
    expect(getNextImportantDateOccurrence('2026-03-23', '2026-09-09')).toBe('2027-03-23')
    expect(getNextUpcomingImportantDate([nextYear], '2026-12-30')?.title).toBe('New year trip')
    expect(getNextUpcomingImportantDate([
      { ...distant, title: 'Expired first', date: '2026-09-12' },
      { ...distant, id: 'second', title: 'Next after expiry', date: '2026-09-21' },
    ], '2026-09-13')?.title).toBe('Next after expiry')
  })

  it('treats original dates as annually recurring and chooses the closest next occurrence', () => {
    const march23 = { id: 'march-23', type: 'custom' as const, title: 'Bookstore', date: '2026-03-23', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }
    const march26 = { ...march23, id: 'march-26', title: 'Pier', date: '2026-03-26' }
    const november = { ...march23, id: 'november', title: 'Birthday', date: '2026-11-15' }
    const todayAnniversary = { ...march23, id: 'today', title: 'Today anniversary', date: '2025-09-09' }

    expect(getNextUpcomingImportantDate([march23, march26], '2026-09-09')).toMatchObject({ title: 'Bookstore', nextOccurrence: '2027-03-23' })
    expect(getNextUpcomingImportantDate([march23, november], '2026-09-09')).toMatchObject({ title: 'Birthday', nextOccurrence: '2026-11-15' })
    expect(getNextUpcomingImportantDate([todayAnniversary, november], '2026-09-09')).toMatchObject({ title: 'Today anniversary', nextOccurrence: '2026-09-09', daysRemaining: 0 })
    expect(getNextImportantDateOccurrence('2025-09-09', '2026-09-10')).toBe('2027-09-09')
  })

  it('maps leap-day anniversaries to February 28 only in non-leap years', () => {
    expect(getNextImportantDateOccurrence('2024-02-29', '2028-02-28')).toBe('2028-02-29')
    expect(getNextImportantDateOccurrence('2024-02-29', '2027-01-01')).toBe('2027-02-28')
    expect(getNextImportantDateOccurrence('2024-02-29', '2027-03-01')).toBe('2028-02-29')
  })

  it('renders a recurring original date from the past instead of the empty state', async () => {
    const runtime = await createSeededRuntime(async (seed) => {
      await seed.importantDates.createImportantDate({ type: 'custom', title: 'Bookstore meeting', date: '2026-03-23' })
      await seed.importantDates.createImportantDate({ type: 'custom', title: 'Pier meeting', date: '2026-03-26' })
    })
    renderCard(runtime)

    expect(screen.getByText('Bookstore meeting')).toBeInTheDocument()
    expect(screen.queryByText('No upcoming important dates yet')).not.toBeInTheDocument()
  })

  it('uses the repository ordering with id as a deterministic final tie-breaker for same-day records', () => {
    const sameDay = [
      { id: 'b', type: 'custom' as const, title: 'Second', date: '2026-09-12', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
      { id: 'a', type: 'custom' as const, title: 'First', date: '2026-09-12', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
    ]
    expect(getNextUpcomingImportantDate(sameDay, localDate)?.title).toBe('First')
  })

  it('shows an actionable localized empty state instead of mock data', async () => {
    const runtime = await createRuntime()
    renderCard(runtime)

    expect(screen.getByText('No upcoming important dates yet')).toBeInTheDocument()
    expect(screen.queryByText('8/30')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Add an important date' }))
    expect(screen.getByTestId('location')).toHaveTextContent('/our?section=important-dates')
  })

  it('reflects an edited persisted title and date, then returns empty only when no future record remains', async () => {
    const backing = createMemoryStorageBacking()
    const seed = await createRuntime(backing)
    const record = await seed.importantDates.createImportantDate({ type: 'custom', title: 'Initial date', date: '2026-09-10' })
    seed.adapter.close()
    const runtime = await createRuntime(backing)
    renderCard(runtime, record.id)

    expect(screen.getByText('Initial date')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'update' }))
    expect(await screen.findByText('Updated date')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'delete' }))
    expect(await screen.findByText('No upcoming important dates yet')).toBeInTheDocument()
  })

  it('navigates each accessible date row to the Our important-date target', async () => {
    const backing = createMemoryStorageBacking()
    const seed = await createRuntime(backing)
    const record = await seed.importantDates.createImportantDate({ type: 'custom', title: 'Open me', date: '2026-09-10' })
    seed.adapter.close()
    const runtime = await createRuntime(backing)
    renderCard(runtime)

    const row = screen.getByRole('button', { name: 'Open important date: Open me' })
    row.focus()
    expect(document.activeElement).toBe(row)
    fireEvent.click(row)
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent(`/our?section=important-dates&recordId=${record.id}`))
  })
})
