import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { I18nProvider } from '../../i18n/I18nProvider'
const api = vi.hoisted(() => ({ getHeartTalkState: vi.fn(), createHeartTalkInvitation: vi.fn() }))
vi.mock('../../lib/firebase/heartTalkClient', () => api)
import { StarrySkyPage } from '../../pages/StarrySkyPage'
function renderSky() { return render(<I18nProvider initialLocale="zh-TW"><MemoryRouter initialEntries={['/our/starry-sky']}><Routes><Route path="/our/starry-sky" element={<StarrySkyPage/>}/><Route path="/our/starry-sky/invitation-preview" element={<p>incoming route</p>}/><Route path="/our/starry-sky/session-preview" element={<p>session route</p>}/></Routes></MemoryRouter></I18nProvider>) }
afterEach(() => { cleanup(); vi.resetAllMocks() })
describe('Heart Talk landing production routing and custom composer', () => {
  it('sends bounded custom product input once and then refreshes authoritative state', async () => {
    api.getHeartTalkState.mockResolvedValue({ invitations: [] }); api.createHeartTalkInvitation.mockResolvedValue({ invitationId: 'invite-12345678', status: 'pending' })
    renderSky(); await waitFor(() => expect(api.getHeartTalkState).toHaveBeenCalledTimes(1))
    fireEvent.change(screen.getByLabelText('✨ 自己出一題'), { target: { value: '今天最想被理解的是什麼？' } }); fireEvent.change(screen.getByLabelText('選擇日期'), { target: { value: '2026-12-22' } }); fireEvent.click(screen.getAllByRole('button', { name: '邀請另一半' })[0])
    await waitFor(() => expect(api.createHeartTalkInvitation).toHaveBeenCalledWith({ topicType: 'custom', customTopicText: '今天最想被理解的是什麼？', scheduledLocalDate: '2026-12-22', startTime: '20:00', endTime: '20:30' }))
    expect(api.createHeartTalkInvitation.mock.calls[0][0]).not.toHaveProperty('pairId'); expect(api.createHeartTalkInvitation.mock.calls[0][0]).not.toHaveProperty('recipientUid')
  })
  it.each([
    ['recipient', 'pending', '💕 收到心話邀約', '💕 收到心話邀約', 'incoming route'],
    ['sender', 'pending', '心話邀約已送出', '心話邀約已送出', 'session route'],
    ['sender', 'accepted', '✨ 心話時段已約好', '查看已約好的心話', 'session route'],
  ] as const)('routes authoritative %s %s state without preview fixtures', async (viewerRole, status, label, action, destination) => {
    api.getHeartTalkState.mockResolvedValue({ invitations: [{ invitationId: 'invite-12345678', viewerRole, topicType: 'official', officialTopicId: 'Q001', scheduledLocalDate: '2026-12-22', startTime: '20:00', endTime: '20:30', status }] })
    renderSky(); await waitFor(() => expect(document.body).toHaveTextContent(label)); fireEvent.click(screen.getByRole('button', { name: action })); expect(await screen.findByText(destination)).toBeInTheDocument()
  })
  it('does not fabricate an active card for empty or terminal-only state', async () => { api.getHeartTalkState.mockResolvedValue({ invitations: [] }); renderSky(); await waitFor(() => expect(api.getHeartTalkState).toHaveBeenCalled()); expect(screen.queryByText('心話邀約已送出')).not.toBeInTheDocument() })
})
