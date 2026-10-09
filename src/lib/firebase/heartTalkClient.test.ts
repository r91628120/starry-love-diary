import { describe, expect, it } from 'vitest'
import { sortHeartTalkInvitations } from './heartTalkClient'

describe('Heart Talk invitation presentation order', () => {
  it('sorts the loaded invitations by schedule and then invitation ID without claiming server pagination', () => {
    const invitations = [
      { invitationId: 'invite-c', viewerRole: 'sender' as const, topicType: 'custom' as const, customTopicText: 'later', scheduledLocalDate: '2026-12-23', startTime: '20:00', endTime: '20:30', status: 'pending' as const },
      { invitationId: 'invite-b', viewerRole: 'sender' as const, topicType: 'custom' as const, customTopicText: 'same time B', scheduledLocalDate: '2026-12-22', startTime: '20:00', endTime: '20:30', status: 'pending' as const },
      { invitationId: 'invite-a', viewerRole: 'sender' as const, topicType: 'custom' as const, customTopicText: 'same time A', scheduledLocalDate: '2026-12-22', startTime: '20:00', endTime: '20:30', status: 'pending' as const },
    ]

    expect(sortHeartTalkInvitations(invitations).map(({ invitationId }) => invitationId)).toEqual(['invite-a', 'invite-b', 'invite-c'])
    expect(invitations.map(({ invitationId }) => invitationId)).toEqual(['invite-c', 'invite-b', 'invite-a'])
  })
})
