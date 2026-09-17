import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { I18nProvider } from '../../i18n/I18nProvider'
import { LikeResult } from './LikeOrHabitFlow'

afterEach(cleanup)

const locales = ['zh-TW', 'en', 'ja', 'ko', 'es', 'fr'] as const
const moduleSets = [
  ['real_person'],
  ['real_person', 'habit'],
  ['real_person', 'habit', 'fear_of_loss'],
] as const

describe('Like or Habit result layout', () => {
  it.each(moduleSets.map((modules) => ({ modules })))('keeps $modules result module cards in a scoped summary-to-modules-to-closing order', ({ modules }) => {
    const { container } = render(<I18nProvider initialLocale="zh-TW"><LikeResult modules={[...modules]} variantKey="unclear.v1" /></I18nProvider>)
    const result = container.querySelector('.clear-like-result')!
    const summary = result.querySelector('.clear-like-result__summary')
    const moduleList = result.querySelector('.clear-like-result__modules')
    const closing = result.querySelector('.clear-like-result__closing')

    expect(summary).not.toBeNull()
    expect(moduleList?.querySelectorAll('.clear-like-result__module')).toHaveLength(modules.length)
    expect(closing).not.toBeNull()
    expect(Array.from(result.children)).toEqual([summary, moduleList, closing])
    moduleList?.querySelectorAll('.clear-like-result__module').forEach((card) => {
      expect(card.querySelector('h3')).not.toBeNull()
      expect(card.querySelector('p')).not.toBeNull()
    })
  })

  it.each(locales)('renders result summary, module cards, and closing copy in %s', (locale) => {
    const { container } = render(<I18nProvider initialLocale={locale}><LikeResult modules={['real_person', 'habit', 'fear_of_loss']} variantKey="unclear.v1" /></I18nProvider>)
    expect(container.querySelector('.clear-like-result__summary')).not.toBeNull()
    expect(container.querySelectorAll('.clear-like-result__module')).toHaveLength(3)
    expect(container.querySelector('.clear-like-result__closing')).not.toBeNull()
  })
})
