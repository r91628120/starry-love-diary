import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { I18nProvider } from '../../i18n/I18nProvider'
import { StarrySkyHistoryPreviewPage } from '../../pages/StarrySkyHistoryPreviewPage'
import { StarrySkyPage } from '../../pages/StarrySkyPage'

function renderHistory() {
  return render(<I18nProvider initialLocale="zh-TW"><MemoryRouter initialEntries={['/our/starry-sky/history-preview']}><Routes><Route path="/our/starry-sky/history-preview" element={<StarrySkyHistoryPreviewPage />} /><Route path="/our/starry-sky" element={<StarrySkyPage />} /></Routes></MemoryRouter></I18nProvider>)
}

afterEach(cleanup)

describe('Starry Sky History preview', () => {
  it('starts from four deterministic in-memory records, all collapsed, without changing the production home count', () => {
    const view = renderHistory()
    expect(screen.getByText('⭐ 我們已一起點亮 4 次心話')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { expanded: false })).toHaveLength(4)
    expect(screen.queryByRole('button', { name: '刪除此紀錄' })).not.toBeInTheDocument()
    expect(view.container.textContent).not.toContain('這是一個不能留下的自訂題目')
  })

  it('expands and collapses one record only, exposing metadata and delete action', () => {
    renderHistory()
    const toggles = screen.getAllByRole('button', { expanded: false })
    fireEvent.click(toggles[0])
    expect(toggles[0]).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getAllByRole('button', { expanded: false })).toHaveLength(3)
    expect(screen.getByRole('button', { name: '刪除此紀錄' })).toBeInTheDocument()
    fireEvent.click(toggles[0])
    expect(screen.getAllByRole('button', { expanded: false })).toHaveLength(4)
  })

  it('requires confirmation for preview single deletion and derives the count from remaining records', () => {
    renderHistory()
    fireEvent.click(screen.getAllByRole('button', { expanded: false })[0])
    fireEvent.click(screen.getByRole('button', { name: '刪除此紀錄' }))
    expect(screen.getByRole('dialog')).toHaveTextContent('刪除這筆心話紀錄？')
    expect(screen.getByRole('dialog').querySelector('.starry-sky-history-confirm__card')).toBeTruthy()
    expect(screen.getByRole('dialog').querySelector('.starry-sky-history-confirm__actions')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: '取消' }))
    expect(screen.getByText('⭐ 我們已一起點亮 4 次心話')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '刪除此紀錄' }))
    fireEvent.click(screen.getByRole('button', { name: '刪除紀錄' }))
    expect(screen.getByText('⭐ 我們已一起點亮 3 次心話')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { expanded: false })).toHaveLength(3)
  })

  it('requires confirmation for clear-all, then shows the shared empty state; remount restores fixtures', () => {
    const view = renderHistory()
    fireEvent.click(screen.getByRole('button', { name: '清除全部紀錄' }))
    expect(screen.getByRole('dialog').querySelector('.starry-sky-history-confirm__card')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: '取消' }))
    expect(screen.getByText('⭐ 我們已一起點亮 4 次心話')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '清除全部紀錄' }))
    fireEvent.click(screen.getByRole('button', { name: '全部清除' }))
    expect(screen.getByText('⭐ 我們已一起點亮 0 次心話')).toBeInTheDocument()
    expect(screen.getByText('還沒有心話紀錄')).toBeInTheDocument()
    view.unmount()
    renderHistory()
    expect(screen.getByText('⭐ 我們已一起點亮 4 次心話')).toBeInTheDocument()
  })

  it('keeps official source text and custom privacy boundary in the compact presentation', () => {
    const view = renderHistory()
    expect(screen.getByText('Q002')).toBeInTheDocument()
    expect(screen.getByText('什麼時候，你會特別感覺到「有你陪著真好」？')).toBeInTheDocument()
    expect(screen.getByText('✨ 自訂題目')).toBeInTheDocument()
    expect(view.container.textContent).not.toContain('自訂題目內容')
  })
})
