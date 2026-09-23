export type NativePlatform = 'ios' | 'android'

export interface PlatformVersionConfig {
  latestVersion: string
  minimumVersion: string
  storeUrl: string
}

export interface RemoteVersionConfig {
  ios: PlatformVersionConfig
  android: PlatformVersionConfig
}

export interface UpdateCheckResult {
  platform: NativePlatform
  latestVersion: string
  storeUrl: string
}

export const OFFICIAL_VERSION_ENDPOINT = 'https://r91628120.github.io/starry-love-diary-official-site/version.json'
export const DISMISSED_UPDATE_VERSION_STORAGE_KEY = 'starry-love-diary.dismissed-update-version'
const REMOTE_VERSION_TIMEOUT_MS = 5000

interface CapacitorHost {
  Capacitor?: {
    getPlatform?: () => string
  }
}

interface StorageLike {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
}

const semverPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/

export function compareSemanticVersions(current: string, candidate: string) {
  const currentMatch = current.match(semverPattern)
  const candidateMatch = candidate.match(semverPattern)
  if (!currentMatch || !candidateMatch) return 0

  const currentParts = currentMatch[0].split(/[+-]/)[0].split('.').map(Number)
  const candidateParts = candidateMatch[0].split(/[+-]/)[0].split('.').map(Number)
  for (let index = 0; index < 3; index += 1) {
    if (currentParts[index] !== candidateParts[index]) return currentParts[index] < candidateParts[index] ? -1 : 1
  }
  return 0
}

export function getNativePlatform(host: CapacitorHost = globalThis as CapacitorHost): NativePlatform | undefined {
  const platform = host.Capacitor?.getPlatform?.()
  return platform === 'ios' || platform === 'android' ? platform : undefined
}

export function parseRemoteVersionConfig(value: unknown): RemoteVersionConfig | undefined {
  if (!value || typeof value !== 'object') return undefined
  const config = value as Partial<Record<NativePlatform, Partial<PlatformVersionConfig>>>
  const parsePlatform = (platform: NativePlatform): PlatformVersionConfig | undefined => {
    const candidate = config[platform]
    if (!candidate || typeof candidate.latestVersion !== 'string' || typeof candidate.minimumVersion !== 'string' || typeof candidate.storeUrl !== 'string') return undefined
    if (!semverPattern.test(candidate.latestVersion) || !semverPattern.test(candidate.minimumVersion)) return undefined
    return { latestVersion: candidate.latestVersion, minimumVersion: candidate.minimumVersion, storeUrl: candidate.storeUrl }
  }
  const ios = parsePlatform('ios')
  const android = parsePlatform('android')
  return ios && android ? { ios, android } : undefined
}

export async function fetchRemoteVersionConfig(fetcher: typeof fetch = globalThis.fetch): Promise<RemoteVersionConfig | undefined> {
  if (!fetcher) return undefined
  const controller = typeof AbortController === 'undefined' ? undefined : new AbortController()
  const timeout = controller ? setTimeout(() => controller.abort(), REMOTE_VERSION_TIMEOUT_MS) : undefined
  try {
    const response = await fetcher(OFFICIAL_VERSION_ENDPOINT, { cache: 'no-store', signal: controller?.signal })
    if (!response.ok) return undefined
    return parseRemoteVersionConfig(await response.json())
  } catch {
    return undefined
  } finally {
    if (timeout) clearTimeout(timeout)
  }
}

export async function checkForSoftUpdate({ currentVersion, host, fetcher }: { currentVersion: string; host?: CapacitorHost; fetcher?: typeof fetch }): Promise<UpdateCheckResult | undefined> {
  const platform = getNativePlatform(host)
  if (!platform) return undefined
  const config = await fetchRemoteVersionConfig(fetcher)
  if (!config) return undefined
  const remote = config[platform]
  return compareSemanticVersions(currentVersion, remote.latestVersion) < 0
    ? { platform, latestVersion: remote.latestVersion, storeUrl: remote.storeUrl.trim() }
    : undefined
}

export function hasSupportedStoreUrl(storeUrl: string) {
  if (!storeUrl.trim()) return false
  try {
    const protocol = new URL(storeUrl).protocol
    return ['https:', 'http:', 'itms-apps:', 'market:'].includes(protocol)
  } catch {
    return false
  }
}

export function openStoreUrl(storeUrl: string, opener: ((url: string, target: string, features: string) => Window | null) | undefined = globalThis.window?.open) {
  if (!hasSupportedStoreUrl(storeUrl)) return false
  opener?.(storeUrl, '_blank', 'noopener,noreferrer')
  return Boolean(opener)
}

function safeStorage(): StorageLike | undefined {
  try {
    return globalThis.localStorage
  } catch {
    return undefined
  }
}

export function getDismissedUpdateVersion(storage: StorageLike | undefined = safeStorage()) {
  try {
    return storage?.getItem(DISMISSED_UPDATE_VERSION_STORAGE_KEY) ?? undefined
  } catch {
    return undefined
  }
}

export function dismissUpdateVersion(version: string, storage: StorageLike | undefined = safeStorage()) {
  try {
    storage?.setItem(DISMISSED_UPDATE_VERSION_STORAGE_KEY, version)
  } catch {
    // An unavailable preference store must never affect the app.
  }
}
