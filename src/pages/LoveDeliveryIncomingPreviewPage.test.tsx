import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { App } from '../app/App'
import { I18nProvider } from '../i18n/I18nProvider'

const renderIncoming = () => render(<I18nProvider initialLocale="zh-TW"><MemoryRouter initialEntries={['/our/love-delivery/incoming-preview']}><App /></MemoryRouter></I18nProvider>)
afterEach(cleanup)

describe('Love Delivery incoming local preview', () => {
  it('renders the deterministic received invitation without generic custom activity text', () => {
    renderIncoming()
    expect(screen.getByRole('heading', { level: 1, name: '💕 收到戀愛外送單' })).toBeInTheDocument()
    for (const text of ['一起去餵魚', '一包魚飼料', '最近有件事想跟你聊聊。', '六堆客家文化村', '不見不散喔。', '09:30–13:00']) expect(screen.getByText(text)).toBeInTheDocument()
    expect(screen.queryByText(/^✍️ 自訂$/u)).not.toBeInTheDocument()
  })

  it('uses local accepted and declined states with no reason or communication controls', () => {
    renderIncoming()
    fireEvent.click(screen.getByRole('button', { name: '接受邀約' }))
    expect(screen.getByRole('status')).toHaveTextContent('已接受戀愛外送單（介面預覽）')
    fireEvent.click(screen.getByRole('button', { name: '查看已成立的戀愛外送單' }))
    expect(screen.getByRole('heading', { level: 1, name: '💕 已成立的戀愛外送單' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '接受邀約' })).not.toBeInTheDocument()
    cleanup(); renderIncoming()
    fireEvent.click(screen.getByRole('button', { name: '婉拒' }))
    expect(screen.getByRole('status')).toHaveTextContent('已婉拒戀愛外送單（介面預覽）')
    expect(document.querySelectorAll('textarea,input[type="tel"],input[type="email"]')).toHaveLength(0)
    expect(within(screen.getByRole('status')).queryByRole('button')).not.toBeInTheDocument()
  })
})
