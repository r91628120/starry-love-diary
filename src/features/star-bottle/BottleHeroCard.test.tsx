import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { LocalStarDropPresentationRepository } from '../../data/repositories/starDropPresentationRepository'
import type { Star } from '../../data/types'
import { I18nProvider } from '../../i18n/I18nProvider'
import { BottleHeroCard } from './BottleHeroCard'

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

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('BottleHeroCard star-drop impact', () => {
  it('renders one deterministic ten-particle impact while preserving the accumulated representative star', async () => {
    renderHero(presentationFor(star))

    await waitFor(() => expect(document.querySelector('.bottle-star--dropping')).toBeInTheDocument())
    expect(screen.getByTestId('star-drop-impact')).toBeInTheDocument()
    expect(screen.getAllByTestId('star-drop-impact-particle')).toHaveLength(10)
    expect(document.querySelectorAll('.bottle-hero__collection .bottle-star')).toHaveLength(1)
  })

  it('keeps the existing presentation completion timing', async () => {
    vi.useFakeTimers()
    renderHero(presentationFor(star))

    await act(async () => { await Promise.resolve() })
    expect(document.querySelector('.bottle-star--dropping')).toBeInTheDocument()
    await act(async () => { await vi.advanceTimersByTimeAsync(1800) })
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
})
