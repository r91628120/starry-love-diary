import { useCallback, useEffect, useRef } from 'react'

export const VISIBLE_REFRESH_INTERVAL_MS = 15_000

type RefreshTask = (isCurrent: () => boolean) => Promise<void>

export function useVisibleRefresh(task: RefreshTask, onError: (error: unknown) => void, intervalMs = VISIBLE_REFRESH_INTERVAL_MS) {
  const taskRef = useRef(task)
  const errorRef = useRef(onError)
  const mounted = useRef(false)
  const sequence = useRef(0)
  const inFlight = useRef<Promise<void> | undefined>(undefined)
  taskRef.current = task
  errorRef.current = onError

  const refresh = useCallback(async ({ afterCurrent = false, task: nextTask }: { afterCurrent?: boolean; task?: RefreshTask } = {}) => {
    if (inFlight.current) {
      if (!afterCurrent) return inFlight.current
      await inFlight.current.catch(() => undefined)
    }
    const request = ++sequence.current
    const work = (nextTask ?? taskRef.current)(() => mounted.current && request === sequence.current)
    const pending = Promise.resolve(work).finally(() => {
      if (inFlight.current === pending) inFlight.current = undefined
    })
    inFlight.current = pending
    return pending
  }, [])

  useEffect(() => {
    mounted.current = true
    let timer: ReturnType<typeof setInterval> | undefined
    const report = (error: unknown) => { if (mounted.current) errorRef.current(error) }
    const request = () => { void refresh().catch(report) }
    const stop = () => { if (timer !== undefined) { clearInterval(timer); timer = undefined } }
    const start = () => {
      if (document.visibilityState === 'hidden' || timer !== undefined) return
      request()
      timer = setInterval(request, intervalMs)
    }
    const onVisibilityChange = () => { if (document.visibilityState === 'hidden') stop(); else start() }
    const onFocus = () => { if (document.visibilityState !== 'hidden') request() }
    start()
    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('focus', onFocus)
    return () => {
      mounted.current = false
      sequence.current += 1
      stop()
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('focus', onFocus)
    }
  }, [intervalMs, refresh])

  return { refresh }
}
