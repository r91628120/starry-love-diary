import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { I18nProvider } from '../../i18n/I18nProvider'

const api = vi.hoisted(() => ({ getHeartTalkState: vi.fn(), completeHeartTalkInvitation: vi.fn(), cancelHeartTalkInvitation: vi.fn() }))
vi.mock('../../lib/firebase/heartTalkClient', () => api)
import { StarrySkySessionPreviewPage } from '../../pages/StarrySkySessionPreviewPage'

const accepted = { invitationId: 'invite-12345678', viewerRole: 'sender', topicType: 'official', officialTopicId: 'Q002', scheduledLocalDate: '2026-12-22', startTime: '20:00', endTime: '20:30', status: 'accepted' }
function renderSession() { return render(<I18nProvider initialLocale="zh-TW"><MemoryRouter initialEntries={['/our/starry-sky/session-preview?invitation=invite-12345678']}><Routes><Route path="/our/starry-sky/session-preview" element={<StarrySkySessionPreviewPage />} /></Routes></MemoryRouter></I18nProvider>) }
afterEach(() => { cleanup(); vi.resetAllMocks() })

describe('Heart Talk production accepted session', () => {
  it('renders authoritative official data, calls completion once, and refreshes only after success', async () => {
    api.getHeartTalkState.mockResolvedValueOnce({ invitations: [accepted] }).mockResolvedValueOnce({ invitations: [] })
    let resolve!: () => void; api.completeHeartTalkInvitation.mockReturnValue(new Promise<void>((done) => { resolve = done }))
    renderSession(); expect(await screen.findByText(/Q002/u)).toBeInTheDocument(); expect(document.body).toHaveTextContent('什麼時候，你會特別感覺到「有你陪著真好」？')
    const complete = screen.getByRole('button', { name: '✨ 這次心話已完成' }); fireEvent.click(complete); fireEvent.click(complete)
    expect(api.completeHeartTalkInvitation).toHaveBeenCalledTimes(1); expect(api.getHeartTalkState).toHaveBeenCalledTimes(1)
    resolve(); await waitFor(() => expect(api.getHeartTalkState).toHaveBeenCalledTimes(2)); expect(screen.getByText('✨ 這次心話已完成')).toBeInTheDocument()
  })
  it('renders accepted custom text and cancels through the callable before refreshing', async () => {
    const custom = { ...accepted, topicType: 'custom' as const, officialTopicId: undefined, customTopicText: '今天最想被理解的是什麼？' }
    api.getHeartTalkState.mockResolvedValueOnce({ invitations: [custom] }).mockResolvedValueOnce({ invitations: [] }); api.cancelHeartTalkInvitation.mockResolvedValue({ status: 'cancelled' })
    renderSession(); await waitFor(() => expect(document.body).toHaveTextContent('今天最想被理解的是什麼？'))
    fireEvent.click(screen.getByRole('button', { name: '取消這次心話' })); fireEvent.click(screen.getByRole('button', { name: '確認取消' }))
    await waitFor(() => expect(api.cancelHeartTalkInvitation).toHaveBeenCalledWith('invite-12345678')); expect(api.getHeartTalkState).toHaveBeenCalledTimes(2)
  })
})
