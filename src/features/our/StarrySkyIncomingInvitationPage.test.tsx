import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { I18nProvider } from '../../i18n/I18nProvider'

const api = vi.hoisted(() => ({ getHeartTalkState: vi.fn(), respondToHeartTalkInvitation: vi.fn() }))
vi.mock('../../lib/firebase/heartTalkClient', () => api)
import { StarrySkyIncomingInvitationPage } from '../../pages/StarrySkyIncomingInvitationPage'

function renderIncoming() { return render(<I18nProvider initialLocale="zh-TW"><MemoryRouter initialEntries={['/our/starry-sky/invitation-preview']}><Routes><Route path="/our/starry-sky/invitation-preview" element={<StarrySkyIncomingInvitationPage />} /></Routes></MemoryRouter></I18nProvider>) }
afterEach(() => { cleanup(); vi.resetAllMocks() })

describe('Heart Talk production incoming invitation', () => {
  it('renders a callable-backed official invitation and accepts it before refreshing', async () => {
    api.getHeartTalkState.mockResolvedValueOnce({ invitations: [{ invitationId: 'invite-12345678', viewerRole: 'recipient', topicType: 'official', officialTopicId: 'Q002', scheduledLocalDate: '2026-12-22', startTime: '20:00', endTime: '20:30', status: 'pending' }] }).mockResolvedValueOnce({ invitations: [] })
    api.respondToHeartTalkInvitation.mockResolvedValue({ status: 'accepted' })
    renderIncoming()
    expect(await screen.findByText(/Q002/u)).toBeInTheDocument()
    expect(document.body).toHaveTextContent('什麼時候，你會特別感覺到「有你陪著真好」？')
    fireEvent.click(screen.getByRole('button', { name: '接受邀約' }))
    await waitFor(() => expect(api.respondToHeartTalkInvitation).toHaveBeenCalledWith('invite-12345678', 'accept'))
    expect(api.getHeartTalkState).toHaveBeenCalledTimes(2)
  })
  it('renders actionable custom text and declines through the callable', async () => {
    api.getHeartTalkState.mockResolvedValueOnce({ invitations: [{ invitationId: 'invite-12345678', viewerRole: 'recipient', topicType: 'custom', customTopicText: '今天最想被理解的是什麼？', scheduledLocalDate: '2026-12-22', startTime: '20:00', endTime: '20:30', status: 'pending' }] }).mockResolvedValueOnce({ invitations: [] })
    api.respondToHeartTalkInvitation.mockResolvedValue({ status: 'declined' })
    renderIncoming()
    await waitFor(() => expect(document.body).toHaveTextContent('今天最想被理解的是什麼？'))
    fireEvent.click(screen.getByRole('button', { name: '婉拒' }))
    await waitFor(() => expect(api.respondToHeartTalkInvitation).toHaveBeenCalledWith('invite-12345678', 'decline'))
  })
})
