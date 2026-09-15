import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it } from 'vitest'
import { PersistenceProvider } from '../../data/PersistenceContext'
import { initializePersistence, type PersistenceRuntime } from '../../data/persistence'
import { createMemoryStorageBacking, MemoryStorageAdapter } from '../../data/storage/MemoryStorageAdapter'
import { I18nProvider } from '../../i18n/I18nProvider'
import { HeartLineCard } from './HeartLineCard'
import { HeartRevealProgressCard } from './HeartRevealProgressCard'

const todayStyles = readFileSync('src/features/today/today.css', 'utf8')

async function createRuntime() {
  return initializePersistence({
    adapter: new MemoryStorageAdapter(createMemoryStorageBacking()),
    defaultLocale: 'zh-TW',
    localDate: '2026-09-01',
  })
}

async function seed(runtime: PersistenceRuntime, count: number) {
  for (let index = 1; index <= count; index += 1) {
    await runtime.heartPhrases.acceptHeartPhrase(`phrase-${index}`)
  }
  const phrases = await runtime.heartPhrases.getHeartPhrases()
  runtime.initial.heartPhrases = phrases
  runtime.initial.heartPhraseCount = phrases.length
}

function renderCard(runtime: PersistenceRuntime, withReveal = false) {
  return render(
    <PersistenceProvider runtime={runtime}>
      <I18nProvider initialLocale="zh-TW">
        <HeartLineCard />
        {withReveal ? <HeartRevealProgressCard /> : null}
      </I18nProvider>
    </PersistenceProvider>,
  )
}

function typePhrase(content = 'a heart note') {
  fireEvent.change(screen.getByRole('textbox'), { target: { value: content } })
}

function pressHeart(times: number) {
  for (let index = 0; index < times; index += 1) {
    fireEvent.click(screen.getByRole('button', { name: '收下這句心話' }))
  }
}

afterEach(cleanup)

