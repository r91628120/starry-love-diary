import { afterEach, describe, expect, it, vi } from 'vitest'
import { Directory } from '@capacitor/filesystem'
import { fireEvent, render } from '@testing-library/react'
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom'
import { createElement } from 'react'
import { clearQa12DiagnosticsForTest, createQa12DiagnosticExport, exportQa12Diagnostics, getQa12Diagnostics, installQa12Diagnostics, qa12LocationCommitted, qa12NavigationHandler, qa12RouterLocationRendered } from './qa12Diagnostics'

afterEach(() => { clearQa12DiagnosticsForTest(); document.body.replaceChildren(); vi.useRealTimers(); vi.restoreAllMocks() })
function navButton(source = 'bottom-nav:today') { const button = document.createElement('button'); button.dataset.qa12NavigationSource = source; button.textContent = 'private diary content'; document.body.append(button); return button }
function dispatch(button: HTMLElement, type: string) { button.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, clientX: 12, clientY: 18 })) }

function RouterRenderProbe() {
  const location = useLocation()
  const navigate = useNavigate()
  qa12RouterLocationRendered(location.pathname)
  return createElement('div', undefined,
    createElement('output', { 'data-testid': 'router-path' }, location.pathname),
    createElement('button', { type: 'button', onClick: () => navigate('/settings') }, 'route'),
    createElement('button', { type: 'button', onClick: () => navigate(location.pathname) }, 'rerender'),
  )
}

