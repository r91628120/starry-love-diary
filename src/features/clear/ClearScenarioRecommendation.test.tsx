import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { I18nProvider } from '../../i18n/I18nProvider'
import { useI18n } from '../../i18n/I18nContext'
import { ClearContent } from './ClearContent'

function LocaleSwitch() {
  const { setLocale } = useI18n()
  return <button type="button" onClick={() => setLocale('en')}>switch-to-en</button>
}

function renderClear() {
  return render(<I18nProvider initialLocale="zh-TW"><LocaleSwitch /><ClearContent /></I18nProvider>)
}

afterEach(cleanup)

const mappings = [
  ['我一直想他', '開始整理心情'],
  ['我在等他的訊息', '開始整理心情'],
  ['我覺得自己暈太深', '戀愛腦檢測'],
  ['我不知道還喜不喜歡他', '喜歡？習慣？'],
  ['我不知道這個人適不適合我', '暈船法典'],
] as const

const locales = ['zh-TW', 'en', 'ja', 'ko', 'es', 'fr'] as const

describe('Clear scenario recommendations', () => {
  it.each(locales)('renders five selectable scenario cards in %s', (locale) => {
    const { container } = render(<I18nProvider initialLocale={locale}><ClearContent /></I18nProvider>)
    const scenarioButtons = Array.from(container.querySelectorAll<HTMLButtonElement>('.clear-scenarios__rail > button'))

    expect(scenarioButtons).toHaveLength(5)
    fireEvent.click(scenarioButtons[0])
    expect(scenarioButtons[0]).toHaveAttribute('aria-pressed', 'true')
    scenarioButtons.slice(1).forEach((scenario) => expect(scenario).toHaveAttribute('aria-pressed', 'false'))
  })

  it('renders five selectable scenarios and transfers the selected state without a visual indicator element', () => {
    renderClear()
    const group = screen.getByRole('group', { name: '今天，我需要哪一種清醒？' })
    const [first, second, ...remaining] = within(group).getAllByRole('button')

    const scenarios = [first, second, ...remaining]
    expect(scenarios).toHaveLength(5)
    scenarios.forEach((scenario) => expect(scenario).toHaveAttribute('aria-pressed', 'false'))
    expect(first).toHaveAttribute('aria-pressed', 'false')
    expect(first).not.toHaveClass('is-active')

    fireEvent.click(first)
    expect(first).toHaveAttribute('aria-pressed', 'true')
    expect(first).toHaveClass('is-active')
    expect(first.querySelector('[aria-hidden="true"]')).toBeNull()

    fireEvent.click(second)
    expect(first).toHaveAttribute('aria-pressed', 'false')
    expect(first).not.toHaveClass('is-active')
    expect(second).toHaveAttribute('aria-pressed', 'true')
    expect(second).toHaveClass('is-active')
  })

  it.each(mappings)('maps %s to %s without entering the tool immediately', (scenario, tool) => {
    renderClear()
    const scenarioButton = screen.getByRole('button', { name: scenario })
    fireEvent.click(scenarioButton)

    expect(scenarioButton).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('group', { name: '今天，我需要哪一種清醒？' })).toBeInTheDocument()
    const recommendation = screen.getByRole('region', { name: '為你推薦' })
    expect(within(recommendation).getByRole('heading', { name: tool })).toBeInTheDocument()
    expect(within(recommendation).getByRole('button', { name: `開始「${tool}」` })).toBeInTheDocument()
    expect(within(recommendation).queryByRole('link')).not.toBeInTheDocument()
    expect(screen.getByRole('region', { name: '清醒工具' }).getElementsByTagName('button')).toHaveLength(4)
  })

  it('enters the mapped tool only after its recommendation CTA is pressed', () => {
    renderClear()
    fireEvent.click(screen.getByRole('button', { name: '我在等他的訊息' }))
    expect(screen.queryByRole('heading', { name: '發生什麼事？' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '開始「開始整理心情」' }))
    expect(screen.getByRole('heading', { name: '發生什麼事？' })).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: '今天，我需要哪一種清醒？' })).not.toBeInTheDocument()
  })

  it('keeps the selected scenario and stable mapping when locale changes', () => {
    renderClear()
    fireEvent.click(screen.getByRole('button', { name: '我覺得自己暈太深' }))
    fireEvent.click(screen.getByRole('button', { name: 'switch-to-en' }))

    expect(screen.getByRole('button', { name: 'I feel in too deep' })).toHaveAttribute('aria-pressed', 'true')
    const recommendation = screen.getByRole('region', { name: 'Suggested for you' })
    expect(within(recommendation).getByRole('heading', { name: 'Love-pattern check' })).toBeInTheDocument()
    expect(within(recommendation).getByRole('button', { name: 'Start “Love-pattern check”' })).toBeInTheDocument()
  })
})
