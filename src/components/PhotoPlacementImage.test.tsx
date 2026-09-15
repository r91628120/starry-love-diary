import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PhotoPlacementImage } from './PhotoPlacementImage'

let resizeCallback: ResizeObserverCallback

class TestResizeObserver implements ResizeObserver {
  constructor(callback: ResizeObserverCallback) { resizeCallback = callback }
  disconnect() {}
  observe() {}
  unobserve() {}
}

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', TestResizeObserver)
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('PhotoPlacementImage responsive geometry', () => {
  it('remeasures pixel translation after its own frame resizes without changing stable placement', async () => {
    render(<span data-testid="frame"><PhotoPlacementImage src="blob:test" alt="test" placement={{ positionX: .8, positionY: .2, zoom: .5 }} /></span>)
    const frame = screen.getByTestId('frame')
    const image = screen.getByRole('img')
    let size = 100
    vi.spyOn(frame, 'getBoundingClientRect').mockImplementation(() => ({ x: 0, y: 0, top: 0, left: 0, right: size, bottom: size, width: size, height: size, toJSON: () => ({}) }))
    Object.defineProperty(image, 'naturalWidth', { configurable: true, value: 100 })
    Object.defineProperty(image, 'naturalHeight', { configurable: true, value: 100 })
    fireEvent.load(image)
    await waitFor(() => expect(image.dataset.translateX).toBe('15.000000000000002'))
    expect(image.dataset.translateY).toBe('-15')

    size = 240
    resizeCallback([], {} as ResizeObserver)
    await waitFor(() => expect(Number(image.dataset.translateX)).toBeCloseTo(36))
    expect(Number(image.dataset.translateY)).toBeCloseTo(-36)
    expect(image).toHaveAttribute('data-position-x', '0.8')
    expect(image).toHaveAttribute('data-position-y', '0.2')
    expect(image).toHaveAttribute('data-zoom', '0.5')
  })
})
