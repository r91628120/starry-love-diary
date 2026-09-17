import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ComponentType } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { PersistenceProvider } from '../../data/PersistenceContext'
import { initializePersistence } from '../../data/persistence'
import { MemoryStorageAdapter } from '../../data/storage/MemoryStorageAdapter'
import { I18nProvider } from '../../i18n/I18nProvider'
import { LikeOrHabitFlow } from './LikeOrHabitFlow'
import { LoveBoatFlow } from './LoveBoatFlow'
import { LoveBrainFlow } from './LoveBrainFlow'

afterEach(cleanup)

const locales = ['zh-TW', 'en', 'ja', 'ko', 'es', 'fr'] as const
const introFlows = [
  ['Love Boat', LoveBoatFlow],
  ['Love Brain', LoveBrainFlow],
  ['Like or Habit', LikeOrHabitFlow],
] as const satisfies ReadonlyArray<readonly [string, ComponentType<{ onDone: () => void }>]>

async function createRuntime() {
  return initializePersistence({ adapter: new MemoryStorageAdapter(), defaultLocale: 'zh-TW', localDate: '2026-09-17' })
}

describe('Clear tool introduction layout', () => {
  it.each(introFlows)('%s uses the shared spacious intro structure and CTA enters its first question', async (_name, Flow) => {
    const runtime = await createRuntime()
    const view = render(<PersistenceProvider runtime={runtime}><I18nProvider initialLocale="zh-TW"><Flow onDone={() => undefined} /></I18nProvider></PersistenceProvider>)

    await waitFor(() => expect(view.container.querySelector('.clear-tool-intro')).not.toBeNull())
    const intro = view.container.querySelector<HTMLElement>('.clear-tool-intro')!
    expect(intro).toHaveClass('clear-flow', 'clear-intro')
    const cta = intro.querySelector<HTMLButtonElement>('.button--primary')
    expect(cta).not.toBeNull()

    fireEvent.click(cta!)
    expect((await screen.findAllByRole('radio')).length).toBeGreaterThan(0)
    expect(view.container.querySelector('.clear-tool-intro')).toBeNull()
  })

  it.each(locales)('renders all three shared intro cards without changing their structure in %s', async (locale) => {
    for (const flow of introFlows) {
      const Flow = flow[1]
      const runtime = await createRuntime()
      const view = render(<PersistenceProvider runtime={runtime}><I18nProvider initialLocale={locale}><Flow onDone={() => undefined} /></I18nProvider></PersistenceProvider>)

      await waitFor(() => expect(view.container.querySelector('.clear-tool-intro')).not.toBeNull())
      const intro = view.container.querySelector<HTMLElement>('.clear-tool-intro')!
      expect(intro.querySelectorAll('p').length).toBeGreaterThan(0)
      expect(intro.querySelector('.button--primary')).not.toBeNull()
      cleanup()
    }
  })
})
