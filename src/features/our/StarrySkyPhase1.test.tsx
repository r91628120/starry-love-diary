import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { I18nProvider } from '../../i18n/I18nProvider'
import { supportedLocales, type Locale } from '../../i18n/messages'
import { StarrySkyEntryCard } from './StarrySkyEntryCard'
import { StarrySkyPage } from '../../pages/StarrySkyPage'

function renderStarrySky(initialPath = '/our', locale: Locale = 'zh-TW') {
  return render(<I18nProvider initialLocale={locale}><MemoryRouter initialEntries={[initialPath]}><Routes><Route path="/our" element={<StarrySkyEntryCard />} /><Route path="/our/starry-sky" element={<StarrySkyPage />} /></Routes></MemoryRouter></I18nProvider>)
}

afterEach(cleanup)

describe('Starry Sky Phase 1', () => {
  it('opens the unpaired page from the accessible entry without a numeric history count', () => {
    renderStarrySky()
    const entry = screen.getByRole('button', { name: /我們的星空/u })
    expect(entry).toHaveTextContent('配對後，這裡會留下你們一起打開的交換日記')
    expect(entry).toHaveTextContent('我們已一起點亮 0 篇交換日記')
    expect(entry).not.toHaveTextContent(/28 篇/u)
    fireEvent.click(entry)
    expect(screen.getByRole('heading', { level: 1, name: '💕 我們的星空' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '邀請另一半' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '輸入配對碼' })).toBeInTheDocument()
  })

  it('keeps invite UI transient and returns to the unpaired state', () => {
    renderStarrySky('/our/starry-sky')
    fireEvent.click(screen.getByRole('button', { name: '邀請另一半' }))
    expect(screen.getByRole('heading', { level: 2, name: '邀請另一半' })).toBeInTheDocument()
    expect(screen.queryByText(/https?:\/\//u)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '取消' }))
    expect(screen.getByRole('button', { name: '輸入配對碼' })).toBeInTheDocument()
  })

  it('filters the transient pairing code to six digits and can cancel it', () => {
    renderStarrySky('/our/starry-sky')
    fireEvent.click(screen.getByRole('button', { name: '輸入配對碼' }))
    const input = screen.getByRole('textbox', { name: '輸入 6 位數配對碼' })
    fireEvent.change(input, { target: { value: '12a345678' } })
    expect(input).toHaveValue('123456')
    fireEvent.click(screen.getByRole('button', { name: '取消' }))
    expect(screen.getByRole('button', { name: '邀請另一半' })).toBeInTheDocument()
  })

  it('uses the page-header fallback to return to Our', () => {
    renderStarrySky('/our/starry-sky')
    fireEvent.click(screen.getByRole('button', { name: '返回' }))
    expect(screen.getByRole('button', { name: /我們的星空/u })).toBeInTheDocument()
  })

  it.each(supportedLocales)('renders Starry Sky strings and the empty shared count without raw keys in %s', (locale) => {
    const view = renderStarrySky('/our', locale)
    expect(view.container.textContent).not.toMatch(/our\.starrySky\./u)
    expect(screen.getByRole('button')).toHaveTextContent('🌟')
    expect(screen.getByRole('button')).toHaveTextContent('0')
  })
})
