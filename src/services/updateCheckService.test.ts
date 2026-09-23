import { describe, expect, it, vi } from 'vitest'
import { checkForSoftUpdate, compareSemanticVersions, DISMISSED_UPDATE_VERSION_STORAGE_KEY, dismissUpdateVersion, fetchRemoteVersionConfig, getDismissedUpdateVersion, getNativePlatform, hasSupportedStoreUrl, OFFICIAL_VERSION_ENDPOINT, openStoreUrl, parseRemoteVersionConfig } from './updateCheckService'

const config = {
  ios: { latestVersion: '0.1.1', minimumVersion: '0.1.0', storeUrl: 'https://apps.apple.com/example' },
  android: { latestVersion: '0.1.1', minimumVersion: '0.1.0', storeUrl: 'https://play.google.com/store/apps/details?id=example' },
}

const fetchConfig = (value: unknown = config) => vi.fn().mockResolvedValue({ ok: true, json: async () => value }) as unknown as typeof fetch

describe('updateCheckService', () => {
  it('compares semantic versions numerically', () => {
    expect(compareSemanticVersions('0.1.0', '0.1.0')).toBe(0)
    expect(compareSemanticVersions('0.1.9', '0.1.10')).toBe(-1)
    expect(compareSemanticVersions('0.1.10', '0.1.9')).toBe(1)
    expect(compareSemanticVersions('1.1.0', '2.0.0')).toBe(-1)
  })

  it('detects only supported native platforms', () => {
    expect(getNativePlatform({ Capacitor: { getPlatform: () => 'ios' } })).toBe('ios')
    expect(getNativePlatform({ Capacitor: { getPlatform: () => 'android' } })).toBe('android')
    expect(getNativePlatform({ Capacitor: { getPlatform: () => 'web' } })).toBeUndefined()
  })

  it('returns a soft update only when the native platform has a newer version', async () => {
    await expect(checkForSoftUpdate({ currentVersion: '0.1.0', host: { Capacitor: { getPlatform: () => 'ios' } }, fetcher: fetchConfig() })).resolves.toMatchObject({ platform: 'ios', storeUrl: config.ios.storeUrl })
    await expect(checkForSoftUpdate({ currentVersion: '0.1.0', host: { Capacitor: { getPlatform: () => 'android' } }, fetcher: fetchConfig() })).resolves.toMatchObject({ platform: 'android', storeUrl: config.android.storeUrl })
    await expect(checkForSoftUpdate({ currentVersion: '0.1.1', host: { Capacitor: { getPlatform: () => 'ios' } }, fetcher: fetchConfig() })).resolves.toBeUndefined()
    await expect(checkForSoftUpdate({ currentVersion: '0.1.2', host: { Capacitor: { getPlatform: () => 'ios' } }, fetcher: fetchConfig() })).resolves.toBeUndefined()
  })

  it('uses marketing version only, so an iOS build-number-only change cannot show a notice', async () => {
    const sameMarketingVersion = {
      ios: { ...config.ios, latestVersion: '1.0.0' },
      android: { ...config.android, latestVersion: '1.0.0' },
    }
    await expect(checkForSoftUpdate({ currentVersion: '1.0.0', host: { Capacitor: { getPlatform: () => 'ios' } }, fetcher: fetchConfig(sameMarketingVersion) })).resolves.toBeUndefined()
  })

  it('uses the configured HTTPS official endpoint instead of a packaged relative version file', async () => {
    const fetcher = fetchConfig()
    await fetchRemoteVersionConfig(fetcher)
    expect(OFFICIAL_VERSION_ENDPOINT).toBe('https://r91628120.github.io/starry-love-diary-official-site/version.json')
    expect(fetcher).toHaveBeenCalledWith(OFFICIAL_VERSION_ENDPOINT, expect.objectContaining({ cache: 'no-store' }))
  })

  it('persists dismissal by remote target version and permits a newer target', () => {
    const values = new Map<string, string>()
    const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) }
    dismissUpdateVersion('1.0.1', storage)
    expect(getDismissedUpdateVersion(storage)).toBe('1.0.1')
    expect(values.get(DISMISSED_UPDATE_VERSION_STORAGE_KEY)).toBe('1.0.1')
    expect(getDismissedUpdateVersion(storage)).not.toBe('1.0.2')
  })

  it('fails safely for missing URLs, fetch failures, malformed config, and web runtime', async () => {
    const missingUrl = { ...config, ios: { ...config.ios, storeUrl: '' } }
    await expect(checkForSoftUpdate({ currentVersion: '0.1.0', host: { Capacitor: { getPlatform: () => 'ios' } }, fetcher: fetchConfig(missingUrl) })).resolves.toMatchObject({ storeUrl: '' })
    await expect(checkForSoftUpdate({ currentVersion: '0.1.0', host: { Capacitor: { getPlatform: () => 'web' } }, fetcher: fetchConfig() })).resolves.toBeUndefined()
    await expect(fetchRemoteVersionConfig(vi.fn().mockRejectedValue(new Error('offline')) as unknown as typeof fetch)).resolves.toBeUndefined()
    expect(parseRemoteVersionConfig({ ios: {} })).toBeUndefined()
    expect(openStoreUrl('', vi.fn())).toBe(false)
    expect(hasSupportedStoreUrl('javascript:alert(1)')).toBe(false)
  })
})
