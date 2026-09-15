import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('heart card ready chip styling', () => {
  it('keeps the ready status a compact, non-button chip in the collapsed action row', () => {
    const css = readFileSync('src/features/our/our.css', 'utf8')
    expect(css).toMatch(/\.heart-card-ready-chip\{(?=[^}]*width:fit-content)(?=[^}]*flex:0 0 auto)(?=[^}]*min-height:0)[^}]*\}/u)
    expect(css).toMatch(/\.our-message__collapsed-actions\{[^}]*flex-wrap:wrap/u)
    const chipRules = css.match(/\.heart-card-ready-chip\{([^}]*)\}/u)?.[1] ?? ''
    expect(chipRules).not.toMatch(/(?:^|;)width:100%(?:;|$)/u)
  })
})
