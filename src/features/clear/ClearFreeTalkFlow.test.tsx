import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { PersistenceProvider } from '../../data/PersistenceContext'
import { initializePersistence } from '../../data/persistence'
import { MemoryStorageAdapter } from '../../data/storage/MemoryStorageAdapter'
import { I18nProvider } from '../../i18n/I18nProvider'
import { EXTERNAL_AI_HANDOFF_CONSENT_VERSION } from '../../services/loveBrainAiHandoff'
import { FreeTalkRoute } from './ClearContent'
import { ClearFreeTalkFlow } from './ClearFreeTalkFlow'

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals() })
async function runtime() { return initializePersistence({ adapter: new MemoryStorageAdapter(), defaultLocale: 'zh-TW', localDate: '2026-09-28' }) }
function renderFlow(node: React.ReactNode, value: Awaited<ReturnType<typeof runtime>>) { return render(<PersistenceProvider runtime={value}><I18nProvider initialLocale="zh-TW">{node}</I18nProvider></PersistenceProvider>) }
function LocationProbe() { const location = useLocation(); return <output data-testid="location">{location.pathname}{location.search}</output> }

describe('Free Talk navigation', () => {
  it('uses the Free Talk presentation and spacing hierarchy without changing the AI actions', async () => {
    const value = await runtime(); const done = vi.fn(); const startNew = vi.fn()
    renderFlow(<ClearFreeTalkFlow onDone={done} onStartNew={startNew} />, value)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '想先把這件事寫下來。' } })
    expect(screen.getByText('✨ 想再聊聊這件事？')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '複製內容' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '和 ChatGPT 聊聊' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '和 Gemini 聊聊' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '✨ 想再聊聊這件事？' }).closest('.clear-ai-handoff')).toHaveClass('clear-ai-handoff--free-talk')
    expect(screen.getByRole('textbox').closest('.clear-free-talk-flow')).not.toBeNull()
    expect(screen.getByRole('button', { name: '保存' }).compareDocumentPosition(screen.getByText('✨ 想再聊聊這件事？')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('keeps draft deletion as a full-width secondary action above the optional AI section', async () => {
    const value = await runtime(); const done = vi.fn(); const startNew = vi.fn()
    renderFlow(<ClearFreeTalkFlow onDone={done} onStartNew={startNew} />, value)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '草稿內容' } })
    await waitFor(() => expect(screen.getByRole('button', { name: '刪除草稿' })).toBeInTheDocument())
    const deleteDraft = screen.getByRole('button', { name: '刪除草稿' })
    expect(deleteDraft).toHaveClass('button--secondary', 'button--danger')
    expect(deleteDraft.parentElement).toHaveClass('clear-free-talk-flow__secondary-action')
    expect(deleteDraft.compareDocumentPosition(screen.getByText('✨ 想再聊聊這件事？')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('keeps the shared neutral external-open status for Free Talk ChatGPT and Gemini', async () => {
    const value = await runtime(); const done = vi.fn(); const startNew = vi.fn()
    await value.settings.updateSettings({ externalAiHandoffConsentVersion: EXTERNAL_AI_HANDOFF_CONSENT_VERSION })
    vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } })
    const open = vi.spyOn(window, 'open').mockReturnValue(null)
    renderFlow(<ClearFreeTalkFlow onDone={done} onStartNew={startNew} />, value)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '想再整理一下。' } })
    fireEvent.click(screen.getByRole('button', { name: '和 ChatGPT 聊聊' }))
    fireEvent.click(screen.getByRole('alertdialog').querySelector('.button--primary') as HTMLButtonElement)
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('請在 ChatGPT 貼上後送出'))
    fireEvent.click(screen.getByRole('button', { name: '和 Gemini 聊聊' }))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('請在 Gemini 貼上後送出'))
    expect(open).toHaveBeenCalledTimes(2)
    expect(screen.queryByRole('button', { name: '再試一次' })).not.toBeInTheDocument()
  })

  it('renders the shared circular back control in empty, draft, completed, and completed-edit states', async () => {
    const value = await runtime(); const done = vi.fn(); const startNew = vi.fn()
    renderFlow(<ClearFreeTalkFlow onDone={done} onStartNew={startNew} />, value)
    expect(screen.getByRole('button', { name: '返回' })).toHaveClass('clear-free-talk__back')
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '草稿' } })
    await waitFor(async () => expect(await value.clearFreeTalkRecords.getActiveDraft()).toBeDefined())
    fireEvent.click(screen.getByRole('button', { name: '保存' }))
    await waitFor(() => expect(screen.getByRole('button', { name: '編輯' })).toBeInTheDocument())
    expect(screen.getByRole('button', { name: '返回' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '編輯' }))
    expect(screen.getByRole('button', { name: '返回' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '返回' }))
    expect(done).toHaveBeenCalledTimes(1)
  })

  it('returns a Footprints record to Footprints without creating a draft or changing stars', async () => {
    const value = await runtime(); const draft = await value.clearFreeTalkRecords.createDraft('足跡內容'); await value.clearFreeTalkRecords.complete(draft.id, '足跡內容')
    render(<PersistenceProvider runtime={value}><I18nProvider initialLocale="zh-TW"><MemoryRouter initialEntries={['/clear']}><FreeTalkRoute recordId={draft.id} returnTo="footprints" routedRecord onHome={() => undefined} /><LocationProbe /></MemoryRouter></I18nProvider></PersistenceProvider>)
    fireEvent.click(await screen.findByRole('button', { name: '返回' }))
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/footprints'))
    expect(await value.clearFreeTalkRecords.listAll()).toHaveLength(1)
    expect(await value.adapter.getAll('stars')).toEqual([])
  })

  it('clears the Footprints return target when starting a new entry', async () => {
    const value = await runtime(); const draft = await value.clearFreeTalkRecords.createDraft('舊紀錄'); await value.clearFreeTalkRecords.complete(draft.id, '舊紀錄')
    render(<PersistenceProvider runtime={value}><I18nProvider initialLocale="zh-TW"><MemoryRouter initialEntries={['/clear']}><FreeTalkRoute recordId={draft.id} returnTo="footprints" routedRecord onHome={() => undefined} /><LocationProbe /></MemoryRouter></I18nProvider></PersistenceProvider>)
    fireEvent.click(await screen.findByRole('button', { name: '新增一則' }))
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/clear?freeTalk=new'))
    expect(await value.clearFreeTalkRecords.listAll()).toHaveLength(1)
  })

  it('keeps a completed Free Talk record identity while saving each AI reflection field', async () => {
    const value = await runtime()
    const draft = await value.clearFreeTalkRecords.createDraft('同一筆自由聊聊')
    const completed = await value.clearFreeTalkRecords.complete(draft.id, '同一筆自由聊聊')
    renderFlow(<ClearFreeTalkFlow recordId={completed.id} onDone={() => undefined} onStartNew={() => undefined} />, value)
    fireEvent.click(await screen.findByRole('button', { name: '＋ 貼上想留下的 AI 回覆' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'AI 回覆精選' }), { target: { value: 'AI 摘要' } })
    fireEvent.click(screen.getByRole('button', { name: '儲存' }))
    await screen.findByText('AI 摘要')
    fireEvent.click(screen.getByRole('button', { name: '＋ 寫下我的整理' }))
    fireEvent.change(screen.getByRole('textbox', { name: '聊完後，我現在怎麼想？' }), { target: { value: '我的整理' } })
    fireEvent.click(screen.getByRole('button', { name: '儲存' }))
    await screen.findByText('我的整理')
    expect(await value.clearFreeTalkRecords.getById(completed.id)).toMatchObject({ id: completed.id, text: '同一筆自由聊聊', aiResponseExcerpt: 'AI 摘要', postChatReflection: '我的整理', createdAt: completed.createdAt, localDate: completed.localDate })
    expect(await value.clearFreeTalkRecords.listAll()).toHaveLength(1)
  })
})
