import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import './index.css'

describe('editable control typography', () => {
  it('keeps native text controls available with the shared body typography', () => {
    render(<><input aria-label="Text input" /><textarea aria-label="Text area" /><select aria-label="Select"><option>Choice</option></select></>)

    for (const control of [screen.getByRole('textbox', { name: 'Text input' }), screen.getByRole('textbox', { name: 'Text area' }), screen.getByRole('combobox', { name: 'Select' })]) {
      expect(control).toBeInstanceOf(HTMLElement)
    }
    expect(readFileSync('src/theme/globals.css', 'utf8')).toMatch(/button,\s*input,\s*textarea,\s*select\s*\{\s*font: inherit;\s*font-size: var\(--font-size-body\) !important;/u)
    expect(readFileSync('src/features/today/today.css', 'utf8')).toMatch(/\.heart-line-card textarea\s*\{[^}]*font-size: var\(--font-size-body\);/u)
  })

  it('keeps the viewport accessible instead of using a zoom lock workaround', () => {
    const viewport = readFileSync('index.html', 'utf8').match(/<meta\s+name="viewport"\s+content="([^"]+)"/u)?.[1] ?? ''
    expect(viewport).not.toContain('user-scalable=no')
    expect(viewport).not.toContain('maximum-scale=1')
  })
})
