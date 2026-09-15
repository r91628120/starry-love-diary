import { describe, expect, it } from 'vitest'
import { messages, supportedLocales } from './messages'

const keys = ['heartRevealCycle.ready', 'heartRevealCycle.choose', 'heartRevealCycle.chooseTitle', 'heartRevealCycle.chooseHint', 'heartRevealCycle.confirmTitle', 'heartRevealCycle.back', 'heartRevealCycle.generate', 'heartRevealCycle.generated', 'heartRevealCycle.finish', 'heartRevealCycle.resetTitle', 'heartRevealCycle.resetBody', 'heartRevealCycle.startNext', 'heartRevealCycle.nextStarted', 'heartRevealCycle.setNextPhoto', 'heartRevealCycle.writeNext', 'heartRevealCycle.shareError', 'heartRevealCycle.shareUnsupported', 'heartRevealCycle.textPlacement', 'heartRevealCycle.placement.top-left', 'heartRevealCycle.placement.top-center', 'heartRevealCycle.placement.top-right', 'heartRevealCycle.placement.bottom-left', 'heartRevealCycle.placement.bottom-center', 'heartRevealCycle.placement.bottom-right'] as const

describe('Heart reveal cycle localization', () => {
  it('has every Cycle v2 message in all six locales with no empty values', () => {
    for (const locale of supportedLocales) for (const key of keys) expect(messages[locale][key]).toMatch(/\S/)
  })
})
