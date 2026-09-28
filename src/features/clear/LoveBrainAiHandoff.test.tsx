import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PersistenceProvider } from '../../data/PersistenceContext'
import { initializePersistence } from '../../data/persistence'
import { MemoryStorageAdapter } from '../../data/storage/MemoryStorageAdapter'
import { I18nProvider } from '../../i18n/I18nProvider'
import { LOVE_BRAIN_KEYS } from '../../data/repositories/clearRepositories'
import { EXTERNAL_AI_HANDOFF_CONSENT_VERSION } from '../../services/loveBrainAiHandoff'
import { LoveBrainRecordResult } from './LoveBrainFlow'

async function setup(acknowledged = false) {
  const runtime = await initializePersistence({ adapter: new MemoryStorageAdapter(), defaultLocale: 'zh-TW', localDate: '2026-09-27' })
  const draft = await runtime.loveBrainAssessments.createDraft()
  await runtime.loveBrainAssessments.updateDraft(draft.id, { answers: Object.fromEntries(LOVE_BRAIN_KEYS.map((key) => [key, 1])) })
  const record = await runtime.loveBrainAssessments.complete(draft.id)
  if (acknowledged) await runtime.settings.updateSettings({ externalAiHandoffConsentVersion: EXTERNAL_AI_HANDOFF_CONSENT_VERSION })
  render(<PersistenceProvider runtime={runtime}><I18nProvider initialLocale="zh-TW"><LoveBrainRecordResult record={record} /></I18nProvider></PersistenceProvider>)
  return { runtime, record }
}

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals() })

describe('Love Brain V2 external AI handoff', () => {
  it('renders Copy, ChatGPT, then Gemini in DOM and keyboard focus order', async () => {
    await setup(true)
    const handoff = screen.getByText('✨ 和 AI 聊聊這份結果').closest('section')
    expect(handoff).not.toBeNull()
    expect(within(handoff!).getAllByRole('button').slice(0, 3).map((button) => button.textContent)).toEqual([
      '複製結果與內容', 'ChatGPT 聊聊', 'Gemini 聊聊',
    ])
  })

  it('requires disclosure before copy/open and persists only the versioned acknowledgement', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    const open = vi.spyOn(window, 'open').mockReturnValue({} as Window)
    const { runtime } = await setup()
    fireEvent.click(screen.getByRole('button', { name: 'ChatGPT 聊聊' }))
    fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: '取消' }))
    expect(writeText).not.toHaveBeenCalled(); expect(open).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'ChatGPT 聊聊' }))
    fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: '我了解，繼續' }))
    await waitFor(() => expect(open).toHaveBeenCalledWith('https://chatgpt.com/', '_blank', 'noopener,noreferrer'))
    expect(writeText.mock.invocationCallOrder[0]).toBeLessThan(open.mock.invocationCallOrder[0])
    expect((await runtime.settings.getSettings())?.externalAiHandoffConsentVersion).toBe(EXTERNAL_AI_HANDOFF_CONSENT_VERSION)
  })

  it('treats a null native opener result as unconfirmed, keeps copied content, and does not offer a retry', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    const open = vi.spyOn(window, 'open').mockReturnValue(null)
    await setup()
    fireEvent.click(screen.getByRole('button', { name: 'Gemini 聊聊' }))
    fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: '我了解，繼續' }))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('請在 Gemini 貼上後送出'))
    expect(open).toHaveBeenCalledWith('https://gemini.google.com/', '_blank', 'noopener,noreferrer')
    expect(writeText).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('button', { name: '再試一次' })).not.toBeInTheDocument()
  })

  it('offers retry only for a synchronous opener exception', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    const open = vi.spyOn(window, 'open').mockImplementationOnce(() => { throw new Error('blocked') }).mockReturnValue({} as Window)
    await setup(true)
    fireEvent.click(screen.getByRole('button', { name: 'ChatGPT 聊聊' }))
    fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: '我了解，繼續' }))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('無法開啟 ChatGPT'))
    fireEvent.click(screen.getByRole('button', { name: '再試一次' }))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('請在 ChatGPT 貼上後送出'))
    expect(open).toHaveBeenCalledTimes(2)
    expect(writeText).toHaveBeenCalledTimes(1)
  })

  it('does not open an external page when copying fails, and V1 never renders the handoff', async () => {
    vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) } })
    const open = vi.spyOn(window, 'open').mockReturnValue({} as Window)
    const { record } = await setup()
    fireEvent.click(screen.getByRole('button', { name: '複製結果與內容' }))
    fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: '我了解，繼續' }))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('還沒有成功複製'))
    expect(open).not.toHaveBeenCalled()
    cleanup()
    const runtime = await initializePersistence({ adapter: new MemoryStorageAdapter(), defaultLocale: 'zh-TW', localDate: '2026-09-27' })
    render(<PersistenceProvider runtime={runtime}><I18nProvider initialLocale="zh-TW"><LoveBrainRecordResult record={{ ...record, quizVersion: 1, v2Scores: undefined }} /></I18nProvider></PersistenceProvider>)
    expect(screen.queryByText('✨ 和 AI 聊聊這份結果')).not.toBeInTheDocument()
  })
})
