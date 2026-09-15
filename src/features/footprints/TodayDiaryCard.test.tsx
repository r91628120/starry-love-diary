import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { PersistenceProvider } from '../../data/PersistenceContext'
import { initializePersistence } from '../../data/persistence'
import { MemoryStorageAdapter } from '../../data/storage/MemoryStorageAdapter'
import { I18nProvider } from '../../i18n/I18nProvider'
import { RecentFootprints } from './RecentFootprints'
import { TodayDiaryCard } from './TodayDiaryCard'

afterEach(() => { cleanup(); vi.restoreAllMocks() })

function QueryProbe() {
  const location = useLocation()
  return <output data-testid="footprints-query">{location.search}</output>
}

async function renderDiary(path = '/footprints?date=2026-09-08', includeRecent = false) {
  const runtime = await initializePersistence({ adapter: new MemoryStorageAdapter(), defaultLocale: 'en', localDate: '2026-09-08' })
  render(<PersistenceProvider runtime={runtime}><I18nProvider initialLocale="en"><MemoryRouter initialEntries={[path]}><TodayDiaryCard />{includeRecent ? <RecentFootprints search="" /> : null}<QueryProbe /></MemoryRouter></I18nProvider></PersistenceProvider>)
  return runtime
}

describe('TodayDiaryCard save and edit reset flow', () => {
  it('creates a diary, returns to a blank new-entry editor, and refreshes Recent Footprints', async () => {
    const runtime = await renderDiary(undefined, true)
    const editor = screen.getByRole('textbox', { name: "Today's diary" })
    fireEvent.change(editor, { target: { value: 'A newly saved diary entry' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save diary' }))

    await waitFor(() => expect(editor).toHaveValue(''))
    expect(document.querySelector('.today-diary-card__copy span')).toHaveTextContent('0 / 1,000')
    expect(screen.getByRole('button', { name: 'Save diary' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Delete diary' })).toBeNull()
    expect(screen.getByTestId('footprints-query')).toHaveTextContent('?date=2026-09-08')
    await waitFor(() => expect(screen.getByText('A newly saved diary …')).toBeInTheDocument())
    expect((await runtime.diaries.getDiaries()).map((entry) => entry.content)).toEqual(['A newly saved diary entry'])
  })

  it('keeps the draft when create persistence fails', async () => {
    const runtime = await renderDiary()
    vi.spyOn(runtime.diaries, 'createDiary').mockRejectedValueOnce(new Error('write failed'))
    const editor = screen.getByRole('textbox', { name: "Today's diary" })
    fireEvent.change(editor, { target: { value: 'Keep this draft' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save diary' }))

    await waitFor(() => expect(screen.getByText('Unable to save the diary right now. Please try again.')).toBeInTheDocument())
    expect(editor).toHaveValue('Keep this draft')
    expect(screen.getByRole('button', { name: 'Save diary' })).toBeInTheDocument()
  })

  it('updates a queried diary once, clears edit state and replaces its edit query', async () => {
    const runtime = await initializePersistence({ adapter: new MemoryStorageAdapter(), defaultLocale: 'en', localDate: '2026-09-08' })
    const entry = await runtime.diaries.createDiary({ localDate: '2026-09-08', content: 'Original diary' })
    render(<PersistenceProvider runtime={runtime}><I18nProvider initialLocale="en"><MemoryRouter initialEntries={[`/footprints?date=2026-09-08&entry=diary&recordId=${entry.id}`]}><TodayDiaryCard /><QueryProbe /></MemoryRouter></I18nProvider></PersistenceProvider>)

    const editor = await screen.findByRole('textbox', { name: "Today's diary" })
    await waitFor(() => expect(editor).toHaveValue('Original diary'))
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument()
    fireEvent.change(editor, { target: { value: 'Updated diary' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => expect(editor).toHaveValue(''))
    expect(screen.queryByRole('button', { name: 'Delete diary' })).toBeNull()
    expect(screen.getByTestId('footprints-query')).toHaveTextContent('?date=2026-09-08')
    expect((await runtime.diaries.getDiaries())).toHaveLength(1)
    expect((await runtime.diaries.getDiary(entry.id))?.content).toBe('Updated diary')
  })

  it('deletes a queried diary, clears its editor, and removes the edit query', async () => {
    const runtime = await initializePersistence({ adapter: new MemoryStorageAdapter(), defaultLocale: 'en', localDate: '2026-09-08' })
    const entry = await runtime.diaries.createDiary({ localDate: '2026-09-08', content: 'Delete this diary' })
    render(<PersistenceProvider runtime={runtime}><I18nProvider initialLocale="en"><MemoryRouter initialEntries={[`/footprints?date=2026-09-08&entry=diary&recordId=${entry.id}`]}><TodayDiaryCard /><QueryProbe /></MemoryRouter></I18nProvider></PersistenceProvider>)

    const editor = await screen.findByRole('textbox', { name: "Today's diary" })
    await waitFor(() => expect(editor).toHaveValue('Delete this diary'))
    fireEvent.click(screen.getByRole('button', { name: 'Delete diary' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))

    await waitFor(() => expect(editor).toHaveValue(''))
    expect(screen.queryByRole('button', { name: 'Delete diary' })).toBeNull()
    expect(screen.getByTestId('footprints-query')).toHaveTextContent('?date=2026-09-08')
    expect(await runtime.diaries.getDiary(entry.id)).toBeUndefined()
  })
})
