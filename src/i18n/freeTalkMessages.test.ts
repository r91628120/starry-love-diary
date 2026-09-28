import { describe, expect, it } from 'vitest'
import { messages, supportedLocales } from './messages'

const keys = ['clear.freeTalk.title', 'clear.freeTalk.homeBody', 'clear.freeTalk.intro', 'clear.freeTalk.start', 'clear.freeTalk.placeholder', 'clear.freeTalk.ai.title', 'clear.freeTalk.ai.body', 'clear.freeTalk.ai.copy'] as const

describe('Free Talk localization', () => {
  it.each([
    ['zh-TW', '💭 陪我聊聊'],
    ['en', '💭 Talk with me'],
    ['ja', '💭 少し話そう'],
    ['ko', '💭 같이 이야기해요'],
    ['es', '💭 Hablemos un rato'],
    ['fr', '💭 Parlons un peu'],
  ] as const)('uses the final Free Talk feature name for %s', (locale, expectedTitle) => {
    expect(messages[locale]['clear.freeTalk.title']).toBe(expectedTitle)
  })

  it('provides complete copy for every supported locale', () => {
    for (const locale of supportedLocales) for (const key of keys) {
      expect(messages[locale][key]).toEqual(expect.any(String))
      expect(messages[locale][key].trim()).not.toBe('')
    }
  })
})