describe('QA-12 V5 touch and pointer diagnostics', () => {
  it('observes overlay and busy transitions once, then disconnects on disposal', async () => {
    const diagnostics = installQa12Diagnostics()
    const baseline = getQa12Diagnostics().events.length
    const overlay = document.createElement('div'); overlay.dataset.qa12Overlay = 'update-check'; document.body.append(overlay)
    await Promise.resolve()
    const busy = document.createElement('div'); busy.setAttribute('aria-busy', 'true'); document.body.append(busy)
    await Promise.resolve()
    const changed = getQa12Diagnostics().events.slice(baseline)
    expect(changed.filter((event) => event.type === 'overlay-state-change')).toHaveLength(1)
    expect(changed.filter((event) => event.type === 'busy-state-change')).toHaveLength(1)
    await Promise.resolve()
    expect(getQa12Diagnostics().events.slice(baseline).filter((event) => event.type === 'overlay-state-change' || event.type === 'busy-state-change')).toHaveLength(2)
    diagnostics.dispose()
    overlay.remove(); busy.remove()
    await Promise.resolve()
    expect(getQa12Diagnostics().events.slice(baseline).filter((event) => event.type === 'overlay-state-change' || event.type === 'busy-state-change')).toHaveLength(2)
  })
  it('correlates input, handler, intent, location and destination commit without preventing navigation', () => {
    const diagnostics = installQa12Diagnostics(); const button = navButton(); dispatch(button, 'pointerdown'); dispatch(button, 'pointerup'); const click = new MouseEvent('click', { bubbles: true, cancelable: true }); button.dispatchEvent(click); const id = qa12NavigationHandler('bottom-nav:today', '/today'); qa12LocationCommitted('/today'); diagnostics.dispose()
    const handler = getQa12Diagnostics().events.find((event) => event.navAttemptId === id)
    const events = getQa12Diagnostics().events.filter((event) => event.interactionId === handler?.interactionId)
    expect(events.map((event) => event.type)).toEqual(expect.arrayContaining(['input', 'react-handler', 'navigation-intent', 'location-change', 'destination-commit']))
    expect(click.defaultPrevented).toBe(false)
  })
  it('distinguishes pointerup and pointercancel and gives separate attempts separate identifiers', () => {
    const diagnostics = installQa12Diagnostics(); const button = navButton('settings-button'); dispatch(button, 'pointerdown'); dispatch(button, 'pointerup'); const first = qa12NavigationHandler('settings-button', '/settings'); dispatch(button, 'pointerdown'); dispatch(button, 'pointercancel'); const second = qa12NavigationHandler('settings-button', '/settings'); diagnostics.dispose()
    const log = getQa12Diagnostics(); expect(first).not.toBe(second); expect(log.events.filter((event) => event.type === 'input').map((event) => event.input?.eventType)).toEqual(expect.arrayContaining(['pointerup', 'pointercancel']))
  })
  it('records navigation_incomplete only as a diagnostic after the observation window', () => {
    vi.useFakeTimers(); const diagnostics = installQa12Diagnostics(); qa12NavigationHandler('recent-important-date-card', '/our?section=important-dates'); vi.advanceTimersByTime(1_500); diagnostics.dispose()
    expect(getQa12Diagnostics().events.some((event) => event.type === 'navigation-incomplete')).toBe(true)
  })
  it('correlates foreground resumes with a session and build identity', () => {
    let visibility: DocumentVisibilityState = 'visible'; Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => visibility }); const diagnostics = installQa12Diagnostics(); visibility = 'hidden'; document.dispatchEvent(new Event('visibilitychange')); visibility = 'visible'; document.dispatchEvent(new Event('visibilitychange')); diagnostics.dispose()
    const log = getQa12Diagnostics(); expect(log).toMatchObject({ diagnosticSchemaVersion: 5, appVersion: '1.0.0', build: 13 }); expect(log.sessionId).toBeTruthy(); expect(log.events.find((event) => event.type === 'foreground-resume')).toMatchObject({ foregroundResumeId: 'resume:1' })
  })
  it('keeps records bounded and never writes private element content', () => {
    const diagnostics = installQa12Diagnostics(); const button = navButton(); for (let index = 0; index < 200; index += 1) { dispatch(button, 'pointerdown'); qa12NavigationHandler('bottom-nav:today', '/today') }; diagnostics.dispose()
    const exported = createQa12DiagnosticExport(); expect(getQa12Diagnostics().events.length).toBeLessThanOrEqual(160); expect(exported.content).not.toContain('private diary content'); expect(JSON.parse(exported.content)).toMatchObject({ diagnosticSchemaVersion: 5, build: 13 })
  })
  it('exports the readable V4 log through native and browser delivery paths', async () => {
    const writeFile = vi.fn().mockResolvedValue({ uri: 'file:///cache/starry-love-diary-qa12-diagnostics.json' }); const share = vi.fn().mockResolvedValue(undefined); const deleteFile = vi.fn().mockResolvedValue(undefined)
    await expect(exportQa12Diagnostics({ isNativePlatform: () => true, canShare: vi.fn().mockResolvedValue({ value: true }), writeFile, share, deleteFile })).resolves.toBe('share-sheet-opened'); expect(writeFile).toHaveBeenCalledWith(expect.objectContaining({ directory: Directory.Cache })); const download = vi.fn(); await expect(exportQa12Diagnostics({ isNativePlatform: () => false, download })).resolves.toBe('downloaded'); expect(JSON.parse(download.mock.calls[0][0])).toMatchObject({ diagnosticSchemaVersion: 5 })
  })
  it('records one router-location-render for an actual Router pathname change, not ordinary rerenders', () => {
    const diagnostics = installQa12Diagnostics()
    const screen = render(createElement(MemoryRouter, { initialEntries: ['/today'] }, createElement(RouterRenderProbe)))
    fireEvent.click(screen.getByRole('button', { name: 'rerender' }))
    fireEvent.click(screen.getByRole('button', { name: 'route' }))
    diagnostics.dispose()
    const renders = getQa12Diagnostics().events.filter((event) => event.type === 'router-location-render')
    expect(renders.map((event) => event.routerPathname)).toEqual(['/today', '/settings'])
    expect(renders[1]).toMatchObject({ previousRouterPathname: '/today', pathnameChanged: true })
  })
  it('marks same-route attempts separately from cross-route attempts', () => {
    window.history.replaceState({}, '', '/today')
    const diagnostics = installQa12Diagnostics()
    const same = qa12NavigationHandler('bottom-nav:today', '/today')
    const cross = qa12NavigationHandler('bottom-nav:settings', '/settings')
    diagnostics.dispose()
    const events = getQa12Diagnostics().events.filter((event) => event.type === 'navigation-intent')
    expect(events.find((event) => event.navAttemptId === same)?.sameRoute).toBe(true)
    expect(events.find((event) => event.navAttemptId === cross)?.sameRoute).toBe(false)
  })
  it('records only the first meaningful move per interaction and does not persist uncorrelated move noise', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    const plain = document.createElement('div'); document.body.append(plain)
    const diagnostics = installQa12Diagnostics(); const baselineWrites = setItem.mock.calls.length
    for (let index = 0; index < 100; index += 1) plain.dispatchEvent(new Event('pointermove', { bubbles: true }))
    expect(setItem.mock.calls).toHaveLength(baselineWrites)
    const button = navButton(); dispatch(button, 'pointerdown')
    for (let index = 0; index < 100; index += 1) button.dispatchEvent(new Event('pointermove', { bubbles: true }))
    diagnostics.dispose()
    expect(getQa12Diagnostics().events.filter((event) => event.input?.eventType === 'pointermove')).toHaveLength(1)
  })
})
