import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { PersistenceProvider } from '../../data/PersistenceContext'
import { usePersistence } from '../../data/PersistenceStateContext'
import { initializePersistence, type PersistenceRuntime } from '../../data/persistence'
import { createMemoryStorageBacking, MemoryStorageAdapter } from '../../data/storage/MemoryStorageAdapter'
import { I18nProvider } from '../../i18n/I18nProvider'
import { useI18n } from '../../i18n/I18nContext'
import { HeartRevealProgressCard } from './HeartRevealProgressCard'

function Controls() {
  const persistence = usePersistence()
  const { setLocale } = useI18n()
  return <>
    <button type="button" onClick={() => persistence?.acceptHeartPhrase(`心話 ${persistence.heartPhraseCount + 1}`)}>add-phrase</button>
    <button type="button" onClick={() => persistence?.heartPhrases[0] && persistence.updateHeartPhrase(persistence.heartPhrases[0].id, '編輯後的心話')}>edit-phrase</button>
    <button type="button" onClick={() => persistence?.heartPhrases[0] && persistence.deleteHeartPhrase(persistence.heartPhrases[0].id)}>delete-phrase</button>
    <button type="button" onClick={() => setLocale('en')}>switch-locale</button>
    <button type="button" onClick={() => persistence?.completeHeartRevealCycle()}>complete-cycle</button>
  </>
}

function renderCard(runtime: PersistenceRuntime) {
  return render(<PersistenceProvider runtime={runtime}><I18nProvider initialLocale="zh-TW"><HeartRevealProgressCard /><Controls /></I18nProvider></PersistenceProvider>)
}

async function createRuntime(backing = createMemoryStorageBacking()) {
  return initializePersistence({ adapter: new MemoryStorageAdapter(backing), defaultLocale: 'zh-TW', localDate: '2026-09-01' })
}

function expectRevealState(container: HTMLElement, progress: number) {
  expect(container.querySelectorAll('.heart-reveal-card__mask span')).toHaveLength(7)
  expect(container.querySelectorAll('.heart-reveal-card__mask span.is-revealed')).toHaveLength(progress)
}

async function seed(runtime: PersistenceRuntime, count: number) {
  for (let index = 1; index <= count; index += 1) {
    const phrase = await runtime.heartPhrases.acceptHeartPhrase(`心話 ${index}`)
    await runtime.heartRevealPhotos.registerHeartPhrase(phrase.id, await runtime.heartPhrases.getHeartPhrases())
  }
  const phrases = await runtime.heartPhrases.getHeartPhrases()
  runtime.initial.heartPhrases = phrases
  runtime.initial.heartPhraseCount = count
  runtime.initial.activeHeartRevealProject = await runtime.heartRevealPhotos.getCycleState(phrases)
}

afterEach(cleanup)

describe('Heart reveal persistence-driven progress', () => {
  it('starts at 0 / 7 with all seven photo segments covered', async () => {
    const view = renderCard(await createRuntime())
    expect(screen.getByText('0 / 7')).toBeInTheDocument()
    expectRevealState(view.container, 0)
  })

  it('moves from 1 / 7 to 3 / 7 as completed phrases are added', async () => {
    const view = renderCard(await createRuntime())
    fireEvent.click(screen.getByRole('button', { name: 'add-phrase' }))
    await screen.findByText('1 / 7')
    expectRevealState(view.container, 1)
    fireEvent.click(screen.getByRole('button', { name: 'add-phrase' }))
    await screen.findByText('2 / 7')
    fireEvent.click(screen.getByRole('button', { name: 'add-phrase' }))
    await screen.findByText('3 / 7')
    expectRevealState(view.container, 3)
  })

  it('does not increase on edit and decreases after deletion', async () => {
    const runtime = await createRuntime()
    await seed(runtime, 2)
    const view = renderCard(runtime)
    fireEvent.click(screen.getByRole('button', { name: 'edit-phrase' }))
    await waitFor(() => expect(screen.getByText('2 / 7')).toBeInTheDocument())
    expectRevealState(view.container, 2)
    fireEvent.click(screen.getByRole('button', { name: 'delete-phrase' }))
    await screen.findByText('1 / 7')
    expectRevealState(view.container, 1)
  })

  it('fully reveals at the seventh phrase and never exceeds 7 / 7', async () => {
    const runtime = await createRuntime()
    await seed(runtime, 6)
    const view = renderCard(runtime)
    expect(screen.getByText('6 / 7')).toBeInTheDocument()
    expectRevealState(view.container, 6)
    fireEvent.click(screen.getByRole('button', { name: 'add-phrase' }))
    await screen.findByText('7 / 7')
    expectRevealState(view.container, 7)
    fireEvent.click(screen.getByRole('button', { name: 'add-phrase' }))
    await waitFor(() => expect(screen.getByText('7 / 7')).toBeInTheDocument())
    expectRevealState(view.container, 7)
  })

  it('keeps the archive after explicit completion and starts the next cycle at 0 / 7', async () => {
    const runtime = await createRuntime(); await seed(runtime, 7)
    const view = renderCard(runtime)
    expect(screen.getByText('7 / 7')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'complete-cycle' }))
    await screen.findByText('0 / 7')
    expect(await runtime.heartPhrases.getHeartPhrases()).toHaveLength(7)
    expectRevealState(view.container, 0)
    fireEvent.click(screen.getByRole('button', { name: 'add-phrase' }))
    await screen.findByText('1 / 7')
  })

  it('offers every archive phrase, including older-cycle phrases, when the current cycle is ready', async () => {
    const runtime = await createRuntime(); await seed(runtime, 7)
    renderCard(runtime)
    fireEvent.click(screen.getByRole('button', { name: '選一句心話做成心意卡' }))
    expect(screen.getAllByRole('radio')).toHaveLength(7)
    expect(screen.getByRole('radio', { name: '心話 1' })).toBeInTheDocument()
  })

  it('restores the persisted count after storage reopen', async () => {
    const backing = createMemoryStorageBacking()
    const first = await createRuntime(backing)
    await seed(first, 3)
    first.adapter.close()
    const reopened = await createRuntime(backing)
    const view = renderCard(reopened)
    expect(screen.getByText('3 / 7')).toBeInTheDocument()
    expectRevealState(view.container, 3)
  })

  it('rerenders its copy without changing progress when locale switches', async () => {
    const runtime = await createRuntime()
    await seed(runtime, 3)
    const view = renderCard(runtime)
    fireEvent.click(screen.getByRole('button', { name: 'switch-locale' }))
    await screen.findByRole('heading', { name: 'Seven Heart Notes · Photo Reveal' })
    expect(screen.getByText('3 / 7')).toBeInTheDocument()
    expectRevealState(view.container, 3)
    expect((await runtime.heartPhrases.getHeartPhrases())).toHaveLength(3)
  })
})
