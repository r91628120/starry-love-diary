import { afterEach, describe, expect, it, vi } from 'vitest'
import { clearQa12DiagnosticsForTest, createQa12DiagnosticExport, exportQa12Diagnostics, getQa12Diagnostics, installQa12Diagnostics } from './qa12Diagnostics'
import { Directory } from '@capacitor/filesystem'

afterEach(() => {
  clearQa12DiagnosticsForTest()
  document.body.replaceChildren()
  vi.restoreAllMocks()
})

describe('QA-12 local diagnostics', () => {
  it('keeps a bounded local ring buffer without collecting DOM text or input values', () => {
    const secret = document.createElement('input')
    secret.value = 'private diary content must not appear'
    document.body.append(secret)
    const diagnostics = installQa12Diagnostics()
    for (let index = 0; index < 170; index += 1) diagnostics.snapshot()
    diagnostics.dispose()

    const exported = createQa12DiagnosticExport()
    const log = getQa12Diagnostics()
    expect(log.entries).toHaveLength(160)
    expect(exported.content).not.toContain(secret.value)
    expect(exported.content).not.toContain('innerHTML')
  })

  it('passively records lifecycle and capture-level interaction receipt without preventing an event', () => {
    const diagnostics = installQa12Diagnostics()
    document.dispatchEvent(new Event('visibilitychange'))
    window.dispatchEvent(new Event('focus'))
    const click = new Event('click', { bubbles: true, cancelable: true })
    document.body.dispatchEvent(click)
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true, cancelable: true }))
    document.body.dispatchEvent(new Event('touchstart', { bubbles: true, cancelable: true }))
    diagnostics.dispose()

    const types = getQa12Diagnostics().entries.map((entry) => entry.type)
    expect(types).toEqual(expect.arrayContaining(['boot', 'visibilitychange', 'focus', 'click', 'pointerdown', 'touchstart']))
    expect(click.defaultPrevented).toBe(false)
    const interaction = getQa12Diagnostics().entries.find((entry) => entry.type === 'click')
    expect(interaction?.interactionCounts.click).toBe(1)
  })

  it('records only known overlay identifiers and a structural topmost category', () => {
    const overlay = document.createElement('div')
    overlay.dataset.qa12Overlay = 'confirm-dialog'
    overlay.textContent = 'private confirmation message'
    document.body.append(overlay)
    Object.defineProperty(document, 'elementFromPoint', { configurable: true, value: vi.fn(() => overlay) })
    const diagnostics = installQa12Diagnostics()
    diagnostics.snapshot()
    diagnostics.dispose()

    const snapshot = getQa12Diagnostics().entries.at(-1)!
    expect(snapshot.overlays).toEqual(['confirm-dialog'])
    expect(snapshot.topmost.every((entry) => entry.category === 'confirm-dialog')).toBe(true)
    expect(JSON.stringify(snapshot)).not.toContain('private confirmation message')
  })

  it('stores error categories without recording arbitrary error messages', () => {
    const diagnostics = installQa12Diagnostics()
    window.dispatchEvent(new ErrorEvent('error', { error: new TypeError('private relationship message') }))
    diagnostics.dispose()

    const error = getQa12Diagnostics().entries.find((entry) => entry.type === 'error')
    expect(error).toMatchObject({ errorCategory: 'error', errorMessage: 'TypeError' })
    expect(JSON.stringify(error)).not.toContain('private relationship message')
  })

  it('writes only the bounded technical log to a native Cache file and shares its URI', async () => {
    const diagnostics = installQa12Diagnostics()
    diagnostics.snapshot()
    diagnostics.dispose()
    const writeFile = vi.fn().mockResolvedValue({ uri: 'file:///cache/starry-love-diary-qa12-diagnostics.json' })
    const share = vi.fn().mockResolvedValue(undefined)
    const deleteFile = vi.fn().mockResolvedValue(undefined)

    await expect(exportQa12Diagnostics({ isNativePlatform: () => true, canShare: vi.fn().mockResolvedValue({ value: true }), writeFile, share, deleteFile })).resolves.toBe('share-sheet-opened')
    expect(writeFile).toHaveBeenCalledWith(expect.objectContaining({ path: 'starry-love-diary-qa12-diagnostics.json', directory: Directory.Cache }))
    const base64 = writeFile.mock.calls[0][0].data as string
    expect(new TextDecoder().decode(Uint8Array.from(atob(base64), (character) => character.charCodeAt(0)))).not.toContain('private diary')
    expect(share).toHaveBeenCalledWith({ files: ['file:///cache/starry-love-diary-qa12-diagnostics.json'] })
    expect(deleteFile).toHaveBeenCalledWith({ path: 'starry-love-diary-qa12-diagnostics.json', directory: Directory.Cache })
  })

  it('preserves a browser-only diagnostic download path', async () => {
    const download = vi.fn()
    await expect(exportQa12Diagnostics({ isNativePlatform: () => false, download })).resolves.toBe('downloaded')
    expect(download).toHaveBeenCalledWith(expect.stringContaining('starry-love-diary-qa12-diagnostics'), 'starry-love-diary-qa12-diagnostics.json')
  })
})
