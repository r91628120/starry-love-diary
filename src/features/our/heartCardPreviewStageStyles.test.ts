import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('heart card preview stage styles', () => {
  it('does not reserve a large feedback frame outside preview mode', () => {
    const css = readFileSync('src/features/our/our.css', 'utf8')

    expect(css).not.toContain('.our-message>p,.our-message textarea')
    expect(css).toContain('.our-message>:is(.our-message__full,.our-message__empty-copy,textarea)')
  })
})
