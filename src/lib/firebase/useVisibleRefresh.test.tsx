import { act, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useVisibleRefresh } from './useVisibleRefresh'

function RefreshHarness({ task }: { task: () => Promise<void> }) {
  useVisibleRefresh(async (isCurrent) => { await task(); if (!isCurrent()) return }, () => undefined)
  return null
}

describe('useVisibleRefresh', () => {
  const visibility = (value: 'visible' | 'hidden') => Object.defineProperty(document, 'visibilityState', { configurable: true, value })

  afterEach(() => {
    vi.useRealTimers()
    visibility('visible')
  })

  it('refreshes while visible, refreshes on foreground, and stops while hidden or unmounted', async () => {
    vi.useFakeTimers()
    const task = vi.fn().mockResolvedValue(undefined)
    const view = render(<RefreshHarness task={task} />)
    await act(async () => undefined)
    expect(task).toHaveBeenCalledTimes(1)

    await act(async () => { await vi.advanceTimersByTimeAsync(15_000) })
    expect(task).toHaveBeenCalledTimes(2)

    visibility('hidden')
    act(() => document.dispatchEvent(new Event('visibilitychange')))
    await act(async () => { await vi.advanceTimersByTimeAsync(30_000) })
    expect(task).toHaveBeenCalledTimes(2)

    visibility('visible')
    act(() => document.dispatchEvent(new Event('visibilitychange')))
    await act(async () => undefined)
    expect(task).toHaveBeenCalledTimes(3)

    view.unmount()
    await act(async () => { await vi.advanceTimersByTimeAsync(30_000) })
    expect(task).toHaveBeenCalledTimes(3)
  })

  it('does not overlap a pending request', async () => {
    vi.useFakeTimers()
    let finish: (() => void) | undefined
    const task = vi.fn(() => new Promise<void>((resolve) => { finish = resolve }))
    render(<RefreshHarness task={task} />)
    await act(async () => undefined)
    expect(task).toHaveBeenCalledTimes(1)

    await act(async () => { await vi.advanceTimersByTimeAsync(30_000) })
    expect(task).toHaveBeenCalledTimes(1)
    await act(async () => { finish?.() })
  })
})
