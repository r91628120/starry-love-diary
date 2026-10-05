import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { I18nProvider } from '../../i18n/I18nProvider'
import { supportedLocales, type Locale } from '../../i18n/messages'
import { StarrySkyEntryCard } from './StarrySkyEntryCard'
import { StarrySkyPage } from '../../pages/StarrySkyPage'

function renderStarrySky(initialPath = '/our', locale: Locale = 'zh-TW') {
  return render(<I18nProvider initialLocale={locale}><MemoryRouter initialEntries={[initialPath]}><Routes><Route path="/our" element={<StarrySkyEntryCard />} /><Route path="/our/starry-sky" element={<StarrySkyPage />} /><Route path="/our/pair" element={<h1>Real Pair route</h1>} /></Routes></MemoryRouter></I18nProvider>)
}

afterEach(cleanup)

describe('Starry Sky Phase 2A entry and real Pair routing', () => {
  it('opens the Home from the accessible entry with the V2 topic prompt framing', () => {
    renderStarrySky()
    const entry = screen.getByRole('button', { name: /我們的星空/u })
    expect(entry).toHaveTextContent('有些話')
    expect(entry).toHaveTextContent('心話')
    expect(entry).not.toHaveTextContent(/交換日記/u)
    fireEvent.click(entry)
    expect(screen.getByRole('heading', { level: 1, name: '💕 我們的星空' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '輸入配對碼' })).toBeInTheDocument()
  })

  it('routes both pairing actions to the real Pair route without rendering the local six-digit UI', () => {
    const first = renderStarrySky('/our/starry-sky')
    const pairing = document.querySelector('.starry-sky-pairing') as HTMLElement
    expect(pairing).not.toHaveTextContent('這些功能會在後續階段開放；目前不會建立配對。')
    fireEvent.click(within(pairing).getByRole('button', { name: '邀請另一半' }))
    expect(screen.getByRole('heading', { name: 'Real Pair route' })).toBeInTheDocument()
    first.unmount()

    renderStarrySky('/our/starry-sky')
    fireEvent.click(within(document.querySelector('.starry-sky-pairing') as HTMLElement).getByRole('button', { name: '輸入配對碼' }))
    expect(screen.getByRole('heading', { name: 'Real Pair route' })).toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: '輸入配對碼' })).not.toBeInTheDocument()
  })

  it('uses the page-header fallback to return to Our', () => {
    renderStarrySky('/our/starry-sky')
    fireEvent.click(screen.getByRole('button', { name: '返回' }))
    expect(screen.getByRole('button', { name: /我們的星空/u })).toBeInTheDocument()
  })

  it.each(supportedLocales)('resolves the V2 entry shell without raw keys in %s', (locale) => {
    const view = renderStarrySky('/our', locale)
    expect(view.container.textContent).not.toMatch(/our\.starrySky\./u)
    expect(screen.getByRole('button')).toHaveTextContent('0')
  })
})
