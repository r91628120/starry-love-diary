import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { I18nProvider } from '../../i18n/I18nProvider'
import { StarrySkyHistoryPreviewPage } from '../../pages/StarrySkyHistoryPreviewPage'
import { StarrySkyPage } from '../../pages/StarrySkyPage'
import { starrySkyTopicById } from './starrySkyTopics'

function renderHistory(locale = 'zh-TW', records?: Parameters<typeof StarrySkyHistoryPreviewPage>[0]['records']) {
  return render(<I18nProvider initialLocale={locale as never}><MemoryRouter initialEntries={['/our/starry-sky/history-preview']}><Routes><Route path="/our/starry-sky/history-preview" element={<StarrySkyHistoryPreviewPage records={records} />} /><Route path="/our/starry-sky" element={<StarrySkyPage />} /></Routes></MemoryRouter></I18nProvider>)
}

afterEach(cleanup)

describe('Starry Sky Phase 2E history and lit-count presentation', () => {
  it('derives the Home count from deterministic completed records and opens history', () => {
    render(<I18nProvider initialLocale="zh-TW"><MemoryRouter initialEntries={['/our/starry-sky']}><Routes><Route path="/our/starry-sky" element={<StarrySkyPage />} /><Route path="/our/starry-sky/history-preview" element={<StarrySkyHistoryPreviewPage />} /></Routes></MemoryRouter></I18nProvider>)
    expect(screen.getByText('⭐ 我們已一起點亮 4 次心話')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '查看心話歷史' }))
    expect(screen.getByRole('heading', { level: 1, name: '💕 心話歷史' })).toBeInTheDocument()
  })

  it('renders newest-first year, month, and day groups with official source text and 24-hour times', () => {
    const topic = starrySkyTopicById('Q002')
    renderHistory()
    expect(screen.getByText('2026')).toBeInTheDocument()
    expect(screen.getByText('12月22日')).toBeInTheDocument()
    expect(screen.getByText('11月3日')).toBeInTheDocument()
    expect(screen.getByText('Q002')).toBeInTheDocument()
    expect(screen.getByText(topic?.text ?? '')).toBeInTheDocument()
    expect(screen.getByText('20:00–20:30')).toBeInTheDocument()
    expect(document.body.textContent).not.toMatch(/上午|下午|AM|PM/u)
    const dates = screen.getAllByText(/2026年/u)
    expect(dates).toHaveLength(4)
  })

  it('shows custom history without retaining or rendering a raw custom prompt', () => {
    const view = renderHistory()
    expect(screen.getByText('✨ 自訂題目')).toBeInTheDocument()
    expect(view.container.textContent).not.toContain('這是一個不能留下的自訂題目')
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.queryByRole('textarea')).not.toBeInTheDocument()
  })

  it('supports the deterministic empty state with a zero derived count', () => {
    renderHistory('zh-TW', [])
    expect(screen.getByText('⭐ 我們已一起點亮 0 次心話')).toBeInTheDocument()
    expect(screen.getByText('還沒有點亮的心話')).toBeInTheDocument()
    expect(screen.queryByText('Q002')).not.toBeInTheDocument()
  })

  it('localizes every shell while retaining official zh-TW topic text and fixed HH:mm values', () => {
    for (const locale of ['zh-TW', 'en', 'ja', 'ko', 'es', 'fr']) {
      const view = renderHistory(locale)
      expect(view.container.textContent).not.toMatch(/our\.starrySky\.history/u)
      expect(screen.getByText('什麼時候，你會特別感覺到「有你陪著真好」？')).toBeInTheDocument()
      expect(screen.getByText('20:00–20:30')).toBeInTheDocument()
      view.unmount()
    }
  })
})
