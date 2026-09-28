import { useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { ClearFreeTalkRecord } from '../../data/clearTypes'
import { I18nProvider } from '../../i18n/I18nProvider'
import { AiHandoffReflection } from './AiHandoffReflection'

const record: ClearFreeTalkRecord = { id: 'same-record', text: '原本想說的話', status: 'completed', localDate: '2026-09-28', timezone: 'Asia/Taipei', createdAt: '2026-09-28T00:00:00.000Z', updatedAt: '2026-09-28T00:00:00.000Z' }
function Harness() {
  const [value, setValue] = useState(record)
  return <><output data-testid="record">{JSON.stringify(value)}</output><AiHandoffReflection record={value} onSave={async (changes) => { const next = { ...value, ...changes, updatedAt: '2026-09-28T01:00:00.000Z' }; setValue(next); return next }} /></>
}

describe('AI handoff reflection editor', () => {
  it('keeps over-limit text editable, then saves it back onto the same record after it is shortened', async () => {
    render(<I18nProvider initialLocale="zh-TW"><Harness /></I18nProvider>)
    fireEvent.click(screen.getByRole('button', { name: '＋ 貼上想留下的 AI 回覆' }))
    const response = screen.getByRole('textbox', { name: 'AI 回覆精選' })
    fireEvent.change(response, { target: { value: 'A'.repeat(5001) } })
    expect(response).toHaveValue('A'.repeat(5001))
    expect(screen.getByRole('alert')).toHaveTextContent('超過 5000 字')
    expect(screen.getByRole('button', { name: '儲存' })).toBeDisabled()
    fireEvent.change(response, { target: { value: 'A'.repeat(5000) } })
    fireEvent.click(screen.getByRole('button', { name: '儲存' }))
    expect(await screen.findByTestId('record')).toHaveTextContent('"id":"same-record"')
    expect(screen.getByTestId('record')).toHaveTextContent('A'.repeat(5000))
    fireEvent.click(screen.getByRole('button', { name: '＋ 寫下我的整理' }))
    const reflection = screen.getByRole('textbox', { name: '聊完後，我現在怎麼想？' })
    fireEvent.change(reflection, { target: { value: 'B'.repeat(2001) } })
    expect(screen.getAllByRole('alert')[0]).toHaveTextContent('超過 2000 字')
    expect(reflection).toHaveValue('B'.repeat(2001))
  })
})
