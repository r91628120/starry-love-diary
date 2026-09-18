import { afterEach, describe, expect, it, vi } from 'vitest'
import { Directory } from '@capacitor/filesystem'
import { clearQa12DiagnosticsForTest, createQa12DiagnosticExport, exportQa12Diagnostics, getQa12Diagnostics, installQa12Diagnostics } from './qa12Diagnostics'

afterEach(() => { clearQa12DiagnosticsForTest(); document.body.replaceChildren(); vi.restoreAllMocks() })

function dispatchInteractionBurst(times: number) {
  for (let index = 0; index < times; index += 1) {
    document.body.dispatchEvent(new Event('touchstart', { bubbles: true, cancelable: true }))
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true, cancelable: true }))
    document.body.dispatchEvent(new Event('click', { bubbles: true, cancelable: true }))
  }
}

describe('QA-12 local diagnostics retention', () => {
  it('keeps background and foreground critical evidence after high-frequency interaction', () => {
    const diagnostics = installQa12Diagnostics()
    document.dispatchEvent(new Event('visibilitychange'))
    window.dispatchEvent(new Event('blur'))
    window.dispatchEvent(new Event('focus'))
    dispatchInteractionBurst(200)
    diagnostics.dispose()

    const log = getQa12Diagnostics()
    expect(log.version).toBe(2)
    expect(log.criticalEvents.map((entry) => entry.type)).toEqual(expect.arrayContaining(['visibilitychange', 'blur', 'focus', 'foreground-snapshot']))
    expect(log.interaction.totals).toEqual({ touchstart: 200, pointerdown: 200, click: 200 })
    expect(log.interaction.snapshots.length).toBeLessThanOrEqual(32)
  })

  it('identifies the first post-resume interaction while preserving passive document receipt', () => {
    const diagnostics = installQa12Diagnostics()
    document.dispatchEvent(new Event('visibilitychange'))
    const click = new Event('click', { bubbles: true, cancelable: true })
    document.body.dispatchEvent(click)
    diagnostics.dispose()

    const firstPostResume = getQa12Diagnostics().interaction.snapshots.find((entry) => entry.firstPostResume)
    expect(firstPostResume).toMatchObject({ type: 'click', interactionCounts: { click: 1 } })
    expect(click.defaultPrevented).toBe(false)
  })

  it('bounds both retention buffers and excludes DOM text and values', () => {
    const secret = document.createElement('input')
    secret.value = 'private diary content must not appear'
    document.body.append(secret)
    const diagnostics = installQa12Diagnostics()
    for (let index = 0; index < 140; index += 1) diagnostics.snapshot()
    dispatchInteractionBurst(200)
    diagnostics.dispose()

    const exported = createQa12DiagnosticExport()
    const log = getQa12Diagnostics()
    expect(log.criticalEvents).toHaveLength(96)
    expect(log.interaction.snapshots.length).toBeLessThanOrEqual(32)
    expect(exported.content).not.toContain(secret.value)
    expect(exported.content).not.toContain('innerHTML')
  })

  it('retains known overlay and busy-state transitions as critical evidence', async () => {
    const diagnostics = installQa12Diagnostics()
    const overlay = document.createElement('div')
    overlay.dataset.qa12Overlay = 'confirm-dialog'
    overlay.setAttribute('aria-busy', 'true')
    overlay.textContent = 'private confirmation message'
    document.body.append(overlay)
    await Promise.resolve()
    diagnostics.dispose()

    const log = getQa12Diagnostics()
    expect(log.criticalEvents.map((entry) => entry.type)).toEqual(expect.arrayContaining(['overlay-state-change', 'busy-state-change']))
    expect(log.criticalEvents.at(-1)?.overlays).toEqual(['confirm-dialog'])
    expect(JSON.stringify(log)).not.toContain('private confirmation message')
  })

  it('stores runtime categories without arbitrary error messages', () => {
    const diagnostics = installQa12Diagnostics()
    window.dispatchEvent(new ErrorEvent('error', { error: new TypeError('private relationship message') }))
    diagnostics.dispose()

    const error = getQa12Diagnostics().criticalEvents.find((entry) => entry.type === 'error')
    expect(error).toMatchObject({ errorCategory: 'error', errorName: 'TypeError' })
    expect(JSON.stringify(error)).not.toContain('private relationship message')
  })

  it('writes the bounded technical log to a native Cache file and shares only its URI', async () => {
    const diagnostics = installQa12Diagnostics(); diagnostics.snapshot(); diagnostics.dispose()
    const writeFile = vi.fn().mockResolvedValue({ uri: 'file:///cache/starry-love-diary-qa12-diagnostics.json' })
    const share = vi.fn().mockResolvedValue(undefined)
    const deleteFile = vi.fn().mockResolvedValue(undefined)
    await expect(exportQa12Diagnostics({ isNativePlatform: () => true, canShare: vi.fn().mockResolvedValue({ value: true }), writeFile, share, deleteFile })).resolves.toBe('share-sheet-opened')
    expect(writeFile).toHaveBeenCalledWith(expect.objectContaining({ path: 'starry-love-diary-qa12-diagnostics.json', directory: Directory.Cache }))
    expect(share).toHaveBeenCalledWith({ files: ['file:///cache/starry-love-diary-qa12-diagnostics.json'] })
    expect(deleteFile).toHaveBeenCalledWith({ path: 'starry-love-diary-qa12-diagnostics.json', directory: Directory.Cache })
  })

  it('preserves the browser-only diagnostic download path', async () => {
    const download = vi.fn()
    await expect(exportQa12Diagnostics({ isNativePlatform: () => false, download })).resolves.toBe('downloaded')
    expect(download).toHaveBeenCalledWith(expect.stringContaining('starry-love-diary-qa12-diagnostics'), 'starry-love-diary-qa12-diagnostics.json')
  })
})
