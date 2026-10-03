import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { I18nProvider } from '../../i18n/I18nProvider'
import { StarrySkyInvitePage } from '../../pages/StarrySkyInvitePage'
import { StarrySkyTopicsPage } from '../../pages/StarrySkyTopicsPage'
import { toLocalDate } from '../../services/localDateService'

function renderInvite(path = '/our/starry-sky/invite?topic=Q001', locale = 'zh-TW') {
  return render(<I18nProvider initialLocale={locale as never}><MemoryRouter initialEntries={[path]}><Routes><Route path="/our/starry-sky/invite" element={<StarrySkyInvitePage />} /><Route path="/our/starry-sky/topics" element={<StarrySkyTopicsPage />} /></Routes></MemoryRouter></I18nProvider>)
}
afterEach(cleanup)

describe('Starry Sky Phase 2B invitation presentation', () => {
  it('resolves a valid official Q ID and keeps the exact official source text', () => {
    renderInvite()
    expect(screen.getByText('Q001')).toBeInTheDocument()
    expect(screen.getByText('當你和我相處的時候，你內心最常有什麼感受？')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(7)
    expect(screen.getByRole('button', { name: '開始時間' })).toHaveTextContent('20:00')
    expect(screen.getByRole('button', { name: '結束時間' })).toHaveTextContent('20:30')
  })
  it('uses a safe select-topic state for invalid or missing topic IDs', () => {
    const invalid = renderInvite('/our/starry-sky/invite?topic=Q999')
    expect(screen.getByText('尚未選擇有效題目')).toBeInTheDocument()
    invalid.unmount()
    renderInvite('/our/starry-sky/invite')
    expect(screen.getByText('尚未選擇有效題目')).toBeInTheDocument()
  })
  it('recenters the quick-date window around a far local selection without exposing past dates', () => {
    const { container } = renderInvite()
    const year = new Date().getFullYear() + 1
    const selected = `${year}-12-16`
    fireEvent.change(screen.getByLabelText('選擇日期'), { target: { value: selected } })
    const dates = [...container.querySelectorAll<HTMLElement>('[data-local-date]')].map((element) => element.dataset.localDate)
    expect(dates).toEqual([`${year}-12-13`,`${year}-12-14`,`${year}-12-15`,`${year}-12-16`,`${year}-12-17`,`${year}-12-18`,`${year}-12-19`])
    expect(container.querySelector(`[data-local-date="${selected}"]`)).toHaveAttribute('aria-pressed', 'true')
    expect(dates.every((date) => date && date >= toLocalDate())).toBe(true)
  })
  it('keeps month and year boundaries in the regenerated local-date window', () => {
    const { container } = renderInvite()
    const year = new Date().getFullYear() + 1
    fireEvent.change(screen.getByLabelText('選擇日期'), { target: { value: `${year}-01-01` } })
    expect([...container.querySelectorAll<HTMLElement>('[data-local-date]')].map((element) => element.dataset.localDate)).toEqual([`${year - 1}-12-29`,`${year - 1}-12-30`,`${year - 1}-12-31`,`${year}-01-01`,`${year}-01-02`,`${year}-01-03`,`${year}-01-04`])
  })
  it('keeps date and time only in component state, blocks invalid time, and shows a local preview', () => {
    const view = renderInvite()
    const dates = screen.getAllByRole('listitem')
    fireEvent.click(dates[1]); expect(dates[1]).toHaveAttribute('aria-pressed', 'true')
    const otherDate = screen.getByLabelText('選擇日期')
    fireEvent.change(otherDate, { target: { value: '2000-01-01' } })
    expect(screen.getByRole('alert')).toHaveTextContent('不能選擇過去日期。')
    fireEvent.click(screen.getByRole('button', { name: '開始時間' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('時'), { target: { value: '23' } }); fireEvent.change(screen.getByLabelText('分'), { target: { value: '59' } }); fireEvent.click(screen.getByRole('button', { name: '確認' }))
    expect(screen.getByRole('button', { name: '開始時間' })).toHaveTextContent('23:59')
    fireEvent.click(screen.getByRole('button', { name: '結束時間' })); fireEvent.change(screen.getByLabelText('時'), { target: { value: '22' } }); fireEvent.change(screen.getByLabelText('分'), { target: { value: '00' } }); fireEvent.click(screen.getByRole('button', { name: '確認' }))
    fireEvent.click(screen.getByRole('button', { name: '發出心話邀約' }))
    expect(screen.getByRole('alert')).toHaveTextContent('結束時間必須晚於開始時間。')
    fireEvent.click(screen.getByRole('button', { name: '開始時間' })); fireEvent.change(screen.getByLabelText('時'), { target: { value: '21' } }); fireEvent.change(screen.getByLabelText('分'), { target: { value: '15' } }); fireEvent.click(screen.getByRole('button', { name: '確認' }))
    fireEvent.click(screen.getByRole('button', { name: '結束時間' })); fireEvent.change(screen.getByLabelText('分'), { target: { value: '30' } }); fireEvent.click(screen.getByRole('button', { name: '取消' }))
    expect(screen.getByRole('button', { name: '結束時間' })).toHaveTextContent('22:00')
    fireEvent.click(screen.getByRole('button', { name: '發出心話邀約' }))
    expect(screen.getByText('心話邀約預覽完成')).toBeInTheDocument()
    expect(screen.getByText('21:15 – 22:00')).toBeInTheDocument()
    expect(view.container.textContent).not.toMatch(/上午|下午|AM|PM/u)
    view.unmount(); renderInvite()
    expect(screen.queryByText('心話邀約預覽完成')).not.toBeInTheDocument()
  })
  it('localizes every shell while retaining the zh-TW official topic fallback', () => {
    for (const locale of ['zh-TW', 'en', 'ja', 'ko', 'es', 'fr']) {
      const view = renderInvite('/our/starry-sky/invite?topic=Q001', locale)
      expect(view.container.textContent).not.toMatch(/our\.starrySky\.invite/u)
      expect(screen.getByText('當你和我相處的時候，你內心最常有什麼感受？')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Start time|開始時間|시작 시간|Hora de inicio|Heure de début/u })).toHaveTextContent('20:00')
      view.unmount()
    }
  })
})
