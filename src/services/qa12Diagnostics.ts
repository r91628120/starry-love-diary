import { Capacitor } from '@capacitor/core'
import { Directory, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { encodeTextExportUtf8 } from './exportTextData'

const STORAGE_KEY = 'starry-love-diary:qa12-diagnostics:v2'
const MAX_CRITICAL_EVENTS = 96
const MAX_INTERACTION_SNAPSHOTS = 32
const INTERACTION_SNAPSHOT_INTERVAL_MS = 15_000
const OVERLAY_IDS = ['update-check', 'confirm-dialog', 'memory-lightbox', 'memory-wall-lightbox'] as const

export type Qa12CriticalEventType = 'boot' | 'visibilitychange' | 'foreground-snapshot' | 'pageshow' | 'pagehide' | 'focus' | 'blur' | 'online' | 'offline' | 'error' | 'unhandledrejection' | 'overlay-state-change' | 'busy-state-change' | 'manual-snapshot'
export type Qa12InteractionType = 'touchstart' | 'pointerdown' | 'click'
export interface Qa12TopmostElement { point: 'center' | 'bottom-navigation' | 'content'; tag: string | null; category: string }
export interface Qa12StateSnapshot { timestamp: string; visibility: DocumentVisibilityState | 'unknown'; focused: boolean; pathname: string; overlays: string[]; busyElementCount: number; interactionCounts: Record<Qa12InteractionType, number>; topmost: Qa12TopmostElement[] }
export interface Qa12CriticalEvent extends Qa12StateSnapshot { type: Qa12CriticalEventType; persisted?: boolean; errorCategory?: 'error' | 'unhandledrejection'; errorName?: string }
export interface Qa12InteractionSnapshot extends Qa12StateSnapshot { type: Qa12InteractionType; firstPostResume: boolean }
export interface Qa12DiagnosticLog { format: 'starry-love-diary-qa12-diagnostics'; version: 2; criticalEvents: Qa12CriticalEvent[]; interaction: { totals: Record<Qa12InteractionType, number>; snapshots: Qa12InteractionSnapshot[] } }

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>
type Delivery = 'downloaded' | 'share-sheet-opened' | 'cancelled' | 'unsupported' | 'error'
const emptyInteractionCounts = (): Record<Qa12InteractionType, number> => ({ touchstart: 0, pointerdown: 0, click: 0 })

function safeStorage(): StorageLike | undefined { try { return globalThis.localStorage } catch { return undefined } }
function emptyLog(): Qa12DiagnosticLog { return { format: 'starry-love-diary-qa12-diagnostics', version: 2, criticalEvents: [], interaction: { totals: emptyInteractionCounts(), snapshots: [] } } }
function readLog(storage: StorageLike | undefined = safeStorage()): Qa12DiagnosticLog {
  if (!storage) return emptyLog()
  try {
    const value: unknown = JSON.parse(storage.getItem(STORAGE_KEY) ?? '')
    if (!value || typeof value !== 'object') return emptyLog()
    const candidate = value as Partial<Qa12DiagnosticLog>
    if (candidate.format !== 'starry-love-diary-qa12-diagnostics' || candidate.version !== 2 || !Array.isArray(candidate.criticalEvents) || !candidate.interaction || typeof candidate.interaction !== 'object' || !Array.isArray(candidate.interaction.snapshots)) return emptyLog()
    const totals = candidate.interaction.totals
    if (!totals || typeof totals.touchstart !== 'number' || typeof totals.pointerdown !== 'number' || typeof totals.click !== 'number') return emptyLog()
    return { ...emptyLog(), criticalEvents: candidate.criticalEvents.slice(-MAX_CRITICAL_EVENTS) as Qa12CriticalEvent[], interaction: { totals: { ...totals }, snapshots: candidate.interaction.snapshots.slice(-MAX_INTERACTION_SNAPSHOTS) as Qa12InteractionSnapshot[] } }
  } catch { return emptyLog() }
}
function writeLog(log: Qa12DiagnosticLog, storage: StorageLike | undefined = safeStorage()) { try { storage?.setItem(STORAGE_KEY, JSON.stringify(log)) } catch { /* Diagnostics must never affect app behavior. */ } }

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
  const points: Array<[Qa12TopmostElement['point'], number, number]> = [['center', width / 2, height / 2], ['bottom-navigation', width / 2, Math.max(0, height - 24)], ['content', width / 2, Math.min(Math.max(80, height * .28), Math.max(80, height - 80))]]
  return points.map(([point, x, y]) => { const element = documentRef.elementFromPoint(x, y); return { point, tag: element?.tagName.toLowerCase() ?? null, category: categoryFor(element) } })
}
function safeErrorName(value: unknown) { if (!(value instanceof Error)) return undefined; return ['Error', 'TypeError', 'ReferenceError', 'RangeError', 'SyntaxError', 'DOMException'].includes(value.name) ? value.name : 'other' }
function stateSnapshot(documentRef: Document, windowRef: Window, counts: Record<Qa12InteractionType, number>): Qa12StateSnapshot {
  return { timestamp: new Date().toISOString(), visibility: documentRef.visibilityState ?? 'unknown', focused: documentRef.hasFocus(), pathname: windowRef.location.pathname, overlays: knownOverlayIds(documentRef), busyElementCount: documentRef.querySelectorAll('[aria-busy="true"]').length, interactionCounts: { ...counts }, topmost: topmostElements(documentRef) }
}

