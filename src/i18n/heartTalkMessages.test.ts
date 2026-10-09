import { describe, expect, it } from 'vitest'
import { supportedLocales } from './messages'
import { heartTalkMessages } from './heartTalkMessages'

describe('Heart Talk list localization', () => {
  it.each(supportedLocales)('includes multi-invitation copy for %s', (locale) => {
    expect(heartTalkMessages[locale]['our.heartTalk.pending']).toBeTruthy()
    expect(heartTalkMessages[locale]['our.heartTalk.pendingTitle']).toBeTruthy()
    expect(heartTalkMessages[locale]['our.heartTalk.pendingBody']).toBeTruthy()
    expect(heartTalkMessages[locale]['our.heartTalk.loadedLimit']).toBeTruthy()
    expect(heartTalkMessages[locale]['our.heartTalk.noActive']).toBeTruthy()
  })
})
