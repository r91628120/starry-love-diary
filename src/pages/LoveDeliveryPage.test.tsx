import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { App } from '../app/App'
import { I18nProvider } from '../i18n/I18nProvider'
import type { Locale } from '../i18n/messages'

function renderDelivery(locale: Locale = 'zh-TW', path = '/our/love-delivery') {
  return render(<I18nProvider initialLocale={locale}><MemoryRouter initialEntries={[path]}><App /></MemoryRouter></I18nProvider>)
}

function chooseTime(trigger: '開始時間' | '結束時間', hour: string, minute: string) {
  fireEvent.click(screen.getByRole('button', { name: trigger }))
  const dialog = screen.getByRole('dialog')
  fireEvent.change(within(dialog).getByLabelText('小時'), { target: { value: hour } })
  fireEvent.change(within(dialog).getByLabelText('分鐘'), { target: { value: minute } })
  fireEvent.click(within(dialog).getByRole('button', { name: '確認' }))
}

afterEach(cleanup)

describe('Love Delivery local presentation', () => {
  it('adds the Our entry and opens the local Love Delivery route', () => {
    renderDelivery('zh-TW', '/our')
    const entry = screen.getByRole('button', { name: /戀愛外送單/u })
    expect(entry).toHaveTextContent('把喜歡做出來。')
    fireEvent.click(entry)
    expect(screen.getByRole('heading', { level: 1, name: '💕 戀愛外送單' })).toBeInTheDocument()
  })

  it('keeps the feature title in the page header and gives the Hero to Song Song', () => {
    renderDelivery()
    expect(screen.getAllByRole('heading', { name: '💕 戀愛外送單' })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 2, name: '把一個「我想靠近你一下」送出去 ✨' })).toBeInTheDocument()
    expect(screen.getByText(/一杯飲料、一份早餐、一段散步，\s*或只是想見你一下。/u)).toBeInTheDocument()
    const mascot = screen.getByRole('img', { name: '戀愛外送員送送騎著粉紅機車送出心意' })
    expect(mascot).toHaveAttribute('src', '/assets/love-delivery/love-delivery-hero-cat.png')
    expect(mascot).toHaveClass('love-delivery-hero__art')
    expect(document.querySelector('.love-delivery-hero__mascot')).not.toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /^我想和你……/u })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '發出邀約' })).toBeInTheDocument()
  })

  it('uses grapheme-safe limits for longer text and item fields', () => {
    renderDelivery()
    const content = screen.getByRole('textbox', { name: /^我想和你……/u })
    const item = screen.getByRole('textbox', { name: /^想送給你什麼？/u })
    fireEvent.change(content, { target: { value: '👩‍❤️‍👨'.repeat(1001) } })
    fireEvent.change(item, { target: { value: '❤️'.repeat(201) } })
    expect((content as HTMLTextAreaElement).value).toHaveLength('👩‍❤️‍👨'.repeat(1000).length)
    expect((item as HTMLInputElement).value).toHaveLength('❤️'.repeat(200).length)
    expect(screen.getAllByText('1000 / 1000')).toHaveLength(1)
    expect(screen.getByText('200 / 200')).toBeInTheDocument()
  })

  it('keeps the optional topic separate and previews only populated fields', () => {
    renderDelivery()
    fireEvent.click(screen.getByRole('button', { name: '🌙 散散步' }))
    fireEvent.change(screen.getByRole('textbox', { name: /^想聊什麼？/u }), { target: { value: '最近最想一起完成什麼？' } })
    fireEvent.click(screen.getByRole('button', { name: '預覽邀約' }))
    const preview = document.querySelector('.love-delivery-preview') as HTMLElement
    expect(within(preview).getByText('🌙 散散步')).toBeInTheDocument()
    expect(within(preview).getByText('最近最想一起完成什麼？')).toBeInTheDocument()
    expect(within(preview).queryByText('想送給你什麼？')).not.toBeInTheDocument()
    expect(within(preview).queryByText('補充一句')).not.toBeInTheDocument()
  })

  it('supports the breakfast and drink invitation examples without requiring every field', () => {
    renderDelivery()
    fireEvent.click(screen.getByRole('button', { name: '🍽️ 一起吃飯' }))
    fireEvent.change(screen.getByRole('textbox', { name: /^我想和你……/u }), { target: { value: '明天幫你買早餐' } })
    fireEvent.change(screen.getByRole('textbox', { name: /^想送給你什麼？/u }), { target: { value: '蛋餅＋豆漿' } })
    fireEvent.change(screen.getByLabelText('日期'), { target: { value: '2026-10-04' } })
    fireEvent.change(screen.getByRole('textbox', { name: /^地點/u }), { target: { value: '教室外面' } })
    fireEvent.click(screen.getByRole('button', { name: '預覽邀約' }))
    let preview = document.querySelector('.love-delivery-preview') as HTMLElement
    for (const text of ['明天幫你買早餐', '蛋餅＋豆漿', '教室外面']) expect(within(preview).getByText(text)).toBeInTheDocument()

    cleanup()
    renderDelivery()
    fireEvent.click(screen.getByRole('button', { name: '🧋 喝點東西' }))
    fireEvent.change(screen.getByRole('textbox', { name: /^想送給你什麼？/u }), { target: { value: '兩杯珍珠奶茶' } })
    fireEvent.change(screen.getByRole('textbox', { name: /^地點/u }), { target: { value: '你家附近' } })
    fireEvent.click(screen.getByRole('button', { name: '預覽邀約' }))
    preview = document.querySelector('.love-delivery-preview') as HTMLElement
    expect(within(preview).getByText('兩杯珍珠奶茶')).toBeInTheDocument()
    expect(within(preview).getByText('你家附近')).toBeInTheDocument()
  })

  it('caps the optional custom topic at 1000 grapheme clusters', () => {
    renderDelivery()
    const topic = screen.getByRole('textbox', { name: /^想聊什麼？/u })
    fireEvent.change(topic, { target: { value: '👩‍❤️‍👨'.repeat(1001) } })
    expect((topic as HTMLTextAreaElement).value).toHaveLength('👩‍❤️‍👨'.repeat(1000).length)
    expect(screen.getAllByText('1000 / 1000')).toHaveLength(1)
  })

  it('uses independent app-controlled HH:mm pickers, including every hour and minute', () => {
    renderDelivery()
    fireEvent.click(screen.getByRole('button', { name: '💕 見個面' }))
    fireEvent.click(screen.getByRole('button', { name: '開始時間' }))
    const startDialog = screen.getByRole('dialog')
    expect(within(startDialog).getByLabelText('小時').querySelectorAll('option')).toHaveLength(24)
    expect(within(startDialog).getByLabelText('分鐘').querySelectorAll('option')).toHaveLength(60)
    fireEvent.change(within(startDialog).getByLabelText('小時'), { target: { value: '23' } })
    fireEvent.change(within(startDialog).getByLabelText('分鐘'), { target: { value: '59' } })
    fireEvent.click(within(startDialog).getByRole('button', { name: '確認' }))
    expect(screen.getByRole('button', { name: '開始時間' })).toHaveTextContent('23:59')
    fireEvent.click(screen.getByRole('button', { name: '結束時間' }))
    fireEvent.change(within(screen.getByRole('dialog')).getByLabelText('小時'), { target: { value: '20' } })
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: '取消' }))
    expect(screen.getByRole('button', { name: '結束時間' })).toHaveTextContent('HH:mm')
    chooseTime('結束時間', '23', '59')
    fireEvent.click(screen.getByRole('button', { name: '預覽邀約' }))
    expect(screen.getByRole('alert')).toHaveTextContent('結束時間需要晚於開始時間。')
    chooseTime('開始時間', '21', '15')
    fireEvent.click(screen.getByRole('button', { name: '預覽邀約' }))
    expect(screen.getByText('21:15–23:59')).toBeInTheDocument()
    expect(screen.queryByText(/AM|PM|上午|下午/u)).not.toBeInTheDocument()
  })

  it('keeps date and start time optional, but blocks end-only and reversed times', () => {
    renderDelivery()
    fireEvent.click(screen.getByRole('button', { name: '✨ 一起做件事' }))
    fireEvent.click(screen.getByRole('button', { name: '預覽邀約' }))
    expect(within(document.querySelector('.love-delivery-preview') as HTMLElement).queryByText('時間')).not.toBeInTheDocument()
    cleanup()
    renderDelivery()
    fireEvent.click(screen.getByRole('button', { name: '✨ 一起做件事' }))
    chooseTime('結束時間', '20', '00')
    fireEvent.click(screen.getByRole('button', { name: '預覽邀約' }))
    expect(screen.getByRole('alert')).toHaveTextContent('請先選擇開始時間。')
    chooseTime('開始時間', '21', '00')
    fireEvent.click(screen.getByRole('button', { name: '預覽邀約' }))
    expect(screen.getByRole('alert')).toHaveTextContent('結束時間需要晚於開始時間。')
    chooseTime('結束時間', '21', '30')
    fireEvent.click(screen.getByRole('button', { name: '預覽邀約' }))
    expect(screen.getByText('21:00–21:30')).toBeInTheDocument()
  })

  it('reveals a grapheme-safe custom activity only for the custom type and retains it locally', () => {
    renderDelivery()
    expect(screen.queryByRole('textbox', { name: /^你想自訂什麼？/u })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '✍️ 自訂' }))
    const customType = screen.getByRole('textbox', { name: /^你想自訂什麼？/u })
    expect(screen.getByText('寫下這次邀約想做的事情。')).toBeInTheDocument()
    fireEvent.change(customType, { target: { value: '👩‍❤️‍👨'.repeat(201) } })
    expect((customType as HTMLInputElement).value).toHaveLength('👩‍❤️‍👨'.repeat(200).length)
    expect(screen.getByText('200 / 200')).toBeInTheDocument()
    fireEvent.change(customType, { target: { value: '陪我去買東西' } })
    fireEvent.click(screen.getByRole('button', { name: '🍽️ 一起吃飯' }))
    expect(screen.queryByRole('textbox', { name: /^你想自訂什麼？/u })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '✍️ 自訂' }))
    expect(screen.getByRole('textbox', { name: /^你想自訂什麼？/u })).toHaveValue('陪我去買東西')
  })

  it('requires custom activity text and uses it instead of the generic custom label in previews', () => {
    renderDelivery()
    fireEvent.click(screen.getByRole('button', { name: '✍️ 自訂' }))
    fireEvent.click(screen.getByRole('button', { name: '預覽邀約' }))
    expect(screen.getByRole('alert')).toHaveTextContent('請寫下你想自訂的邀約。')
    fireEvent.change(screen.getByRole('textbox', { name: /^你想自訂什麼？/u }), { target: { value: '一起去餵貓' } })
    fireEvent.click(screen.getByRole('button', { name: '發出邀約' }))
    const preview = document.querySelector('.love-delivery-preview') as HTMLElement
    expect(within(preview).getByText('一起去餵貓')).toBeInTheDocument()
    expect(within(preview).queryByText('✍️ 自訂')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('creates only a deterministic UI preview with no communication or contact controls', () => {
    renderDelivery()
    fireEvent.click(screen.getByRole('button', { name: '✨ 一起做件事' }))
    fireEvent.click(screen.getByRole('button', { name: '發出邀約' }))
    expect(screen.getByRole('status')).toHaveTextContent('戀愛外送單已建立（介面預覽）')
    expect(document.querySelectorAll('input[type="tel"], input[type="email"]')).toHaveLength(0)
    expect(document.querySelectorAll('input[type="file"], a[href*="line" i], a[href*="facetime" i]')).toHaveLength(0)
    for (const unavailable of ['開始通話', '加入聊天室', '傳送訊息', '選擇聯絡人']) expect(screen.queryByRole('button', { name: unavailable })).not.toBeInTheDocument()
  })

  it.each(['zh-TW', 'en', 'ja', 'ko', 'es', 'fr'] as const)('resolves the Love Delivery shell for %s without locale-dependent time wording', (locale) => {
    renderDelivery(locale)
    expect(screen.getByRole('heading', { level: 1 })).not.toHaveTextContent('our.loveDelivery')
    fireEvent.click(document.querySelector('.love-delivery-time-trigger') as HTMLButtonElement)
    expect(screen.getByRole('dialog')).not.toHaveTextContent('our.loveDelivery')
    expect(screen.queryByText(/AM|PM|上午|下午/u)).not.toBeInTheDocument()
  })

  it('portals the picker outside the isolated page while retaining its actions', () => {
    renderDelivery()
    const opener = screen.getByRole('button', { name: '開始時間' })
    opener.focus()
    fireEvent.click(opener)
    const dialog = screen.getByRole('dialog')
    expect(dialog.closest('.love-delivery-time-picker-backdrop')?.parentElement).toBe(document.body)
    expect(dialog.closest('.modal-overlay')).toHaveClass('modal-overlay--bottom-sheet')
    expect(document.body.style.overflow).toBe('hidden')
    expect(within(dialog).getByRole('button', { name: '取消' })).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: '確認' })).toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole('button', { name: '取消' }))
    expect(document.body.style.overflow).toBe('')
    expect(document.activeElement).toBe(opener)
  })
})