export function getQa12Diagnostics() { return readLog() }
export function clearQa12DiagnosticsForTest(storage?: StorageLike) { writeLog(emptyLog(), storage) }

export function installQa12Diagnostics(documentRef: Document = document, windowRef: Window = window) {
  const log = readLog()
  let waitingForPostResumeInteraction = documentRef.visibilityState === 'visible'
  let lastInteractionSnapshotAt = 0
  let previousOverlayKey = knownOverlayIds(documentRef).join('|')
  let previousBusyCount = documentRef.querySelectorAll('[aria-busy="true"]').length
  const persist = () => writeLog(log)
  const recordCritical = (type: Qa12CriticalEventType, options: Pick<Qa12CriticalEvent, 'persisted' | 'errorCategory' | 'errorName'> = {}) => {
    log.criticalEvents.push({ ...stateSnapshot(documentRef, windowRef, log.interaction.totals), type, ...options })
    log.criticalEvents = log.criticalEvents.slice(-MAX_CRITICAL_EVENTS)
    persist()
  }
  const recordInteraction = (type: Qa12InteractionType) => {
    log.interaction.totals[type] += 1
    const now = Date.now()
    const firstPostResume = waitingForPostResumeInteraction
    if (firstPostResume || now - lastInteractionSnapshotAt >= INTERACTION_SNAPSHOT_INTERVAL_MS) {
      log.interaction.snapshots.push({ ...stateSnapshot(documentRef, windowRef, log.interaction.totals), type, firstPostResume })
      log.interaction.snapshots = log.interaction.snapshots.slice(-MAX_INTERACTION_SNAPSHOTS)
      lastInteractionSnapshotAt = now
    }
    if (firstPostResume) waitingForPostResumeInteraction = false
    persist()
  }
  const observeStateTransition = () => {
    const overlays = knownOverlayIds(documentRef).join('|')
    const busyCount = documentRef.querySelectorAll('[aria-busy="true"]').length
    if (overlays !== previousOverlayKey) { previousOverlayKey = overlays; recordCritical('overlay-state-change') }
    if (busyCount !== previousBusyCount) { previousBusyCount = busyCount; recordCritical('busy-state-change') }
  }
  const lifecycle = (type: Exclude<Qa12CriticalEventType, 'pageshow' | 'pagehide' | 'error' | 'unhandledrejection'>) => () => {
    recordCritical(type)
    if ((type === 'visibilitychange' && documentRef.visibilityState === 'visible') || (type === 'focus' && documentRef.visibilityState === 'visible')) { waitingForPostResumeInteraction = true; recordCritical('foreground-snapshot') }
  }
  const pageLifecycle = (type: 'pageshow' | 'pagehide') => (event: PageTransitionEvent) => {
    recordCritical(type, { persisted: event.persisted })
    if (type === 'pageshow' && documentRef.visibilityState === 'visible') { waitingForPostResumeInteraction = true; recordCritical('foreground-snapshot') }
  }
  const onError = (event: ErrorEvent) => recordCritical('error', { errorCategory: 'error', errorName: safeErrorName(event.error) })
  const onUnhandledRejection = (event: PromiseRejectionEvent) => recordCritical('unhandledrejection', { errorCategory: 'unhandledrejection', errorName: safeErrorName(event.reason) })
  const listeners: Array<[EventTarget, string, EventListener, AddEventListenerOptions | boolean | undefined]> = [
    [documentRef, 'visibilitychange', lifecycle('visibilitychange'), undefined], [windowRef, 'pageshow', pageLifecycle('pageshow') as EventListener, undefined], [windowRef, 'pagehide', pageLifecycle('pagehide') as EventListener, undefined], [windowRef, 'focus', lifecycle('focus'), undefined], [windowRef, 'blur', lifecycle('blur'), undefined], [windowRef, 'online', lifecycle('online'), undefined], [windowRef, 'offline', lifecycle('offline'), undefined],
    [documentRef, 'touchstart', (() => recordInteraction('touchstart')) as EventListener, { capture: true, passive: true }], [documentRef, 'pointerdown', (() => recordInteraction('pointerdown')) as EventListener, { capture: true, passive: true }], [documentRef, 'click', (() => recordInteraction('click')) as EventListener, { capture: true, passive: true }], [windowRef, 'error', onError as EventListener, undefined], [windowRef, 'unhandledrejection', onUnhandledRejection as EventListener, undefined],
  ]
  for (const [target, name, listener, options] of listeners) target.addEventListener(name, listener, options)
  const observer = typeof MutationObserver === 'undefined' || !documentRef.body ? undefined : new MutationObserver(observeStateTransition)
  observer?.observe(documentRef.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['aria-busy', 'data-qa12-overlay', 'class'] })
  recordCritical('boot')
  return { snapshot: () => recordCritical('manual-snapshot'), dispose: () => { observer?.disconnect(); listeners.forEach(([target, name, listener, options]) => target.removeEventListener(name, listener, options)) } }
}

