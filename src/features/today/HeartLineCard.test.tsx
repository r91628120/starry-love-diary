import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { PersistenceProvider } from '../../data/PersistenceContext'
import { initializePersistence, type PersistenceRuntime } from '../../data/persistence'
import { createMemoryStorageBacking, MemoryStorageAdapter } from '../../data/storage/MemoryStorageAdapter'
import { I18nProvider } from '../../i18n/I18nProvider'
import { HeartLineCard } from './HeartLineCard'
import { HeartRevealProgressCard } from './HeartRevealProgressCard'

async function createRuntime() {
  return initializePersistence({ adapter: new MemoryStorageAdapter(createMemoryStorageBacking()), defaultLocale: 'zh-TW', localDate: '2026-09-01' })
}

function renderCard(runtime: PersistenceRuntime, withReveal = false) {
  return render(<PersistenceProvider runtime={runtime}><I18nProvider initialLocale="zh-TW"><MemoryRouter><HeartLineCard />{withReveal ? <HeartRevealProgressCard /> : null}</MemoryRouter></I18nProvider></PersistenceProvider>)
}

function writeAndSave(content = 'a heart note') {
  fireEvent.change(screen.getByRole('textbox'), { target: { value: content } })
  fireEvent.click(screen.getByRole('button', { name: '收下這句心話' }))
}

afterEach(cleanup)

describe('HeartLineCard', () => {
  it('saves one phrase with one heart press and shows the saved count', async () => {
    const runtime = await createRuntime()
    renderCard(runtime)
    writeAndSave()
    await waitFor(async () => expect(await runtime.heartPhrases.getHeartPhrases()).toHaveLength(1))
    expect(screen.getByTestId('heart-line-ritual-progress')).toHaveTextContent('已完成 1 / 7 句')
  })

  it('deduplicates rapid presses at the save boundary', async () => {
    const runtime = await createRuntime()
    renderCard(runtime)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'only once' } })
    const heart = screen.getByRole('button', { name: '收下這句心話' })
    fireEvent.click(heart); fireEvent.click(heart)
    await waitFor(async () => expect(await runtime.heartPhrases.getHeartPhrases()).toHaveLength(1))
  })

  it('keeps up to eighty Unicode code points intact from input through save', async () => {
    const runtime = await createRuntime()
    renderCard(runtime)
    const safeBoundary = `${'心'.repeat(79)}💗`
    fireEvent.change(screen.getByRole('textbox'), { target: { value: `${safeBoundary}😘` } })
    expect(screen.getByRole('textbox')).toHaveValue(safeBoundary)
    expect(screen.getByText('80 / 80')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '收下這句心話' }))
    await waitFor(async () => expect((await runtime.heartPhrases.getHeartPhrases())[0]?.content).toBe(safeBoundary))
  })

  it('advances the reveal through seven saved phrases without requiring repeated presses', async () => {
    const runtime = await createRuntime()
    renderCard(runtime, true)
    for (let index = 1; index <= 7; index += 1) {
      writeAndSave(`phrase-${index}`)
      await waitFor(async () => expect(await runtime.heartPhrases.getHeartPhrases()).toHaveLength(index))
    }
    expect(screen.getByText('7 / 7')).toBeInTheDocument()
    expect(screen.getByTestId('heart-line-ritual-progress')).toHaveTextContent('已完成 7 / 7 句')
  })

  it('keeps edit behavior without changing the one-press rule', async () => {
    const runtime = await createRuntime()
    await runtime.heartPhrases.acceptHeartPhrase('第一句')
    runtime.initial.heartPhrases = await runtime.heartPhrases.getHeartPhrases()
    runtime.initial.heartPhraseCount = 1
    renderCard(runtime)
    fireEvent.click(screen.getByRole('button', { name: '編輯' }))
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'edited phrase' } })
    fireEvent.click(screen.getByRole('button', { name: '保存編輯' }))
    await screen.findByText('edited phrase')
    expect(await runtime.heartPhrases.getHeartPhrases()).toHaveLength(1)
  })
})
