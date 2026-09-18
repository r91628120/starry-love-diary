import { Capacitor } from '@capacitor/core'
import { Directory, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { encodeTextExportUtf8 } from './exportTextData'

const STORAGE_KEY = 'starry-love-diary:qa12-diagnostics:v1'
const MAX_ENTRIES = 160
const INTERACTION_THROTTLE_MS = 2_000
const OVERLAY_IDS = ['update-check', 'confirm-dialog', 'memory-lightbox', 'memory-wall-lightbox'] as const

export type Qa12EventType = 'boot' | 'visibilitychange' | 'pageshow' | 'pagehide' | 'focus' | 'blur' | 'online' | 'offline' | 'touchstart' | 'pointerdown' | 'click' | 'error' | 'unhandledrejection' | 'manual-snapshot'
export interface Qa12TopmostElement { point: 'center' | 'bottom-navigation' | 'content'; tag: string | null; category: string }
export interface Qa12DiagnosticEntry {
  timestamp: string
  type: Qa12EventType
  visibility: DocumentVisibilityState | 'unknown'
  focused: boolean
  pathname: string
  overlays: string[]
  busyElementCount: number
  interactionCounts: Record<'touchstart' | 'pointerdown' | 'click', number>
  topmost: Qa12TopmostElement[]
  persisted?: boolean
  errorCategory?: 'error' | 'unhandledrejection'
  errorMessage?: string
}
export interface Qa12DiagnosticLog { format: 'starry-love-diary-qa12-diagnostics'; version: 1; entries: Qa12DiagnosticEntry[] }

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>
type Delivery = 'downloaded' | 'share-sheet-opened' | 'cancelled' | 'unsupported' | 'error'

function safeStorage(): StorageLike | undefined {
  try { return globalThis.localStorage } catch { return undefined }
}

function emptyLog(): Qa12DiagnosticLog { return { format: 'starry-love-diary-qa12-diagnostics', version: 1, entries: [] } }

function readLog(storage: StorageLike | undefined = safeStorage()): Qa12DiagnosticLog {
  if (!storage) return emptyLog()
  try {
    const value: unknown = JSON.parse(storage.getItem(STORAGE_KEY) ?? '')
    if (!value || typeof value !== 'object') return emptyLog()
    const candidate = value as Partial<Qa12DiagnosticLog>
    if (candidate.format !== 'starry-love-diary-qa12-diagnostics' || candidate.version !== 1 || !Array.isArray(candidate.entries)) return emptyLog()
    return { ...emptyLog(), entries: candidate.entries.slice(-MAX_ENTRIES) as Qa12DiagnosticEntry[] }
  } catch { return emptyLog() }
}

function writeLog(log: Qa12DiagnosticLog, storage: StorageLike | undefined = safeStorage()) {
  try { storage?.setItem(STORAGE_KEY, JSON.stringify(log)) } catch { /* Diagnostics must never affect app behavior. */ }
}

function knownOverlayIds(documentRef: Document) {
  const detected = new Set<string>()
  for (const node of documentRef.querySelectorAll<HTMLElement>('[data-qa12-overlay]')) {
    const id = node.dataset.qa12Overlay
    if (OVERLAY_IDS.includes(id as typeof OVERLAY_IDS[number])) detected.add(id!)
  }
  if (documentRef.querySelector('.memory-lightbox')) detected.add('memory-lightbox')
  if (documentRef.querySelector('.memory-wall-lightbox')) detected.add('memory-wall-lightbox')
  return [...detected].sort()
}

function categoryFor(element: Element | null) {
  if (!element) return 'none'
  if (element.closest('[data-qa12-overlay="update-check"]')) return 'update-check'
  if (element.closest('[data-qa12-overlay="confirm-dialog"]')) return 'confirm-dialog'
  if (element.closest('.memory-lightbox')) return 'memory-lightbox'
  if (element.closest('.memory-wall-lightbox')) return 'memory-wall-lightbox'
  if (element.closest('.bottom-navigation')) return 'bottom-navigation'
  return 'other'
}

function topmostElements(documentRef: Document): Qa12TopmostElement[] {
  const view = documentRef.defaultView
  if (!view || typeof documentRef.elementFromPoint !== 'function') return []
  const width = view.innerWidth
  const height = view.innerHeight
  const points: Array<[Qa12TopmostElement['point'], number, number]> = [
    ['center', width / 2, height / 2],
    ['bottom-navigation', width / 2, Math.max(0, height - 24)],
    ['content', width / 2, Math.min(Math.max(80, height * .28), Math.max(80, height - 80))],
  ]
  return points.map(([point, x, y]) => {
    const element = documentRef.elementFromPoint(x, y)
    return { point, tag: element?.tagName.toLowerCase() ?? null, category: categoryFor(element) }
  })
}

function safeErrorName(value: unknown) {
  if (!(value instanceof Error)) return undefined
  return ['Error', 'TypeError', 'ReferenceError', 'RangeError', 'SyntaxError', 'DOMException'].includes(value.name) ? value.name : 'other'
}

export function getQa12Diagnostics() { return readLog() }

export function clearQa12DiagnosticsForTest(storage?: StorageLike) { writeLog(emptyLog(), storage) }

export function installQa12Diagnostics(documentRef: Document = document, windowRef: Window = window) {
  const interactionCounts = { touchstart: 0, pointerdown: 0, click: 0 }
  const lastInteraction = new Map<string, number>()
  const record = (type: Qa12EventType, options: Pick<Qa12DiagnosticEntry, 'persisted' | 'errorCategory' | 'errorMessage'> = {}) => {
    const log = readLog()
    const entry: Qa12DiagnosticEntry = {
      timestamp: new Date().toISOString(), type,
      visibility: documentRef.visibilityState ?? 'unknown', focused: documentRef.hasFocus(), pathname: windowRef.location.pathname,
      overlays: knownOverlayIds(documentRef), busyElementCount: documentRef.querySelectorAll('[aria-busy="true"]').length,
      interactionCounts: { ...interactionCounts }, topmost: topmostElements(documentRef), ...options,
    }
    log.entries.push(entry)
    log.entries = log.entries.slice(-MAX_ENTRIES)
    writeLog(log)
  }
  const lifecycle = (type: Qa12EventType) => () => record(type)
  const pageLifecycle = (type: 'pageshow' | 'pagehide') => (event: PageTransitionEvent) => record(type, { persisted: event.persisted })
  const interaction = (type: 'touchstart' | 'pointerdown' | 'click') => () => {
    interactionCounts[type] += 1
    const now = Date.now()
    if (now - (lastInteraction.get(type) ?? 0) >= INTERACTION_THROTTLE_MS) {
      lastInteraction.set(type, now)
      record(type)
    }
  }
  const onError = (event: ErrorEvent) => record('error', { errorCategory: 'error', errorMessage: safeErrorName(event.error) })
  const onUnhandledRejection = (event: PromiseRejectionEvent) => record('unhandledrejection', { errorCategory: 'unhandledrejection', errorMessage: safeErrorName(event.reason) })

  const listeners: Array<[EventTarget, string, EventListener, AddEventListenerOptions | boolean | undefined]> = [
    [documentRef, 'visibilitychange', lifecycle('visibilitychange'), undefined], [windowRef, 'pageshow', pageLifecycle('pageshow') as EventListener, undefined], [windowRef, 'pagehide', pageLifecycle('pagehide') as EventListener, undefined],
    [windowRef, 'focus', lifecycle('focus'), undefined], [windowRef, 'blur', lifecycle('blur'), undefined], [windowRef, 'online', lifecycle('online'), undefined], [windowRef, 'offline', lifecycle('offline'), undefined],
    [documentRef, 'touchstart', interaction('touchstart'), { capture: true, passive: true }], [documentRef, 'pointerdown', interaction('pointerdown'), { capture: true, passive: true }], [documentRef, 'click', interaction('click'), { capture: true, passive: true }],
    [windowRef, 'error', onError as EventListener, undefined], [windowRef, 'unhandledrejection', onUnhandledRejection as EventListener, undefined],
  ]
  for (const [target, name, listener, options] of listeners) target.addEventListener(name, listener, options)
  record('boot')
  return { snapshot: () => record('manual-snapshot'), dispose: () => listeners.forEach(([target, name, listener, options]) => target.removeEventListener(name, listener, options)) }
}

export function createQa12DiagnosticExport() {
  return { filename: 'starry-love-diary-qa12-diagnostics.json', content: JSON.stringify(getQa12Diagnostics(), null, 2) }
}

export async function exportQa12Diagnostics(options: { isNativePlatform?: () => boolean; canShare?: () => Promise<{ value: boolean }>; writeFile?: (options: { path: string; data: string; directory: Directory }) => Promise<{ uri: string }>; share?: (options: { files: string[] }) => Promise<unknown>; deleteFile?: (options: { path: string; directory: Directory }) => Promise<unknown>; download?: (content: string, filename: string) => void } = {}): Promise<Delivery> {
  const result = createQa12DiagnosticExport()
  const isNative = options.isNativePlatform ?? (() => Capacitor.isNativePlatform())
  if (!isNative()) {
    try {
      if (options.download) options.download(result.content, result.filename)
      else {
        const url = URL.createObjectURL(new Blob([result.content], { type: 'application/json;charset=utf-8' }))
        const anchor = document.createElement('a'); anchor.href = url; anchor.download = result.filename; anchor.style.display = 'none'; document.body.append(anchor)
        try { anchor.click() } finally { anchor.remove(); URL.revokeObjectURL(url) }
      }
      return 'downloaded'
    } catch { return 'error' }
  }
  const canShare = options.canShare ?? (() => Share.canShare())
  const writeFile = options.writeFile ?? ((writeOptions) => Filesystem.writeFile(writeOptions))
  const share = options.share ?? ((shareOptions) => Share.share(shareOptions))
  const deleteFile = options.deleteFile ?? ((deleteOptions) => Filesystem.deleteFile(deleteOptions))
  let written = false
  try {
    if (!(await canShare()).value) return 'unsupported'
    const file = await writeFile({ path: result.filename, data: encodeTextExportUtf8(result.content), directory: Directory.Cache })
    written = true
    await share({ files: [file.uri] })
    return 'share-sheet-opened'
  } catch (error) {
    return error instanceof Error && /cancel/i.test(error.message) ? 'cancelled' : 'error'
  } finally {
    if (written) await deleteFile({ path: result.filename, directory: Directory.Cache }).catch(() => undefined)
  }
}