export function createQa12DiagnosticExport() { return { filename: 'starry-love-diary-qa12-diagnostics.json', content: JSON.stringify(getQa12Diagnostics(), null, 2) } }
export async function exportQa12Diagnostics(options: { isNativePlatform?: () => boolean; canShare?: () => Promise<{ value: boolean }>; writeFile?: (options: { path: string; data: string; directory: Directory }) => Promise<{ uri: string }>; share?: (options: { files: string[] }) => Promise<unknown>; deleteFile?: (options: { path: string; directory: Directory }) => Promise<unknown>; download?: (content: string, filename: string) => void } = {}): Promise<Delivery> {
  const result = createQa12DiagnosticExport()
  const isNative = options.isNativePlatform ?? (() => Capacitor.isNativePlatform())
  if (!isNative()) {
    try {
      if (options.download) options.download(result.content, result.filename)
      else { const url = URL.createObjectURL(new Blob([result.content], { type: 'application/json;charset=utf-8' })); const anchor = document.createElement('a'); anchor.href = url; anchor.download = result.filename; anchor.style.display = 'none'; document.body.append(anchor); try { anchor.click() } finally { anchor.remove(); URL.revokeObjectURL(url) } }
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
  } catch (error) { return error instanceof Error && /cancel/i.test(error.message) ? 'cancelled' : 'error' } finally { if (written) await deleteFile({ path: result.filename, directory: Directory.Cache }).catch(() => undefined) }
}