describe('HeartLineCard ritual and phrase list', () => {
  it('keeps the heart icon visible through presses one to six', async () => {
    const runtime = await createRuntime()
    renderCard(runtime)
    typePhrase()
    const heartIcon = screen.getByTestId('heart-line-icon')
    expect(heartIcon).toHaveTextContent('♥')
    expect(heartIcon).toHaveAttribute('aria-hidden', 'true')
    expect(heartIcon).toBeVisible()

    for (let press = 1; press <= 6; press += 1) {
      fireEvent.click(screen.getByRole('button', { name: '收下這句心話' }))
      const heartButton = screen.getByRole('button', { name: '收下這句心話' })
      expect(screen.getByTestId('heart-line-icon')).toBeVisible()
      expect(screen.getByTestId('heart-line-icon')).toBe(heartIcon)
      expect(screen.getByTestId('heart-line-icon')).toHaveTextContent('♥')
      expect(heartButton).toHaveAttribute('data-ritual-progress', String(press))
      expect(screen.getByTestId('heart-line-ritual-progress')).toHaveTextContent(`第 ${press} / 7 次心意`)
      expect(await runtime.heartPhrases.getHeartPhrases()).toHaveLength(0)
    }
  })

  it('saves only on the seventh press and resets the ritual', async () => {
    const runtime = await createRuntime()
    renderCard(runtime)
    typePhrase()
    pressHeart(6)
    expect(await runtime.heartPhrases.getHeartPhrases()).toHaveLength(0)

    fireEvent.click(screen.getByRole('button', { name: '收下這句心話' }))
    await waitFor(async () => expect(await runtime.heartPhrases.getHeartPhrases()).toHaveLength(1))
    expect(screen.getByRole('button', { name: '收下這句心話' })).toHaveAttribute('data-ritual-progress', '0')
    expect(screen.getByTestId('heart-line-icon')).toBeVisible()
    expect(screen.getByTestId('heart-line-ritual-progress')).toHaveTextContent('第 0 / 7 次心意')
  })

  it('keeps a stable, visible heart icon for keyboard activation and the saving-disabled state', async () => {
    const runtime = await createRuntime()
    renderCard(runtime)
    typePhrase()
    const heartButton = screen.getByRole('button', { name: '收下這句心話' })

    fireEvent.keyDown(heartButton, { key: 'Enter' })
    fireEvent.click(heartButton)
    expect(screen.getByTestId('heart-line-icon')).toBeVisible()

    pressHeart(5)
    fireEvent.click(heartButton)
    await waitFor(() => expect(heartButton).not.toBeDisabled())
    expect(screen.getByTestId('heart-line-icon')).toBeVisible()
  })

  it('keeps the stable heart glyph visible in active and disabled button styles', () => {
    expect(todayStyles).toMatch(/\.heart-line-card__heart--active\s*\{[\s\S]*?background:\s*var\(--color-pink-100\);[\s\S]*?color:\s*var\(--color-pink-500\)/)
    expect(todayStyles).toMatch(/\.heart-line-card__heart-glyph\s*\{[\s\S]*?font-size:\s*1\.45rem;[\s\S]*?visibility:\s*visible;[\s\S]*?opacity:\s*1;/)
    expect(todayStyles).toMatch(/\.heart-line-card__heart:disabled \.heart-line-card__heart-glyph\s*\{[\s\S]*?opacity:\s*0\.72;[\s\S]*?visibility:\s*visible;/)
  })

  it('deduplicates rapid clicks at the save boundary', async () => {
    const runtime = await createRuntime()
    renderCard(runtime)
    typePhrase()
    pressHeart(6)
    const heartButton = screen.getByRole('button', { name: '收下這句心話' })
    fireEvent.click(heartButton)
    fireEvent.click(heartButton)

    await waitFor(async () => expect(await runtime.heartPhrases.getHeartPhrases()).toHaveLength(1))
  })

  it.each([4, 7])('uses a bounded touch-scroll list for %i phrases', async (count) => {
    const runtime = await createRuntime()
    await seed(runtime, count)
    const view = renderCard(runtime)
    const list = view.container.querySelector('.heart-line-card__phrases')

    expect(list).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(count)
    expect(todayStyles).toMatch(/\.heart-line-card__phrases\s*\{[\s\S]*?max-height:\s*8rem;/)
    expect(todayStyles).toMatch(/\.heart-line-card__phrases\s*\{[\s\S]*?overflow-y:\s*auto;/)
    expect(todayStyles).toMatch(/\.heart-line-card__phrases\s*\{[\s\S]*?touch-action:\s*pan-y;/)
  })

  it('keeps the complete archive in the bounded scroll list', async () => {
    const runtime = await createRuntime()
    await seed(runtime, 8)
    renderCard(runtime)

    expect(screen.getAllByRole('listitem')).toHaveLength(8)
  })

  it('keeps edit and delete behavior without replaying the ritual', async () => {
    const runtime = await createRuntime()
    await seed(runtime, 2)
    renderCard(runtime)

    fireEvent.click(screen.getAllByRole('button', { name: '編輯' })[0])
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'edited phrase' } })
    fireEvent.click(screen.getByRole('button', { name: '保存編輯' }))
    await screen.findByText('edited phrase')
    expect(await runtime.heartPhrases.getHeartPhrases()).toHaveLength(2)

    fireEvent.click(screen.getAllByRole('button', { name: '刪除' })[0])
    await waitFor(async () => expect(await runtime.heartPhrases.getHeartPhrases()).toHaveLength(1))
    expect(screen.getAllByRole('listitem')).toHaveLength(1)
  })

  it('keeps reveal progress synchronized with formal save and delete', async () => {
    const runtime = await createRuntime()
    renderCard(runtime, true)
    typePhrase()
    pressHeart(7)
    await screen.findByText('1 / 7')
    expect(screen.getAllByRole('listitem')).toHaveLength(1)

    fireEvent.click(screen.getByRole('button', { name: '刪除' }))
    await screen.findByText('0 / 7')
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument()
  })
})
