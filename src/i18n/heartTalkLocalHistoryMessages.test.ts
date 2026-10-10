import { describe, expect, it } from 'vitest'
import { supportedLocales } from './messages'
import { heartTalkLocalHistoryMessages } from './heartTalkLocalHistoryMessages'

describe('Heart Talk local history count copy', () => {
  it.each(supportedLocales)('provides a count interpolation in %s', (locale) => {
    expect(heartTalkLocalHistoryMessages[locale]['our.starrySky.count']).toContain('{count}')
  })
})
