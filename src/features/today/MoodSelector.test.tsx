import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PersistenceProvider } from '../../data/PersistenceContext'
import { initializePersistence, type PersistenceRuntime } from '../../data/persistence'
import { createMemoryStorageBacking, MemoryStorageAdapter, type MemoryStorageBacking } from '../../data/storage/MemoryStorageAdapter'
import { useI18n } from '../../i18n/I18nContext'
import { I18nProvider } from '../../i18n/I18nProvider'
import { MoodSelector } from './MoodSelector'

const todayStyles = readFileSync('src/features/today/today.css', 'utf8')
const testLocalDate = '2026-09-01'
const testNow = new Date(2026, 8, 1, 12, 0, 0)

function LocaleControl() {
  const { setLocale } = useI18n()
  return <button type="button" onClick={() => setLocale('en')}>switch-locale</button>
}

async function createRuntime(backing: MemoryStorageBacking = createMemoryStorageBacking()) {
  return initializePersistence({
    adapter: new MemoryStorageAdapter(backing),
    defaultLocale: 'zh-TW',
    localDate: testLocalDate,
  })
}

function renderSelector(runtime: PersistenceRuntime) {
  return render(
    <PersistenceProvider runtime={runtime}>
      <I18nProvider initialLocale="zh-TW">
        <MoodSelector />
        <LocaleControl />
      </I18nProvider>
    </PersistenceProvider>,
  )
}

function moodAwards(runtime: PersistenceRuntime) {
  return runtime.scores.getAwards().then((awards) => awards.filter((award) => award.awardType === 'mood_selected'))
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(testNow)
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('MoodSelector persisted selection feedback', () => {
  it('persists the first mood selection and shows the existing +2 feedback', async () => {
    const runtime = await createRuntime()
    renderSelector(runtime)
    expect(screen.getByRole('button', { name: '想念' })).toHaveAttribute('aria-pressed', 'false')

    fireEvent.click(screen.getByRole('button', { name: '開心' }))

    expect(await screen.findByRole('status')).toHaveTextContent('+2')
    expect((await runtime.moods.getMoodByLocalDate(testLocalDate))?.mood).toBe('happy')
    expect(screen.getByRole('button', { name: '開心' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('awards mood_selected +2 only once on the first selection that day', async () => {
    const runtime = await createRuntime()
    renderSelector(runtime)
    fireEvent.click(screen.getByRole('button', { name: '心動' }))

    await waitFor(async () => expect(await moodAwards(runtime)).toHaveLength(1))
    expect((await moodAwards(runtime))[0].points).toBe(2)
    expect(await runtime.scores.getTotal()).toBe(3)
  })

  it('updates the selected mood without awarding +2 again on the same day', async () => {
    const runtime = await createRuntime()
    renderSelector(runtime)
    fireEvent.click(screen.getByRole('button', { name: '開心' }))
    await waitFor(() => expect(screen.getByRole('button', { name: '開心' })).toHaveAttribute('aria-pressed', 'true'))
    fireEvent.click(screen.getByRole('button', { name: '安心' }))

    await waitFor(() => expect(screen.getByRole('button', { name: '安心' })).toHaveAttribute('aria-pressed', 'true'))
    expect(screen.getByRole('button', { name: '開心' })).toHaveAttribute('aria-pressed', 'false')
    expect((await runtime.moods.getMoodByLocalDate(testLocalDate))?.mood).toBe('peaceful')
    expect(await moodAwards(runtime)).toHaveLength(1)
    expect(await runtime.scores.getTotal()).toBe(3)
  })

  it('uses distinct selected styling with a check indicator', async () => {
    const runtime = await createRuntime()
    renderSelector(runtime)
    fireEvent.click(screen.getByRole('button', { name: '不安' }))
    const selected = await screen.findByRole('button', { name: '不安' })

    expect(selected).toHaveAttribute('aria-pressed', 'true')
    expect(selected.querySelector('.mood-option__check')).toHaveTextContent('✓')
    expect(todayStyles).toMatch(/\.mood-option\[aria-pressed='true'\]\s*\{[\s\S]*?border-color:/)
    expect(todayStyles).toMatch(/\.mood-option\[aria-pressed='true'\]\s*\{[\s\S]*?background:/)
    expect(todayStyles).toMatch(/\.mood-option\[aria-pressed='true'\] \.mood-option__check\s*\{[\s\S]*?opacity:\s*1;/)
    expect(todayStyles).toMatch(/\.mood-option:hover:not\(\[aria-pressed='true'\]\)/)
    expect(todayStyles).toMatch(/\.mood-option:focus-visible/)
  })

  it('restores the selected mood after reload', async () => {
    const backing = createMemoryStorageBacking()
    const first = await createRuntime(backing)
    await first.moods.setMood('sad', testLocalDate)
    first.adapter.close()

    const reopened = await createRuntime(backing)
    renderSelector(reopened)
    expect(screen.getByRole('button', { name: '難過' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('keeps the stable selected mood when locale changes', async () => {
    const runtime = await createRuntime()
    renderSelector(runtime)
    fireEvent.click(screen.getByRole('button', { name: '內耗' }))
    await waitFor(() => expect(screen.getByRole('button', { name: '內耗' })).toHaveAttribute('aria-pressed', 'true'))
    fireEvent.click(screen.getByRole('button', { name: 'switch-locale' }))

    expect(await screen.findByRole('button', { name: 'Overthinking' })).toHaveAttribute('aria-pressed', 'true')
    expect((await runtime.moods.getMoodByLocalDate(testLocalDate))?.mood).toBe('rumination')
  })
})
