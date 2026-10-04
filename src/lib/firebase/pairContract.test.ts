import { describe, expect, it } from 'vitest'
import { hasValidPairMembers, isPairStatus } from './pairContract'

describe('Pair contract', () => {
  it('accepts exactly two distinct non-blank durable UIDs', () => {
    expect(hasValidPairMembers(['uid-a', 'uid-b'])).toBe(true)
    expect(hasValidPairMembers(['uid-a'])).toBe(false)
    expect(hasValidPairMembers(['uid-a', 'uid-a'])).toBe(false)
    expect(hasValidPairMembers(['uid-a', 'uid-b', 'uid-c'])).toBe(false)
    expect(hasValidPairMembers(['uid-a', '   '])).toBe(false)
  })

  it('keeps Pair status limited to active and ended', () => {
    expect(isPairStatus('active')).toBe(true)
    expect(isPairStatus('ended')).toBe(true)
    expect(isPairStatus('pending')).toBe(false)
  })
})
