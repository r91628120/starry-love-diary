import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { I18nProvider } from '../../i18n/I18nProvider'
import { StarrySkySessionPreviewPage } from '../../pages/StarrySkySessionPreviewPage'
import { StarrySkyHistoryPreviewPage } from '../../pages/StarrySkyHistoryPreviewPage'
import { starrySkyTopicById } from './starrySkyTopics'

function renderSession(locale = 'zh-TW', initialStatus?: 'accepted' | 'cancelled' | 'completed', now = new Date('2026-12-21T20:00:00')) {
  return render(<I18nProvider initialLocale={locale as never}><MemoryRouter initialEntries={['/our/starry-sky/session-preview']}><Routes><Route path="/our/starry-sky/session-preview" element={<StarrySkySessionPreviewPage initialStatus={initialStatus} now={now} />} /><Route path="/our/starry-sky/history-preview" element={<StarrySkyHistoryPreviewPage />} /></Routes></MemoryRouter></I18nProvider>)
}

afterEach(cleanup)

describe('Starry Sky Phase 2D accepted session presentation', () => {
  it('renders the accepted route with the exact official Q002 source and 24-hour schedule', () => {
    const topic = starrySkyTopicById('Q002')
    renderSession()
    expect(screen.getByRole('heading', { level: 1, name: '💕 已約好的心話' })).toBeInTheDocument()
    expect(screen.getByText('✨ 心話時段已約好')).toBeInTheDocument()
    expect(screen.getByText('Q002')).toBeInTheDocument()
    expect(screen.getByText(topic?.text ?? '')).toBeInTheDocument()
    expect(screen.getByText('20:00–20:30')).toBeInTheDocument()
    expect(screen.getByText(/這裡不會開啟通話或聊天室/u)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /開始通話|加入聊天室/u })).not.toBeInTheDocument()
    expect(screen.queryByText(/24 小時/u)).not.toBeInTheDocument()
    expect(document.body.textContent).not.toMatch(/上午|下午|AM|PM/u)
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.queryByRole('textarea')).not.toBeInTheDocument()
  })

  it('uses a neutral cancellation confirmation without a reason and can safely dismiss it', () => {
    renderSession()
    fireEvent.click(screen.getByRole('button', { name: '取消這次心話' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('取消後，這次邀約不會算入心話次數，也不會留下完成紀錄。')).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '先不要' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByText('✨ 心話時段已約好')).toBeInTheDocument()
  })

  it('cancels locally without count or history UI and removes the cancellation action', () => {
    renderSession()
    fireEvent.click(screen.getByRole('button', { name: '取消這次心話' }))
    fireEvent.click(screen.getByRole('button', { name: '確認取消' }))
    expect(screen.getByText('這次心話已取消')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '取消這次心話' })).not.toBeInTheDocument()
    expect(screen.queryByText(/一起點亮/u)).not.toBeInTheDocument()
    expect(screen.queryByText(/完成紀錄/u)).toBeInTheDocument()
  })

  it('renders a deterministic completed presentation with no cancel or manual completion action', () => {
    renderSession('zh-TW', 'completed', new Date('2026-12-22T20:30:00'))
    expect(screen.getByText('✨ 這次心話已完成')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '取消這次心話' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /完成心話|我們聊完了|標記完成/u })).not.toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('offers a local history review path only after the deterministic completed presentation', () => {
    renderSession('zh-TW', 'completed', new Date('2026-12-22T20:30:00'))
    fireEvent.click(screen.getByRole('button', { name: '查看心話歷史（介面預覽）' }))
    expect(screen.getByRole('heading', { level: 1, name: '💕 心話歷史' })).toBeInTheDocument()
  })

  it('keeps the during-time presentation outside the app conversation channel', () => {
    renderSession('zh-TW', 'accepted', new Date('2026-12-22T20:15:00'))
    expect(screen.getByText('現在是你們約好的心話時間')).toBeInTheDocument()
    expect(screen.getByText('現在可以用你們平常習慣的方式聯絡，或直接見面聊聊。')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /開始通話|加入聊天室/u })).not.toBeInTheDocument()
  })

  it('localizes every shell while retaining the zh-TW official topic fallback', () => {
    for (const locale of ['zh-TW', 'en', 'ja', 'ko', 'es', 'fr']) {
      const view = renderSession(locale)
      expect(view.container.textContent).not.toMatch(/our\.starrySky\.session/u)
      expect(screen.getByText('什麼時候，你會特別感覺到「有你陪著真好」？')).toBeInTheDocument()
      expect(screen.getByText('20:00–20:30')).toBeInTheDocument()
      view.unmount()
    }
  })
})
