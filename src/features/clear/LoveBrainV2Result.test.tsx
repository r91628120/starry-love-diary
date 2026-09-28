import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { PersistenceProvider } from '../../data/PersistenceContext'
import { initializePersistence } from '../../data/persistence'
import { MemoryStorageAdapter } from '../../data/storage/MemoryStorageAdapter'
import { I18nProvider } from '../../i18n/I18nProvider'
import { LOVE_BRAIN_KEYS } from '../../data/repositories/clearRepositories'
import { LoveBrainRecordResult } from './LoveBrainFlow'

afterEach(cleanup)

describe('Love Brain V2 result', () => {
  it('renders five dimensions and saves then clears an optional note on the same record', async () => {
    const runtime = await initializePersistence({ adapter: new MemoryStorageAdapter(), defaultLocale: 'zh-TW', localDate: '2026-09-27' })
    const draft = await runtime.loveBrainAssessments.createDraft()
    await runtime.loveBrainAssessments.updateDraft(draft.id, { answers: Object.fromEntries(LOVE_BRAIN_KEYS.map((key) => [key, 1])) })
    const record = await runtime.loveBrainAssessments.complete(draft.id)
    function ResultHarness() {
      const [current, setCurrent] = useState(record)
      return <LoveBrainRecordResult record={current} onRecordChange={setCurrent} />
    }
    render(<PersistenceProvider runtime={runtime}><I18nProvider initialLocale="zh-TW"><ResultHarness /></I18nProvider></PersistenceProvider>)
    expect(screen.getByText('最近的你，可能有些心力一直留在這段關係裡')).toBeInTheDocument()
    expect(screen.getAllByRole('progressbar')).toHaveLength(5)
    fireEvent.click(screen.getByRole('button', { name: '編輯' }))
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '我想多說一點 ❤️' } })
    fireEvent.click(screen.getByRole('button', { name: '儲存' }))
    await waitFor(async () => expect((await runtime.loveBrainAssessments.getById(record.id))?.noteToSay).toBe('我想多說一點 ❤️'))
    fireEvent.click(screen.getByRole('button', { name: '編輯' }))
    fireEvent.click(screen.getByRole('button', { name: '清除' }))
    fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: '清除' }))
    await waitFor(async () => expect((await runtime.loveBrainAssessments.getById(record.id))?.noteToSay).toBeUndefined())
  })
})
