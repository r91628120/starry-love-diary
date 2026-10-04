import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { I18nProvider } from '../../i18n/I18nProvider'
import { StarrySkyIncomingInvitationPage } from '../../pages/StarrySkyIncomingInvitationPage'
import { starrySkyTopicById } from './starrySkyTopics'

function renderIncoming(locale = 'zh-TW') {
  return render(<I18nProvider initialLocale={locale as never}><MemoryRouter initialEntries={['/our/starry-sky/invitation-preview']}><Routes><Route path="/our/starry-sky/invitation-preview" element={<StarrySkyIncomingInvitationPage />} /></Routes></MemoryRouter></I18nProvider>)
}

afterEach(cleanup)

describe('Starry Sky Phase 2C incoming invitation presentation', () => {
  it('renders the dedicated route with the exact official Q002 source and fixed 24-hour time', () => {
    const topic = starrySkyTopicById('Q002')
    renderIncoming()
    expect(screen.getByRole('heading', { level: 1, name: '💕 收到心話邀約' })).toBeInTheDocument()
    expect(screen.getByText('Q002')).toBeInTheDocument()
    expect(screen.getByText(topic?.text ?? '')).toBeInTheDocument()
    expect(screen.getByText('20:00–20:30')).toBeInTheDocument()
    expect(screen.getByText(/正式邀約將在 24 小時內/u)).toBeInTheDocument()
    expect(screen.getByText(/這個邀約會幫你們約好話題與時間/u)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /開始通話|加入聊天室/u })).not.toBeInTheDocument()
    expect(document.body.textContent).not.toMatch(/上午|下午|AM|PM/u)
  })

  it('accepts only as an in-memory presentation result and prevents a second decision', () => {
    renderIncoming()
    fireEvent.click(screen.getByRole('button', { name: '接受邀約' }))
    expect(screen.getByText('已接受邀約（介面預覽）')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '接受邀約' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '婉拒' })).toBeDisabled()
    expect(screen.queryByRole('button', { name: /開始通話|加入聊天室/u })).not.toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.queryByRole('textarea')).not.toBeInTheDocument()
  })

  it('declines without collecting a reason and resets after a new local render', () => {
    const first = renderIncoming()
    fireEvent.click(screen.getByRole('button', { name: '婉拒' }))
    expect(screen.getByText('已婉拒邀約（介面預覽）')).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    first.unmount()
    renderIncoming()
    expect(screen.queryByText('已婉拒邀約（介面預覽）')).not.toBeInTheDocument()
  })

  it('localizes every page shell while retaining the bounded zh-TW official topic fallback', () => {
    for (const locale of ['zh-TW', 'en', 'ja', 'ko', 'es', 'fr']) {
      const view = renderIncoming(locale)
      expect(view.container.textContent).not.toMatch(/our\.starrySky\.incoming/u)
      expect(screen.getByText('什麼時候，你會特別感覺到「有你陪著真好」？')).toBeInTheDocument()
      expect(screen.getByText('20:00–20:30')).toBeInTheDocument()
      view.unmount()
    }
  })
})
