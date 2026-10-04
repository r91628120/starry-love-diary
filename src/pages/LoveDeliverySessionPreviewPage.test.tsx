import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { I18nProvider } from '../i18n/I18nProvider'
import { LoveDeliverySessionPreviewPage } from './LoveDeliverySessionPreviewPage'

const renderSession = (initialState?: 'accepted' | 'completed') => render(<I18nProvider initialLocale="zh-TW"><MemoryRouter><LoveDeliverySessionPreviewPage initialState={initialState} /></MemoryRouter></I18nProvider>)
afterEach(cleanup)
describe('Love Delivery accepted session local preview', () => {
  it('renders accepted demo details with only a cancellation action', () => {
    renderSession()
    expect(screen.getByRole('status')).toHaveTextContent('這張戀愛外送單已成立')
    expect(screen.getByText('09:30–13:00')).toBeInTheDocument()
    expect(screen.getByText('一起去餵魚')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '取消這次邀約' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /完成|評分|星/u })).not.toBeInTheDocument()
  })
  it('dismisses and confirms cancellation without collecting a reason', () => {
    renderSession(); fireEvent.click(screen.getByRole('button', { name: '取消這次邀約' }))
    expect(screen.getByRole('dialog')).toHaveTextContent('取消這次邀約？')
    fireEvent.click(screen.getByRole('button', { name: '先不要' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument(); expect(screen.getByRole('button', { name: '取消這次邀約' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '取消這次邀約' })); fireEvent.click(screen.getByRole('button', { name: '確認取消' }))
    expect(screen.getByRole('status')).toHaveTextContent('這次戀愛外送單已取消')
    expect(screen.queryByRole('button', { name: '取消這次邀約' })).not.toBeInTheDocument()
    expect(document.querySelectorAll('textarea,input[type="tel"],input[type="email"]')).toHaveLength(0)
  })
  it('renders completed deterministically without manual completion or communication UI', () => {
    renderSession('completed')
    expect(screen.getByRole('status')).toHaveTextContent('這次戀愛外送單已完成')
    expect(screen.queryByRole('button', { name: /取消|完成|評分|回覆|通話/u })).not.toBeInTheDocument()
    expect(document.querySelectorAll('textarea,input[type="tel"],input[type="email"],a[href*="facetime" i]')).toHaveLength(0)
  })
})
