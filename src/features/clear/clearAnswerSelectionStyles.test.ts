import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const clearDirectory = resolve(process.cwd(), 'src/features/clear')
const css = readFileSync(resolve(clearDirectory, 'clear.css'), 'utf8')

describe('Clear answer selection styles', () => {
  it('gives selected answers a strong border, background, shadow, weight, and fixed check indicator', () => {
    expect(css).toMatch(/\.clear-choice-grid button\.is-active,.clear-answer-list button\.is-active,.clear-scale button\.is-active\{[^}]*border-color:[^}]*background:[^}]*box-shadow:[^}]*font-weight:/)
    expect(css).toMatch(/\.clear-choice-grid button::after,.clear-answer-list button::after\{[^}]*position:absolute[^}]*content:'✓'/)
    expect(css).toMatch(/\.clear-choice-grid button,.clear-answer-list button\{padding-right:2\.55rem\}/)
  })

  it('keeps hover and keyboard focus visually distinct from selection', () => {
    expect(css).toContain('@media(hover:hover)')
    expect(css).toMatch(/button:not\(\.is-active\):hover/)
    expect(css).toMatch(/button:focus-visible[^{}]*\{[^}]*outline:3px solid #657aa1;outline-offset:2px/)
  })

  it('uses the scenario card background and border without a visual checkmark badge', () => {
    expect(css).toMatch(/\.clear-scenarios__rail button\.is-active\{[^}]*border-color:var\(--color-pink-500\)[^}]*background:var\(--color-pink-100\)[^}]*box-shadow:/)
    expect(css).not.toContain('.clear-scenarios__rail button.is-active::after')
  })

  it('marks Yes, No, and Unknown selects after a choice is made', () => {
    const source = readFileSync(resolve(clearDirectory, 'OrganizeFeelingsFlow.tsx'), 'utf8')
    expect(source).toContain("className={form.observations[item] ? 'is-selected' : ''}")
    expect(source).toContain('clear-select-control__indicator')
    expect(css).toMatch(/\.clear-observations select\.is-selected\{[^}]*border-color:[^}]*background:[^}]*box-shadow:[^}]*font-weight:/)
    expect(css).toMatch(/\.clear-select-control__indicator\{[^}]*position:absolute[^}]*background:var\(--color-pink-500\)/)
  })

  it('lets long localized copy wrap while cards grow without clipping it', () => {
    expect(css).toMatch(/\.clear-page :where\(h1,h2,h3,p,blockquote,legend,label,button,dt,dd,strong,time\)\{[^}]*min-width:0[^}]*overflow-wrap:anywhere/)
    expect(css).toMatch(/\.clear-latest__body,\.clear-quote\{overflow:visible\}/)
    expect(css).toMatch(/\.clear-records article,\.clear-record-button,\.clear-tool,\.clear-flow>\.soft-card,\.clear-result,\.clear-intro\{[^}]*height:auto[^}]*overflow:visible/)
    expect(css).toMatch(/\.clear-answer-list button,\.clear-choice-grid button\{[^}]*height:auto[^}]*line-height:1\.45/)
  })

  it('keeps all four tool cards and flow introductions auto-sized with the CTA last', () => {
    expect(css).toMatch(/\.clear-tool\{height:auto;min-height:0;align-items:stretch;overflow:visible\}/)
    expect(css).toMatch(/\.clear-tool>div\{display:grid;min-width:0;align-content:start/)
    expect(css).toMatch(/\.clear-tool h2,\.clear-tool p\{[^}]*white-space:normal[^}]*overflow:visible[^}]*text-overflow:clip/)
    expect(css).toMatch(/\.clear-intro\{[^}]*width:100%[^}]*min-width:0[^}]*height:auto[^}]*overflow:visible/)
    expect(css).toMatch(/\.clear-intro>\.button:last-child\{justify-self:start;margin-top:\.25rem\}/)
  })

  it('keeps the current tool context heading secondary, readable, and wrappable', () => {
    expect(css).toMatch(/\.clear-tool-context\{[^}]*width:100%[^}]*min-width:0/)
    expect(css).toMatch(/\.clear-tool-context__name\{[^}]*color:#657aa1[^}]*font-size:clamp\([^}]*overflow-wrap:anywhere/)
  })

  it('stacks long navigation and observation controls at narrow app widths', () => {
    expect(css).toMatch(/@media\(max-width:26rem\)\{[^}]*\.clear-flow__top\{[^}]*flex-direction:column/)
    expect(css).toMatch(/@media\(max-width:26rem\)[\s\S]*\.clear-observations label,\.clear-summary\{grid-template-columns:1fr\}/)
  })

  it.each([
    ['OrganizeFeelingsFlow.tsx', 'clear-choice-grid'],
    ['LoveBoatFlow.tsx', 'clear-answer-list'],
    ['LoveBrainFlow.tsx', 'clear-answer-list'],
    ['LikeOrHabitFlow.tsx', 'clear-answer-list'],
  ])('keeps stable selected state wiring in %s', (file, answerClass) => {
    const source = readFileSync(resolve(clearDirectory, file), 'utf8')
    expect(source).toContain(answerClass)
    expect(source).toContain("'is-active'")
  })

  it.each([
    ['LoveBoatFlow.tsx'],
    ['LoveBrainFlow.tsx'],
    ['LikeOrHabitFlow.tsx'],
  ])('uses radio semantics for single-choice answers in %s', (file) => {
    const source = readFileSync(resolve(clearDirectory, file), 'utf8')
    expect(source).toContain('role="radiogroup"')
    expect(source).toContain('role="radio"')
    expect(source).toContain('aria-checked=')
  })
})
