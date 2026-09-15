import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { PersistenceProvider } from '../../data/PersistenceContext'
import { initializePersistence } from '../../data/persistence'
import { createMemoryStorageBacking, MemoryStorageAdapter, type MemoryStorageBacking } from '../../data/storage/MemoryStorageAdapter'
import { I18nProvider } from '../../i18n/I18nProvider'
import { LoveBrainFlow } from './LoveBrainFlow'

afterEach(cleanup)

async function createRuntime(backing?: MemoryStorageBacking) {
  return initializePersistence({ adapter: new MemoryStorageAdapter(backing), defaultLocale: 'zh-TW', localDate: '2026-09-09' })
}

async function createDraftRuntime(backing = createMemoryStorageBacking()) {
  const seed = await createRuntime(backing)
  await seed.loveBrainAssessments.createDraft()
  seed.adapter.close()
  return { backing, runtime: await createRuntime(backing) }
}

function renderFlow(runtime: Awaited<ReturnType<typeof createRuntime>>) {
  return render(<PersistenceProvider runtime={runtime}><I18nProvider initialLocale="zh-TW"><LoveBrainFlow onDone={() => undefined} /></I18nProvider></PersistenceProvider>)
}

describe('LoveBrainFlow selected answer visual state', () => {
  it('starts unselected, then renders one selected radio with the shared active class and check indicator contract', async () => {
    const { runtime } = await createDraftRuntime()
    renderFlow(runtime)
    const radios = await screen.findAllByRole('radio')
    expect(radios).toHaveLength(4)
    expect(radios.every((radio) => radio.getAttribute('aria-checked') === 'false')).toBe(true)
    expect(radios.every((radio) => !radio.classList.contains('is-active'))).toBe(true)

    fireEvent.click(radios[1])
    await waitFor(() => expect(radios[1]).toHaveAttribute('aria-checked', 'true'))
    expect(radios[1]).toHaveClass('is-active')
    expect(radios.filter((radio) => radio.getAttribute('aria-checked') === 'true')).toHaveLength(1)
  })

  it('moves the selected visual state when a different answer is chosen', async () => {
    const { runtime } = await createDraftRuntime()
    renderFlow(runtime)
    const radios = await screen.findAllByRole('radio')

    fireEvent.click(radios[0])
    await waitFor(() => expect(radios[0]).toHaveAttribute('aria-checked', 'true'))
    fireEvent.click(radios[3])
    await waitFor(() => expect(radios[3]).toHaveAttribute('aria-checked', 'true'))
    expect(radios[0]).toHaveAttribute('aria-checked', 'false')
    expect(radios[0]).not.toHaveClass('is-active')
    expect(radios.filter((radio) => radio.getAttribute('aria-checked') === 'true')).toHaveLength(1)
  })

  it('keeps a saved answer visibly selected through next/previous navigation', async () => {
    const { runtime } = await createDraftRuntime()
    renderFlow(runtime)
    const firstQuestionRadios = await screen.findAllByRole('radio')
    fireEvent.click(firstQuestionRadios[2])
    await waitFor(() => expect(firstQuestionRadios[2]).toHaveAttribute('aria-checked', 'true'))

    fireEvent.click(screen.getByRole('button', { name: '下一題' }))
    await waitFor(() => expect(screen.getByText('2 / 25')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: '上一題' }))
    await waitFor(() => expect(screen.getByText('1 / 25')).toBeInTheDocument())
    expect((await screen.findAllByRole('radio'))[2]).toHaveAttribute('aria-checked', 'true')
  })

  it('restores the persisted selected answer after draft reload', async () => {
    const { backing, runtime } = await createDraftRuntime()
    const view = renderFlow(runtime)
    const radios = await screen.findAllByRole('radio')
    fireEvent.click(radios[1])
    await waitFor(() => expect(radios[1]).toHaveAttribute('aria-checked', 'true'))
    view.unmount()
    runtime.adapter.close()

    const reopened = await createRuntime(backing)
    renderFlow(reopened)
    expect((await screen.findAllByRole('radio'))[1]).toHaveAttribute('aria-checked', 'true')
    expect((await screen.findAllByRole('radio'))[1]).toHaveClass('is-active')
  })
})
