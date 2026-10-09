import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { I18nProvider } from '../../i18n/I18nProvider'

const api = vi.hoisted(() => ({ getHeartTalkState: vi.fn(), respondToHeartTalkInvitation: vi.fn(), heartTalkErrorCode: vi.fn((error: unknown) => error instanceof Error ? error.message : 'service-unavailable'), sortHeartTalkInvitations: <T,>(invitations: T[]) => [...invitations], HEART_TALK_LOADED_INVITATION_LIMIT: 20 }))
vi.mock('../../lib/firebase/heartTalkClient', () => api)
import { StarrySkyIncomingInvitationPage } from '../../pages/StarrySkyIncomingInvitationPage'

function renderIncoming(locale = 'zh-TW') { return render(<I18nProvider initialLocale={locale as never}><MemoryRouter initialEntries={['/our/starry-sky/invitation-preview']}><Routes><Route path="/our/starry-sky/invitation-preview" element={<StarrySkyIncomingInvitationPage />} /></Routes></MemoryRouter></I18nProvider>) }
afterEach(() => { cleanup(); vi.useRealTimers(); vi.resetAllMocks() })

describe('Heart Talk production incoming invitation', () => {
  it.each(['zh-TW', 'en', 'ja', 'ko', 'es', 'fr'])('localizes the collapsed and expanded controls in %s', async (locale) => {
    api.getHeartTalkState.mockResolvedValue({ invitations: [{ invitationId: 'invite-localized', viewerRole: 'recipient', topicType: 'custom', customTopicText: 'Localized prompt', scheduledLocalDate: '2026-12-22', startTime: '20:00', endTime: '20:30', status: 'pending' }] })
    const view = renderIncoming(locale); const summary = await screen.findByRole('button', { name: /Localized prompt/u }); expect(summary).toHaveAttribute('aria-expanded', 'false'); fireEvent.click(summary); expect(view.container.textContent).not.toMatch(/our\.heartTalk\.(expand|collapse)/u)
  })
  it('renders a callable-backed official invitation and accepts it before refreshing', async () => {
    api.getHeartTalkState.mockResolvedValueOnce({ invitations: [{ invitationId: 'invite-12345678', viewerRole: 'recipient', topicType: 'official', officialTopicId: 'Q002', scheduledLocalDate: '2026-12-22', startTime: '20:00', endTime: '20:30', status: 'pending' }] }).mockResolvedValueOnce({ invitations: [] })
    api.respondToHeartTalkInvitation.mockResolvedValue({ status: 'accepted' })
    renderIncoming()
    expect(await screen.findByText(/Q002/u)).toBeInTheDocument()
    expect(document.body).toHaveTextContent('什麼時候，你會特別感覺到「有你陪著真好」？')
    fireEvent.click(screen.getByRole('button', { name: /Q002/u }))
    fireEvent.click(screen.getByRole('button', { name: '接受邀約' }))
    await waitFor(() => expect(api.respondToHeartTalkInvitation).toHaveBeenCalledWith('invite-12345678', 'accept'))
    expect(api.getHeartTalkState).toHaveBeenCalledTimes(2)
  })
  it('renders actionable custom text and declines through the callable', async () => {
    api.getHeartTalkState.mockResolvedValueOnce({ invitations: [{ invitationId: 'invite-12345678', viewerRole: 'recipient', topicType: 'custom', customTopicText: '今天最想被理解的是什麼？', scheduledLocalDate: '2026-12-22', startTime: '20:00', endTime: '20:30', status: 'pending' }] }).mockResolvedValueOnce({ invitations: [] })
    api.respondToHeartTalkInvitation.mockResolvedValue({ status: 'declined' })
    renderIncoming()
    await waitFor(() => expect(document.body).toHaveTextContent('今天最想被理解的是什麼？'))
    fireEvent.click(screen.getByRole('button', { name: /今天最想被理解/u }))
    fireEvent.click(screen.getByRole('button', { name: '婉拒' }))
    await waitFor(() => expect(api.respondToHeartTalkInvitation).toHaveBeenCalledWith('invite-12345678', 'decline'))
  })
  it('shows an invitation created by the other member on the visible refresh interval', async () => {
    vi.useFakeTimers()
    api.getHeartTalkState.mockResolvedValueOnce({ invitations: [] }).mockResolvedValueOnce({ invitations: [{ invitationId: 'invite-12345678', viewerRole: 'recipient', topicType: 'custom', customTopicText: '我們現在最想聊什麼？', scheduledLocalDate: '2026-12-22', startTime: '20:00', endTime: '20:30', status: 'pending' }] })
    renderIncoming()
    await act(async () => undefined)
    expect(screen.queryByText('我們現在最想聊什麼？')).not.toBeInTheDocument()
    await act(async () => { await vi.advanceTimersByTimeAsync(15_000) })
    expect(screen.getByText('我們現在最想聊什麼？')).toBeInTheDocument()
  })
  it('shows every recipient pending invitation and lets the user respond to the second one', async () => {
    const invitations = ['第一筆', '第二筆', '第三筆'].map((customTopicText, index) => ({ invitationId: `invite-${index + 1}`, viewerRole: 'recipient' as const, topicType: 'custom' as const, customTopicText, scheduledLocalDate: '2026-12-22', startTime: `2${index}:00`, endTime: `2${index}:30`, status: 'pending' as const }))
    api.getHeartTalkState.mockResolvedValueOnce({ invitations }).mockResolvedValueOnce({ invitations: [invitations[0], invitations[2]] })
    api.respondToHeartTalkInvitation.mockResolvedValue({ status: 'accepted' })
    renderIncoming()
    expect(await screen.findByText('第一筆')).toBeInTheDocument(); expect(screen.getByText('第二筆')).toBeInTheDocument(); expect(screen.getByText('第三筆')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /第二筆/u })); fireEvent.click(screen.getByRole('button', { name: '接受邀約' }))
    await waitFor(() => expect(api.respondToHeartTalkInvitation).toHaveBeenCalledWith('invite-2', 'accept'))
    expect(screen.getByText('第一筆')).toBeInTheDocument(); expect(screen.queryByText('第二筆')).not.toBeInTheDocument(); expect(screen.getByText('第三筆')).toBeInTheDocument()
  })
  it('explains the loaded-list limit without claiming a complete list', async () => {
    api.getHeartTalkState.mockResolvedValue({ invitations: Array.from({ length: 20 }, (_, index) => ({ invitationId: `invite-${index}`, viewerRole: 'recipient', topicType: 'custom', customTopicText: `題目 ${index}`, scheduledLocalDate: '2026-12-22', startTime: '20:00', endTime: '20:30', status: 'pending' })) })
    renderIncoming()
    expect(await screen.findByText(/目前只顯示已載入的 20 筆邀約/u)).toBeInTheDocument()
  })
  it('shows safe empty and service-error states', async () => {
    api.getHeartTalkState.mockResolvedValueOnce({ invitations: [] }).mockRejectedValueOnce(new Error('service-unavailable'))
    renderIncoming()
    expect(await screen.findByText('目前沒有可查看的心話邀約。')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '更換題目' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('心話服務暫時無法完成操作，請稍後再試。')
  })
})
