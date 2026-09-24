import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { LocalStarDropPresentationRepository } from '../../data/repositories/starDropPresentationRepository'
import type { Star } from '../../data/types'
import { I18nProvider } from '../../i18n/I18nProvider'
import { BottleHeroCard, STAR_DROP_IMPACT_PARTICLES, STAR_DROP_RITUAL_DURATION_MS } from './BottleHeroCard'

const star: Star = {
  id: 'star-1', type: 'mood', mood: 'happy', content: 'happy', localDate: '2026-09-20', timezone: 'Asia/Taipei',
  createdAt: '2026-09-20T00:00:00.000Z', updatedAt: '2026-09-20T00:00:00.000Z',
}

function presentationFor(representative: Star | undefined) {
  return { claimRepresentative: vi.fn().mockResolvedValue(representative) } as unknown as LocalStarDropPresentationRepository
}

function renderHero(presentations: LocalStarDropPresentationRepository, stars: Star[] = [star]) {
  return render(<I18nProvider initialLocale="en"><BottleHeroCard stars={stars} presentations={presentations} /></I18nProvider>)
}

function milliseconds(value: string) {
  return value.endsWith('ms') ? Number.parseFloat(value) : Number.parseFloat(value) * 1000
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('BottleHeroCard star-drop impact', () => {
  it('renders one deterministic four-wave, forty-eight-particle impact while preserving the accumulated representative star', async () => {
    renderHero(presentationFor(star))

    await waitFor(() => expect(document.querySelector('.bottle-star--dropping')).toBeInTheDocument())
    expect(screen.getByTestId('star-drop-impact')).toBeInTheDocument()
    expect(screen.getAllByTestId('star-drop-impact-particle')).toHaveLength(48)
    expect(STAR_DROP_IMPACT_PARTICLES).toHaveLength(48)
    expect(STAR_DROP_IMPACT_PARTICLES.filter(({ wave }) => wave === 1)).toHaveLength(10)
    expect(STAR_DROP_IMPACT_PARTICLES.filter(({ wave }) => wave === 2)).toHaveLength(13)
    expect(STAR_DROP_IMPACT_PARTICLES.filter(({ wave }) => wave === 3)).toHaveLength(15)
    expect(STAR_DROP_IMPACT_PARTICLES.filter(({ wave }) => wave === 4)).toHaveLength(10)
    expect(document.querySelectorAll('[data-particle-wave="1"]')).toHaveLength(10)
    expect(document.querySelectorAll('[data-particle-wave="2"]')).toHaveLength(13)
    expect(document.querySelectorAll('[data-particle-wave="3"]')).toHaveLength(15)
    expect(document.querySelectorAll('[data-particle-wave="4"]')).toHaveLength(10)
    expect(STAR_DROP_IMPACT_PARTICLES.filter(({ glyph }) => glyph === '★')).toHaveLength(9)
    expect(STAR_DROP_IMPACT_PARTICLES.filter(({ glyph }) => glyph === '✦')).toHaveLength(14)
    expect(STAR_DROP_IMPACT_PARTICLES.filter(({ glyph }) => glyph === '✧')).toHaveLength(11)
    expect(STAR_DROP_IMPACT_PARTICLES.filter(({ glyph }) => glyph === '♥')).toHaveLength(6)
    expect(STAR_DROP_IMPACT_PARTICLES.filter(({ glyph }) => glyph === 'dot')).toHaveLength(8)
    expect(document.querySelectorAll('[data-particle-glyph="★"]')).toHaveLength(9)
    expect(document.querySelectorAll('[data-particle-glyph="✦"]')).toHaveLength(14)
    expect(document.querySelectorAll('[data-particle-glyph="✧"]')).toHaveLength(11)
    expect(document.querySelectorAll('[data-particle-glyph="♥"]')).toHaveLength(6)
    expect(document.querySelectorAll('[data-particle-glyph="dot"]')).toHaveLength(8)
    expect(document.querySelector('.bottle-hero__ritual-sparkles')).not.toBeInTheDocument()
    expect(document.querySelector('.bottle-hero__ritual-message')).not.toBeInTheDocument()
    expect(document.querySelectorAll('.bottle-hero__collection .bottle-star')).toHaveLength(1)
    expect(Math.max(...STAR_DROP_IMPACT_PARTICLES.map(({ delay, duration }) => 2620 + milliseconds(delay) + milliseconds(duration)))).toBeLessThan(STAR_DROP_RITUAL_DURATION_MS)
  })

  it('keeps the presentation through the 4.5-second ritual before advancing the queue', async () => {
    vi.useFakeTimers()
    renderHero(presentationFor(star))

    await act(async () => { await Promise.resolve() })
    expect(document.querySelector('.bottle-star--dropping')).toBeInTheDocument()
    await act(async () => { await vi.advanceTimersByTimeAsync(1800) })
    expect(document.querySelector('.bottle-star--dropping')).toBeInTheDocument()
    expect(screen.getByTestId('star-drop-impact')).toBeInTheDocument()
    await act(async () => { await vi.advanceTimersByTimeAsync(STAR_DROP_RITUAL_DURATION_MS - 1801) })
    expect(document.querySelector('.bottle-star--dropping')).toBeInTheDocument()
    await act(async () => { await vi.advanceTimersByTimeAsync(1) })
    expect(document.querySelector('.bottle-star--dropping')).not.toBeInTheDocument()
    expect(screen.queryByTestId('star-drop-impact')).not.toBeInTheDocument()
  })

  it('does not render the visual impact when reduced motion is requested', async () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }))
    renderHero(presentationFor(star))

    await act(async () => { await Promise.resolve() })
    expect(document.querySelector('.bottle-star--dropping')).not.toBeInTheDocument()
    expect(screen.queryByTestId('star-drop-impact')).not.toBeInTheDocument()
    expect(document.querySelectorAll('.bottle-hero__collection .bottle-star')).toHaveLength(1)
  })

  it('keeps the fall, impact, bounce, and deterministic burst choreography synchronized', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/features/star-bottle/star-bottle.css'), 'utf8')

    expect(STAR_DROP_RITUAL_DURATION_MS).toBe(4500)
    expect(css).toMatch(/\.bottle-star--dropping\s*\{[^}]*animation:\s*star-bottle-drop 3\.05s/u)
    expect(css).toMatch(/@keyframes star-bottle-drop\s*\{[\s\S]*?66%\s*\{[^}]*top:\s*42%[\s\S]*?75%\s*\{[^}]*scale\(\.78, \.62\)[\s\S]*?88%\s*\{[^}]*top:\s*38%/u)
    expect(css).toMatch(/\.bottle-hero__impact-particle\s*\{[^}]*animation:\s*star-bottle-impact-particle var\(--impact-duration, \.95s\)[^;]*calc\(2\.62s \+ var\(--impact-delay, 0ms\)\) forwards/u)
    expect(css).not.toContain('.bottle-hero__ritual-sparkles')
    expect(css).not.toContain('star-bottle-glow')
  })
})
